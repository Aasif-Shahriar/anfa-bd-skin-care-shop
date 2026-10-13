import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { DELIVERY_ZONES, DeliveryZoneOption } from '../types';

interface CartPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onProceedToCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onProceedToCheckout }) => {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    deliveryZone,
    setDeliveryZone,
    deliveryZoneOption,
    shippingFee,
    total,
    totalItems,
    addToast,
  } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'ANFA10' || code === 'GLOW10' || code === 'SKIN10') {
      setPromoApplied(true);
      addToast('Promo Code Applied', '10% privilege discount activated!', 'success');
    } else {
      addToast('Invalid Code', 'Please enter a valid coupon code (e.g. ANFA10).', 'warning');
    }
  };

  const discountAmount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[#FFF0F6] text-[#FF1493] flex items-center justify-center mx-auto mb-6 border border-[#FFC1E3]">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h1 className="font-serif text-3xl font-medium text-slate-900 mb-3">
          Your Skincare Bag is Empty
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
          Your bag currently contains no skincare essentials. Explore our catalog of Korean serums,
          barrier moisturizers, gentle cleansers, and soothing sunscreens.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-8 py-3.5 bg-[#FF1493] text-white text-xs uppercase tracking-widest font-semibold rounded-xl hover:bg-[#E00078] transition-all shadow-[0_0_15px_rgba(255,20,147,0.35)] cursor-pointer"
        >
          Discover Skincare
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Title */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex items-baseline justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#FF1493]">
            Shopping Bag
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-medium mt-1">
            Review Your Skincare Items ({totalItems})
          </h1>
        </div>
        <button
          onClick={() => onNavigate('shop')}
          className="text-xs text-[#FF1493] hover:text-[#E00078] font-semibold hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Items Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5">
              {/* Product Image */}
              {item.mainImage ? (
                <img
                  src={item.mainImage}
                  alt={item.productName}
                  className="w-24 h-32 object-cover rounded-xl border border-slate-200 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-24 h-32 rounded-xl border border-slate-200 bg-pink-50 flex items-center justify-center text-xs text-slate-400 shrink-0">
                  Skincare
                </div>
              )}

              {/* Item Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-slate-900">
                        {item.productName}
                      </h3>
                      {/* Variation badge */}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: item.variation.colorCode }}
                        />
                        <span className="text-xs font-semibold text-[#FF1493]">
                          {item.variation.name} ({item.variation.color})
                        </span>
                        {item.variation.sku && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            • SKU: {item.variation.sku}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId, item.variation.id)}
                      className="text-slate-400 hover:text-rose-700 p-1 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-sm font-bold text-slate-900 mt-2">
                    {formatPrice(item.price)} each
                  </div>
                </div>

                {/* Quantity and Subtotal line */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center border border-slate-200 bg-white rounded-lg shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variation.id, item.quantity - 1)}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-l-lg transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-xs font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variation.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-r-lg disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Line Total:</span>
                    <span className="font-serif text-base font-bold text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-xl font-medium text-slate-900 pb-3 border-b border-slate-200">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>

            {/* Delivery Zone Selector */}
            <div className="space-y-2 py-2 border-y border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Select Delivery Location
                </span>
                <span className="font-bold text-[#FF1493] text-xs">
                  {deliveryZoneOption.name}: {formatPrice(deliveryZoneOption.fee)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.values(DELIVERY_ZONES) as DeliveryZoneOption[]).map((zone) => {
                  const isSelected = deliveryZone === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setDeliveryZone(zone.id)}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        isSelected
                          ? 'bg-pink-50 border-[#FF1493] text-[#FF1493] ring-1 ring-[#FF1493] font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-pink-50/50 hover:text-[#FF1493] font-medium'
                      }`}
                    >
                      <span className="block text-xs leading-tight truncate">{zone.name}</span>
                      <span className="block text-[11px] font-mono text-[#FF1493] font-bold mt-0.5">
                        ৳{zone.fee}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span>Delivery Charge</span>
                <span className="block text-[11px] text-slate-400">({deliveryZoneOption.name})</span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatPrice(shippingFee)}
              </span>
            </div>

            {promoApplied && (
              <div className="flex justify-between text-[#FF1493] font-semibold">
                <span>Privilege Discount (10%)</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4 flex justify-between items-baseline text-base font-semibold text-slate-900">
              <span>Grand Total (BDT)</span>
              <span className="font-serif text-2xl font-bold text-[#FF1493]">
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>

          {/* Promo code form */}
          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <input
              type="text"
              placeholder="Promo code (e.g. ANFA10 or GLOW10)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 text-xs rounded-xl uppercase tracking-wider focus:outline-none focus:border-[#FF1493]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-pink-50 text-[#FF1493] border border-pink-200 hover:bg-[#FF1493] hover:text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Apply
            </button>
          </form>

          {/* Checkout CTA */}
          <button
            onClick={onProceedToCheckout}
            className="w-full py-4 px-6 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Proceed to Secure Checkout <ArrowRight className="w-4 h-4" />
          </button>

          <div className="space-y-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF1493] shrink-0" />
              <span>Cash on Delivery available on all doorstep deliveries</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>Includes complimentary signature velvet presentation gift box</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
