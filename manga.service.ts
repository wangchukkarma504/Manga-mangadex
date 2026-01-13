import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  private readonly API_URL = 'https://script.google.com/macros/s/AKfycbw8cMWs0NCmrXa3GuNIOlvVznnf-v75KBvQA-Ikm7JNZvKuRrm08CViTSTCGuUa2rqE/exec';

  private _mangaList = signal<Manga[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  
  mangaList = this._mangaList.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  constructor() {
    this.fetchMangaList();
  }

  async fetchMangaList(refresh = false, offset = 0, limit = 20, query: string = '') {
    if (this._loading() && !refresh) return;
    this._loading.set(true);
    if (refresh) this._mangaList.set([]);

    try {
      let params = new HttpParams().set('offset', offset).set('limit', limit);
      if (query?.trim()) {
        params = params.set('action', 'search').set('title', query.trim());
      } else {
        params = params.set('action', 'list');
      }

      const response = await firstValueFrom(this.http.get<MangaListResponse>(this.API_URL, { params }));
      const enrichedData = (response?.data || []).map(m => ({
        ...m,
        coverImage: m.coverImage || `https://picsum.photos/seed/${m.mangaId}/300/450`
      }));

      if (refresh || offset === 0) {
        this._mangaList.set(enrichedData);
      } else {
        this._mangaList.update(current => [...current, ...enrichedData]);
      }
    } catch (err) {
      this._error.set('Failed to load manga library.');
    } finally {
      this._loading.set(false);
    }
  }

  async getMangaDetail(mangaId: string, chapter: string): Promise<MangaDetailResponse> {
    const params = new HttpParams()
      .set('action', 'detail')
      .set('mangaId', mangaId)
      .set('chapter', chapter);
    return firstValueFrom(this.http.get<MangaDetailResponse>(this.API_URL, { params }));
  }
}