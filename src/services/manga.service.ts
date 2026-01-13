
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Manga {
  mangaId: string;
  type: string;
  title: string;
  description: string;
  genre: string[];
  coverImage: string;
}

export interface MangaListResponse {
  offset: number;
  limit: number;
  total: number;
  count: number;
  data: Manga[];
}

export interface ChapterInfo {
  chapter: string;
}

export interface MangaDetailResponse {
  mangaId: string;
  images: string[];
  chapterList: ChapterInfo[];
  currentChapter: string;
  maxChapter: number;
}

@Injectable({
  providedIn: 'root'
})
export class MangaService {
  private http = inject(HttpClient);
  
  // Updated to the new exec URL provided by user
  private readonly API_URL = 'https://script.google.com/macros/s/AKfycbw8cMWs0NCmrXa3GuNIOlvVznnf-v75KBvQA-Ikm7JNZvKuRrm08CViTSTCGuUa2rqE/exec';

  // State
  private _mangaList = signal<Manga[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  
  // Expose Read-only signals
  mangaList = this._mangaList.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  constructor() {
    // Always fetch fresh data on init
    this.fetchMangaList();
  }

  async fetchMangaList(refresh = false, offset = 0, limit = 20, query: string = '') {
    if (this._loading() && !refresh) return;

    this._loading.set(true);
    this._error.set(null);

    // Clear list if refreshing (Search or Reload) to show clean loading state
    if (refresh) {
      this._mangaList.set([]);
    }

    try {
      let params = new HttpParams()
        .set('offset', offset)
        .set('limit', limit);

      // Search Logic: Use action=search & title=...
      if (query && query.trim() !== '') {
        params = params.set('action', 'search');
        params = params.set('title', query.trim());
      } else {
        // Default List Logic
        params = params.set('action', 'list');
      }

      const response = await firstValueFrom(
        this.http.get<MangaListResponse>(this.API_URL, { params })
      );

      // Validation to ensure data exists
      if (!response || !response.data) {
        throw new Error('Invalid API response: "data" field missing.');
      }

      // Map to ensure valid data structure and add fallback if needed
      const enrichedData = response.data.map((m: any) => ({
        ...m,
        coverImage: m.coverImage || `https://picsum.photos/seed/${m.mangaId}/300/450`
      }));

      // Preload images before updating state
      // This ensures that when the list renders, images are already in cache
      if (enrichedData.length > 0) {
        await this.preloadImages(enrichedData.map(m => m.coverImage));
      }

      if (refresh || offset === 0) {
        this._mangaList.set(enrichedData);
      } else {
        this._mangaList.update(current => [...current, ...enrichedData]);
      }

    } catch (err) {
      let errorMessage = 'Failed to load manga.';
      
      // Enhanced Error Logging
      if (err instanceof HttpErrorResponse) {
        errorMessage += ` HTTP ${err.status}: ${err.statusText}`;
        if (err.url && err.url.includes('/dev')) {
           errorMessage += ' (Note: /dev URLs often fail with CORS/403 outside of the Apps Script editor. Ensure you have permissions or use /exec)';
        }
        console.error('Fetch Manga List HTTP Error:', err.message, err.error);
      } else if (err instanceof Error) {
        errorMessage += ` ${err.message}`;
        console.error('Fetch Manga List Error:', err.message, err.stack);
      } else {
        console.error('Fetch Manga List Unknown Error:', err);
      }

      this._error.set(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  private preloadImages(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to prevent blocking
        img.src = url;
      });
    });
    return Promise.all(promises);
  }

  async getMangaDetail(mangaId: string, chapter: string): Promise<MangaDetailResponse> {
    const params = new HttpParams()
      .set('action', 'detail')
      .set('mangaId', mangaId)
      .set('chapter', chapter);

    try {
      const response = await firstValueFrom(
        this.http.get<MangaDetailResponse>(this.API_URL, { params })
      );
      
      // Validation to prevent app crash if API is wonky
      if (!response.images) response.images = [];
      if (!response.chapterList) response.chapterList = [];
      
      return response;
    } catch (error) {
      // Improved error logging
      let errorMessage = 'Unknown Error';
      if (error instanceof HttpErrorResponse) {
        errorMessage = `HTTP ${error.status}: ${error.statusText}`;
        if (error.error && typeof error.error === 'string') {
          errorMessage += ` | Details: ${error.error}`;
        } else {
          errorMessage += ` | Details: ${JSON.stringify(error.error)}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('Error fetching details:', errorMessage);
      console.error('Full Error Object:', error);
      throw error;
    }
  }

  refresh() {
    this.fetchMangaList(true);
  }
}
