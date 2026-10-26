import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Truck,
  Printer,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
} from 'lucide-react';
import { Order } from '../types';
import { formatPrice } from '../utils/format';
import { OrderReceiptModal } from '../components/OrderReceiptModal';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
import { BangladeshFlag } from '../components/BangladeshFlag';

interface OrderConfirmationPageProps {
  order: Order;
  onNavigate: (tab: string, param?: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  onNavigate,
}) => {
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF1493', '#D4AF37', '#FF69B4', '#FF007F'],
      });
    } catch {
      // Ignore if confetti not supported
    }
  }, []);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadReceiptPdf(order);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in">
      {/* Top banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-[#FFF0F6] text-[#FF1493] flex items-center justify-center mx-auto mb-4 border border-[#FFC1E3]">
          <CheckCircle2 className="w-8 h-8 text-[#FF1493]" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#FF1493]">
          Order Confirmed • ANFA BD
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-medium mt-1 mb-3">
          Thank You for Your Order
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Your authentic skincare order has been recorded. We are preparing your products with
          tamper-evident security packaging for express courier delivery.
        </p>

        {/* Order Reference Badge */}
        <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-3 bg-[#FFF0F6] border border-[#FFC1E3] rounded-xl text-xs">
          <span className="text-slate-600">Official Order Reference:</span>
          <span className="font-mono font-bold text-sm text-[#FF1493] tracking-wider">
            #{order.orderNumber}
          </span>
          <span className="hidden sm:inline text-pink-300">•</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-[#FFC1E3] text-[#FF1493]">
            Status: {order.status}
          </span>
        </div>
      </div>

      {/* Official Tax Invoice & PDF Download Card */}
      <div className="bg-white rounded-2xl border-2 border-[#FFC1E3] p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF1493] via-[#D4AF37] to-[#FF1493]" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F6] text-[#FF1493] flex items-center justify-center shrink-0 border border-[#FFC1E3] shadow-xs">
              <FileText className="w-6 h-6 text-[#FF1493]" />
            </div>
            
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3]">
                  Official Tax Invoice &amp; Order Record
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              
              <h3 className="font-serif text-base sm:text-lg font-medium text-slate-900">
                Downloadable PDF &amp; Printable Receipt Ready
              </h3>
              
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                An itemized receipt and official order record for Order <strong>#{order.orderNumber}</strong> has been generated. You can download the PDF document directly or open the print-ready sheet.
              </p>

              {downloadSuccess && (
                <div className="pt-1.5 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>PDF invoice downloaded successfully: ANFA-Receipt-{order.orderNumber}.pdf</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex-1 md:flex-none py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 text-[#FF1493] ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Downloading...' : 'Download PDF Receipt'}</span>
            </button>
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="flex-1 md:flex-none py-2.5 px-5 bg-white hover:bg-[#FFF0F6] text-slate-800 hover:text-[#FF1493] border border-slate-300 hover:border-[#FFC1E3] rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>View &amp; Print Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h3 className="font-serif text-lg font-medium text-slate-900 mb-6">
          Order Journey
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {[
            { label: 'Order Received', desc: 'Saved in Firestore', active: true, done: true },
            { label: 'Confirmed', desc: 'Customer Support Verification', active: order.status !== 'Pending', done: ['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(order.status) },
            { label: 'In Transit', desc: 'Insured Express Courier', active: ['Shipped', 'Delivered'].includes(order.status), done: ['Shipped', 'Delivered'].includes(order.status) },
            { label: 'Delivered', desc: 'Doorstep Handover', active: order.status === 'Delivered', done: order.status === 'Delivered' },
          ].map((step, idx) => (
            <div key={step.label} className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step.done
                    ? 'bg-[#FF1493] text-white'
                    : step.active
                    ? 'bg-[#D4AF37] text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step.done ? '✓' : idx + 1}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">{step.label}</p>
                <p className="text-[10px] text-slate-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details & Customer Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Purchased Skincare Items (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-medium text-slate-900 pb-3 border-b border-slate-100">
            Purchased Skincare
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
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
                <div className="flex-1">
                  <h4 className="font-serif text-sm font-medium text-slate-900">
                    {item.productName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: item.variation.colorCode }}
                    />
                    <span className="text-xs font-semibold text-[#FF1493]">
                      {item.variation.name} ({item.variation.color})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600 mt-2">
                    <span>
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Courier Delivery ({order.deliveryZone || order.customer.deliveryZone || 'Standard'})</span>
              <span>{order.shippingFee === 0 ? 'Free Delivery' : formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <BangladeshFlag className="w-4 h-2.5 shadow-2xs" />
                <span>Total Payable (BDT ৳)</span>
              </span>
              <span className="font-serif text-xl font-bold text-[#FF1493]">
                {formatPrice(order.total)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Payment Method: <strong className="text-slate-900">{order.paymentMethod}</strong>
            </div>
          </div>
        </div>

        {/* Shipping & Contact info (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-medium text-slate-900 pb-3 border-b border-slate-100">
              Delivery Information
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF1493] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">{order.customer.name}</p>
                  <p className="text-slate-500 leading-relaxed mt-0.5">
                    {order.customer.address}, {order.customer.city}
                    {order.customer.postalCode ? ` - ${order.customer.postalCode}` : ''},{' '}
                    {order.customer.country}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-[#FF1493] shrink-0" />
                <span>{order.customer.phone}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF1493] shrink-0" />
                <span className="truncate">{order.customer.email}</span>
              </div>

              {order.customer.deliveryNotes && (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-900">Notes: </span>
                  {order.customer.deliveryNotes}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 text-[#FF1493] ${isDownloading ? 'animate-bounce' : ''}`} />
              {isDownloading ? 'Generating PDF...' : 'Download Receipt (PDF)'}
            </button>

            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="w-full py-3.5 px-4 bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#FF1493]" />
              Print Receipt / Order Record
            </button>

            <button
              onClick={() => onNavigate('track-order', order.orderNumber)}
              className="w-full py-3.5 px-4 bg-[#FFF0F6] hover:bg-[#FF1493] hover:text-white text-[#FF1493] border border-[#FFC1E3] text-xs font-semibold uppercase tracking-wider rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              Track This Order Live
            </button>

            <button
              onClick={() => onNavigate('shop')}
              className="w-full py-3.5 px-4 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Official Printable Receipt & PDF Modal */}
      <OrderReceiptModal
        order={order}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
};
