import '@angular/compiler';
import './styles.css';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withHashLocation, Routes } from '@angular/router';

import { HomeComponent } from './home.component';
import { ReaderComponent } from './reader.component';
import { FavoritesComponent } from './favorites.component';
import { MangaDetailComponent } from './manga-detail.component';

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
