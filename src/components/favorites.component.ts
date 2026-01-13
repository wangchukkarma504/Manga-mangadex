
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../services/storage.service';
import { MangaCardComponent } from './ui/manga-card.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule, MangaCardComponent, RouterLink],
  template: `
    <div class="min-h-full p-4 pb-20">
      <header class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
        <span class="text-sm text-gray-500">{{ favorites().length }} items</span>
      </header>

      @if (favorites().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 text-gray-400">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mb-4 opacity-30">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p class="text-lg font-medium mb-2">No favorites yet</p>
          <p class="text-sm text-center max-w-xs mb-6">Start reading and tap the heart icon to save manga here.</p>
          <a routerLink="/" class="px-6 py-2 bg-brand-500 text-white rounded-full font-medium shadow-lg shadow-brand-500/30">Explore Manga</a>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          @for (manga of favorites(); track manga.mangaId) {
            <app-manga-card 
              [manga]="manga" 
              [isFavorite]="true"
              (toggleFav)="toggleFavorite($event, manga)">
            </app-manga-card>
          }
        </div>
      }
    </div>
  `
})
export class FavoritesComponent {
  storage = inject(StorageService);
  favorites = this.storage.favorites;

  toggleFavorite(event: Event, manga: any) {
    event.stopPropagation();
    event.preventDefault();
    this.storage.toggleFavorite(manga);
  }
}
