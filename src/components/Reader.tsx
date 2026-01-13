
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, ChapterInfo } from '../services/api';
import { useStorage } from '../context/StorageContext';
import { ChevronLeft, List, Loader2 } from 'lucide-react';

export default function Reader() {
  const { mangaId, chapter } = useParams<{ mangaId: string, chapter: string }>();
  const navigate = useNavigate();
  const { saveProgress, getProgress, favorites } = useStorage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterList, setChapterList] = useState<ChapterInfo[]>([]);
  
  const [showControls, setShowControls] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Determine Title
  const title = useMemo(() => {
    const fav = favorites.find(f => f.mangaId === mangaId);
    if (fav) return fav.title;
    const prog = getProgress(mangaId || '');
    if (prog?.title) return prog.title;
    return `Manga ${mangaId}`;
  }, [mangaId, favorites]);

  // Load Chapter
  useEffect(() => {
    if (!mangaId || !chapter) return;
    
    const load = async () => {
      setLoading(true);
      setError(null);
      setImages([]);
      setShowChapterList(false);

      try {
        const data = await api.getMangaDetail(mangaId, chapter);
        setImages(data.images || []);
        if (data.chapterList) setChapterList(data.chapterList);

        // Restore position
        const prog = getProgress(mangaId);
        if (prog && prog.chapter === chapter && prog.imageIndex > 0) {
          setTimeout(() => {
            const el = document.getElementById(`page-${prog.imageIndex}`);
            el?.scrollIntoView();
          }, 100);
        }
      } catch {
        setError("Failed to load chapter");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mangaId, chapter]);

  // Scroll Tracking
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const center = container.scrollTop + (container.clientHeight / 2);
    
    // Simple intersection check
    const els = container.querySelectorAll('[id^="page-"]');
    els.forEach((el: any, index) => {
      if (el.offsetTop <= center && (el.offsetTop + el.offsetHeight) > center) {
        if (index !== currentIndex) {
          setCurrentIndex(index);
        }
      }
    });
  };

  // Save Progress
  useEffect(() => {
    if (mangaId && chapter && images.length > 0) {
      saveProgress(mangaId, chapter, currentIndex, images.length, title);
    }
  }, [currentIndex, mangaId, chapter, images.length, title]);

  const sortedChapters = useMemo(() => {
    return [...chapterList].sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter));
  }, [chapterList]);

  const navigateChapter = (dir: number) => {
    const idx = sortedChapters.findIndex(c => c.chapter === chapter);
    if (idx !== -1) {
      const next = sortedChapters[idx + dir];
      if (next) navigate(`/read/${mangaId}/${next.chapter}`);
    } else {
      // Fallback
      const nextVal = parseFloat(chapter || '1') + dir;
      navigate(`/read/${mangaId}/${nextVal}`);
    }
  };

  const isFirst = sortedChapters.length > 0 && sortedChapters[0].chapter === chapter;
  const isLast = sortedChapters.length > 0 && sortedChapters[sortedChapters.length - 1].chapter === chapter;
  const percentage = images.length ? Math.min(100, Math.max(5, ((currentIndex + 1) / images.length) * 100)) : 0;

  return (
    <div className="relative w-full h-full bg-black">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white bg-dark-bg p-4">
          <Loader2 className="animate-spin w-10 h-10 text-brand-500 mb-4" />
          <p className="animate-pulse font-medium text-lg">Loading Chapter...</p>
        </div>
      )}

      {showControls && !loading && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-black/90 p-4 animate-slide-up shadow-lg border-b border-gray-800">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Link to={`/manga/${mangaId}`} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft />
            </Link>

            <div className="text-center">
              <h2 className="text-white font-bold text-sm line-clamp-1 max-w-[200px]">{title}</h2>
              <p className="text-xs text-brand-400 font-medium mt-0.5">
                Chapter {chapter} <span className="text-gray-500">/ {sortedChapters.length || '?'}</span>
              </p>
            </div>

            <button onClick={() => setShowChapterList(!showChapterList)} className="p-2 text-white hover:bg-white/10 rounded-full">
              <List />
            </button>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 h-1 bg-brand-500 z-50 transition-all duration-300" style={{ width: `${percentage}%` }} />

      {!loading && (
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto no-scrollbar scroll-smooth" 
          onClick={() => setShowControls(!showControls)} 
          onScroll={handleScroll}
        >
          {error && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white text-black rounded-lg">Retry</button>
            </div>
          )}

          {images.map((img, i) => (
            <div key={i} id={`page-${i}`} className="w-full relative min-h-[300px] bg-gray-900 mb-1">
              <img src={img} className="w-full h-auto block" alt={`Page ${i+1}`} loading="eager" />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded opacity-50">
                {i + 1} / {images.length}
              </div>
            </div>
          ))}
          <div className="h-32 bg-black"></div>
        </div>
      )}

      {showControls && !loading && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 p-6 pb-8 animate-slide-up border-t border-gray-800 shadow-lg">
           <div className="flex items-center justify-between text-white max-w-md mx-auto">
             <button onClick={() => navigateChapter(-1)} disabled={isFirst} className="text-sm font-medium hover:text-brand-400 transition-colors disabled:opacity-50">Previous</button>
             <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{percentage.toFixed(0)}% Read</span>
             <button onClick={() => navigateChapter(1)} disabled={isLast} className="text-sm font-medium hover:text-brand-400 transition-colors disabled:opacity-50">Next</button>
           </div>
        </div>
      )}

      {showChapterList && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowChapterList(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-inherit rounded-t-2xl z-10">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Chapters</h3>
              <span className="text-xs text-gray-500">{sortedChapters.length} Total</span>
            </div>
            <div className="overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-5 gap-3 no-scrollbar pb-8 safe-area-bottom">
              {sortedChapters.map(chap => (
                <button 
                  key={chap.chapter}
                  onClick={() => {
                    navigate(`/read/${mangaId}/${chap.chapter}`);
                    setShowChapterList(false);
                  }}
                  className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm text-center break-words ${
                    chap.chapter === chapter 
                      ? 'bg-brand-500 text-white ring-2 ring-brand-500' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 hover:bg-brand-400 hover:text-white'
                  }`}
                >
                  {chap.chapter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
