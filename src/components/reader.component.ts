
import { Component, inject, signal, computed, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MangaService, MangaDetailResponse } from '../services/manga.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-reader',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative w-full h-full bg-black">
      
      <!-- Loading State -->
      @if (loading()) {
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center text-white bg-dark-bg p-4">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-4"></div>
          <p class="animate-pulse font-medium text-lg mb-1">Loading Chapter...</p>
        </div>
      }

      <!-- Controls Overlay (Top) -->
      @if (showControls() && !loading()) {
        <div class="fixed top-0 left-0 right-0 z-40 bg-black/90 p-4 animate-slide-up shadow-lg border-b border-gray-800">
          <div class="flex items-center justify-between max-w-md mx-auto">
            <!-- Back to Detail -->
            <a [routerLink]="['/manga', mangaId()]" class="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </a>

            <!-- Title Info -->
            <div class="text-center">
              <h2 class="text-white font-bold text-sm line-clamp-1 max-w-[200px]">{{ mangaTitle() }}</h2>
              <p class="text-xs text-brand-400 font-medium mt-0.5">
                Chapter {{ currentChapterId() }} <span class="text-gray-500">/ {{ sortedChapters().length || '?' }}</span>
              </p>
            </div>

            <!-- Chapter List Toggle -->
            <button (click)="toggleChapterList()" class="p-2 text-white hover:bg-white/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- Progress Bar -->
      <div class="fixed top-0 left-0 h-1 bg-brand-500 z-50 transition-all duration-300" [style.width.%]="readPercentage()"></div>

      <!-- Main Reader Area -->
      @if (!loading()) {
        <div #scrollContainer class="h-full overflow-y-auto no-scrollbar scroll-smooth" (click)="toggleControls()" (scroll)="onScroll()">
          
          <!-- Error State -->
          @if (error()) {
            <div class="flex flex-col items-center justify-center min-h-[50vh] text-white">
              <p class="text-red-400 mb-4">{{ error() }}</p>
              <button (click)="loadChapter(mangaId()!, currentChapterId()!)" class="px-4 py-2 bg-white text-black rounded-lg">Retry</button>
            </div>
          }

          <!-- Images -->
          @for (img of images(); track $index) {
            <div class="w-full relative min-h-[300px] bg-gray-900 mb-1" [id]="'page-' + $index">
              <img [src]="img" class="w-full h-auto block" alt="Page {{ $index + 1 }}" loading="eager" decoding="async">
              <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded opacity-50">
                {{ $index + 1 }} / {{ images().length }}
              </div>
            </div>
          }
          
          <div class="h-32 bg-black"></div>
        </div>
      }

      <!-- Controls Overlay (Bottom) -->
      @if (showControls() && !loading()) {
        <div class="fixed bottom-0 left-0 right-0 z-40 bg-black/90 p-6 pb-8 animate-slide-up border-t border-gray-800 shadow-lg">
           <div class="flex items-center justify-between text-white max-w-md mx-auto">
             <button (click)="navigateChapter(-1)" class="text-sm font-medium hover:text-brand-400 transition-colors disabled:opacity-50" [disabled]="isFirstChapter()">Previous</button>
             <span class="text-xs bg-white/20 px-3 py-1 rounded-full">{{ readPercentage() | number:'1.0-0' }}% Read</span>
             <button (click)="navigateChapter(1)" class="text-sm font-medium hover:text-brand-400 transition-colors disabled:opacity-50" [disabled]="isLastChapter()">Next</button>
           </div>
        </div>
      }

      <!-- Chapter List Drawer -->
      @if (showChapterList()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" (click)="toggleChapterList()">
          <div class="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col shadow-2xl animate-slide-up" (click)="$event.stopPropagation()">
            
            <!-- Drawer Header -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-inherit rounded-t-2xl z-10 shadow-sm">
              <div>
                <h3 class="font-bold text-lg text-gray-900 dark:text-white">Chapters</h3>
                <span class="text-xs text-gray-500">{{ sortedChapters().length }} Total</span>
              </div>
              <button (click)="toggleChapterList()" class="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full bg-gray-100 dark:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Chapter Grid -->
            <div class="overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-5 gap-3 no-scrollbar pb-8 safe-area-bottom">
              @for (chap of sortedChapters(); track chap.chapter) {
                <button 
                  (click)="jumpToChapter(chap.chapter)"
                  [class.ring-2]="chap.chapter === currentChapterId()"
                  [class.ring-brand-500]="chap.chapter === currentChapterId()"
                  [class.bg-brand-500]="chap.chapter === currentChapterId()"
                  [class.text-white]="chap.chapter === currentChapterId()"
                  [class.bg-gray-100]="chap.chapter !== currentChapterId()"
                  [class.dark:bg-gray-800]="chap.chapter !== currentChapterId()"
                  [class.text-gray-900]="chap.chapter !== currentChapterId()"
                  [class.dark:text-gray-300]="chap.chapter !== currentChapterId()"
                  class="py-3 px-2 rounded-xl text-sm font-semibold hover:bg-brand-400 hover:text-white transition-all active:scale-95 shadow-sm text-center break-words">
                  {{ chap.chapter }}
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ReaderComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mangaService = inject(MangaService);
  private storage = inject(StorageService);

  // Signals
  data = signal<MangaDetailResponse | null>(null);
  images = signal<string[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showControls = signal(true);
  showChapterList = signal(false);
  currentImageIndex = signal(0);
  
  // Route Params
  mangaId = signal<string | null>(null);
  currentChapterId = signal<string | null>(null);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  readPercentage = computed(() => {
    const total = this.images().length;
    if (total === 0) return 0;
    return Math.min(100, Math.max(5, ((this.currentImageIndex() + 1) / total) * 100));
  });

  mangaTitle = computed(() => {
    const id = this.mangaId();
    if (!id) return '';
    const listMatch = this.mangaService.mangaList().find(m => m.mangaId === id);
    if (listMatch) return listMatch.title;
    const favMatch = this.storage.favorites().find(m => m.mangaId === id);
    if (favMatch) return favMatch.title;
    const progress = this.storage.getProgress(id);
    if (progress && progress.title && !progress.title.startsWith('Manga ' + id)) return progress.title;
    return `Manga ${id}`; 
  });

  // Get Sorted Chapters from Data
  sortedChapters = computed(() => {
    const list = this.data()?.chapterList || [];
    // Sort numerically if possible
    return [...list].sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter));
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('mangaId');
      const chapter = params.get('chapter');
      if (id && chapter) {
        this.mangaId.set(id);
        this.currentChapterId.set(chapter);
        this.loadChapter(id, chapter);
      }
    });
  }

  async loadChapter(id: string, chapter: string) {
    this.loading.set(true);
    this.error.set(null);
    this.images.set([]);
    this.showChapterList.set(false); // Close drawer on load
    
    const progress = this.storage.getProgress(id);
    const shouldRestore = progress && progress.chapter === chapter;

    try {
      const data = await this.mangaService.getMangaDetail(id, chapter);
      this.data.set(data);
      
      const imageUrls = data.images || [];
      this.images.set(imageUrls);

      if (shouldRestore && progress.imageIndex > 0) {
        setTimeout(() => {
          this.scrollToImage(progress.imageIndex);
        }, 100);
      }
    } catch (e) {
      this.error.set('Failed to load chapter.');
    } finally {
      this.loading.set(false);
    }
  }

  toggleControls() {
    this.showControls.update(v => !v);
  }

  toggleChapterList() {
    this.showChapterList.update(v => !v);
    if (this.showChapterList()) {
      this.showControls.set(false); // Hide standard controls when list is open for cleaner UI
    }
  }

  jumpToChapter(chapter: string) {
    if (chapter === this.currentChapterId()) {
      this.toggleChapterList();
      return;
    }
    this.router.navigate(['/read', this.mangaId(), chapter]);
  }

  onScroll() {
    if (this.loading()) return;
    
    const container = this.scrollContainer.nativeElement;
    const center = container.scrollTop + (container.clientHeight / 2);
    const imagesElements = container.querySelectorAll('[id^="page-"]');
    
    let currentIndex = 0;
    imagesElements.forEach((el: any, index: number) => {
      if (el.offsetTop <= center && (el.offsetTop + el.offsetHeight) > center) {
        currentIndex = index;
      }
    });

    if (currentIndex !== this.currentImageIndex()) {
      this.currentImageIndex.set(currentIndex);
      this.saveProgress();
    }
  }

  saveProgress() {
    const mId = this.mangaId();
    const cId = this.currentChapterId();
    if (!mId || !cId) return;
    
    this.storage.saveProgress(
      mId,
      cId,
      this.currentImageIndex(),
      this.images().length,
      this.mangaTitle()
    );
  }

  navigateChapter(direction: number) {
    const current = parseFloat(this.currentChapterId() || '1');
    // Try to find the next/prev chapter in the list to support non-linear IDs (e.g. 1.5)
    const list = this.sortedChapters();
    const idx = list.findIndex(c => c.chapter === this.currentChapterId());
    
    if (idx !== -1) {
      const nextIdx = idx + direction;
      if (nextIdx >= 0 && nextIdx < list.length) {
         this.router.navigate(['/read', this.mangaId(), list[nextIdx].chapter]);
         return;
      }
    }

    // Fallback to simple increment if list not found (shouldn't happen often)
    const next = current + direction;
    if (next < 1) return;
    this.router.navigate(['/read', this.mangaId(), next.toString()]);
  }

  isFirstChapter() {
    const list = this.sortedChapters();
    if (list.length === 0) return true;
    return list[0].chapter === this.currentChapterId();
  }

  isLastChapter() {
     const list = this.sortedChapters();
    if (list.length === 0) return true;
    return list[list.length - 1].chapter === this.currentChapterId();
  }

  scrollToImage(index: number) {
    const el = document.getElementById(`page-${index}`);
    if (el) {
      el.scrollIntoView();
    }
  }

  ngOnDestroy() {
    this.saveProgress();
  }
}
