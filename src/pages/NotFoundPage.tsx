import React, { useState } from 'react';
import {
  Sparkles,
  Home,
  ShoppingBag,
  Search,
  Truck,
  Heart,
  ArrowRight,
  ShieldCheck,
  RefreshCcw,
} from 'lucide-react';
import { Category } from '../types';

interface NotFoundPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenSearch?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  onOpenSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const popularCategories: { label: string; category: Category }[] = [
    { label: 'Sheet Masks', category: 'Sheet mask' },
    { label: 'Sunscreens', category: 'Sunscream' },
    { label: 'Mud & Clay Masks', category: 'Mud mask' },
    { label: 'Sleeping Masks', category: 'Sleeping mask' },
    { label: 'Lip Masks', category: 'Lip mask' },
    { label: 'Combo Offers', category: 'Combo offer' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      onNavigate('shop', 'All');
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FFF5F8] via-[#FAF8F5] to-white relative overflow-hidden">
      {/* Decorative background glow & elements */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[520px] h-[340px] bg-gradient-to-tr from-[#FF1493]/10 via-[#FF69B4]/15 to-transparent rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 right-10 w-72 h-72 bg-pink-100/40 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-2xl w-full text-center relative z-10 space-y-8">
        {/* Soft floating badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-pink-200/80 shadow-xs backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#FF1493] animate-ping" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[#FF1493]">
            Routine Step Missing • Error 404
          </span>
          <Sparkles className="w-3.5 h-3.5 text-[#FF1493]" />
        </div>

        {/* Big stylized 404 Display with skincare motif */}
        <div className="relative select-none py-2">
          <h1 className="text-8xl sm:text-9xl font-serif font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#241D20] via-[#5C2B40] to-[#FF1493]">
            4<span className="inline-block text-[#FF1493] animate-pulse">0</span>4
          </h1>
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <span className="text-9xl sm:text-[11rem] font-serif font-black tracking-widest text-[#FF1493]">
              ANFA
            </span>
          </div>
        </div>

        {/* Headings & Friendly Skincare Explanation */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-slate-900">
            This Skincare Formula Evaporated
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            Even the most dedicated 10-step glass skin routine hits an empty bottle sometimes.
            The page or product you are looking for might have been moved, renamed, or is temporarily out of our Dhaka vault.
          </p>
        </div>

        {/* Quick Search Action Box */}
        <div className="max-w-md mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-white rounded-full border border-pink-200 shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-[#FF1493]/30 focus-within:border-[#FF1493] transition-all"
          >
            <div className="pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search serums, masks, sunscreens..."
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              onClick={() => onOpenSearch && onOpenSearch()}
            />
            <button
              type="submit"
              className="shrink-0 bg-[#FF1493] hover:bg-[#e0007d] active:scale-95 text-white font-medium px-4 py-2 rounded-full text-xs transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 bg-[#FF1493] hover:bg-[#d90074] active:scale-95 text-white font-medium text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-md shadow-pink-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Return to Boutique</span>
          </button>

          <button
            onClick={() => onNavigate('shop', 'All')}
            className="inline-flex items-center gap-2 bg-white hover:bg-pink-50/60 active:scale-95 text-slate-800 border border-pink-200 hover:border-pink-300 font-medium text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-2xs"
          >
            <ShoppingBag className="w-4 h-4 text-[#FF1493]" />
            <span>Browse All Skincare</span>
          </button>

          <button
            onClick={() => onNavigate('track-order')}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 hover:border-slate-300 font-medium text-xs sm:text-sm px-5 py-3 rounded-full transition-all shadow-2xs"
          >
            <Truck className="w-4 h-4 text-slate-500" />
            <span>Track Order</span>
          </button>
        </div>

        {/* Recommended Skincare Categories Pills */}
        <div className="pt-6 border-t border-pink-100/80">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#FF1493]" />
            <span>Trending Skincare Vaults</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {popularCategories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => onNavigate('shop', cat.category)}
                className="text-xs px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-pink-50 text-slate-700 hover:text-[#FF1493] border border-slate-200/70 hover:border-pink-200 transition-colors shadow-2xs"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Guarantee Badge footer */}
        <div className="flex items-center justify-center gap-4 text-slate-400 text-[11px] pt-4">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Authentic Korean Imports
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            Fast Nationwide Delivery in BD
          </span>
        </div>
      </div>
    </div>
  );
};
