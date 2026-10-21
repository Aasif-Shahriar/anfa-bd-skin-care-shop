import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  X,
  Search,
  ChevronDown,
  Check,
  RotateCcw,
  ArrowUpDown,
  Sparkles,
  Droplet,
} from 'lucide-react';
import { Product, EXACT_14_CATEGORIES } from '../types';
import { ProductCard } from '../components/ProductCard';
import { formatPrice, normalizeCategory } from '../utils/format';

interface ShopPageProps {
  products: Product[];
  initialCategory?: string;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  initialCategory = 'All',
  onSelectProduct,
  onQuickView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedConcern, setSelectedConcern] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Sync when user clicks a category in Navbar or external links
  useEffect(() => {
    setSelectedCategory(initialCategory || 'All');
  }, [initialCategory]);

  const categories = ['All', ...EXACT_14_CATEGORIES];

  const skinConcerns = [
    'All',
    'Acne & Blemish',
    'Pore Clarifying',
    'Deep Hydration',
    'Barrier Repair',
    'UV Protection',
  ];

  const sortOptions = [
    { value: 'featured', label: 'Featured Curations' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'New Arrivals' },
    { value: 'bestseller', label: 'Best Sellers' },
  ];

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedConcern('All');
    setSearchQuery('');
    setSortBy('featured');
    setInStockOnly(false);
    setMaxPrice(5000);
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Exclude drafts, archived, or inactive products from public shop
        if (p.status === 'draft' || p.status === 'archived' || p.active === false) {
          return false;
        }

        // Category filter (normalized so Title Case and legacy match)
        if (selectedCategory === 'New') {
          if (!p.newArrival) return false;
        } else if (selectedCategory !== 'All') {
          const normProductCat = normalizeCategory(p.category);
          const normSelectedCat = normalizeCategory(selectedCategory);
          if (normProductCat !== normSelectedCat) {
            return false;
          }
        }

        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matches =
            p.name?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query) ||
            p.brand?.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query) ||
            p.tags?.some((t) => t.toLowerCase().includes(query)) ||
            p.description?.toLowerCase().includes(query) ||
            p.shortDescription?.toLowerCase().includes(query) ||
            p.specifications?.keyIngredients?.toLowerCase().includes(query);
          if (!matches) return false;
        }

        // Skin concern filter
        if (selectedConcern !== 'All') {
          const concernLower = selectedConcern.toLowerCase();
          const concernsText = Array.isArray(p.specifications?.concerns)
            ? p.specifications.concerns.join(' ').toLowerCase()
            : (p.specifications?.concerns || '').toLowerCase();
          const matchesConcern =
            p.name.toLowerCase().includes(concernLower) ||
            p.description.toLowerCase().includes(concernLower) ||
            concernsText.includes(concernLower) ||
            (p.specifications?.keyIngredients || '').toLowerCase().includes(concernLower);
          if (!matchesConcern) return false;
        }

        // In stock only
        if (inStockOnly && (p.totalStock ?? 0) <= 0) {
          return false;
        }

        // Max price filter (checks base price)
        if (p.basePrice > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return a.basePrice - b.basePrice;
        }
        if (sortBy === 'price-desc') {
          return b.basePrice - a.basePrice;
        }
        if (sortBy === 'newest') {
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        if (sortBy === 'bestseller') {
          return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
        }
        if (sortBy === 'featured') {
          const prioDiff = (b.displayPriority ?? 0) - (a.displayPriority ?? 0);
          if (prioDiff !== 0) return prioDiff;
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
        return (b.displayPriority ?? 0) - (a.displayPriority ?? 0);
      });
  }, [products, selectedCategory, selectedConcern, searchQuery, sortBy, inStockOnly, maxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Shop Header */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#FF1493]">
            Korean Skincare Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-medium mt-1">
            {selectedCategory === 'All' ? 'All Skincare Products' : selectedCategory}
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Showing {filteredProducts.length} authentic dermatological formulas
          </p>
        </div>

        {/* Search, Sort Dropdown and Mobile Filter trigger */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search serums, sunscreens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-[#FF1493] focus:ring-1 focus:ring-[#FF1493] w-48 sm:w-60 shadow-2xs font-medium"
            />
            <Search className="w-4 h-4 text-[#FF1493] absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-xs text-slate-900 font-semibold py-2 pl-3.5 pr-8 rounded-xl focus:outline-none focus:border-[#FF1493] shadow-2xs cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#FF1493] absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF1493]" />
            <span>Filters</span>
            {(selectedCategory !== 'All' || selectedConcern !== 'All' || inStockOnly) && (
              <span className="w-2 h-2 rounded-full bg-[#FF1493]" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-slate-200 h-fit sticky top-28 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF1493]" />
              Filter By
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-[#FF1493] hover:text-[#E00078] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Category
            </label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between font-medium ${
                    selectedCategory === cat
                      ? 'bg-[#FFF0F6] text-[#FF1493] font-bold border border-[#FFC1E3]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-[#FF1493]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Skin Concern / Benefit */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Skin Concern / Focus
            </label>
            <div className="flex flex-wrap gap-2">
              {skinConcerns.map((sc) => (
                <button
                  key={sc}
                  onClick={() => setSelectedConcern(sc)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    selectedConcern === sc
                      ? 'border-[#FF1493] bg-[#FF1493] text-white shadow-[0_0_10px_rgba(255,20,147,0.35)]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#FF1493]'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-800 uppercase tracking-wider">
                Max Price
              </label>
              <span className="font-bold text-[#FF1493] font-serif text-sm">{formatPrice(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="5000"
              step="200"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#FF1493] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>৳ 1,000</span>
              <span>৳ 5,000</span>
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#FF1493] focus:ring-[#FF1493] accent-[#FF1493] w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold">In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Stage */}
        <div className="lg:col-span-3">
          {/* Active filter chips & current sort badge */}
          {(selectedCategory !== 'All' ||
            selectedConcern !== 'All' ||
            searchQuery ||
            inStockOnly ||
            sortBy !== 'featured') && (
            <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
              <span className="text-slate-600 text-[11px] font-semibold">Active:</span>

              {/* Sort Chip */}
              {sortBy !== 'featured' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] rounded-lg font-semibold">
                  <ArrowUpDown className="w-3 h-3 text-[#FF1493]" />
                  <span>
                    Sorted:{' '}
                    {sortOptions.find((o) => o.value === sortBy)?.label || sortBy}
                  </span>
                  <button
                    onClick={() => setSortBy('featured')}
                    className="hover:text-rose-700 transition-colors ml-0.5 cursor-pointer"
                    title="Reset sort"
                  >
                    <X className="w-3 h-3 text-[#FF1493]" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] rounded-lg font-semibold">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('All')} className="cursor-pointer">
                    <X className="w-3 h-3 text-[#FF1493]" />
                  </button>
                </span>
              )}

              {selectedConcern !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] rounded-lg font-semibold">
                  Focus: {selectedConcern}
                  <button onClick={() => setSelectedConcern('All')} className="cursor-pointer">
                    <X className="w-3 h-3 text-[#FF1493]" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] rounded-lg font-semibold">
                  &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery('')} className="cursor-pointer">
                    <X className="w-3 h-3 text-[#FF1493]" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] rounded-lg font-semibold">
                  In Stock Only
                  <button onClick={() => setInStockOnly(false)} className="cursor-pointer">
                    <X className="w-3 h-3 text-[#FF1493]" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs text-[#FF1493] hover:text-[#E00078] hover:underline ml-auto font-semibold cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <p className="font-serif text-2xl text-slate-900 font-medium mb-2">
                No skincare products matched your criteria
              </p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mb-6">
                Try widening your price range, choosing another category, or resetting your filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-[#FF1493] text-white text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-[#E00078] shadow-[0_0_12px_rgba(255,20,147,0.35)] transition-all cursor-pointer"
              >
                Reset All Filters &amp; Sorting
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-Over Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-4/5 max-w-sm bg-white h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="font-serif text-base font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#FF1493]" />
                  Filter Skincare
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sort selector for mobile */}
              <div className="py-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#FF1493]" />
                  Sort Products
                </h4>
                <div className="space-y-1.5">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-xl border flex items-center justify-between font-medium transition-colors ${
                        sortBy === opt.value
                          ? 'border-[#FF1493] bg-[#FFF0F6] text-[#FF1493] font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-[#FF1493]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="py-4 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Category
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors font-medium ${
                        selectedCategory === cat
                          ? 'border-[#FF1493] bg-[#FFF0F6] text-[#FF1493] font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin Concern */}
              <div className="py-4 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Skin Concern Focus
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skinConcerns.map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setSelectedConcern(sc)}
                      className={`px-3 py-1.5 text-xs rounded-full border font-semibold ${
                        selectedConcern === sc
                          ? 'bg-[#FF1493] text-white border-[#FF1493]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              {/* In stock */}
              <div className="py-4">
                <label className="flex items-center gap-2 text-xs text-slate-900 font-semibold">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-[#FF1493] w-4 h-4 cursor-pointer"
                  />
                  <span>Show In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl uppercase cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-bold rounded-xl uppercase shadow-[0_0_12px_rgba(255,20,147,0.35)] cursor-pointer"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileFilterOpen(false)} />
        </div>
      )}
    </div>
  );
};
