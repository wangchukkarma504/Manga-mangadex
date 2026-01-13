
import React from 'react';
import { useStorage } from '../context/StorageContext';
import MangaCard from './MangaCard';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Favorites() {
  const { favorites, toggleFavorite } = useStorage();

  return (
    <div className="min-h-full p-4 pb-20">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
        <span className="text-sm text-gray-500">{favorites.length} items</span>
      </header>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Heart size={64} className="mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">No favorites yet</p>
          <p className="text-sm text-center max-w-xs mb-6">Start reading and tap the heart icon to save manga here.</p>
          <Link to="/" className="px-6 py-2 bg-brand-500 text-white rounded-full font-medium shadow-lg shadow-brand-500/30">Explore Manga</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {favorites.map(manga => (
            <MangaCard 
              key={manga.mangaId} 
              manga={manga} 
              isFavorite={true}
              onToggleFav={(e) => {
                e.preventDefault();
                toggleFavorite(manga);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
