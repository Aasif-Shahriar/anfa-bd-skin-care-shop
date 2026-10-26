import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { Product, ProductVariation } from '../types';
import { formatPrice, calculateDiscountPercentage } from '../utils/format';
import { useCart } from '../context/CartContext';
import { BangladeshFlag } from './BangladeshFlag';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onViewProductDetail: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onViewProductDetail,
}) => {
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const defaultVar = product?.variations?.find((v) => v.active) || product?.variations?.[0] || null;
  const initialImg =
    defaultVar?.images && defaultVar.images.length > 0 && defaultVar.images[0]
      ? defaultVar.images[0]
      : (product?.mainImage || '');

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(defaultVar);
  const [activeImage, setActiveImage] = useState<string>(initialImg);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      const dVar = product.variations?.find((v) => v.active) || product.variations?.[0] || null;
      setSelectedVariation(dVar);
      const initImg =
        dVar?.images && dVar.images.length > 0 && dVar.images[0]
          ? dVar.images[0]
          : (product.mainImage || '');
      setActiveImage(initImg);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const handleVariationChange = (v: ProductVariation) => {
    setSelectedVariation(v);
    if (v.images && v.images.length > 0 && v.images[0]) {
      setActiveImage(v.images[0]);
    }
    setQuantity(1);
  };

  const currentPrice = selectedVariation?.priceOverride ?? product.basePrice;
  const discount = calculateDiscountPercentage(currentPrice, product.compareAtPrice);
  const isWishlisted = isInWishlist(product.id);
  const stock = selectedVariation?.stock ?? product.totalStock ?? 0;
  const isOutOfStock = stock <= 0;

  // Active gallery thumbnails: variation images if present, plus fallback product images
  const rawGalleryImages =
    selectedVariation?.images && selectedVariation.images.length > 0
      ? selectedVariation.images
      : product.images || (product.mainImage ? [product.mainImage] : []);

  const galleryImages = rawGalleryImages.filter((img): img is string => Boolean(img && img.trim() !== ''));

  const effectiveImage =
    activeImage ||
    (selectedVariation?.images && selectedVariation.images.length > 0 ? selectedVariation.images[0] : null) ||
    product.mainImage ||
    null;

  const handleAdd = () => {
    if (selectedVariation && !isOutOfStock) {
      addItem(product, selectedVariation, quantity);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-fade-in flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-800 rounded-full bg-white/80 backdrop-blur-sm transition-colors border border-slate-200 shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery / Images (Left side) */}
        <div className="md:w-1/2 bg-slate-50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs">
            {effectiveImage ? (
              <img
                src={effectiveImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-pink-50/50 text-slate-400 text-xs">
                No Image
              </div>
            )}
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-[#FF1493] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,20,147,0.35)]">
                Save {discount}%
              </span>
            )}
          </div>

          {/* Thumbnails if multiple images exist */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white cursor-pointer ${
                    effectiveImage === img
                      ? 'border-[#FF1493] ring-1 ring-[#FF1493]'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions (Right side) */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#FF1493]">
                {product.category}
              </span>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="p-1 text-slate-400 hover:text-[#FF1493] transition-colors cursor-pointer"
                title="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#FF1493] text-[#FF1493]' : ''}`} />
              </button>
            </div>

            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 font-medium leading-snug mb-2">
              {product.name}
            </h2>

            {/* Price with Bangladesh Flag */}
            <div className="flex flex-wrap items-baseline gap-3 mb-4">
              <span className="font-serif text-2xl font-bold text-[#FF1493]">
                {formatPrice(currentPrice)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                <span className="text-sm text-slate-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF1493] bg-[#FFF0F6] px-2 py-0.5 rounded-full border border-[#FFC1E3]">
                <BangladeshFlag className="w-3.5 h-2 shadow-2xs" />
                <span>BDT (৳)</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-5">
              {product.description}
            </p>

            {/* Variation Selection */}
            {product.variations && product.variations.length > 0 && (
              <div className="mb-6 border-t border-b border-slate-100 py-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-800">
                    Formula Size / Texture: <span className="font-bold text-[#FF1493]">{selectedVariation?.name}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {stock > 0 ? `${stock} available` : 'Sold out'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.variations.map((v) => {
                    const isSelected = selectedVariation?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVariationChange(v)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#FF1493] bg-pink-50 ring-1 ring-[#FF1493] text-[#FF1493] shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-[#FF1493]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: v.colorCode }}
                        />
                        <span>{v.color}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#FF1493]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Add to Bag */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-300 bg-white rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-slate-700 hover:bg-slate-100 rounded-l-lg transition-colors font-semibold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock}
                    className="p-2 text-slate-700 hover:bg-slate-100 rounded-r-lg disabled:opacity-30 transition-colors font-semibold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className="flex-1 py-3 px-5 bg-[#FF1493] hover:bg-[#E00078] disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {isOutOfStock ? 'Sold Out' : `Add to Bag • ${formatPrice(currentPrice * quantity)}`}
                </button>
              </div>

              <button
                onClick={() => {
                  onViewProductDetail(product);
                  onClose();
                }}
                className="w-full py-2 text-center text-xs text-[#FF1493] font-semibold hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                View Full Skincare Specifications &amp; Routine <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF1493]" /> 100% Authentic Korean Formula
            </span>
            <span>Free Skincare Samples Included</span>
          </div>
        </div>
      </div>
    </div>
  );
};
