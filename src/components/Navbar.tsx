import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  User as UserIcon,
  Menu,
  X,
  Shield,
  LogOut,
  Package,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Truck,
  Flame,
  Home,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Category, ALL_CATEGORIES } from '../types';

interface NavbarProps {
  activeTab: string;
  activeCategory?: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenSearch: () => void;
}

interface NavCategoryItem {
  label: string;
  category: Category | 'All';
  highlight?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  activeCategory = 'All',
  onNavigate,
  onOpenSearch,
}) => {
  const { totalItems, wishlist, setIsCartDrawerOpen } = useCart();
  const { user, isAdmin, isSigningIn, signInWithGoogle, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navCategories: NavCategoryItem[] = [
    { label: 'All Products', category: 'All' },
    { label: 'Sheet Mask', category: 'Sheet mask' },
    { label: 'Mud Mask', category: 'Mud mask' },
    { label: 'Sleeping Mask', category: 'Sleeping mask' },
    { label: 'Bubble Mask', category: 'Bubble mask' },
    { label: 'Eye Mask', category: 'Eye mask' },
    { label: 'Lip Mask', category: 'Lip mask' },
    { label: 'Sunscream', category: 'Sunscream' },
    { label: 'Bodywash', category: 'Bodywash' },
    { label: 'Nose Strip', category: 'Nose strip' },
    { label: 'Blackhead Remover', category: 'Blackhead remover' },
    { label: 'Makeup Remover', category: 'Makeup remover' },
    { label: 'Applicator', category: 'Applicator' },
    { label: 'Foot Mask', category: 'Foot mask' },
    { label: 'Combo Offer', category: 'Combo offer', highlight: true },
  ];

  // Helper to determine exact active state
  const isLinkActive = (cat: Category | 'All'): boolean => {
    if (activeTab !== 'shop') return false;
    if (cat === 'All') {
      return !activeCategory || activeCategory === 'All';
    }
    return activeCategory.toLowerCase() === cat.toLowerCase();
  };

  const handleCategoryClick = (cat: Category | 'All') => {
    onNavigate('shop', cat);
    setIsMobileMenuOpen(false);
  };

  const scrollNav = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 240;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-2xs">
      {/* Top Announcement Bar */}
      <div className="bg-[#FF1493] text-white py-1.5 px-4 text-center text-[10px] sm:text-[11px] tracking-wider uppercase font-semibold flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white/90 shrink-0 animate-pulse" />
        <span className="truncate">
          100% Authentic Korean &amp; Dermatological Skincare • Delivery: Inside Dhaka 80tk | Dhaka sub-area 120tk | Outside Dhaka 150tk
        </span>
        <Sparkles className="w-3.5 h-3.5 text-white/90 shrink-0 animate-pulse" />
      </div>

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-3">
          {/* Left: Mobile menu trigger + search trigger */}
          <div className="flex items-center lg:hidden shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 text-slate-800 hover:text-[#FF1493] focus:outline-none"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
            <button
              onClick={onOpenSearch}
              className="p-1.5 sm:p-2 text-slate-800 hover:text-[#FF1493] ml-0.5 sm:ml-1"
              aria-label="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Left on Desktop: Quick Search */}
          <div className="hidden lg:flex items-center w-1/4">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:border-[#FF1493] rounded-full transition-colors w-56 shadow-2xs group"
            >
              <Search className="w-3.5 h-3.5 text-[#FF1493] group-hover:text-[#E00078]" />
              <span className="font-normal text-slate-600">Search skincare & masks...</span>
            </button>
          </div>

          {/* Center: Brand Identity with Responsive Scaling for Small Devices */}
          <div
            className="flex-1 lg:flex-initial text-center cursor-pointer select-none px-1 sm:px-2 min-w-0 flex flex-col items-center justify-center"
            onClick={() => onNavigate('home')}
          >
            <span className="block font-serif text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-[0.14em] sm:tracking-[0.2em] text-slate-900 uppercase hover:text-[#FF1493] transition-colors leading-tight truncate max-w-full">
              ANFA BD
            </span>
            <span className="block text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.28em] text-[#FF1493] font-bold uppercase -mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              GIRLS SKIN CARE BOUTIQUE
            </span>
          </div>

          {/* Right: Currency, Wishlist, Account, Cart */}
          <div className="flex items-center justify-end w-auto lg:w-1/4 gap-1 sm:gap-2.5 shrink-0">
            {/* Currency Pill */}
            <div className="hidden sm:flex items-center text-[10px] font-semibold text-[#FF1493] px-2.5 py-0.5 bg-[#FFF0F6] rounded-full border border-[#FFC1E3]">
              BDT (৳)
            </div>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="relative p-1.5 sm:p-2 text-slate-700 hover:text-[#FF1493] transition-colors"
              aria-label="Wishlist"
              title="Saved Favorites"
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  wishlist.length > 0 ? 'fill-[#FF1493] text-[#FF1493]' : ''
                }`}
              />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#FF1493] text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* User Profile / Admin Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`flex items-center gap-1 p-1.5 sm:p-2 rounded-full transition-colors ${
                  user ? 'text-[#FF1493] bg-[#FFF0F6]' : 'text-slate-700 hover:text-[#FF1493]'
                }`}
                aria-label="Account"
              >
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in text-xs">
                  {user ? (
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                      <p className="font-semibold text-slate-900 truncate">
                        {user.displayName || 'Client'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#FF1493] text-white text-[9px] font-semibold uppercase tracking-wider rounded">
                          Admin Privileges
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                      <p className="font-medium text-slate-900">Welcome to ANFA BD</p>
                      <p className="text-[11px] text-slate-500">
                        Sign in for order tracking & wishlist sync
                      </p>
                    </div>
                  )}

                  <div className="py-1">
                    {user ? (
                      <>
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            onNavigate('account');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                        >
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>My Orders & Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            onNavigate('track-order');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                        >
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Track Parcel</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              onNavigate('admin');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#FFF0F6] text-[#FF1493] font-semibold flex items-center gap-2 border-t border-slate-100 mt-1"
                          >
                            <Shield className="w-3.5 h-3.5 text-[#FF1493]" />
                            <span>Store Admin Panel</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            signOut();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 border-t border-slate-100 mt-1"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            signInWithGoogle();
                          }}
                          disabled={isSigningIn}
                          className="w-full text-left px-4 py-2 hover:bg-[#FFF0F6] text-[#FF1493] font-semibold flex items-center gap-2"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-[#FF1493]" />
                          <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            onNavigate('track-order');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                        >
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Track An Order</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Bag Trigger */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 sm:p-2.5 bg-[#FF1493] hover:bg-[#E00078] active:scale-95 text-white rounded-full shadow-[0_0_15px_rgba(255,20,147,0.4)] hover:shadow-[0_0_24px_rgba(255,20,147,0.65)] transition-all cursor-pointer"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#D4AF37] text-slate-900 text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse-soft">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Responsive Horizontal Category Navigation Bar */}
        <div className="relative border-t border-slate-100 flex items-center">
          {/* Scroll Left Button (hidden if at start or on mobile) */}
          <button
            onClick={() => scrollNav('left')}
            className="hidden md:flex absolute -left-3 z-10 p-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-[#FF1493] hover:border-[#FF1493]"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Category Ribbon */}
          <nav
            ref={scrollContainerRef}
            className="w-full overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 sm:gap-2.5 py-2.5 px-1 sm:px-2"
          >
            {/* Home button */}
            <button
              onClick={() => onNavigate('home')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-[#FF1493] text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-700 hover:bg-pink-50 hover:text-[#FF1493] border border-slate-200/60'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            {/* All 14 Specific Requested Categories */}
            {navCategories.map((item) => {
              const active = isLinkActive(item.category);
              return (
                <button
                  key={item.label}
                  onClick={() => handleCategoryClick(item.category)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none ${
                    active
                      ? 'bg-[#FF1493] text-white shadow-xs ring-1 ring-[#FF1493]'
                      : item.highlight
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-100/90 text-slate-700 hover:bg-pink-50 hover:text-[#FF1493] border border-slate-200/60'
                  }`}
                >
                  {item.highlight && <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Scroll Right Button */}
          <button
            onClick={() => scrollNav('right')}
            className="hidden md:flex absolute -right-3 z-10 p-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-[#FF1493] hover:border-[#FF1493]"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-fade-in">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-200">
                <div className="min-w-0">
                  <span className="font-serif text-lg sm:text-xl tracking-[0.14em] sm:tracking-[0.18em] font-bold text-slate-900 uppercase block truncate">
                    ANFA BD
                  </span>
                  <span className="block text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.24em] text-[#FF1493] font-bold uppercase whitespace-nowrap">
                    GIRLS SKIN CARE BOUTIQUE
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Main Nav Links in Mobile Drawer */}
              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Navigation
                  </span>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('home');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-semibold transition-colors ${
                      activeTab === 'home'
                        ? 'bg-[#FFF0F6] text-[#FF1493] font-bold border border-[#FFC1E3]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-[#FF1493]" />
                      Home Page
                    </span>
                  </button>
                </div>

                {/* Categories Group in Drawer */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Skincare Categories
                  </span>
                  <div className="space-y-1">
                    {navCategories.map((item) => {
                      const active = isLinkActive(item.category);
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleCategoryClick(item.category)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between font-medium transition-colors ${
                            active
                              ? 'bg-[#FF1493] text-white font-bold shadow-2xs'
                              : item.highlight
                              ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {item.highlight && <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />}
                            <span>{item.label}</span>
                          </span>
                          {active && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase font-bold">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* User Services */}
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Client Services
                  </span>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('wishlist');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[#FF1493]" />
                      <span>Saved Wishlist</span>
                    </span>
                    <span className="font-bold text-[#FF1493]">({wishlist.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('track-order');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-[#FF1493]" />
                    <span>Track Your Parcel</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('account');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4 text-[#FF1493]" />
                    <span>My Account & Orders</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigate('admin');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[#FF1493] bg-[#FFF0F6] font-semibold flex items-center gap-2 border border-[#FFC1E3] mt-2"
                    >
                      <Shield className="w-4 h-4 text-[#FF1493]" />
                      <span>Store Admin Panel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500">
              <p className="font-semibold text-slate-800">ANFA BD Helpline</p>
              <p>Cash on Delivery • Banani, Dhaka</p>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};
