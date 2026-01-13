
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, MangaDetailResponse, Manga } from '../services/api';
import { useStorage } from '../context/StorageContext';
import { ChevronLeft, Heart, Play } from 'lucide-react';

export default function MangaDetail() {
  const { mangaId } = useParams<{ mangaId: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, getProgress, favorites } = useStorage();
  
  const [detail, setDetail] = useState<MangaDetailResponse | null>(null);
  const [mangaInfo, setMangaInfo] = useState<Manga | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Derive manga info from favorites if available, or fetch it (simulated by finding in list if we had context, 
  // but for now we rely on the API detail or passed state. 
  // Since our API separates List and Detail, and Detail doesn't return Title/Cover, 
  // we normally pass it via state location or context. 
  // For this demo, we'll try to find it in favorites or assume we might miss some meta if refreshed directly).
  
  useEffect(() => {
    if (!mangaId) return;
    
    // Try to find in favorites for instant load
    const fav = favorites.find(f => f.mangaId === mangaId);
    if (fav) setMangaInfo(fav);

    // Fetch chapters
    const load = async () => {
      setLoading(true);
      try {
        // Fetch List if we don't have info? Actually the list API is the only way to get title/cover.
        // If we came from home, we have it. If direct link, we might miss it.
        // Let's fetch list with search to find this manga info if missing? 
        // For efficiency, we'll skip that complex logic and just load chapters.
        
        const data = await api.getMangaDetail(mangaId, '1');
        setDetail(data);
        
        // If we still lack info, we might need to fetch the manga list filtering by ID or just accept it's missing in UI
        if (!mangaInfo && !fav) {
           // Fallback: fetch a small list chunk or use placeholder? 
           // In a real app we'd have a specific endpoint for metadata.
           // For now, let's just proceed.
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [mangaId, favorites]);

  // If we came from Home, we might want to grab the title from history/cache, 
  // but React Router state is easiest. 
  // Since we don't have that wired up in the Links, we rely on Favorites or a global store.
  
  const sortedChapters = detail?.chapterList 
    ? [...detail.chapterList].sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter)) 
    : [];

  const handleStartReading = () => {
    if (!mangaId) return;
    const progress = getProgress(mangaId);
    if (progress) {
      navigate(`/read/${mangaId}/${progress.chapter}`);
    } else {
      navigate(`/read/${mangaId}/1`);
    }
  };

  const handleToggleFav = () => {
    // If we don't have full manga object (e.g. direct load), we can't add to favs properly.
    // Construct a minimal one if needed or disable button.
    if (mangaInfo) {
      toggleFavorite(mangaInfo);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-dark-bg pb-20 relative">
      <div className="absolute top-0 left-0 z-20 p-4">
        <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-colors">
          <ChevronLeft />
        </Link>
      </div>

      <div className="relative h-64 overflow-hidden">
        {mangaInfo ? (
          <>
            <img src={mangaInfo.coverImage} className="w-full h-full object-cover blur-xl opacity-50 dark:opacity-30 scale-110" alt="bg" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-dark-bg"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        )}
      </div>

      <div className="px-5 -mt-20 relative z-10">
        <div className="flex gap-5">
          <div className="w-32 shrink-0">
            {mangaInfo ? (
              <img src={mangaInfo.coverImage} className="w-full aspect-[2/3] object-cover rounded-lg shadow-xl ring-4 ring-white dark:ring-dark-bg" alt="cover" />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-300 dark:bg-gray-700 rounded-lg shadow-xl ring-4 ring-white dark:ring-dark-bg animate-pulse" />
            )}
          </div>

          <div className="flex flex-col justify-end pb-2">
            {mangaInfo ? (
              <>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-3">{mangaInfo.title}</h1>
                <div className="flex flex-wrap gap-1.5">
                  {mangaInfo.genre?.slice(0, 2).map(g => (
                    <span key={g} className="px-2 py-0.5 text-[10px] font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-md">
                      {g}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-full" />
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={handleStartReading}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-brand-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" />
            {getProgress(mangaId || '') ? 'Continue Reading' : 'Start Reading'}
          </button>

          <button 
            onClick={handleToggleFav}
            disabled={!mangaInfo}
            className="w-14 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            <Heart size={24} className={isFavorite(mangaId || '') ? "fill-red-500 text-red-500" : ""} />
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Synopsis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {mangaInfo?.description || 'No description available.'}
          </p>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chapters</h3>
             {sortedChapters.length > 0 && (
               <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400 px-3 py-1 rounded-full border border-brand-100 dark:border-brand-900">
                 {sortedChapters.length} Total
               </span>
             )}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          ) : sortedChapters.length > 0 ? (
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
               {sortedChapters.map(chap => (
                 <Link 
                    key={chap.chapter}
                    to={`/read/${mangaId}/${chap.chapter}`} 
                    className="group flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 border border-gray-100 dark:border-gray-800 transition-all active:scale-95 relative overflow-hidden"
                 >
                   {getProgress(mangaId || '')?.chapter === chap.chapter && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-brand-500 rounded-bl-lg"></div>
                   )}
                   <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-white">{chap.chapter}</span>
                   <span className="text-[10px] text-gray-400 group-hover:text-brand-100 uppercase tracking-wider">Ch.</span>
                 </Link>
               ))}
             </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              <p className="text-gray-400 text-sm">No chapters found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
