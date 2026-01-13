import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { StorageService } from './storage.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-[100dvh] flex flex-col w-full max-w-md mx-auto bg-white dark:bg-dark-bg relative shadow-2xl overflow-hidden">
      <main class="flex-1 overflow-y-auto no-scrollbar relative">
        <router-outlet></router-outlet>
      </main>

      @if (showNav()) {
        <nav class="h-16 bg-white/95 dark:bg-dark-surface/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 flex justify-around items-center z-50 shrink-0">
          <a routerLink="/" routerLinkActive="text-brand-500 dark:text-brand-400" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center w-full h-full text-gray-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mb-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span class="text-[10px] font-medium">Discover</span>
          </a>

          @let last = lastRead();
          @if (last) {
            <a [routerLink]="['/read', last.mangaId, last.chapter]" class="flex flex-col items-center justify-center w-full h-full -mt-6">
              <div class="w-14 h-14 rounded-full bg-brand-500 shadow-lg shadow-brand-500/30 flex items-center justify-center text-white border-4 border-white dark:border-dark-bg transform active:scale-95 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 ml-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>
              <span class="text-[10px] font-medium text-brand-500 mt-1">Resume</span>
            </a>
          }

          <a routerLink="/favorites" routerLinkActive="text-red-500" class="flex flex-col items-center justify-center w-full h-full text-gray-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mb-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span class="text-[10px] font-medium">Favorites</span>
          </a>
        </nav>
      }
    </div>
  `
})
export class AppComponent {
  storage = inject(StorageService);
  router = inject(Router);
  lastRead = this.storage.lastRead;
  showNav = signal(true);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showNav.set(!event.urlAfterRedirects.includes('/read/'));
    });
  }
}