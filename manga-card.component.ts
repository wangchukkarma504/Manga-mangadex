import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Manga } from './manga.service';

@Component({
  selector: 'app-manga-card',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="group relative flex flex-col h-full bg-white dark:bg-dark-surface rounded-xl overflow-hidden shadow-sm transition-all active:scale-[0.98]">
      <a [routerLink]="['/manga', manga.mangaId]" class="relative w-full aspect-[2/3] overflow-hidden bg-gray-200 dark:bg-gray-800">
        <img [src]="manga.coverImage" [alt]="manga.title" loading="lazy" class="w-full h-full object-cover">
        @if (manga.genre && manga.genre.length > 0) {
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <span class="text-[10px] text-white bg-brand-600 px-1.5 py-0.5 rounded-md">
              {{ manga.genre[0] }}
            </span>
          </div>
        }
      </a>
      <div class="p-2 flex flex-col flex-1">
        <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
          {{ manga.title }}
        </h3>
        <div class="mt-auto flex items-center justify-between pt-2">
          <button (click)="onFavClick($event)" class="p-1">
            <svg xmlns="http://www.w3.org/2000/svg" [class.fill-red-500]="isFavorite" [class.text-red-500]="isFavorite" [class.text-gray-400]="!isFavorite" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class MangaCardComponent {
  @Input({ required: true }) manga!: Manga;
  @Input({ required: true }) isFavorite: boolean = false;
  @Output() toggleFav = new EventEmitter<Event>();

  onFavClick(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.toggleFav.emit(e);
  }
}