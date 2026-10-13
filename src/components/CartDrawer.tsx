import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Truck, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { DELIVERY_ZONES, DeliveryZoneOption } from '../types';

interface CartDrawerProps {
  onCheckout: () => void;
  onViewBag: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout, onViewBag }) => {
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    removeItem,
    updateQuantity,
    subtotal,
    deliveryZone,
    setDeliveryZone,
    deliveryZoneOption,
    shippingFee,
    total,
    totalItems,
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-fade-in">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-pink-50 text-[#FF1493] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-lg font-bold text-slate-900 tracking-wide">
                Your Skincare Bag ({totalItems})
              </h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Charges Info Banner */}
          <div className="px-4 py-2.5 bg-pink-50 border-b border-pink-100 flex items-center gap-2 text-[11px] text-[#FF1493] font-medium">
            <Truck className="w-4 h-4 shrink-0 text-[#FF1493]" />
            <div className="leading-tight">
              <span className="font-bold">Delivery:</span> Dhaka ৳80 (80tk) • Sub-area ৳120 (120tk) • Outside Dhaka ৳150 (150tk)
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mb-4 text-[#FF1493]">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="font-serif text-xl font-medium text-slate-900 mb-2">
                  Your bag is currently empty
                </h3>
                <p className="text-xs text-slate-600 max-w-xs mb-6">
                  Explore our curated collections of Korean sheet masks, suncream, sleeping masks, and combo offers.
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="px-6 py-2.5 bg-[#FF1493] text-white text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-[#E00078] transition-all shadow-[0_0_12px_rgba(255,20,147,0.3)]"
                >
                  Discover Skincare
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  {item.mainImage ? (
                    <img
                      src={item.mainImage}
                      alt={item.productName}
                      className="w-20 h-24 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-24 rounded-xl border border-slate-200 bg-pink-50 flex items-center justify-center text-xs text-slate-400 shrink-0">
                      Skincare
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-sm font-medium text-slate-900 line-clamp-1">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId, item.variation.id)}
                          className="text-slate-400 hover:text-rose-700 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-[11px] text-[#FF1493] font-semibold mt-0.5">
                        {item.variation.name}
                      </div>

                      <div className="text-xs font-semibold text-slate-900 mt-1">
                        {formatPrice(item.price)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variation.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variation.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-[#FF1493]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer Summary */}
          {items.length > 0 && (
            <div className="p-5 bg-white border-t border-slate-200 space-y-3">
              {/* Delivery Zone Selector */}
              <div className="pb-2 border-b border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold uppercase tracking-wider text-slate-500">
                    Delivery Area
                  </span>
                  <span className="font-semibold text-[#FF1493]">
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
                        className={`py-1.5 px-1.5 rounded-lg text-center transition-all ${
                          isSelected
                            ? 'bg-[#FF1493] text-white shadow-[0_0_10px_rgba(255,20,147,0.35)] font-semibold'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-pink-50 hover:text-[#FF1493] font-medium'
                        }`}
                      >
                        <span className="block text-[10px] truncate leading-tight">{zone.name}</span>
                        <span className="block text-[9px] opacity-90 font-mono">৳{zone.fee}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery ({deliveryZoneOption.name})</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-semibold text-slate-900">
                  <span>Total (BDT)</span>
                  <span className="text-[#FF1493] font-serif text-lg font-bold">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onCheckout();
                  }}
                  className="w-full py-3.5 px-4 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onViewBag();
                  }}
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-pink-50 text-[#FF1493] border border-[#FF1493]/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  View Full Bag
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF1493]" />
                <span>100% Authentic Korean &amp; Dermatologist Tested Skincare</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
