
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { StorageProvider, useStorage } from './context/StorageContext';
import Home from './components/Home';
import Favorites from './components/Favorites';
import MangaDetail from './components/MangaDetail';
import Reader from './components/Reader';
import { Home as HomeIcon, Heart, BookOpen } from 'lucide-react';

function NavBar() {
  const location = useLocation();
  const { lastRead } = useStorage();
  const hideNav = location.pathname.includes('/read/');

  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-dark-surface/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 flex justify-around items-center z-50">
      <Link to="/" className={`flex flex-col items-center justify-center w-full h-full transition-colors ${location.pathname === '/' ? 'text-brand-500 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
        <HomeIcon size={24} className="mb-1" />
        <span className="text-[10px] font-medium">Discover</span>
      </Link>

      {lastRead && (
        <Link to={`/read/${lastRead.mangaId}/${lastRead.chapter}`} className="flex flex-col items-center justify-center w-full h-full -mt-6">
          <div className="w-14 h-14 rounded-full bg-brand-500 shadow-lg shadow-brand-500/30 flex items-center justify-center text-white border-4 border-white dark:border-dark-bg transform active:scale-95 transition-transform">
            <BookOpen size={28} className="ml-0.5" />
          </div>
          <span className="text-[10px] font-medium text-brand-500 mt-1">Resume</span>
        </Link>
      )}

      <Link to="/favorites" className={`flex flex-col items-center justify-center w-full h-full transition-colors ${location.pathname === '/favorites' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
        <Heart size={24} className="mb-1" />
        <span className="text-[10px] font-medium">Favorites</span>
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <HashRouter>
      <StorageProvider>
        <div className="h-[100dvh] flex flex-col w-full max-w-md mx-auto bg-white dark:bg-dark-bg relative shadow-2xl overflow-hidden">
          <main className="flex-1 overflow-y-auto no-scrollbar relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/manga/:mangaId" element={<MangaDetail />} />
              <Route path="/read/:mangaId/:chapter" element={<Reader />} />
            </Routes>
          </main>
          <NavBar />
        </div>
      </StorageProvider>
    </HashRouter>
  );
}
