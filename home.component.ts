import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MangaService } from './manga.service';
import { StorageService } from './storage.service';
import { MangaCardComponent } from './manga-card.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, MangaCardComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-full pb-20">
      <header class="sticky top-0 z-40 bg-white/95 dark:bg-dark-surface/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <h1 class="text-xl font-bold bg-gradient-to-r from-brand-500 to-purple-600 bg-clip-text text-transparent mb-3">ZenManga</h1>
        <div class="relative">
          <input type="text" [(ngModel)]="searchQuery" (keydown.enter)="onSearch()" placeholder="Search..." class="w-full bg-gray-100 dark:bg-dark-bg border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-500">
          <div class="absolute left-3 top-2 text-gray-400">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </header>

      @let last = lastRead();
      @if (last) {
        <a [routerLink]="['/read', last.mangaId, last.chapter]" class="block mx-4 mt-4 p-4 bg-gray-900 rounded-2xl text-white shadow-lg overflow-hidden relative">
          <div class="relative z-10">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Resume Reading</p>
            <h2 class="text-md font-bold truncate">{{ last.title }}</h2>
            <p class="text-[10px] text-brand-400 mt-1">Ch. {{ last.chapter }} • Page {{ last.imageIndex + 1 }}</p>
          </div>
        </a>
      }

      <div class="p-4 grid grid-cols-2 gap-4">
        @for (manga of mangaList(); track manga.mangaId) {
          <app-manga-card 
            [manga]="manga" 
            [isFavorite]="storage.isFavorite(manga.mangaId)"
            (toggleFav)="storage.toggleFavorite(manga)">
          </app-manga-card>
        }
      </div>

      @if (mangaService.loading()) {
        <div class="flex justify-center py-8">
          <div class="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    </div>
  `
})
export class HomeComponent {
  mangaService = inject(MangaService);
  storage = inject(StorageService);
  searchQuery = signal('');
  mangaList = this.mangaService.mangaList;
  lastRead = this.storage.lastRead;

  onSearch() {
    this.mangaService.fetchMangaList(true, 0, 20, this.searchQuery());
  }
}