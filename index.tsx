
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withHashLocation, Routes } from '@angular/router';

import { HomeComponent } from './src/components/home.component';
import { ReaderComponent } from './src/components/reader.component';
import { FavoritesComponent } from './src/components/favorites.component';
import { MangaDetailComponent } from './src/components/manga-detail.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'favorites', component: FavoritesComponent },
  { path: 'manga/:mangaId', component: MangaDetailComponent },
  { path: 'read/:mangaId/:chapter', component: ReaderComponent },
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withHashLocation())
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
