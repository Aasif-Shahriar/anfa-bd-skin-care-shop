import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Award,
  HeartHandshake,
  Compass,
  RotateCw,
  CheckCircle2,
  Droplet,
  Star,
  Shield,
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import luxuryHeroImg from '../assets/images/luxury_skincare_hero_1791695789499.jpg';
import image1 from '../assets/images/sheetmask.jpg';
import image2 from '../assets/images/mud mask.jpg';
import image3 from '../assets/images/sleeping mask.jpg';
import image4 from '../assets/images/buble mask.jpg';
import image5 from '../assets/images/eye mask.jpg';
import image6 from '../assets/images/lip mask.jpg';
import image7 from '../assets/images/sunscreen.jpg';
import image8 from '../assets/images/bodywash.jpg';
import image9 from '../assets/images/nosestrips.jpg';
import image10 from '../assets/images/blackhead remover.jpg';
import image11 from '../assets/images/makeup remover.jpg';
import image12 from '../assets/images/comboset.jpeg';

interface HomePageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  onSelectProduct,
  onQuickView,
  onNavigate,
}) => {
  const bestsellers = products.filter((p) => p.bestseller).slice(0, 4);
  const newArrivals = products.filter((p) => p.newArrival).slice(0, 4);

  // Recommendations Filter State (All, Serums, Moisturizers, Sun Care, Toners, Cleansers)
  const [recommendationCategory, setRecommendationCategory] = useState<string>('All');
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  // Dynamic recommendations computed from the collection
  const recommendedProducts = useMemo(() => {
    let pool = [...products];

    // Category filter for recommendations
    if (recommendationCategory !== 'All') {
      pool = pool.filter((p) => p.category.toLowerCase() === recommendationCategory.toLowerCase());
    }

    // Pseudo-shuffle based on seed to allow interactive discovery
    if (shuffleSeed > 0) {
      pool = [...pool].sort((a, b) => {
        const hashA = (a.id.charCodeAt(a.id.length - 1) + shuffleSeed) % 17;
        const hashB = (b.id.charCodeAt(b.id.length - 1) + shuffleSeed) % 17;
        return hashA - hashB;
      });
    }

    // Return top 4-8 products from the pool
    return pool.slice(0, 8);
  }, [products, recommendationCategory, shuffleSeed]);

  const categories = [
    {
      name: 'Sheet mask',
      subtitle: 'Tea Tree & Calming Bamboo Sheets',
      image: image1,
    },
    {
      name: 'Mud mask',
      subtitle: 'Jeju Volcanic Mineral Clay',
      image: image2,
    },
    {
      name: 'Sleeping mask',
      subtitle: 'Overnight Barrier Recharge',
      image: image3,
    },
    {
      name: 'Bubble mask',
      subtitle: 'Oxygen Charcoal Deep Detox',
      image: image4,
    },
    {
      name: 'Eye mask',
      subtitle: '24K Gold & Collagen Patches',
      image: image5,
    },
    {
      name: 'Lip mask',
      subtitle: 'Berry Peptide Plumping Balm',
      image: image6,
    },
    {
      name: 'Sunscream',
      subtitle: 'Invisible Daily SPF 50+ PA++++',
      image: image7,
    },
    {
      name: 'Bodywash',
      subtitle: 'Brightening Niacinamide Gel',
      image: image8,
    },
    {
      name: 'Nose strip',
      subtitle: 'Bamboo Charcoal Pore Strips',
      image: image9,
    },
    {
      name: 'Blackhead remover',
      subtitle: 'Volcanic BHA Melting Stick',
      image: image10,
    },
    {
      name: 'Makeup remover',
      subtitle: 'Centella Melting Oil & Balm',
      image: image11,
    },
    {
      name: 'Combo set',
      subtitle: '7-Day Glass Skin Complete Set',
      image: image12,
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Editorial Luxury Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-[#18020D] text-white overflow-hidden">
        {/* Ambient Animated Lighting Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#FF1493]/20 blur-[130px] pointer-events-none animate-pulse-soft" />
        <div className="absolute bottom-1/3 right-1/4 w-[30rem] h-[30rem] rounded-full bg-[#FF007F]/25 blur-[150px] pointer-events-none animate-pulse-soft" />

        {/* Ambient Subtle Background Texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#18020D] via-[#2A0217]/60 to-[#18020D]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Brand Story & Call to Actions */}
            <div className="lg:col-span-7 space-y-7">
              {/* High-Fashion Editorial Typography */}
              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-white">
                Low profits and <br />
                <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-pink-100 to-[#FF69B4]">
                  customer satisfaction
                </span>
              </h1>

              {/* Refined Curation Description */}
              <p className="text-base sm:text-lg text-pink-100/90 font-light leading-relaxed max-w-xl">
                Authentic Korean &amp; Chinese skincare products directly imported for girls in Bangladesh. Crafted with Centella Asiatica, Niacinamide, Camellia extracts, and barrier-repair ceramides.
              </p>

              {/* Action Buttons with Ambient Neon Glow */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('shop')}
                  className="group relative py-4 px-8 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-[0_0_25px_rgba(255,20,147,0.5)] hover:shadow-[0_0_35px_rgba(255,20,147,0.7)] transition-all border border-pink-400/40 flex items-center gap-3 cursor-pointer overflow-hidden"
                >
                  <span className="relative z-10">Shop Skincare Catalogue</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('shop', 'Combo offer')}
                  className="py-4 px-8 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-xl backdrop-blur-md border border-white/20 transition-all hover:border-pink-400/40 cursor-pointer hover:shadow-lg"
                >
                  View Combo Offers
                </button>
              </div>

              {/* Trust Pillars */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-pink-200/90 font-medium border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF1493]" />
                  <span>Mirpur, Dhaka, Bangladesh</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF1493]" />
                  <span>100% Cash on Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF1493]" />
                  <span>Doorstep Package Inspection</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Backlight Glow Halo */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#FF1493]/35 to-pink-500/10 rounded-3xl blur-2xl -z-10 animate-pulse-soft" />

              {/* Main Image Stage */}
              <div className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden border border-pink-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(255,20,147,0.3)] group">
                <img
                  src="https://res.cloudinary.com/dnh9rdh01/image/upload/v1792564765/441ebc7b-70e6-4d48-b038-c1888c32a078.png"
                  alt="ANFA BD Skincare Collection - Low profits and customer satisfaction"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                
                {/* Subtle Inner Glass Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#18020D]/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Continuous Luxury Marquee Ticker */}
      <div className="relative -mt-20 overflow-hidden bg-gradient-to-r from-[#2A0217] via-[#FF1493] to-[#2A0217] py-3 text-white border-y border-pink-400/40 shadow-lg">
        <div className="animate-marquee whitespace-nowrap text-xs font-bold uppercase tracking-[0.22em] flex items-center gap-8">
          <span>✦ 100% AUTHENTIC KOREAN IMPORT</span>
          <span className="opacity-60">·</span>
          <span>✦ CASH ON DELIVERY ALL OVER BANGLADESH</span>
          <span className="opacity-60">·</span>
          <span>✦ DELIVERY: INSIDE DHAKA ৳80 · SUB-AREA ৳120 · OUTSIDE DHAKA ৳150</span>
          <span className="opacity-60">·</span>
          <span>✦ DERMATOLOGIST TESTED FOR SENSITIVE &amp; TEEN SKIN</span>
          <span className="opacity-60">·</span>
          <span>✦ ZERO WHITE CAST SUNSCREENS &amp; GLASS SKIN MASKS</span>
          <span className="opacity-60">·</span>
          <span>✦ 100% AUTHENTIC KOREAN IMPORT</span>
          <span className="opacity-60">·</span>
          <span>✦ CASH ON DELIVERY ALL OVER BANGLADESH</span>
          <span className="opacity-60">·</span>
          <span>✦ DELIVERY: INSIDE DHAKA ৳80 · SUB-AREA ৳120 · OUTSIDE DHAKA ৳150</span>
          <span className="opacity-60">·</span>
          <span>✦ DERMATOLOGIST TESTED FOR SENSITIVE &amp; TEEN SKIN</span>
          <span className="opacity-60">·</span>
          <span>✦ ZERO WHITE CAST SUNSCREENS &amp; GLASS SKIN MASKS</span>
        </div>
      </div>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF1493]">
            Curated Formulations
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 font-medium">
            Shop by Skincare Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Targeted active routines designed to nurture your skin barrier and enhance your natural glow.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
          {categories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onNavigate('shop', cat.name)}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-[#FF1493] shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 ease-out flex flex-col"
            >
              <div className="aspect-square overflow-hidden bg-slate-100 relative">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <span className="absolute bottom-2 left-2 right-2 text-white font-serif font-bold text-sm text-center drop-shadow-sm">
                  {cat.name}
                </span>
              </div>
              <div className="p-2.5 text-center bg-white flex-1 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 font-medium line-clamp-1">
                  {cat.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bestselling Skincare Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF1493]">
              Community Holy Grails
            </span>
            <h2 className="font-serif text-3xl text-slate-900 font-medium mt-1">
              Bestselling Skincare
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold uppercase tracking-wider text-[#FF1493] hover:text-[#E00078] flex items-center gap-1.5 transition-colors mt-2 sm:mt-0 font-semibold cursor-pointer"
          >
            Explore Full Range <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(bestsellers.length > 0 ? bestsellers : products.slice(0, 4)).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </section>

      {/* High-Luxury Editorial Banner in Deep Neon Pink & Berry */}
      <section className="relative bg-[#18020D] text-white overflow-hidden my-16 border-y border-pink-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#FF1493]">
                Korean Glass Skin Science
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-light leading-tight">
                Authentic Formulas. <br />
                <span className="italic font-normal text-pink-200">Radiant Skin Barrier.</span>
              </h2>
              <p className="text-sm text-pink-100/90 leading-relaxed max-w-xl font-light">
                Every ANFA BD product is sealed and verified for authenticity. We prioritize soothing, non-comedogenic
                ingredients that strengthen your delicate acid mantle — 100% free from harsh bleaches, steroid concoctions,
                or synthetic fragrances.
              </p>
              <div className="pt-2 flex flex-wrap gap-8 text-xs">
                <div>
                  <span className="block font-serif text-2xl font-bold text-[#FF1493]">100%</span>
                  <span className="text-pink-200 font-medium">Original Korean Import</span>
                </div>
                <div>
                  <span className="block font-serif text-2xl font-bold text-[#FF1493]">0%</span>
                  <span className="text-pink-200 font-medium">Harmful Bleach & Paraben</span>
                </div>
                <div>
                  <span className="block font-serif text-2xl font-bold text-[#FF1493]">Dermat</span>
                  <span className="text-pink-200 font-medium">Tested & Hypoallergenic</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-[#FF1493]/40 shadow-[0_0_25px_rgba(255,20,147,0.35)]">
                <img
                  src="https://res.cloudinary.com/dnh9rdh01/image/upload/v1792647933/section4_blaq9t.jpg"
                  alt="ANFA BD Skincare Products"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECOMMENDED FOR YOU SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-pink-50/80 via-white to-pink-50/40 rounded-3xl border border-pink-200/80 p-6 sm:p-10 shadow-sm space-y-8">
          {/* Header & Category Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-pink-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#FF1493] mb-2">
                <Compass className="w-4 h-4 text-[#FF1493]" />
                <span>Personalized Selection</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 font-medium tracking-tight">
                Recommended For Your Routine
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-xl">
                Curated suggestions from our entire skincare boutique of {products.length} verified formulas,
                tailored to help you discover products that suit your skin type and concerns.
              </p>
            </div>

            {/* Interactive Discovery Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShuffleSeed((prev) => prev + 1)}
                className="px-3.5 py-2 bg-white hover:bg-pink-50 text-[#FF1493] border border-pink-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Shuffle discovery picks"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#FF1493]" />
                <span>Shuffle Picks</span>
              </button>

              <div className="flex items-center bg-slate-100/90 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
                {['All', 'Sheet mask', 'Mud mask', 'Sleeping mask', 'Sunscream', 'Combo offer'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setRecommendationCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      recommendationCategory === cat
                        ? 'bg-[#FF1493] text-white shadow-[0_0_10px_rgba(255,20,147,0.35)]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF1493]">
                Fresh From Seoul
              </span>
              <h2 className="font-serif text-3xl text-slate-900 font-medium mt-1">
                New Arrivals
              </h2>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold uppercase tracking-wider text-[#FF1493] hover:text-[#E00078] flex items-center gap-1.5 transition-colors mt-2 sm:mt-0 font-semibold cursor-pointer"
            >
              Browse All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* Brand Atelier Story & Trust Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF1493]">
                The ANFA BD Philosophy
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 font-medium leading-snug">
                Healthy, Bouncy Skin For Every Girl.
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                At ANFA BD, our mission is to empower girls across Bangladesh with genuine, science-backed skincare.
                We believe glowing skin is not about masking with heavy makeup, but rather nourishing your skin barrier
                with calming botanicals, gentle hydration, and high-performance Korean actives.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#FFF0F6] rounded-xl border border-[#FFC1E3]">
                  <Award className="w-5 h-5 text-[#FF1493] mb-2" />
                  <h4 className="font-serif text-sm font-semibold text-slate-900">Sealed & Authentic</h4>
                  <p className="text-xs text-slate-600 mt-1">Every bottle has verifiable batch codes directly from authorized importers.</p>
                </div>
                <div className="p-4 bg-[#FFF0F6] rounded-xl border border-[#FFC1E3]">
                  <HeartHandshake className="w-5 h-5 text-[#FF1493] mb-2" />
                  <h4 className="font-serif text-sm font-semibold text-slate-900">Routine Advisory</h4>
                  <p className="text-xs text-slate-600 mt-1">Free consultation on WhatsApp & Messenger to find your customized regimen.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://res.cloudinary.com/dnh9rdh01/image/upload/v1792647934/section7p1_eczesm.jpg"
                alt="ANFA BD Skincare 1"
                className="w-full h-64 object-cover rounded-xl shadow-md"
              />
              <img
                src="https://res.cloudinary.com/dnh9rdh01/image/upload/v1792647937/section7p2_pesjpt.jpg"
                alt="ANFA BD Skincare 2"
                className="w-full h-64 object-cover rounded-xl shadow-md mt-6"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
