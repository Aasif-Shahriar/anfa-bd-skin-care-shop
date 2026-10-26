import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Check,
  ChevronRight,
  Share2,
  Package,
  Layers,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Product, ProductVariation } from '../types';
import { formatPrice, calculateDiscountPercentage } from '../utils/format';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { BangladeshFlag } from '../components/BangladeshFlag';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (tab: string, param?: string) => void;
  onBuyNow: (product: Product, variation: ProductVariation, quantity: number) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onSelectProduct,
  onNavigate,
  onBuyNow,
}) => {
  const { addItem, toggleWishlist, isInWishlist, addToast } = useCart();

  // Selected variation state
  const defaultVar =
    product.variations?.find((v) => v.active && v.stock > 0) ||
    product.variations?.[0] || {
      id: 'default',
      name: 'Standard Size',
      color: 'Dewy Hydration',
      colorCode: '#A7F3D0',
      images: [product.mainImage],
      stock: product.totalStock,
      active: true,
    };

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation>(defaultVar);
  const [activeImage, setActiveImage] = useState<string>(product.mainImage);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'shipping' | 'care'>('specs');
  const [reviewStats, setReviewStats] = useState<{ count: number; avgRating: number }>({
    count: 3,
    avgRating: 5.0,
  });
  const [openReviewFormTrigger, setOpenReviewFormTrigger] = useState<boolean>(false);

  // Update when product changes or variation is switched
  useEffect(() => {
    const primaryVar = product.variations?.find((v) => v.active) || product.variations?.[0] || defaultVar;
    setSelectedVariation(primaryVar);
    const initialImg =
      primaryVar.images && primaryVar.images.length > 0
        ? primaryVar.images[0]
        : product.mainImage;
    setActiveImage(initialImg);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  // CRITICAL: When customer selects a variation:
  // 1. Selected variation visually active
  // 2. Main product image changes to that variation's image
  // 3. Thumbnail gallery updates
  const handleVariationSelect = (v: ProductVariation) => {
    setSelectedVariation(v);
    if (v.images && v.images.length > 0) {
      setActiveImage(v.images[0]);
    } else {
      setActiveImage(product.mainImage);
    }
    setQuantity(1);
  };

  const currentPrice = selectedVariation.priceOverride ?? product.basePrice;
  const discount = calculateDiscountPercentage(currentPrice, product.compareAtPrice);
  const isWishlisted = isInWishlist(product.id);
  const availableStock = selectedVariation.stock ?? product.totalStock ?? 0;
  const isOutOfStock = availableStock <= 0;

  // Gallery images prioritized by current variation
  const rawGalleryImages =
    selectedVariation.images && selectedVariation.images.length > 0
      ? selectedVariation.images
      : product.images || (product.mainImage ? [product.mainImage] : []);

  const galleryImages = rawGalleryImages.filter((img): img is string => Boolean(img && img.trim() !== ''));

  const effectiveActiveImage =
    activeImage ||
    (selectedVariation.images && selectedVariation.images.length > 0 ? selectedVariation.images[0] : null) ||
    product.mainImage ||
    null;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addItem(product, selectedVariation, quantity);
    }
  };

  const handleDirectBuy = () => {
    if (!isOutOfStock) {
      onBuyNow(product, selectedVariation, quantity);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Authentic Korean skincare: ${product.name} at ANFA BD.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      addToast('Link Copied', 'Product link copied to clipboard.', 'info');
    }
  };

  const relatedProducts = useMemo(() => {
    if (product.relatedProductIds && product.relatedProductIds.length > 0) {
      const explicitMatches = allProducts.filter((p) => product.relatedProductIds?.includes(p.id));
      if (explicitMatches.length > 0) return explicitMatches.slice(0, 4);
    }
    return allProducts
      .filter((p) => p.id !== product.id && p.category === product.category && p.status !== 'draft' && p.status !== 'archived')
      .slice(0, 4);
  }, [allProducts, product]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <button onClick={() => onNavigate('home')} className="hover:text-[#FF1493]">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => onNavigate('shop', product.category)} className="hover:text-[#FF1493]">
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Gallery Column (7 cols on large screen) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails list */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[580px] shrink-0 pb-2 md:pb-0">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white ${
                  effectiveActiveImage === img
                    ? 'border-[#FF1493] shadow-sm ring-1 ring-[#FF1493]'
                    : 'border-slate-200 opacity-75 hover:opacity-100 hover:border-[#FF1493]'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} view ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Large Hero Active Image Stage */}
          <div className="flex-1 relative aspect-[4/5] bg-white rounded-2xl overflow-hidden border border-[#EDE5E2] shadow-sm">
            {effectiveActiveImage ? (
              <img
                src={effectiveActiveImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-pink-50/50 text-slate-400 text-xs">
                No Image
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discount > 0 && (
                <span className="bg-[#FF1493] text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-md">
                  Save {discount}%
                </span>
              )}
              {product.bestseller && (
                <span className="bg-[#D4AF37] text-slate-950 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-md">
                  Bestseller
                </span>
              )}
            </div>

            {/* Variation indicator watermark */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 text-[11px] font-semibold text-slate-900 flex items-center gap-1.5 shadow-sm">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: selectedVariation.colorCode }}
              />
              <span>{selectedVariation.name}</span>
            </div>
          </div>
        </div>

        {/* Purchase & Specifications Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#FF1493]">
                {product.category} • Authentic Korean Skincare
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  aria-label="Share"
                  className="p-2 text-slate-500 hover:text-[#FF1493] rounded-full hover:bg-slate-50 border border-slate-200"
                  title="Share Product"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Wishlist"
                  className="p-2 text-slate-500 hover:text-[#FF1493] rounded-full hover:bg-slate-50 border border-slate-200"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#FF1493] text-[#FF1493]' : ''}`} />
                </button>
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-medium leading-tight">
              {product.name}
            </h1>

            {/* Star Rating & Reviews anchor */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center text-[#D4AF37]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(reviewStats.avgRating)
                        ? 'fill-[#D4AF37]'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-900">
                {reviewStats.avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <button
                onClick={() => {
                  document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs text-[#FF1493] hover:text-[#E00078] hover:underline font-semibold"
              >
                {reviewStats.count} {reviewStats.count === 1 ? 'Customer Review' : 'Customer Reviews'}
              </button>
              <span className="text-xs text-slate-300">•</span>
              <button
                onClick={() => {
                  setOpenReviewFormTrigger(true);
                  setTimeout(() => {
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="text-xs text-[#FF1493] hover:text-[#E00078] font-semibold hover:underline flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Rate &amp; Review Product</span>
              </button>
            </div>

            {/* Price display with Bangladesh Flag beside BDT */}
            <div className="flex flex-wrap items-baseline gap-3 mt-4">
              <span className="font-serif text-3xl font-bold text-slate-900">
                {formatPrice(currentPrice)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                <span className="text-base text-slate-400 line-through font-light">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-[#FF1493] font-semibold bg-[#FFF0F6] px-2.5 py-1 rounded-full border border-[#FFC1E3]">
                <BangladeshFlag className="w-3.5 h-2 shadow-2xs" />
                <span>BDT (৳) • VAT Included</span>
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            {product.description}
          </p>

          {/* Variation Selector (Critical Feature) */}
          {product.variations && product.variations.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-900 font-bold uppercase tracking-wider">
                  Select Formula / Size:
                </span>
                <span className="font-serif font-bold text-[#FF1493] text-sm">
                  {selectedVariation.name}
                </span>
              </div>

              {/* Swatch buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {product.variations.map((v) => {
                  const isSelected = selectedVariation.id === v.id;
                  const varPrice = v.priceOverride ?? product.basePrice;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariationSelect(v)}
                      className={`relative flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#FF1493] bg-[#FFF0F6] ring-2 ring-[#FF1493]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-[#FF1493]'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shadow-inner mb-1.5"
                        style={{ backgroundColor: v.colorCode }}
                      />
                      <span className="text-xs font-bold text-slate-900">{v.color}</span>
                      <span className="text-[10px] text-slate-600 mt-0.5 font-medium">{formatPrice(varPrice)}</span>

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#FF1493] text-white rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Variation Stock & SKU Info */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>
                  SKU:{' '}
                  <span className="font-mono text-slate-900 font-semibold">
                    {selectedVariation.sku || 'ANFA-SKIN-STD'}
                  </span>
                </span>
                <span>
                  Stock:{' '}
                  {isOutOfStock ? (
                    <span className="text-rose-700 font-bold">Sold Out</span>
                  ) : availableStock <= 5 ? (
                    <span className="text-amber-800 font-bold">Only {availableStock} remaining</span>
                  ) : (
                    <span className="text-[#FF1493] font-semibold">In Stock ({availableStock} units)</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-slate-300 bg-white rounded-xl shadow-2xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-3.5 py-3 text-slate-700 hover:bg-slate-100 rounded-l-xl transition-colors font-bold text-sm"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  disabled={quantity >= availableStock}
                  className="px-3.5 py-3 text-slate-700 hover:bg-slate-100 rounded-r-xl transition-colors font-bold text-sm disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 bg-[#FF1493] hover:bg-[#E00078] disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-[0.18em] rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                {isOutOfStock ? 'Sold Out' : `Add to Bag • ${formatPrice(currentPrice * quantity)}`}
              </button>
            </div>

            {/* Direct Buy Now Button */}
            <button
              onClick={handleDirectBuy}
              disabled={isOutOfStock}
              className="w-full py-3.5 px-6 bg-transparent hover:bg-[#FFF0F6] text-[#FF1493] border-2 border-[#FF1493] disabled:border-slate-300 disabled:text-slate-400 text-xs font-bold uppercase tracking-[0.18em] rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              Instant Checkout / Cash on Delivery
            </button>
          </div>

          {/* Guarantees Box */}
          <div className="bg-[#FFF0F6] border border-[#FFC1E3] rounded-xl p-4 divide-y divide-[#FFD6EA] text-xs text-slate-700">
            <div className="flex items-center gap-3 py-2">
              <Truck className="w-4 h-4 text-[#FF1493] shrink-0" />
              <span>Complimentary insured shipping across Bangladesh (orders above ৳5,000)</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <ShieldCheck className="w-4 h-4 text-[#FF1493] shrink-0" />
              <span>100% Authentic Korean Formula • Sealed Packaging & Verified Batch Code</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Package className="w-4 h-4 text-[#FF1493] shrink-0" />
              <span>Directly imported from Seoul, South Korea with free complimentary samples</span>
            </div>
          </div>

          {/* Specifications Accordions */}
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${
                  activeTab === 'specs'
                    ? 'border-b-2 border-[#FF1493] text-[#FF1493] bg-[#FFF0F6]/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${
                  activeTab === 'shipping'
                    ? 'border-b-2 border-[#FF1493] text-[#FF1493] bg-[#FFF0F6]/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Shipping & Returns
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center transition-colors ${
                  activeTab === 'care'
                    ? 'border-b-2 border-[#FF1493] text-[#FF1493] bg-[#FFF0F6]/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Routine & Usage
              </button>
            </div>

            <div className="p-5 text-xs text-slate-700">
              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {product.brand && (
                      <div>
                        <dt className="text-[#FF1493] font-bold">Brand</dt>
                        <dd className="font-semibold text-slate-900 mt-0.5">{product.brand}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-[#FF1493] font-bold">Skin Compatibility</dt>
                      <dd className="font-semibold text-slate-900 mt-0.5">
                        {Array.isArray(product.specifications?.skinTypes) && product.specifications.skinTypes.length > 0
                          ? product.specifications.skinTypes.join(', ')
                          : product.specifications?.skinType || 'All Skin Types (Sensitive Safe)'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#FF1493] font-bold">Target Concerns</dt>
                      <dd className="font-semibold text-slate-900 mt-0.5">
                        {Array.isArray(product.specifications?.skinConcerns) && product.specifications.skinConcerns.length > 0
                          ? product.specifications.skinConcerns.join(', ')
                          : product.specifications?.concerns || 'Hydration, Barrier Repair, Radiance'}
                      </dd>
                    </div>
                    {product.specifications?.volume && (
                      <div>
                        <dt className="text-[#FF1493] font-bold">Net Weight / Volume</dt>
                        <dd className="font-semibold text-slate-900 mt-0.5">{product.specifications.volume}</dd>
                      </div>
                    )}
                    {product.specifications?.origin && (
                      <div>
                        <dt className="text-[#FF1493] font-bold">Country of Origin</dt>
                        <dd className="font-semibold text-slate-900 mt-0.5">{product.specifications.origin}</dd>
                      </div>
                    )}
                    {(product.specifications?.spfRating || product.specifications?.paRating) && (
                      <div>
                        <dt className="text-[#FF1493] font-bold">Sun Protection</dt>
                        <dd className="font-semibold text-[#FF1493] mt-0.5">
                          {[product.specifications?.spfRating, product.specifications?.paRating].filter(Boolean).join(' ')}
                        </dd>
                      </div>
                    )}
                    {product.specifications?.expiryDate && (
                      <div>
                        <dt className="text-[#FF1493] font-bold">Shelf Life / Expiry</dt>
                        <dd className="font-semibold text-slate-900 mt-0.5">{product.specifications.expiryDate}</dd>
                      </div>
                    )}
                    {product.specifications?.keyIngredients && (
                      <div className="sm:col-span-2">
                        <dt className="text-[#FF1493] font-bold">Key Ingredients</dt>
                        <dd className="font-medium text-slate-900 mt-0.5">{product.specifications.keyIngredients}</dd>
                      </div>
                    )}
                    {product.specifications?.benefits && (
                      <div className="sm:col-span-2">
                        <dt className="text-[#FF1493] font-bold">Product Benefits</dt>
                        <dd className="text-slate-800 mt-0.5 leading-relaxed">{product.specifications.benefits}</dd>
                      </div>
                    )}
                    {product.specifications?.fullIngredients && (
                      <div className="sm:col-span-2">
                        <dt className="text-[#FF1493] font-bold">Full Ingredients List</dt>
                        <dd className="text-slate-600 text-[11px] mt-0.5 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                          {product.specifications.fullIngredients}
                        </dd>
                      </div>
                    )}
                    {product.specifications?.warnings && (
                      <div className="sm:col-span-2">
                        <dt className="text-amber-800 font-bold">Warnings &amp; Precautions</dt>
                        <dd className="text-amber-900 text-[11px] mt-0.5 leading-relaxed bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                          {product.specifications.warnings}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {/* Verified Attributes Badges */}
                  {product.specifications?.attributes && product.specifications.attributes.length > 0 && (
                    <div className="pt-3 border-t border-slate-200">
                      <dt className="text-[#FF1493] font-bold mb-1.5">Verified Formulation Attributes</dt>
                      <div className="flex flex-wrap gap-1.5">
                        {product.specifications.attributes.map((attr, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-pink-50 text-[#FF1493] border border-pink-200 font-bold px-2.5 py-0.5 rounded-full"
                          >
                            ✓ {attr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-[#241D20]">Inside Dhaka:</strong> Express doorstep delivery within
                    24–48 hours (৳80 delivery fee, or free over ৳5,000).
                  </p>
                  <p>
                    <strong className="text-[#241D20]">Dhaka sub-area:</strong> Gazipur, Savar, Narayanganj, Keraniganj, Tongi, Dhamrai within 2–3 business days (৳120 delivery fee).
                  </p>
                  <p>
                    <strong className="text-[#241D20]">Outside Dhaka:</strong> Nationwide courier
                    dispatch to all other 63 districts via Steadfast / Pathao within 2–4 business days (৳150 delivery fee).
                  </p>
                  <p>
                    <strong className="text-[#241D20]">Cash on Delivery:</strong> Inspect the sealed
                    ANFA BD parcel at your doorstep before completing payment.
                  </p>
                  <p>
                    <strong className="text-[#241D20]">7-Day Exchange:</strong> Hassle-free exchange
                    on unopened skincare products with original tamper seals intact.
                  </p>
                </div>
              )}

              {activeTab === 'care' && (
                <div className="space-y-3 leading-relaxed">
                  {product.specifications?.howToUse ? (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Recommended Usage &amp; Ritual:</h4>
                      <p className="whitespace-pre-line text-slate-700 bg-pink-50/50 p-3 rounded-lg border border-pink-100">
                        {product.specifications.howToUse}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p>
                        <strong>How to apply:</strong> After cleansing and toning, dispense 2–3 drops or a dime-sized amount onto clean fingertips.
                      </p>
                      <p>
                        Gently pat and press into the skin until completely absorbed. Follow with moisturizer and broad-spectrum sunscreen in daytime.
                      </p>
                    </>
                  )}
                  <p className="text-[11px] text-slate-500 pt-1">
                    Store in a cool, dry place away from direct sunlight. Always perform a quick 24-hour patch test before introducing new active formulas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Ratings Section */}
      <ProductReviewsSection
        product={product}
        selectedVariation={selectedVariation}
        openFormTrigger={openReviewFormTrigger}
        onReviewsUpdated={(count, avgRating) => setReviewStats({ count, avgRating })}
      />

      {/* Recommended / Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-slate-200">
          <div className="text-center space-y-1 mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF1493]">
              Harmonious Complements
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 font-medium">
              You May Also Admire
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p: Product) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
