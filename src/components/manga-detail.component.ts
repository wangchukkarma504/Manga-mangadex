
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MangaService, Manga } from '../services/manga.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-manga-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-full bg-white dark:bg-dark-bg pb-20 relative">
      
      <!-- Back Navigation -->
      <div class="absolute top-0 left-0 z-20 p-4">
        <a routerLink="/" class="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </a>
      </div>

      <!-- Hero Section with Background Blur -->
      <div class="relative h-64 overflow-hidden">
        @if (manga()) {
          <img [src]="manga()?.coverImage" class="w-full h-full object-cover blur-xl opacity-50 dark:opacity-30 scale-110" alt="Background">
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-dark-bg"></div>
        } @else {
          <div class="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
        }
      </div>

      <!-- Main Content -->
      <div class="px-5 -mt-20 relative z-10">
        <div class="flex gap-5">
          <!-- Cover Image -->
          <div class="w-32 shrink-0">
            @if (manga()) {
              <img [src]="manga()?.coverImage" class="w-full aspect-[2/3] object-cover rounded-lg shadow-xl ring-4 ring-white dark:ring-dark-bg" [alt]="manga()?.title">
            } @else {
              <div class="w-full aspect-[2/3] bg-gray-300 dark:bg-gray-700 rounded-lg shadow-xl ring-4 ring-white dark:ring-dark-bg animate-pulse"></div>
            }
          </div>

          <!-- Info -->
          <div class="flex flex-col justify-end pb-2">
            @if (manga()) {
              <h1 class="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-3">{{ manga()?.title }}</h1>
              <div class="flex flex-wrap gap-1.5">
                @for (genre of manga()?.genre?.slice(0, 2); track genre) {
                  <span class="px-2 py-0.5 text-[10px] font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-md">
                    {{ genre }}
                  </span>
                }
              </div>
            } @else {
              <div class="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
              <div class="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            }
          </div>
        </div>

        <!-- Action Bar -->
        <div class="mt-6 flex gap-3">
          <button 
            (click)="startReading()"
            class="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-brand-500/30 active:scale-95 transition-all flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M4.5 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" clip-rule="evenodd" />
            </svg>
            {{ hasProgress() ? 'Continue Reading' : 'Start Reading' }}
          </button>

          <button 
            (click)="toggleFavorite()"
            class="w-14 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" [class.fill-red-500]="isFavorite()" [class.text-red-500]="isFavorite()" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        <!-- Description -->
        <div class="mt-8">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-2">Synopsis</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ manga()?.description || 'No description available.' }}
          </p>
        </div>

        <!-- Chapters -->
        <div class="mt-8">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3">Chapters</h3>
          
          @if (loadingChapters()) {
            <div class="space-y-2">
              <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
              <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
              <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
            </div>
          } @else if (chapters().length > 0) {
             <div class="grid grid-cols-1 gap-2">
               @for (chap of chapters(); track chap.chapter) {
                 <a [routerLink]="['/read', mangaId(), chap.chapter]" 
                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-brand-50 dark:hover:bg-gray-800 border border-transparent hover:border-brand-200 transition-colors">
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Chapter {{ chap.chapter }}</span>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-gray-400">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                   </svg>
                 </a>
               }
             </div>
          } @else {
            <p class="text-gray-400 text-sm">No chapters found.</p>
          }
        </div>
      </div>
    </div>
  `
})
export class MangaDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mangaService = inject(MangaService);
  private storage = inject(StorageService);

  mangaId = signal<string>('');
  
  // Try to find manga in the loaded list
  manga = computed(() => 
    this.mangaService.mangaList().find(m => m.mangaId === this.mangaId())
  );

  chapters = signal<{chapter: string}[]>([]);
  loadingChapters = signal(false);

  isFavorite = computed(() => {
    const id = this.mangaId();
    return id ? this.storage.isFavorite(id) : false;
  });
  
  hasProgress = computed(() => {
    const id = this.mangaId();
    return id ? !!this.storage.getProgress(id) : false;
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('mangaId');
      if (id) {
        this.mangaId.set(id);
        this.loadChapters(id);
      }
    });
  }

  async loadChapters(id: string) {
    this.loadingChapters.set(true);
    try {
      // Fetch chapter 1 to get the chapter list. 
      // The API structure returns the full chapter list in the detail response.
      const data = await this.mangaService.getMangaDetail(id, '1');
      if (data && data.chapterList) {
        this.chapters.set(data.chapterList);
      }
    } catch (e) {
      console.error('Failed to load chapters', e);
    } finally {
      this.loadingChapters.set(false);
    }
  }

  startReading() {
    const id = this.mangaId();
    if (!id) return;

    // Check progress
    const progress = this.storage.getProgress(id);
    if (progress) {
      this.router.navigate(['/read', id, progress.chapter]);
    } else {
      // Default to chapter 1
      this.router.navigate(['/read', id, '1']);
    }
  }

  toggleFavorite() {
    const m = this.manga();
    if (m) {
      this.storage.toggleFavorite(m);
    }
  }
}
