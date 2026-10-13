import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils/format';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSearchAll: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onSearchAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = searchTerm.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && searchTerm.trim()) {
      onSearchAll(searchTerm);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
        {/* Search header input */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200 bg-white">
          <Search className="w-5 h-5 text-[#FF1493] mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search sheet masks, mud masks, suncream, combo offers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-slate-900 text-base placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-900 text-xs uppercase tracking-wider mr-2 font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search results or popular tags */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {searchTerm.trim() ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FF1493]">
                  Found {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
                </span>
                {filtered.length > 0 && (
                  <button
                    onClick={() => {
                      onSearchAll(searchTerm);
                      onClose();
                    }}
                    className="text-xs text-[#FF1493] hover:text-[#E00078] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View all in shop <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-700 font-serif italic text-lg">
                    No skincare products matched &quot;{searchTerm}&quot;
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching for &quot;Serum&quot;, &quot;Centella&quot;, &quot;Sunscreen&quot;, &quot;Niacinamide&quot;, or &quot;Moisturizer&quot;
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.slice(0, 6).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="flex items-center gap-4 py-3 hover:bg-[#FFF0F6] p-2 rounded-xl cursor-pointer transition-colors"
                    >
                      {product.mainImage ? (
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl border border-slate-200 bg-pink-50 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                          Skincare
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] tracking-widest uppercase font-semibold text-[#FF1493]">
                          {product.category}
                        </span>
                        <h4 className="text-sm font-serif font-medium text-slate-900 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-slate-900">
                            {formatPrice(product.basePrice)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {formatPrice(product.compareAtPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {product.variations?.map((v) => (
                          <span
                            key={v.id}
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: v.colorCode }}
                            title={v.name}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FF1493] mb-3">
                Curated Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Sheet mask',
                  'Mud mask',
                  'Sleeping mask',
                  'Bubble mask',
                  'Eye mask',
                  'Lip mask',
                  'Sunscream',
                  'Nose strip',
                  'Blackhead remover',
                  'Combo offer',
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-[#FF1493] hover:text-[#FF1493] text-xs text-slate-700 rounded-full transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
