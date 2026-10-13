import React, { useState } from 'react';
import { X, Printer, Mail, CheckCircle2, ShieldCheck, Download, ExternalLink, RefreshCw, Sparkles, Building2, Phone, MapPin } from 'lucide-react';
import { Order, DELIVERY_ZONES, DeliveryZone } from '../types';
import { sendOrderInvoiceEmail } from '../services/emailService';

interface OrderReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onToast?: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'email'>('receipt');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      const res = await sendOrderInvoiceEmail(order);
      setResendSuccess(true);
      if (onToast) {
        onToast('Invoice Dispatched', `Official invoice re-sent to ${order.customer.email}`, 'success');
      }
    } catch (err: any) {
      if (onToast) {
        onToast('Dispatch Failed', err.message || 'Could not send invoice email', 'error');
      }
    } finally {
      setIsResending(false);
    }
  };

  // Resolve delivery zone label & details
  let zoneTitle = 'Inside Dhaka (৳80)';
  if (order.deliveryZone === 'dhaka_sub_area') zoneTitle = 'Dhaka sub-area (৳120)';
  else if (order.deliveryZone === 'outside_dhaka') zoneTitle = 'Outside Dhaka (৳150)';

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container Dialog */}
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="no-print p-4 sm:px-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF1493] animate-pulse-soft" />
            <h3 className="font-serif text-sm sm:text-base font-semibold tracking-wide">
              Official Order Record &amp; Tax Invoice #{order.orderNumber}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher tabs */}
            <div className="flex bg-slate-800 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('receipt')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'receipt' ? 'bg-[#FF1493] text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Printable Receipt
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'email' ? 'bg-[#FF1493] text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Email Dispatch
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          
          {activeTab === 'receipt' ? (
            /* PRINTABLE INVOICE SHEET */
            <div className="printable-receipt-sheet bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-2xl mx-auto space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0">
              
              {/* Header Letterhead */}
              <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-[0.16em] uppercase text-slate-950">
                    ANFA BD
                  </h1>
                  <p className="text-[10px] tracking-[0.25em] font-bold text-[#FF1493] uppercase mt-0.5">
                    GIRLS SKIN CARE BOUTIQUE • AUTHENTIC K-BEAUTY
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Imported Directly from Seoul, South Korea<br />
                    Dhaka, Bangladesh • Hotline: +880 1700-000000<br />
                    Official Support: support@anfabd.com
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <span className="inline-block px-3 py-1 rounded bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] text-xs font-bold uppercase tracking-wider">
                    Tax Invoice / Receipt
                  </span>
                  <p className="font-mono text-sm font-bold text-slate-900 mt-1">
                    Invoice #{order.orderNumber}
                  </p>
                  <p className="text-xs text-slate-500">Date: {formattedDate}</p>
                  <p className="text-xs font-semibold text-[#10B981]">Status: {order.status}</p>
                </div>
              </div>

              {/* Customer & Shipping Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 rounded-xl p-5 border border-slate-100 text-xs">
                <div>
                  <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px] mb-2 text-[#FF1493]">
                    Customer &amp; Delivery Address:
                  </h4>
                  <p className="font-bold text-sm text-slate-900">{order.customer.name}</p>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {order.customer.address}<br />
                    {order.customer.city}
                    {order.customer.postalCode ? ` - ${order.customer.postalCode}` : ''}, {order.customer.country || 'Bangladesh'}
                  </p>
                  <p className="text-slate-700 mt-2 font-medium">
                    <strong>Phone:</strong> {order.customer.phone}
                  </p>
                  <p className="text-slate-700 font-medium">
                    <strong>Email:</strong> {order.customer.email}
                  </p>
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-6 space-y-1.5">
                  <h4 className="font-bold text-slate-950 uppercase tracking-wider text-[11px] mb-2 text-[#FF1493]">
                    Dispatch &amp; Payment:
                  </h4>
                  <p className="text-slate-700">
                    <span className="text-slate-500 font-medium">Payment Method:</span>{' '}
                    <strong className="text-slate-900">{order.paymentMethod || 'Cash on Delivery'}</strong>
                  </p>
                  <p className="text-slate-700">
                    <span className="text-slate-500 font-medium">Delivery Zone:</span>{' '}
                    <strong className="text-slate-900">{zoneTitle}</strong>
                  </p>
                  <p className="text-slate-700">
                    <span className="text-slate-500 font-medium">Fulfillment Courier:</span>{' '}
                    <span className="text-slate-900">Insured Doorstep Parcel Service</span>
                  </p>
                  {order.customer.deliveryNotes && (
                    <p className="text-slate-700 pt-1 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-500 font-medium">Customer Notes:</span>{' '}
                      <em>{order.customer.deliveryNotes}</em>
                    </p>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-slate-700 uppercase tracking-wider text-[11px] font-bold">
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-2">Skincare Item</th>
                      <th className="py-2.5 px-2">Variation</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Unit Price</th>
                      <th className="py-2.5 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-2 font-medium text-slate-900 max-w-[200px]">
                          {item.productName}
                          {item.variation?.sku && (
                            <span className="block font-mono text-[10px] text-slate-400">
                              SKU: {item.variation.sku}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-600">
                          {item.variation?.name || 'Standard'} ({item.variation?.color || 'Original'})
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-3 px-2 text-right text-slate-700">৳{item.price.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right font-bold text-slate-950">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">৳{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge ({order.deliveryZone ? order.deliveryZone.replace('_', ' ') : 'Standard'}):</span>
                    <span className="font-semibold text-slate-900">৳{order.shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT &amp; Taxes:</span>
                    <span className="font-semibold text-[#10B981]">Included (100%)</span>
                  </div>
                  <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-bold text-slate-950">
                    <span>Grand Total:</span>
                    <span className="text-[#FF1493] text-base">৳{order.total.toLocaleString()} BDT</span>
                  </div>
                </div>
              </div>

              {/* Security & Authenticity Footnote */}
              <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-[11px] text-slate-500">
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-900 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#FF1493]" />
                    <span>Official 100% Genuine Korean Skincare Guarantee</span>
                  </div>
                  <p>
                    Retain this document for doorstep inspection and warranty claims.
                    Report transit discrepancies within 24 hours of package receipt.
                  </p>
                </div>

                {/* Simulated Verification Barcode */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="font-mono text-[9px] tracking-widest text-slate-400">VERIFIED AUTHENTIC</div>
                  <div className="h-6 w-32 flex items-center justify-center space-x-0.5 mt-0.5">
                    {[1,2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,3,1,2,1,3,1].map((w, i) => (
                      <span
                        key={i}
                        className="bg-slate-900 h-full"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[8px] text-slate-500 tracking-wider">
                    {order.orderNumber}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* EMAIL DISPATCH AUDIT & PREVIEW */
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
              <div className="flex items-center gap-3 p-4 bg-[#FFF0F6] border border-[#FFC1E3] rounded-xl text-xs text-slate-800">
                <CheckCircle2 className="w-6 h-6 text-[#FF1493] shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-[#FF1493]">
                    Automated Order Invoice Email Sent
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Dispatched automatically to <strong>{order.customer.email}</strong> upon order placement.
                  </p>
                </div>
              </div>

              {/* Email Envelope Header */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-16">To:</span>
                  <span className="text-slate-900 font-medium">{order.customer.name} &lt;{order.customer.email}&gt;</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-16">From:</span>
                  <span className="text-slate-900 font-medium">ANFA BD Boutique &lt;support@anfabd.com&gt;</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-16">Subject:</span>
                  <span className="text-slate-900 font-bold">Your Invoice for Order #{order.orderNumber} • ANFA BD</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-500 w-16">Timestamp:</span>
                  <span className="text-slate-600">{formattedDate}</span>
                </div>
              </div>

              {/* Email Content Summary */}
              <div className="border border-slate-200 rounded-xl p-6 space-y-4 text-xs text-slate-700 bg-white">
                <div className="text-center pb-4 border-b border-slate-100">
                  <h4 className="font-serif text-lg font-bold text-slate-900 uppercase tracking-widest">
                    ANFA BD
                  </h4>
                  <p className="text-[10px] text-[#FF1493] font-bold tracking-widest uppercase">
                    Girls Skin Care Boutique • Tax Invoice
                  </p>
                </div>

                <p>Hello <strong>{order.customer.name}</strong>,</p>
                <p>
                  Thank you for shopping at ANFA BD! Your order <strong>#{order.orderNumber}</strong> has been received
                  and is currently in preparation for express delivery. Below is your official receipt and breakdown.
                </p>

                <div className="bg-slate-50 p-3 rounded-lg space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Order Total:</span>
                    <strong className="text-[#FF1493]">৳{order.total.toLocaleString()} BDT</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Option:</span>
                    <span>{zoneTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span>{order.paymentMethod || 'Cash on Delivery'}</span>
                  </div>
                </div>

                <p className="text-slate-500 text-[11px] pt-2">
                  Need any assistance? Reply directly to this email or track your package anytime on our store.
                </p>
              </div>

              {/* Resend Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="px-5 py-2.5 bg-[#FF1493] hover:bg-[#E00078] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Transmitting...' : 'Re-send Invoice to Email'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions (Hidden on print) */}
        <div className="no-print p-4 sm:px-6 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-4 h-4 text-[#FF1493]" />
            <span>Invoice automatically sent to: <strong>{order.customer.email}</strong></span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" />
              <span>{isResending ? 'Sending...' : 'Email Invoice'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-5 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.4)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt / Order Record</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
