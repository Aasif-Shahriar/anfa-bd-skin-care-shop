import React, { useState } from 'react';
import { ShieldCheck, Truck, RotateCcw, Headphones, Sparkles, Send, Check } from 'lucide-react';

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
                  100% Authentic Korean Skincare
                </h4>
                <p className="text-xs text-pink-200/80 mt-0.5">
                  Directly imported, sealed packaging & verified batch codes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF1493]/15 flex items-center justify-center shrink-0 text-[#FF1493] border border-[#FF1493]/40 shadow-[0_0_12px_rgba(255,20,147,0.25)]">
                <Truck className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold text-white tracking-wide">
                  Nationwide Delivery Rates
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
                  Skincare Advisory & Support
                </h4>
                <p className="text-xs text-pink-200/80 mt-0.5">
                  Personalized routine recommendations & order assistance 7 days a week
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
            <span className="font-serif text-xl sm:text-2xl tracking-[0.14em] sm:tracking-[0.2em] font-medium text-white uppercase block">
              ANFA BD
            </span>
            <span className="block text-[8.5px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] text-[#FF1493] font-bold uppercase">
              PREMIUM GIRLS SKIN CARE BOUTIQUE
            </span>
            <p className="text-xs text-pink-100/80 leading-relaxed pt-2">
              Curating genuine Korean and dermatologist-grade skincare formulas for girls in Bangladesh.
              From glass-skin serums to gentle cleansers and reef-safe sun care, we empower your daily glowing skin ritual.
            </p>
            <div className="pt-2 text-xs text-[#FF1493] flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4" />
              <span className="text-pink-200">Banani & Gulshan • Dhaka, Bangladesh</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#FF1493]">
              Skincare Categories
            </h5>
            <ul className="space-y-2 text-xs text-pink-100/80">
              {[
                'Sheet mask',
                'Mud mask',
                'Sleeping mask',
                'Bubble mask',
                'Eye mask',
                'Lip mask',
                'Sunscream',
                'Bodywash',
                'Nose strip',
                'Blackhead remover',
                'Makeup remover',
                'Applicator',
                'Foot mask',
                'Combo offer',
              ].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onNavigate('shop', cat)}
                    className="hover:text-[#FF1493] transition-colors text-left"
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
                <span className="text-pink-400/60 cursor-default">Glass Skin Routine Guide</span>
              </li>
              <li>
                <span className="text-pink-400/60 cursor-default">Skin Type Consultation</span>
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

            <div className="pt-2 flex items-center gap-3 text-xs text-pink-300/80">
              <span>Payment Accepted:</span>
              <span className="text-[#FF1493] font-semibold">Cash on Delivery</span>
              <span>•</span>
              <span className="text-white font-medium">bKash / Nagad</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-12 mt-12 border-t border-pink-900/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-pink-300/70 gap-4">
          <p>© {new Date().getFullYear()} ANFA BD. All rights reserved. 100% Authentic Korean Skincare.</p>
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
