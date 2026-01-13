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
  private _favorites = signal<Manga[]>([]);
  favorites = this._favorites.asReadonly();
  
  private _progressMap = signal<Record<string, ReadingProgress>>({});
  
  lastRead = computed(() => {
    const allProgress = Object.values(this._progressMap());
    if (allProgress.length === 0) return null;
    return allProgress.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
  });

  constructor() {
    const favs = localStorage.getItem('manga_favorites');
    if (favs) try { this._favorites.set(JSON.parse(favs)); } catch (e) {}
    
    const prog = localStorage.getItem('manga_progress');
    if (prog) try { this._progressMap.set(JSON.parse(prog)); } catch (e) {}

    effect(() => localStorage.setItem('manga_favorites', JSON.stringify(this._favorites())));
    effect(() => localStorage.setItem('manga_progress', JSON.stringify(this._progressMap())));
  }

  toggleFavorite(manga: Manga) {
    this._favorites.update(favs => {
      const exists = favs.find(f => f.mangaId === manga.mangaId);
      return exists ? favs.filter(f => f.mangaId !== manga.mangaId) : [...favs, manga];
    });
  }

  isFavorite(mangaId: string): boolean {
    return this._favorites().some(f => f.mangaId === mangaId);
  }

  saveProgress(mangaId: string, chapter: string, imageIndex: number, totalImages: number, title?: string) {
    this._progressMap.update(map => ({
      ...map,
      [mangaId]: {
        mangaId, chapter, imageIndex, totalImages,
        lastUpdated: Date.now(),
        title: title || map[mangaId]?.title || 'Unknown'
      }
    }));
  }

  getProgress(mangaId: string): ReadingProgress | undefined {
    return this._progressMap()[mangaId];
  }
}