import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from './storage.service';
import { MangaCardComponent } from './manga-card.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule, MangaCardComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-full p-4 pb-20">
      <header class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Favorites</h1>
        <span class="text-sm text-gray-500">{{ favorites().length }} items</span>
      </header>

      @if (favorites().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 text-gray-400">
          <p class="text-lg font-medium mb-2">No favorites yet</p>
          <a routerLink="/" class="px-6 py-2 bg-brand-500 text-white rounded-full">Explore Manga</a>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          @for (manga of favorites(); track manga.mangaId) {
            <app-manga-card 
              [manga]="manga" 
              [isFavorite]="true"
              (toggleFav)="storage.toggleFavorite(manga)">
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
}