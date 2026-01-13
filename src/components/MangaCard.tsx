
import React from 'react';
import { Link } from 'react-router-dom';
import { Manga } from '../services/api';
import { Heart } from 'lucide-react';

interface MangaCardProps {
  manga: Manga;
  isFavorite: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
}

export default function MangaCard({ manga, isFavorite, onToggleFav }: MangaCardProps) {
  return (
    <div className="group relative flex flex-col h-full bg-white dark:bg-dark-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/manga/${manga.mangaId}`} className="relative w-full aspect-[2/3] overflow-hidden bg-gray-200 dark:bg-gray-800">
        <img 
          src={manga.coverImage} 
          alt={manga.title} 
          loading="lazy" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {manga.genre && manga.genre.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <span className="text-[10px] text-white bg-brand-600/90 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
              {manga.genre[0]}
            </span>
          </div>
        )}
      </Link>

      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight mb-1">
          {manga.title}
        </h3>
        
        <div className="mt-auto flex items-center justify-between pt-2">
          <button 
            onClick={onToggleFav} 
            className="text-gray-400 hover:text-red-500 active:scale-95 transition-transform p-1 -ml-1"
          >
            <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
          </button>
          
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">INFO</span>
        </div>
      </div>
    </div>
  );
}
