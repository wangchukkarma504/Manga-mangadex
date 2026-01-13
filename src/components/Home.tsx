
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Manga } from '../services/api';
import { useStorage } from '../context/StorageContext';
import MangaCard from './MangaCard';
import { Search, Loader2, BookOpen } from 'lucide-react';

export default function Home() {
  const { lastRead, isFavorite, toggleFavorite } = useStorage();
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchManga = async (refresh = false, query = '') => {
    setLoading(true);
    if (refresh) setMangaList([]);
    try {
      const offset = refresh ? 0 : mangaList.length;
      const data = await api.fetchMangaList(offset, 20, query);
      setMangaList(prev => refresh ? data : [...prev, ...data]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManga(true);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchManga(true, searchQuery);
  };

  return (
    <div className="min-h-full pb-20">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-dark-surface/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-purple-600 bg-clip-text text-transparent mb-3">
          ZenManga
        </h1>
        
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search manga..." 
            className="w-full bg-gray-100 dark:bg-dark-bg border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-500 transition-all dark:text-white outline-none"
          />
          <button type="submit" className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-400 hover:text-brand-500 transition-colors">
            <Search size={20} />
          </button>
        </form>
      </header>

      {lastRead && (
        <Link to={`/read/${lastRead.mangaId}/${lastRead.chapter}`} className="block mx-4 mt-4 p-4 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-brand-900 dark:to-brand-800 rounded-2xl text-white shadow-lg relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs text-gray-300 font-medium uppercase tracking-wider mb-1">Jump back in</p>
            <h2 className="text-lg font-bold truncate pr-8">{lastRead.title}</h2>
            <div className="flex items-center mt-3 text-xs font-medium">
              <span className="bg-white/20 px-2 py-1 rounded text-white">Chapter {lastRead.chapter}</span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-brand-300">Page {lastRead.imageIndex + 1}</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <BookOpen size={128} />
          </div>
        </Link>
      )}

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {mangaList.map(manga => (
          <MangaCard 
            key={manga.mangaId} 
            manga={manga} 
            isFavorite={isFavorite(manga.mangaId)}
            onToggleFav={(e) => {
              e.preventDefault();
              toggleFavorite(manga);
            }}
          />
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
          <p className="text-sm font-medium text-brand-500 animate-pulse">Loading...</p>
        </div>
      )}

      {!loading && mangaList.length > 0 && (
        <div className="flex justify-center py-4">
          <button onClick={() => fetchManga(false, searchQuery)} className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700">
            Load More Manga
          </button>
        </div>
      )}

      {!loading && mangaList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <p>No manga found</p>
          <button onClick={() => handleSearch()} className="mt-4 px-4 py-2 text-sm bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 dark:bg-gray-800 dark:text-brand-400">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
