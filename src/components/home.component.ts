
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MangaService } from '../services/manga.service';
import { StorageService } from '../services/storage.service';
import { MangaCardComponent } from './ui/manga-card.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, MangaCardComponent],
  template: `
    <div class="min-h-full pb-20">
      <!-- Header -->
      <header class="sticky top-0 z-40 bg-white/95 dark:bg-dark-surface/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <h1 class="text-2xl font-bold bg-gradient-to-r from-brand-500 to-purple-600 bg-clip-text text-transparent mb-3">
          ZenManga
        </h1>
        
        <!-- Search -->
        <div class="relative">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (keydown.enter)="onSearch()"
            placeholder="Search manga... (Press Enter)" 
            class="w-full bg-gray-100 dark:bg-dark-bg border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-500 transition-all dark:text-white"
          >
          <button (click)="onSearch()" class="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-400 hover:text-brand-500 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Welcome Banner / Last Read -->
      @if (lastRead()) {
        <div class="mx-4 mt-4 p-4 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-brand-900 dark:to-brand-800 rounded-2xl text-white shadow-lg relative overflow-hidden group">
          <div class="relative z-10">
            <p class="text-xs text-gray-300 font-medium uppercase tracking-wider mb-1">Jump back in</p>
            <h2 class="text-lg font-bold truncate pr-8">{{ lastRead()?.title }}</h2>
            <div class="flex items-center mt-3 text-xs font-medium">
              <span class="bg-white/20 px-2 py-1 rounded text-white">Chapter {{ lastRead()?.chapter }}</span>
              <span class="mx-2 text-gray-400">•</span>
              <span class="text-brand-300">Page {{ lastRead()?.imageIndex! + 1 }}</span>
            </div>
          </div>
          <div class="absolute -right-6 -bottom-6 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
            <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
        </div>
      }

      <!-- Grid -->
      <div class="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        @for (manga of filteredManga(); track manga.mangaId) {
          <app-manga-card 
            [manga]="manga" 
            [isFavorite]="storage.isFavorite(manga.mangaId)"
            (toggleFav)="toggleFavorite($event, manga)">
          </app-manga-card>
        }
      </div>

      <!-- Loading / Empty States -->
      @if (mangaService.loading()) {
        <div class="flex flex-col items-center justify-center space-y-4" [class.h-[60vh]]="filteredManga().length === 0" [class.py-8]="filteredManga().length > 0">
          <div class="relative w-20 h-20">
             <!-- Pulse ring -->
             <div class="absolute inset-0 rounded-full border-4 border-brand-200 opacity-25 animate-ping"></div>
             <!-- Spinner -->
             <div class="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
             <!-- Icon -->
             <div class="absolute inset-0 flex items-center justify-center">
                @if (searchQuery()) {
                   <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-brand-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-brand-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                }
             </div>
          </div>
          <p class="text-sm font-medium text-brand-500 animate-pulse">
            {{ searchQuery() ? 'Searching Library...' : 'Loading Manga...' }}
          </p>
        </div>
      } @else if (filteredManga().length === 0) {
        <div class="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg class="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p>No manga found</p>
          <button (click)="onSearch()" class="mt-4 px-4 py-2 text-sm bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 dark:bg-gray-800 dark:text-brand-400">
            Retry
          </button>
        </div>
      }

      <!-- Load More Trigger -->
      @if (!mangaService.loading() && filteredManga().length > 0) {
        <div class="flex justify-center py-4">
          <button (click)="loadMore()" class="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700">
            Load More Manga
          </button>
        </div>
      }
    </div>
  `
})
export class HomeComponent {
  mangaService = inject(MangaService);
  storage = inject(StorageService);
  
  searchQuery = signal('');
  
  // Directly use the service's list as it now reflects the search state
  filteredManga = this.mangaService.mangaList;

  lastRead = this.storage.lastRead;

  toggleFavorite(event: Event, manga: any) {
    event.stopPropagation();
    event.preventDefault();
    this.storage.toggleFavorite(manga);
  }

  onSearch() {
    this.mangaService.fetchMangaList(true, 0, 20, this.searchQuery());
  }

  loadMore() {
    this.mangaService.fetchMangaList(false, this.mangaService.mangaList().length, 20, this.searchQuery());
  }
}
