import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Package,
  Heart,
  Phone,
  MapPin,
  Calendar,
  LogOut,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronRight,
  Shield,
  Truck,
  Cloud,
  Printer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Order, Product } from '../types';
import { fetchUserOrders } from '../services/orderService';
import { formatPrice } from '../utils/format';
import { ProductCard } from '../components/ProductCard';
import { OrderReceiptModal } from '../components/OrderReceiptModal';

interface AccountPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  products,
  onSelectProduct,
  onNavigate,
}) => {
  const { user, profile, isAdmin, isSigningIn, signInWithGoogle, signOut, updateProfileData } = useAuth();
  const { wishlist } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [phoneInput, setPhoneInput] = useState(profile?.phone || '');
  const [addressInput, setAddressInput] = useState(profile?.address || '');
  const [cityInput, setCityInput] = useState(profile?.city || 'Dhaka');

  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      fetchUserOrders(user.uid)
        .then((res) => setOrders(res))
        .catch((e) => console.warn('Orders fetch:', e))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setPhoneInput(profile.phone || '');
      setAddressInput(profile.address || '');
      setCityInput(profile.city || 'Dhaka');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData({
      phone: phoneInput,
      address: addressInput,
      city: cityInput,
    });
    setEditingProfile(false);
  };

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FFF0F6] text-[#FF1493] flex items-center justify-center mx-auto mb-4 border border-[#FFC1E3]">
          <UserIcon className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h1 className="font-serif text-3xl font-medium text-slate-900 mb-2">
          ANFA BD Customer Portal
        </h1>
        <p className="text-xs text-slate-600 mb-8 leading-relaxed">
          Sign in to view your skincare orders, track delivery progress, and maintain your
          saved skincare wishlist.
        </p>
        <button
          disabled={isSigningIn}
          onClick={() => signInWithGoogle()}
          className="w-full py-3.5 px-6 bg-[#FF1493] hover:bg-[#E00078] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserIcon className="w-4 h-4" />
          <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FF1493] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-medium text-slate-900">
                {user.displayName || 'Valued Client'}
              </h1>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-[#FF1493] text-white text-[9px] uppercase tracking-wider font-semibold rounded">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-4 py-2 bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3] hover:bg-[#FF1493] hover:text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-4 h-4" /> Maison Admin
            </button>
          )}
          <button
            onClick={() => signOut()}
            className="px-4 py-2 border border-slate-200 hover:bg-red-50 text-red-700 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-8 text-xs uppercase tracking-wider font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'border-b-2 border-[#FF1493] text-[#FF1493] font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'wishlist'
              ? 'border-b-2 border-[#FF1493] text-[#FF1493] font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Private Wishlist ({wishlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-b-2 border-[#FF1493] text-[#FF1493] font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Address & Profile</span>
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="text-center py-12 text-xs text-slate-500">
              Retrieving your bespoke orders from Firestore...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-[#FF1493] mx-auto mb-3 stroke-[1.5]" />
              <h3 className="font-serif text-xl font-medium text-slate-900 mb-2">
                No orders placed yet
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mb-6">
                When you place a skincare order, your complete order journey and tracking
                milestones will appear here.
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs uppercase tracking-wider font-semibold rounded-lg shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all cursor-pointer"
              >
                Browse Skincare
              </button>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500">Order Reference</span>
                    <h4 className="font-mono font-bold text-sm text-[#FF1493]">
                      #{ord.orderNumber}
                    </h4>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ord.status === 'Delivered'
                          ? 'bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3]'
                          : ord.status === 'Shipped'
                          ? 'bg-sky-100 text-sky-800'
                          : ord.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.status}
                    </span>

                    <span className="font-serif text-base font-bold text-slate-900">
                      {formatPrice(ord.total)}
                    </span>

                    <button
                      onClick={() => onNavigate('track-order', ord.orderNumber)}
                      className="px-3 py-1 bg-[#FFF0F6] hover:bg-[#FF1493] hover:text-white text-[#FF1493] border border-[#FFC1E3] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Parcel</span>
                    </button>

                    <button
                      onClick={() => setSelectedReceiptOrder(ord)}
                      className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#FF1493]" />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                      {item.mainImage ? (
                        <img
                          src={item.mainImage}
                          alt={item.productName}
                          className="w-12 h-14 object-cover rounded-md border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-14 rounded-md border border-slate-200 bg-pink-50 flex items-center justify-center text-[10px] text-slate-400">
                          Skincare
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-xs font-semibold text-slate-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-[#FF1493] font-medium">
                          {item.variation.name} ({item.variation.color})
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-slate-500">Qty: {item.quantity}</span>
                        <p className="font-bold text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div className="bg-[#FFF0F6] border border-[#FFC1E3] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Cloud className="w-4 h-4 text-[#FF1493] shrink-0" />
              <span>
                <strong>Cloud Synchronized:</strong> Your saved skincare items are stored in your Firestore profile and available across all your signed-in devices.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#FF1493] shrink-0">
              {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} Saved
            </span>
          </div>

          {wishlistedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Heart className="w-12 h-12 text-[#FF1493] mx-auto mb-3 stroke-[1.5]" />
              <h3 className="font-serif text-xl font-medium text-slate-900 mb-2">
                Your private wishlist is empty
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mb-6">
                Click the heart on any serum, moisturizer, or cleanser to bookmark products for
                your daily skincare routine.
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs uppercase tracking-wider font-semibold rounded-lg shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all cursor-pointer"
              >
                Explore Skincare Range
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-2xl shadow-2xs">
          <h3 className="font-serif text-xl font-medium text-slate-900 pb-3 border-b border-slate-100 mb-6">
            Default Delivery Information
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                Client Name
              </label>
              <input
                type="text"
                disabled
                value={user.displayName || ''}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                Registered Email
              </label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                Primary Phone Number
              </label>
              <input
                type="tel"
                placeholder="+880 1..."
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                Delivery Address
              </label>
              <input
                type="text"
                placeholder="House, Road, Area"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1">
                City / Region
              </label>
              <select
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493] text-slate-900"
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Khulna">Khulna</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs uppercase tracking-wider font-semibold rounded-lg shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Receipt & Order Record Modal */}
      <OrderReceiptModal
        order={selectedReceiptOrder}
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
