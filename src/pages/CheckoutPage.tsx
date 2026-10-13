import React, { useState } from 'react';
import { ShieldCheck, Truck, Lock, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CustomerInfo, Order, DELIVERY_ZONES, DeliveryZone, DeliveryZoneOption } from '../types';
import { formatPrice, generateOrderNumber } from '../utils/format';
import { createOrder } from '../services/orderService';

interface CheckoutPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate, onOrderSuccess }) => {
  const {
    items,
    subtotal,
    deliveryZone,
    setDeliveryZone,
    deliveryZoneOption,
    shippingFee,
    total,
    clearCart,
    addToast,
  } = useCart();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState<CustomerInfo>({
    name: profile?.displayName || user?.displayName || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || 'Dhaka',
    postalCode: '1212',
    country: 'Bangladesh',
    deliveryNotes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Card / Mobile Banking (Online)'>('Cash on Delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <h2 className="font-serif text-2xl font-medium text-slate-900 mb-3">
          Your bag is currently empty
        </h2>
        <p className="text-xs text-slate-600 mb-6">
          Please add skincare products to your bag prior to checkout.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-[0_0_12px_rgba(255,20,147,0.35)] transition-all cursor-pointer"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-assist delivery zone when city changes
    if (name === 'city') {
      if (value === 'Dhaka') {
        if (deliveryZone === 'outside_dhaka') {
          setDeliveryZone('inside_dhaka');
        }
      } else if (value === 'Gazipur' || value === 'Savar' || value === 'Narayanganj' || value === 'Keraniganj') {
        setDeliveryZone('dhaka_sub_area');
      } else {
        if (deliveryZone === 'inside_dhaka') {
          setDeliveryZone('outside_dhaka');
        }
      }
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMessage('Please complete all required customer and delivery address fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();
      const orderPayload: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        orderNumber,
        customer: {
          ...formData,
          deliveryZone: deliveryZoneOption.name,
          deliveryNotes: formData.deliveryNotes || '',
        },
        items,
        subtotal,
        shippingFee,
        deliveryZone: deliveryZoneOption.name,
        total,
        currency: 'BDT',
        paymentMethod,
        status: 'Pending',
        userId: user?.uid || null,
      };

      // Create in Firestore, safely reduce stock, and get final order record
      const placedOrder = await createOrder(orderPayload);

      // Clear shopping bag
      clearCart();
      addToast('Order Placed Successfully', `Reference: #${placedOrder.orderNumber}`, 'success');

      // Navigate to order confirmation
      onOrderSuccess(placedOrder);
    } catch (err) {
      console.error('Failed to submit order:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred while placing your order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex items-baseline justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#FF1493]">
            Secure ANFA BD Checkout
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-medium mt-1">
            Complete Your Skincare Order
          </h1>
        </div>
        <button
          onClick={() => onNavigate('cart')}
          className="text-xs text-[#FF1493] hover:text-[#E00078] font-semibold hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Bag
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Customer / Delivery Destination */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="font-serif text-xl font-medium text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#FF1493]" />
              <span>1. Delivery Destination</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Farhana Rahman"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1493] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1493] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="e.g. 01700 000000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1493] focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Street Address & Apartment / House Details *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="House #, Road #, Area / Sector"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1493] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  City / Region *
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1493] focus:bg-white"
                >
                  <option value="Dhaka">Dhaka (City / Metro)</option>
                  <option value="Gazipur">Gazipur (Dhaka Sub-area)</option>
                  <option value="Savar">Savar (Dhaka Sub-area)</option>
                  <option value="Narayanganj">Narayanganj (Dhaka Sub-area)</option>
                  <option value="Keraniganj">Keraniganj (Dhaka Sub-area)</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Barisal">Barisal</option>
                  <option value="Rangpur">Rangpur</option>
                  <option value="Mymensingh">Mymensingh</option>
                  <option value="Comilla">Comilla</option>
                  <option value="Other">Other District in Bangladesh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1493] focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Special Delivery Instructions (Optional)
                </label>
                <textarea
                  name="deliveryNotes"
                  rows={2}
                  placeholder="e.g. Please call before arrival; deliver after 2 PM"
                  value={formData.deliveryNotes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1493] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Delivery Zone Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-serif text-xl font-medium text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FF1493]" />
                <span>2. Select Delivery Zone</span>
              </h2>
              <span className="text-xs text-[#FF1493] font-bold bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                {deliveryZoneOption.name}: {formatPrice(deliveryZoneOption.fee)}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Please choose your delivery location to apply the courier delivery charge:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.values(DELIVERY_ZONES) as DeliveryZoneOption[]).map((zone) => {
                const isSelected = deliveryZone === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setDeliveryZone(zone.id)}
                    className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-[#FF1493] bg-pink-50/70 ring-2 ring-[#FF1493] shadow-xs'
                        : 'border-slate-200 bg-white hover:border-pink-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-xs text-slate-900 block">
                          {zone.name}
                        </span>
                        <span className="text-[11px] text-slate-500 leading-snug mt-1 block">
                          {zone.description}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#FF1493] border-[#FF1493] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Delivery Charge
                      </span>
                      <span className="font-serif text-base font-bold text-[#FF1493]">
                        {formatPrice(zone.fee)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="font-serif text-xl font-medium text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#FF1493]" />
              <span>3. Payment Method</span>
            </h2>

            <div className="space-y-3">
              {/* Option 1: Cash on Delivery (Active) */}
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-[#FF1493] bg-pink-50/50 ring-1 ring-[#FF1493]'
                    : 'border-slate-200 bg-white hover:border-pink-200'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={() => setPaymentMethod('Cash on Delivery')}
                  className="mt-1 accent-[#FF1493]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">
                      Cash on Delivery (Recommended)
                    </span>
                    <span className="text-[10px] bg-[#FF1493] text-white px-2 py-0.5 rounded font-semibold uppercase">
                      Inspect at Doorstep
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Pay safely in cash when your authentic skincare parcel arrives at your residence.
                    You may inspect the sealed package before completing payment.
                  </p>
                </div>
              </label>

              {/* Option 2: Online Payment / Card / Mobile Banking */}
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'Card / Mobile Banking (Online)'
                    ? 'border-[#FF1493] bg-[#FFF0F6] ring-1 ring-[#FF1493]'
                    : 'border-slate-200 bg-white hover:border-[#FF1493]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Card / Mobile Banking (Online)"
                  checked={paymentMethod === 'Card / Mobile Banking (Online)'}
                  onChange={() => setPaymentMethod('Card / Mobile Banking (Online)')}
                  className="mt-1 accent-[#FF1493]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">
                      bKash / Nagad / Visa / Mastercard
                    </span>
                    <span className="text-[10px] text-[#FF1493] font-semibold bg-[#FFF0F6] px-2 py-0.5 rounded border border-[#FFC1E3]">
                      Payment Link on Confirmation
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Our team will send a verified digital payment link directly to your phone number
                    and email upon placing your order.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="font-serif text-xl font-medium text-slate-900 pb-3 border-b border-slate-100">
            Order Review ({items.length} {items.length === 1 ? 'Item' : 'Items'})
          </h2>

          {/* Itemized snapshot */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 pr-1">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex gap-3 first:pt-0">
                {item.mainImage ? (
                  <img
                    src={item.mainImage}
                    alt={item.productName}
                    className="w-16 h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-16 h-20 rounded-xl border border-slate-200 bg-pink-50 flex items-center justify-center text-xs text-slate-400 shrink-0">
                    Skincare
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-xs font-medium text-slate-900 truncate">
                    {item.productName}
                  </h4>
                  {/* Variation Display */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: item.variation.colorCode }}
                    />
                    <span className="text-[11px] text-[#FF1493] font-semibold">
                      {item.variation.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-1.5 text-xs">
                    <span className="text-slate-500">Qty: {item.quantity}</span>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span>Delivery Charge</span>
                <span className="block text-[11px] text-[#FF1493] font-semibold">
                  {deliveryZoneOption.name}
                </span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatPrice(shippingFee)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-base font-semibold text-slate-900">
              <span>Grand Total</span>
              <span className="font-serif text-2xl font-bold text-[#FF1493]">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Place Order CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-[#FF1493] hover:bg-[#E00078] disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Placing Your Order...</span>
            ) : (
              <span>Confirm & Place Order ({formatPrice(total)})</span>
            )}
          </button>

          <div className="space-y-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF1493] shrink-0" />
              <span>100% Authentic Korean Skincare • Verified Batch Codes</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#FF1493] shrink-0" />
              <span>Cash on Delivery Available Nationwide</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
