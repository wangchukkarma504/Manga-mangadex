import { Component, inject, signal, computed, ElementRef, ViewChild, OnDestroy, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MangaService, MangaDetailResponse } from './manga.service';
import { StorageService } from './storage.service';

@Component({
  selector: 'app-reader',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full bg-black overflow-hidden select-none">
      @if (loading()) {
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center text-white bg-dark-bg p-4">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-4"></div>
          <p class="animate-pulse font-medium">Loading Chapter...</p>
        </div>
      }

      <!-- Top Controls -->
      @if (showControls() && !loading()) {
        <div class="fixed top-0 left-0 right-0 z-40 bg-black/90 p-4 animate-slide-up shadow-lg border-b border-gray-800">
          <div class="flex items-center justify-between max-w-md mx-auto text-white">
            <a [routerLink]="['/manga', mangaId()]" class="p-2 hover:bg-white/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            </a>
            <div class="text-center">
              <h2 class="font-bold text-sm line-clamp-1 max-w-[200px]">{{ mangaTitle() }}</h2>
              <p class="text-xs text-brand-400">Chapter {{ currentChapterId() }}</p>
            </div>
            <div class="w-10"></div>
          </div>
        </div>
      }

      <div class="fixed top-0 left-0 h-1 bg-brand-500 z-50 transition-all duration-300" [style.width.%]="readPercentage()"></div>

      @if (!loading()) {
        <div #scrollContainer class="h-full overflow-y-auto no-scrollbar scroll-smooth bg-black" (click)="handleContainerClick($event)" (scroll)="onScroll()">
          @for (img of images(); track $index) {
            <div class="w-full relative min-h-[300px] bg-gray-900 mb-1" [id]="'page-' + $index">
              <img [src]="img" class="w-full h-auto block" [alt]="'Page ' + ($index + 1)" loading="eager">
              <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded opacity-50">
                {{ $index + 1 }} / {{ images().length }}
              </div>
            </div>
          }
          
          <!-- Chapter Navigation Footer -->
          <div class="h-64 bg-black flex flex-col items-center justify-center p-8 border-t border-gray-800">
            <p class="text-gray-500 mb-6 font-medium">End of Chapter {{ currentChapterId() }}</p>
            <div class="flex gap-4 w-full max-w-xs">
               <button (click)="navigateChapter(-1)" 
                 class="flex-1 py-3 px-4 bg-gray-800 text-white rounded-xl font-bold disabled:opacity-20 active:scale-95 transition-transform" 
                 [disabled]="isFirstChapter()">
                 Prev
               </button>
               <button (click)="navigateChapter(1)" 
                 class="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl font-bold disabled:opacity-20 active:scale-95 transition-transform" 
                 [disabled]="isLastChapter()">
                 Next
               </button>
            </div>
          </div>
        </div>
      }

      <!-- Bottom Controls -->
      @if (showControls() && !loading()) {
        <div class="fixed bottom-0 left-0 right-0 z-40 bg-black/90 p-6 pb-8 border-t border-gray-800 animate-slide-up">
           <div class="flex items-center justify-between text-white max-w-md mx-auto mb-4">
             <button (click)="navigateChapter(-1)" class="text-sm font-medium px-4 py-2 hover:bg-white/10 rounded-lg disabled:opacity-30" [disabled]="isFirstChapter()">Prev</button>
             <span class="text-xs font-bold">{{ currentImageIndex() + 1 }} / {{ images().length }}</span>
             <button (click)="navigateChapter(1)" class="text-sm font-medium px-4 py-2 hover:bg-white/10 rounded-lg disabled:opacity-30" [disabled]="isLastChapter()">Next</button>
           </div>
           <div class="max-w-md mx-auto">
             <input type="range" 
               [min]="0" 
               [max]="images().length > 0 ? images().length - 1 : 0" 
               [value]="currentImageIndex()"
               (input)="handleSliderInput($event)"
               class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500">
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

  data = signal<MangaDetailResponse | null>(null);
  images = signal<string[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showControls = signal(true);
  currentImageIndex = signal(0);
  mangaId = signal<string | null>(null);
  currentChapterId = signal<string | null>(null);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  readPercentage = computed(() => {
    const total = this.images().length;
    return total === 0 ? 0 : Math.min(100, ((this.currentImageIndex() + 1) / total) * 100);
  });

  mangaTitle = computed(() => {
    const id = this.mangaId();
    if (!id) return '';
    const progress = this.storage.getProgress(id);
    return progress?.title || `Manga ${id}`;
  });

  sortedChapters = computed(() => this.data()?.chapterList || []);

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
    this.showControls.set(true);
    try {
      const data = await this.mangaService.getMangaDetail(id, chapter);
      this.data.set(data);
      this.images.set(data.images || []);
      
      const progress = this.storage.getProgress(id);
      if (progress && progress.chapter === chapter) {
        // Delay slightly to ensure DOM is rendered
        setTimeout(() => this.scrollToImage(progress.imageIndex), 100);
      } else {
        // New chapter, scroll to top
        setTimeout(() => {
          if (this.scrollContainer) this.scrollContainer.nativeElement.scrollTop = 0;
        }, 100);
      }
    } catch (e) {
      this.error.set('Failed to load chapter.');
    } finally {
      this.loading.set(false);
      // Auto-hide controls after 3 seconds
      setTimeout(() => this.showControls.set(false), 3000);
    }
  }

  handleContainerClick(event: MouseEvent) {
    const height = window.innerHeight;
    const y = event.clientY;
    
    // Middle 40% of screen toggles controls
    if (y > height * 0.3 && y < height * 0.7) {
      this.showControls.update(v => !v);
    } else if (y <= height * 0.3) {
      // Top 30% scrolls up
      this.scrollContainer.nativeElement.scrollBy({ top: -height * 0.8, behavior: 'smooth' });
    } else {
      // Bottom 30% scrolls down
      this.scrollContainer.nativeElement.scrollBy({ top: height * 0.8, behavior: 'smooth' });
    }
  }

  handleSliderInput(event: any) {
    const index = parseInt(event.target.value, 10);
    this.scrollToImage(index);
  }

  onScroll() {
    if (this.loading() || !this.scrollContainer) return;
    const container = this.scrollContainer.nativeElement;
    const center = container.scrollTop + (container.clientHeight / 2);
    const imagesElements = container.querySelectorAll('[id^="page-"]');
    
    let currentIndex = 0;
    imagesElements.forEach((el: HTMLElement, index: number) => {
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
    if (mId && cId) {
      this.storage.saveProgress(
        mId, 
        cId, 
        this.currentImageIndex(), 
        this.images().length, 
        this.mangaTitle()
      );
    }
  }

  navigateChapter(direction: number) {
    const list = this.sortedChapters();
    const currentIdx = list.findIndex(c => c.chapter === this.currentChapterId());
    const nextIdx = currentIdx + direction;
    
    if (nextIdx >= 0 && nextIdx < list.length) {
      this.router.navigate(['/read', this.mangaId(), list[nextIdx].chapter]);
    }
  }

  isFirstChapter() {
    const list = this.sortedChapters();
    return list.length > 0 && list[0].chapter === this.currentChapterId();
  }

  isLastChapter() {
    const list = this.sortedChapters();
    return list.length > 0 && list[list.length - 1].chapter === this.currentChapterId();
  }

  scrollToImage(index: number) {
    const el = document.getElementById(`page-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }

  ngOnDestroy() {
    this.saveProgress();
  }
}