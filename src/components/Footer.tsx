import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Sparkles,
  Send,
  Check,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { EXACT_14_CATEGORIES } from '../types';
import faviconImg from '../assets/images/favicon.jpg';
import { BangladeshFlag } from './BangladeshFlag';

interface FooterProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#18020D] text-[#EDE5E2] border-t border-pink-900/50 mt-20">
      {/* Guarantees Bar */}
      <div className="border-b border-pink-900/40 py-10 bg-[#250314]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF1493]/15 flex items-center justify-center shrink-0 text-[#FF1493] border border-[#FF1493]/40 shadow-[0_0_12px_rgba(255,20,147,0.25)]">
                <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-white tracking-wide">
                  100% Authentic Korean &amp; Chinese Skincare
                </h4>
                <p className="text-xs text-pink-200/80 mt-0.5">
                  Directly imported, sealed packaging &amp; verified batch codes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF1493]/15 flex items-center justify-center shrink-0 text-[#FF1493] border border-[#FF1493]/40 shadow-[0_0_12px_rgba(255,20,147,0.25)]">
                <Truck className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-white tracking-wide">
                  Nationwide Express Rates
                </h4>
                <p className="text-xs text-pink-200/80 mt-0.5">
                  Inside Dhaka ৳80 • Sub-area ৳120 • Outside Dhaka ৳150
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF1493]/15 flex items-center justify-center shrink-0 text-[#FF1493] border border-[#FF1493]/40 shadow-[0_0_12px_rgba(255,20,147,0.25)]">
                <RotateCcw className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-white tracking-wide">
                  Hassle-Free 7-Day Exchange
                </h4>
                <p className="text-xs text-pink-200/80 mt-0.5">
                  Easy exchange on unopened items with original seals intact
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF1493]/15 flex items-center justify-center shrink-0 text-[#FF1493] border border-[#FF1493]/40 shadow-[0_0_12px_rgba(255,20,147,0.25)]">
                <Headphones className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-white tracking-wide">
                  Skincare Advisory &amp; Support
                </h4>
                <p className="text-xs text-pink-200/80 mt-0.5">
                  WhatsApp consultation &amp; routine help 7 days a week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
            
              <div>
                <span className="font-serif text-xl sm:text-2xl tracking-[0.14em] sm:tracking-[0.2em] font-medium text-white uppercase block leading-tight">
                  ANFA BD
                </span>
                <span className="block text-[8.5px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] text-[#FF1493] font-bold uppercase">
                  PREMIUM GIRLS SKIN CARE BOUTIQUE
                </span>
              </div>
            </div>
            <p className="text-xs text-pink-100/80 leading-relaxed pt-2">
              Curating genuine Korean and dermatologist-grade skincare formulas for girls in Bangladesh.
              Low profits and customer satisfaction with authentic botanical glass-skin formulas.
            </p>
            <div className="pt-2 text-xs text-[#FF1493] flex items-center gap-2 font-medium">
              <MapPin className="w-4 h-4 text-[#FF1493] shrink-0" />
              <span className="text-pink-200 font-semibold">Mirpur, Dhaka, Bangladesh</span>
            </div>

            {/* Social Media Links */}
            <div className="pt-3 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF1493] block">
                Connect With Us
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/share/14wYf68w23w/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#250314] hover:bg-[#FF1493] text-pink-200 hover:text-white border border-pink-900/60 hover:border-[#FF1493] transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs group"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@farias.adorn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#250314] hover:bg-[#FF1493] text-pink-200 hover:text-white border border-pink-900/60 hover:border-[#FF1493] transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs group"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  <span>TikTok</span>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/8801847604404"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#250314] hover:bg-[#25D366] text-pink-200 hover:text-white border border-pink-900/60 hover:border-[#25D366] transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs group"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366] group-hover:text-white" />
                  <span>WhatsApp: +880 1847-604404</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick links: 14 Exact Categories */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#FF1493]">
              14 Skincare Lines
            </h5>
            <ul className="space-y-1.5 text-xs text-pink-100/80 max-h-72 overflow-y-auto pr-1">
              {EXACT_14_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onNavigate('shop', cat)}
                    className="hover:text-[#FF1493] transition-colors text-left truncate block w-full"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Client services */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#FF1493]">
              Customer Care
            </h5>
            <ul className="space-y-2 text-xs text-pink-100/80">
              <li>
                <button onClick={() => onNavigate('track-order')} className="hover:text-[#FF1493] transition-colors text-left">
                  Track Your Parcel
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('wishlist')} className="hover:text-[#FF1493] transition-colors text-left">
                  Saved Favorites
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-[#FF1493] transition-colors text-left">
                  Store Admin
                </button>
              </li>
              <li>
                <span className="text-pink-400/60 cursor-default">Doorstep Verification</span>
              </li>
              <li>
                <span className="text-pink-400/60 cursor-default">Authentic Batch Check</span>
              </li>
            </ul>
          </div>

          {/* Newsletter signup */}
          <div className="md:col-span-4 space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#FF1493]">
              ANFA Glow Club
            </h5>
            <p className="text-xs text-pink-100/80 leading-relaxed">
              Subscribe to receive exclusive restock alerts for viral Korean products, flash discounts, and skincare routine guides.
            </p>

            {subscribed ? (
              <div className="p-3 bg-[#250314] border border-[#FF1493]/50 rounded-lg flex items-center gap-2 text-xs text-[#FF1493]">
                <Check className="w-4 h-4" />
                <span>Thank you! You have joined the ANFA Glow Club.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-[#250314] border border-pink-900/80 text-white text-xs px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF1493] placeholder-pink-300/60"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white rounded-lg transition-colors border border-[#FF1493] shadow-[0_0_12px_rgba(255,20,147,0.4)]"
                  aria-label="Subscribe"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Cash on Delivery & BDT Currency with Bangladesh Flag */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-pink-200">
              <span className="text-[#FF1493] font-bold bg-[#250314] px-2.5 py-1 rounded-md border border-[#FF1493]/40 shadow-xs flex items-center gap-1.5">
                <BangladeshFlag className="w-4 h-2.5 shadow-2xs" />
                <span>BDT (৳)</span>
              </span>
              <span className="text-[#FF1493] font-bold bg-[#250314] px-2.5 py-1 rounded-md border border-[#FF1493]/40 shadow-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Cash on Delivery Only</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-12 mt-12 border-t border-pink-900/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-pink-300/70 gap-4">
          <p>© {new Date().getFullYear()} ANFA BD. Mirpur, Dhaka, Bangladesh. 100% Authentic Korean &amp; Chinese Skincare.</p>
          <div className="flex gap-6">
            <span className="hover:text-[#FF1493] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#FF1493] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#FF1493] cursor-pointer">Authenticity Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
