
import { Injectable, signal, computed, effect } from '@angular/core';
import { Manga } from './manga.service';

export interface ReadingProgress {
  mangaId: string;
  chapter: string;
  imageIndex: number;
  totalImages: number;
  lastUpdated: number;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Favorites
  private _favorites = signal<Manga[]>([]);
  favorites = this._favorites.asReadonly();
  
  // Progress
  private _progressMap = signal<Record<string, ReadingProgress>>({});
  
  // Computed for the "Resume" button (returns most recently updated)
  lastRead = computed(() => {
    const allProgress = Object.values(this._progressMap()) as ReadingProgress[];
    if (allProgress.length === 0) return null;
    return allProgress.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
  });

  constructor() {
    this.loadFavorites();
    this.loadProgress();

    // Persist changes
    effect(() => {
      localStorage.setItem('manga_favorites', JSON.stringify(this._favorites()));
    });
    
    effect(() => {
      localStorage.setItem('manga_progress', JSON.stringify(this._progressMap()));
    });
  }

  private loadFavorites() {
    const stored = localStorage.getItem('manga_favorites');
    if (stored) {
      try {
        this._favorites.set(JSON.parse(stored));
      } catch (e) { console.error(e); }
    }
  }

  private loadProgress() {
    const stored = localStorage.getItem('manga_progress');
    if (stored) {
      try {
        this._progressMap.set(JSON.parse(stored));
      } catch (e) { console.error(e); }
    }
  }

  toggleFavorite(manga: Manga) {
    this._favorites.update(favs => {
      const exists = favs.find(f => f.mangaId === manga.mangaId);
      if (exists) {
        return favs.filter(f => f.mangaId !== manga.mangaId);
      } else {
        return [...favs, manga];
      }
    });
  }

  isFavorite(mangaId: string): boolean {
    return this._favorites().some(f => f.mangaId === mangaId);
  }

  saveProgress(mangaId: string, chapter: string, imageIndex: number, totalImages: number, title?: string) {
    this._progressMap.update(map => ({
      ...map,
      [mangaId]: {
        mangaId,
        chapter,
        imageIndex,
        totalImages,
        lastUpdated: Date.now(),
        title: title || map[mangaId]?.title || 'Unknown Title'
      }
    }));
  }

  getProgress(mangaId: string): ReadingProgress | undefined {
    return this._progressMap()[mangaId];
  }
}
