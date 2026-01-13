
import { Component, inject, signal, computed, effect, ElementRef, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MangaService, MangaDetailResponse } from '../services/manga.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative w-full h-full bg-black">
      
      <!-- Loading State (Metadata only) -->
      @if (loading()) {
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center text-white bg-dark-bg p-4">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-4"></div>
          <p class="animate-pulse font-medium text-lg mb-1">Loading Chapter...</p>
        </div>
      }

      <!-- Controls Overlay (Top) -->
      @if (showControls() && !loading()) {
        <div class="fixed top-0 left-0 right-0 z-50 bg-black/90 p-4 animate-slide-up shadow-lg border-b border-gray-800">
          <div class="flex items-center justify-between max-w-md mx-auto">
            <a routerLink="/" class="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </a>
            <div class="text-center">
              <h2 class="text-white font-bold text-sm line-clamp-1 max-w-[200px]">{{ mangaTitle() }}</h2>
              <p class="text-xs text-gray-300">Chapter {{ currentChapterId() }}</p>
            </div>
            <button (click)="toggleControls()" class="p-2 text-white hover:bg-white/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- Progress Bar (Always visible lightly) -->
      <div class="fixed top-0 left-0 h-1 bg-brand-500 z-50 transition-all duration-300" [style.width.%]="readPercentage()"></div>

      <!-- Main Reader Area -->
      <!-- Only rendered when loading is false to ensure all images are ready -->
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
              <!-- loading="eager" forces all images to start downloading immediately -->
              <!-- decoding="async" prevents UI freeze during image decode -->
              <img [src]="img" class="w-full h-auto block" alt="Page {{ $index + 1 }}" loading="eager" decoding="async">
              
              <!-- Page Number Indicator -->
              <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded opacity-50">
                {{ $index + 1 }} / {{ images().length }}
              </div>
            </div>
          }
          
          <!-- Spacer at bottom to allow scrolling past last image slightly -->
          <div class="h-32 bg-black"></div>
        </div>
      }

      <!-- Controls Overlay (Bottom) -->
      @if (showControls() && !loading()) {
        <div class="fixed bottom-0 left-0 right-0 z-50 bg-black/90 p-6 pb-8 animate-slide-up border-t border-gray-800 shadow-lg">
           <div class="flex items-center justify-between text-white max-w-md mx-auto">
             <button (click)="navigateChapter(-1)" class="text-sm font-medium hover:text-brand-400 transition-colors">Previous</button>
             <span class="text-xs bg-white/20 px-3 py-1 rounded-full">{{ readPercentage() | number:'1.0-0' }}% Read</span>
             <button (click)="navigateChapter(1)" class="text-sm font-medium hover:text-brand-400 transition-colors">Next</button>
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

  // Smart Title Resolver
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
    
    const progress = this.storage.getProgress(id);
    const shouldRestore = progress && progress.chapter === chapter;

    try {
      // 1. Fetch Metadata
      const data = await this.mangaService.getMangaDetail(id, chapter);
      this.data.set(data);
      
      const imageUrls = data.images || [];
      this.images.set(imageUrls); // Render images immediately

      // 2. Restore Position
      // Since we are not waiting for images to load, layout might shift.
      // We attempt to scroll, but it might need manual adjustment by user if images load slowly.
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
    const current = parseInt(this.currentChapterId() || '1');
    const next = current + direction;
    
    if (next < 1) return;
    if (this.data()?.maxChapter && next > this.data()!.maxChapter) return;

    this.router.navigate(['/read', this.mangaId(), next.toString()]);
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
