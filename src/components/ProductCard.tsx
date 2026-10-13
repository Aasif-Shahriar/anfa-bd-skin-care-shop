import React, { useState } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Product, ProductVariation } from '../types';
import { formatPrice, calculateDiscountPercentage } from '../utils/format';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onQuickView,
}) => {
  const { addItem, isInWishlist, toggleWishlist } = useCart();
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation>(
    product.variations && product.variations.length > 0
      ? product.variations[0]
      : {
          id: 'default',
          name: 'Standard',
          color: 'Default',
          colorCode: '#FF1493',
          images: product.mainImage ? [product.mainImage] : [],
          stock: product.totalStock || 10,
          active: true,
        }
  );

  const [isHovered, setIsHovered] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const currentPrice = selectedVariation.priceOverride ?? product.basePrice;
  const currentStock = selectedVariation.stock ?? product.totalStock ?? 0;
  const isOutOfStock = currentStock <= 0;
  const discount = calculateDiscountPercentage(currentPrice, product.compareAtPrice);

  const fallbackPlaceholder = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80';

  const displayImage =
    selectedVariation.images && selectedVariation.images.length > 0 && selectedVariation.images[0]
      ? selectedVariation.images[0]
      : product.mainImage || fallbackPlaceholder;

  const hoverImage =
    product.images && product.images.length > 1 && product.images[1]
      ? product.images[1]
      : displayImage;

  const currentImage = (isHovered && hoverImage !== displayImage ? hoverImage : displayImage) || fallbackPlaceholder;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product, selectedVariation, 1);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-[#FF1493]/60 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 ease-out cursor-pointer"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {discount > 0 && (
          <span className="bg-[#FF1493] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,20,147,0.4)]">
            Save {discount}%
          </span>
        )}
        {product.bestseller && (
          <span className="bg-[#D4AF37] text-slate-950 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded shadow-sm">
            Bestseller
          </span>
        )}
        {product.newArrival && (
          <span className="bg-[#FF1493] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded shadow-sm">
            New
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-slate-700 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded shadow-sm">
            Sold Out
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistClick}
        aria-label="Save to Wishlist"
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 hover:text-[#FF1493] hover:bg-white active:scale-90 transition-all duration-300 shadow-sm"
      >
        <Heart
          className={`w-4 h-4 transition-transform duration-300 ${
            isWishlisted ? 'fill-[#FF1493] text-[#FF1493] scale-110' : 'text-slate-600'
          }`}
        />
      </button>

      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] bg-pink-50/30 overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : null}

        {/* Quick action overlay */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#FF1493] hover:bg-[#E00078] disabled:bg-slate-400 text-white text-xs font-semibold tracking-wide uppercase rounded-xl shadow-[0_0_12px_rgba(255,20,147,0.35)] transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {isOutOfStock ? 'Sold Out' : 'Quick Add'}
          </button>

          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              aria-label="Quick View"
              className="p-2.5 bg-white hover:bg-pink-50 text-slate-800 hover:text-[#FF1493] rounded-xl border border-slate-200 shadow-md transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Metadata & Swatches */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#FF1493] mb-1">
          {product.category}
        </span>

        <h3 className="font-serif text-base text-slate-900 line-clamp-1 font-medium group-hover:text-[#FF1493] transition-colors">
          {product.name}
        </h3>

        {/* Variation / Color Swatches */}
        {product.variations && product.variations.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">
              Formula:
            </span>
            {product.variations.map((v) => {
              const isSelected = selectedVariation?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariation(v)}
                  title={`${v.name} (${v.color})`}
                  className={`group/swatch relative p-0.5 rounded-full border transition-all ${
                    isSelected
                      ? 'border-[#FF1493] ring-1 ring-[#FF1493]'
                      : 'border-transparent hover:border-[#FF1493]'
                  }`}
                >
                  <span
                    className="block w-3.5 h-3.5 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: v.colorCode }}
                  />
                  {isSelected && (
                    <span className="sr-only">Selected {v.name}</span>
                  )}
                </button>
              );
            })}
            <span className="text-[10px] text-[#FF1493] font-semibold ml-1">
              {selectedVariation?.color}
            </span>
          </div>
        )}

        {/* Price & Stock summary */}
        <div className="mt-auto pt-3 flex items-baseline justify-between border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#FF1493] font-serif">
              {formatPrice(currentPrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > currentPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <span className="text-[10px]">
            {isOutOfStock ? (
              <span className="text-rose-700 font-semibold">Out of stock</span>
            ) : currentStock <= 5 ? (
              <span className="text-amber-800 font-semibold">Only {currentStock} left</span>
            ) : (
              <span className="text-[#FF1493] font-semibold">In Stock</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
