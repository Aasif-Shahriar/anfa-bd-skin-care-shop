import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Printer,
  Download,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatPrice } from '../utils/format';
import { trackOrderByReferenceAndEmail } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { OrderReceiptModal } from '../components/OrderReceiptModal';
import { downloadReceiptPdf } from '../utils/pdfGenerator';

interface OrderTrackingPageProps {
  initialOrderId?: string;
  onNavigate: (tab: string, param?: string) => void;
  onSelectProductById?: (productId: string) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderId = '',
  onNavigate,
}) => {
  const { user, profile } = useAuth();
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [emailInput, setEmailInput] = useState(profile?.email || user?.email || '');
  const [loading, setLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // If initialOrderId is passed and email is available, auto-search
  useEffect(() => {
    if (initialOrderId && (profile?.email || user?.email)) {
      setOrderIdInput(initialOrderId);
      setEmailInput(profile?.email || user?.email || '');
      handleTrack(initialOrderId, profile?.email || user?.email || '');
    }
  }, [initialOrderId, user, profile]);

  const handleTrack = async (orderId: string, email: string) => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await trackOrderByReferenceAndEmail(orderId, email);
      if (res.order) {
        setTrackedOrder(res.order);
      } else {
        setTrackedOrder(null);
        setErrorMessage(res.error || 'No matching order could be found. Please check your credentials.');
      }
    } catch {
      setTrackedOrder(null);
      setErrorMessage('An unexpected error occurred while communicating with the atelier registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim() || !emailInput.trim()) {
      setErrorMessage('Please fill in both your Order Reference and Email Address.');
      return;
    }
    handleTrack(orderIdInput, emailInput);
  };

  const handlePrint = () => {
    window.print();
  };

  // Status mapping for timeline
  const getTimelineSteps = (status: OrderStatus) => {
    const isCancelled = status === 'Cancelled';
    const orderRanks: Record<OrderStatus, number> = {
      Pending: 1,
      Confirmed: 2,
      Processing: 3,
      Shipped: 4,
      Delivered: 5,
      Cancelled: 0,
    };

    const currentRank = orderRanks[status] || 1;

    return [
      {
        label: 'Order Confirmed',
        desc: 'Logged in ANFA BD system',
        done: currentRank >= 1 && !isCancelled,
        active: currentRank === 1,
      },
      {
        label: 'Authenticity Check',
        desc: 'Batch code & seal verification',
        done: currentRank >= 2 && !isCancelled,
        active: currentRank === 2,
      },
      {
        label: 'Packaging & Sealing',
        desc: 'Cushioned & tamper-evident seal',
        done: currentRank >= 3 && !isCancelled,
        active: currentRank === 3,
      },
      {
        label: 'Courier Dispatched',
        desc: 'Fast express transit',
        done: currentRank >= 4 && !isCancelled,
        active: currentRank === 4,
      },
      {
        label: 'Delivered',
        desc: 'Handed over at doorstep',
        done: currentRank >= 5 && !isCancelled,
        active: currentRank === 5,
      },
    ];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#FF1493]">
          Client Care & Tracking
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-slate-900 font-light">
          Track Your Skincare Parcel
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Monitor your authentic skincare order journey from our fulfillment boutique to your doorstep
          with real-time updates.
        </p>
      </div>

      {/* Tracking Search Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1.5">
                Order ID / Reference # *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. ANFA-82914 or ord_..."
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-[#FF1493] focus:bg-white transition-colors"
                />
                <Package className="w-4 h-4 text-[#FF1493] absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold uppercase tracking-wider mb-1.5">
                Order Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#FF1493] focus:bg-white transition-colors"
                />
                <Mail className="w-4 h-4 text-[#FF1493] absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-[#FF1493] hover:bg-[#E00078] disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Order Records...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Locate Skincare Parcel</span>
              </>
            )}
          </button>
        </form>

        {errorMessage && (
          <div className="mt-5 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Lookup Notice</p>
              <p className="text-[11px] mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Result Section */}
      {trackedOrder && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#FF1493] font-bold">
                Order Status Record
              </span>
              <h2 className="font-serif text-2xl font-medium text-slate-900 mt-0.5">
                Reference #{trackedOrder.orderNumber}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Placed on {new Date(trackedOrder.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })} • {trackedOrder.items.length} unique designs
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  trackedOrder.status === 'Delivered'
                    ? 'bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3]'
                    : trackedOrder.status === 'Cancelled'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                Current Status: {trackedOrder.status}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    setIsDownloadingPdf(true);
                    try {
                      await downloadReceiptPdf(trackedOrder);
                    } finally {
                      setIsDownloadingPdf(false);
                    }
                  }}
                  disabled={isDownloadingPdf}
                  className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-2xs flex items-center gap-2 text-xs font-semibold tracking-wider uppercase cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 text-[#FF1493] ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
                  <span>{isDownloadingPdf ? 'Generating...' : 'Download PDF'}</span>
                </button>

                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="py-2 px-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl transition-all shadow-2xs flex items-center gap-2 text-xs font-semibold tracking-wider uppercase cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FF1493]" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>

          {/* Visual Milestone Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="font-serif text-lg font-medium text-slate-900 mb-6">
              Milestone Progress
            </h3>

            {trackedOrder.status === 'Cancelled' ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Order Cancelled</h4>
                  <p className="mt-0.5">
                    This reservation has been cancelled. If you believe this was an error or would like to
                    re-order, please contact our concierge service.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                {getTimelineSteps(trackedOrder.status).map((step, idx) => (
                  <div key={step.label} className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-2xs ${
                        step.done
                          ? 'bg-[#FF1493] text-white'
                          : step.active
                          ? 'bg-[#D4AF37] text-slate-900 ring-4 ring-[#D4AF37]/20 animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step.done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{step.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Ordered Skincare Items (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-medium text-slate-900 pb-3 border-b border-slate-100">
                Ordered Skincare Items ({trackedOrder.items.length})
              </h3>

              <div className="divide-y divide-slate-100">
                {trackedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0">
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
                      <h4 className="font-serif text-sm font-medium text-slate-900 truncate">
                        {item.productName}
                      </h4>
                      {/* Variation badge */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: item.variation.colorCode }}
                        />
                        <span className="text-xs font-semibold text-[#FF1493]">
                          {item.variation.name} ({item.variation.color})
                        </span>
                        {item.variation.sku && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            • {item.variation.sku}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-baseline mt-2 text-xs text-slate-600">
                        <span>
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </span>
                        <span className="font-serif font-bold text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price summary */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900">{formatPrice(trackedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge ({trackedOrder.deliveryZone || trackedOrder.customer.deliveryZone || 'Standard'})</span>
                  <span>
                    {trackedOrder.shippingFee === 0 ? 'Free Delivery' : formatPrice(trackedOrder.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total (BDT)</span>
                  <span className="font-serif text-xl font-bold text-[#FF1493]">
                    {formatPrice(trackedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Customer Info (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-lg font-medium text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#FF1493]" />
                  <span>Destination & Recipient</span>
                </h3>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#FF1493] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">{trackedOrder.customer.name}</p>
                      <p className="text-slate-500 leading-relaxed mt-0.5">
                        {trackedOrder.customer.address}, {trackedOrder.customer.city}
                        {trackedOrder.customer.postalCode ? ` - ${trackedOrder.customer.postalCode}` : ''}
                      </p>
                      <p className="text-slate-500">{trackedOrder.customer.country}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <Phone className="w-4 h-4 text-[#FF1493] shrink-0" />
                    <span>{trackedOrder.customer.phone}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#FF1493] shrink-0" />
                    <span className="truncate">{trackedOrder.customer.email}</span>
                  </div>

                  {trackedOrder.customer.deliveryNotes && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="font-medium text-slate-900">Client Instructions: </span>
                      {trackedOrder.customer.deliveryNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Security & Contact Box */}
              <div className="bg-[#FFF0F6] rounded-2xl border border-[#FFC1E3] p-6 space-y-3 text-xs text-slate-600">
                <h4 className="font-serif text-sm font-medium text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF1493]" />
                  <span>Doorstep Inspection Protocol</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Upon arrival, the courier will present the parcel sealed with the ANFA BD
                  tamper-evident security sticker. You may inspect the seal before paying.
                </p>

                <div className="pt-2 border-t border-[#FFD6EA]">
                  <button
                    onClick={() => onNavigate('shop')}
                    className="w-full py-3 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,20,147,0.35)] cursor-pointer"
                  >
                    <span>Browse More Skincare</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Receipt & PDF Modal */}
      <OrderReceiptModal
        order={trackedOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
};
