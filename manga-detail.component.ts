import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MangaService } from './manga.service';
import { StorageService } from './storage.service';

@Component({
  selector: 'app-manga-detail',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-full bg-white dark:bg-dark-bg pb-20 relative">
      <div class="absolute top-0 left-0 z-20 p-4">
        <a routerLink="/" class="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        </a>
      </div>

      <div class="relative h-64 overflow-hidden bg-gray-200 dark:bg-gray-800">
        @if (manga()) {
          <img [src]="manga()?.coverImage" class="w-full h-full object-cover blur-xl opacity-30" alt="BG">
        }
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-dark-bg"></div>
      </div>

      <div class="px-5 -mt-20 relative z-10">
        <div class="flex gap-5">
          <div class="w-32 shrink-0">
            <img [src]="manga()?.coverImage" class="w-full aspect-[2/3] object-cover rounded-lg shadow-xl ring-4 ring-white dark:ring-dark-bg" [alt]="manga()?.title">
          </div>
          <div class="flex flex-col justify-end pb-2">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-3">{{ manga()?.title }}</h1>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button (click)="startReading()" class="flex-1 bg-brand-500 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform">
            {{ hasProgress() ? 'Continue' : 'Start Reading' }}
          </button>
          <button (click)="toggleFavorite()" class="w-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center active:scale-95 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" [class.fill-red-500]="isFavorite()" [class.text-red-500]="isFavorite()" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          </button>
        </div>

        <div class="mt-8">
          <h3 class="text-lg font-bold mb-4">Chapters</h3>
          @if (loadingChapters()) {
            <div class="grid grid-cols-3 gap-3 animate-pulse">
              @for (i of [1,2,3,4,5,6]; track i) { <div class="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg"></div> }
            </div>
          } @else {
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
              @for (chap of chapters(); track chap.chapter) {
                <a [routerLink]="['/read', mangaId(), chap.chapter]" class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center border border-gray-100 dark:border-gray-800">
                  <span class="text-sm font-bold">{{ chap.chapter }}</span>
                </a>
              }
            </div>
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
  manga = computed(() => this.mangaService.mangaList().find(m => m.mangaId === this.mangaId()));
  chapters = signal<{chapter: string}[]>([]);
  loadingChapters = signal(false);

  isFavorite = computed(() => this.storage.isFavorite(this.mangaId()));
  hasProgress = computed(() => !!this.storage.getProgress(this.mangaId()));

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
      const data = await this.mangaService.getMangaDetail(id, '1');
      if (data?.chapterList) this.chapters.set(data.chapterList);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingChapters.set(false);
    }
  }

  startReading() {
    const id = this.mangaId();
    const progress = this.storage.getProgress(id);
    this.router.navigate(['/read', id, progress?.chapter || '1']);
  }

  toggleFavorite() {
    const m = this.manga();
    if (m) this.storage.toggleFavorite(m);
  }
}