
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Manga } from '../services/api';

export interface ReadingProgress {
  mangaId: string;
  chapter: string;
  imageIndex: number;
  totalImages: number;
  lastUpdated: number;
  title?: string;
}

interface StorageContextType {
  favorites: Manga[];
  toggleFavorite: (manga: Manga) => void;
  isFavorite: (mangaId: string) => boolean;
  saveProgress: (mangaId: string, chapter: string, imageIndex: number, totalImages: number, title?: string) => void;
  getProgress: (mangaId: string) => ReadingProgress | undefined;
  lastRead: ReadingProgress | null;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Manga[]>(() => {
    try {
      const stored = localStorage.getItem('manga_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>(() => {
    try {
      const stored = localStorage.getItem('manga_progress');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('manga_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('manga_progress', JSON.stringify(progressMap));
  }, [progressMap]);

  const toggleFavorite = (manga: Manga) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.mangaId === manga.mangaId);
      if (exists) return prev.filter(f => f.mangaId !== manga.mangaId);
      return [...prev, manga];
    });
  };

  const isFavorite = (mangaId: string) => favorites.some(f => f.mangaId === mangaId);

  const saveProgress = (mangaId: string, chapter: string, imageIndex: number, totalImages: number, title?: string) => {
    setProgressMap(prev => ({
      ...prev,
      [mangaId]: {
        mangaId,
        chapter,
        imageIndex,
        totalImages,
        lastUpdated: Date.now(),
        title: title || prev[mangaId]?.title || 'Unknown Title'
      }
    }));
  };

  const getProgress = (mangaId: string) => progressMap[mangaId];

  const lastRead = useMemo(() => {
    const all = Object.values(progressMap);
    if (all.length === 0) return null;
    return all.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
  }, [progressMap]);

  return (
    <StorageContext.Provider value={{ favorites, toggleFavorite, isFavorite, saveProgress, getProgress, lastRead }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within StorageProvider');
  return context;
};
