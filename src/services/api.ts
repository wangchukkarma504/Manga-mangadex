
const API_URL = 'https://script.google.com/macros/s/AKfycbzutjzuXt-7-O8c0O_OOpSj4NkX6-qF_zithhbgp4GrkemDnG7sE-qA-A8uZhcYXFkx/exec';

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

export const api = {
  fetchMangaList: async (offset = 0, limit = 20, query = ''): Promise<Manga[]> => {
    const params = new URLSearchParams();
    params.append('offset', offset.toString());
    params.append('limit', limit.toString());
    
    if (query && query.trim()) {
      params.append('action', 'search');
      params.append('title', query.trim());
    } else {
      params.append('action', 'list');
    }

    const res = await fetch(`${API_URL}?${params.toString()}`);
    const data: MangaListResponse = await res.json();
    
    if (!data.data) return [];

    return data.data.map((m: any) => ({
      ...m,
      coverImage: m.coverImage || `https://picsum.photos/seed/${m.mangaId}/300/450`
    }));
  },

  getMangaDetail: async (mangaId: string, chapter: string): Promise<MangaDetailResponse> => {
    const params = new URLSearchParams({
      action: 'detail',
      mangaId,
      chapter
    });

    const res = await fetch(`${API_URL}?${params.toString()}`);
    const data: MangaDetailResponse = await res.json();
    
    if (!data.images) data.images = [];
    if (!data.chapterList) data.chapterList = [];
    
    return data;
  }
};
