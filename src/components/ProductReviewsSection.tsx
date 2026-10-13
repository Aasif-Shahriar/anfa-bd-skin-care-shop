import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Trash2,
  Send,
  ThumbsUp,
  Filter,
  ArrowUpDown,
  User,
  X,
} from 'lucide-react';
import { Product, Review, ProductVariation } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  fetchProductReviews,
  submitProductReview,
  checkUserPurchaseStatus,
  deleteProductReview,
} from '../services/reviewService';

interface ProductReviewsSectionProps {
  product: Product;
  selectedVariation: ProductVariation;
  onReviewsUpdated?: (count: number, avgRating: number) => void;
  openFormTrigger?: boolean;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  selectedVariation,
  onReviewsUpdated,
  openFormTrigger = false,
}) => {
  const { user, profile, isSigningIn, signInWithGoogle, isAdmin } = useAuth();
  const { addToast } = useCart();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(openFormTrigger);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Purchase verification state (for Verified Buyer badge)
  const [isPurchased, setIsPurchased] = useState(false);
  const [matchedOrderNumber, setMatchedOrderNumber] = useState<string | undefined>(undefined);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [chosenVariation, setChosenVariation] = useState<string>(selectedVariation?.name || 'Standard Size');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtering & Sorting State
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Helpful votes stored in localStorage
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('anfa_helpful_review_votes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Keep chosenVariation in sync if selectedVariation prop changes and form was untouched
  useEffect(() => {
    if (selectedVariation?.name) {
      setChosenVariation(selectedVariation.name);
    }
  }, [selectedVariation]);

  // Sync reviewer name from auth if available
  useEffect(() => {
    if (user && !reviewerName) {
      setReviewerName(profile?.displayName || user.displayName || user.email?.split('@')[0] || '');
    }
  }, [user, profile]);

  // If external trigger requested form open
  useEffect(() => {
    if (openFormTrigger) {
      setIsFormOpen(true);
    }
  }, [openFormTrigger]);

  // Load reviews on mount or when product changes
  useEffect(() => {
    let isMounted = true;
    const loadReviews = async () => {
      setLoading(true);
      try {
        const data = await fetchProductReviews(product.id, product.slug);
        if (isMounted) {
          setReviews(data);
          const avg = data.length > 0 ? data.reduce((s, r) => s + r.rating, 0) / data.length : 5.0;
          onReviewsUpdated?.(data.length, avg);
        }
      } catch (e) {
        console.error('Failed to load reviews:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [product.id, product.slug]);

  // Check purchase status to award "Verified Buyer" badge
  useEffect(() => {
    let isMounted = true;
    const verifyPurchase = async () => {
      if (!user) {
        setIsPurchased(false);
        setMatchedOrderNumber(undefined);
        return;
      }
      setCheckingPurchase(true);
      try {
        const res = await checkUserPurchaseStatus(user.uid, product.id, product.slug, product.name);
        if (isMounted) {
          setIsPurchased(res.purchased);
          setMatchedOrderNumber(res.orderNumber);
          if (res.matchedVariation) {
            setChosenVariation(res.matchedVariation);
          }
        }
      } catch (e) {
        console.warn('Purchase check error:', e);
      } finally {
        if (isMounted) setCheckingPurchase(false);
      }
    };

    verifyPurchase();
    return () => {
      isMounted = false;
    };
  }, [user, product.id, product.slug]);

  // Calculate review statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 5.0;

  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(r.rating)));
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  const ratingDescriptions: Record<number, string> = {
    5: '5 Stars — Loved it! Amazing results & glowing skin',
    4: '4 Stars — Very good, visible improvement',
    3: '3 Stars — Average, works as described',
    2: '2 Stars — Below expectations, minimal effect',
    1: '1 Star — Disappointed, did not suit my skin',
  };

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        if (filterRating !== 'all' && Math.round(rev.rating) !== filterRating) {
          return false;
        }
        if (verifiedOnly && !rev.verifiedPurchase) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'highest') {
          return b.rating - a.rating;
        }
        if (sortBy === 'lowest') {
          return a.rating - b.rating;
        }
        return 0;
      });
  }, [reviews, filterRating, verifiedOnly, sortBy]);

  // Toggle helpful vote
  const handleToggleHelpful = (reviewId: string) => {
    const isVoted = !!helpfulVotes[reviewId];
    const newVotes = { ...helpfulVotes, [reviewId]: !isVoted };
    setHelpfulVotes(newVotes);
    try {
      localStorage.setItem('anfa_helpful_review_votes', JSON.stringify(newVotes));
    } catch {
      // ignore
    }

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const currentCount = r.helpfulCount || 0;
          return {
            ...r,
            helpfulCount: isVoted ? Math.max(0, currentCount - 1) : currentCount + 1,
          };
        }
        return r;
      })
    );
  };

  // Form submit handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError('Please sign in with Google to publish your review.');
      return;
    }

    if (!title.trim()) {
      setFormError('Please provide a concise headline for your review.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setFormError('Please share at least 10 characters detailing your experience.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalName =
        reviewerName.trim() ||
        profile?.displayName ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'Verified Customer';

      const reviewPayload: Omit<Review, 'id' | 'createdAt'> = {
        productId: product.id,
        productName: product.name,
        userId: user.uid,
        userName: finalName,
        userEmail: user.email || '',
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verifiedPurchase: isPurchased,
        isPurchased: isPurchased,
        variationChosen: chosenVariation,
        variationName: chosenVariation,
        helpfulCount: 0,
      };

      const created = await submitProductReview(reviewPayload);

      // Prepend newly created review to active reviews
      const updated = [created, ...reviews];
      setReviews(updated);
      const newAvg = updated.reduce((s, r) => s + r.rating, 0) / updated.length;
      onReviewsUpdated?.(updated.length, newAvg);

      addToast('Review Published', 'Thank you for sharing your authentic skincare experience!', 'success');
      setTitle('');
      setComment('');
      setRating(5);
      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setFormError('Unable to record your review right now. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete review handler
  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you certain you wish to delete this review?')) return;
    try {
      await deleteProductReview(reviewId);
      const updated = reviews.filter((r) => r.id !== reviewId);
      setReviews(updated);
      const newAvg = updated.length > 0 ? updated.reduce((s, r) => s + r.rating, 0) / updated.length : 5.0;
      onReviewsUpdated?.(updated.length, newAvg);
      addToast('Review Removed', 'The review was successfully deleted.', 'info');
    } catch (err) {
      console.error('Failed to delete review:', err);
      addToast('Error', 'Could not delete review from database.', 'error');
    }
  };

  return (
    <section id="reviews-section" className="pt-12 border-t border-slate-200 space-y-8 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>Customer Feedback</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 font-medium">
            Customer Reviews &amp; Ratings
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl font-normal">
            Real experiences and routine results from girls using this skincare formula in Bangladesh.
          </p>
        </div>

        {/* Action Button: Write Review */}
        {!isFormOpen && (
          <div className="shrink-0">
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-full sm:w-auto py-3 px-6 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-pink-100 group-hover:scale-110 transition-transform" />
              <span>Write a Customer Review</span>
            </button>
          </div>
        )}
      </div>

      {/* Review Metrics Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Average Score Column */}
          <div className="lg:col-span-4 text-center lg:border-r border-slate-100 lg:pr-8">
            <span className="font-serif text-5xl sm:text-6xl font-light text-slate-900">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex justify-center items-center gap-1 text-[#D4AF37] my-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(averageRating)
                      ? 'fill-[#D4AF37]'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-slate-700">
              Based on {totalReviews} {totalReviews === 1 ? 'customer review' : 'customer reviews'}
            </p>
            <p className="text-[11px] text-[#FF1493] mt-1 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>100% Authentic Customer Feedback</span>
            </p>
          </div>

          {/* Breakdown Bars Column */}
          <div className="lg:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = starCounts[stars] || 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              const isCurrentFilter = filterRating === stars;
              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setFilterRating(isCurrentFilter ? 'all' : stars)}
                  className={`w-full flex items-center gap-3 text-xs p-1.5 rounded-lg transition-colors text-left ${
                    isCurrentFilter ? 'bg-[#FFF0F6] ring-1 ring-[#FFC1E3]' : 'hover:bg-slate-50'
                  }`}
                  title={`Filter by ${stars} star reviews`}
                >
                  <span className="w-14 font-medium text-slate-700 flex items-center gap-1 shrink-0">
                    <span>{stars} Stars</span>
                    <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[11px] text-slate-500 font-mono shrink-0">
                    {pct}%
                  </span>
                  <span className="w-8 text-right text-[11px] text-slate-400 shrink-0">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* REVIEW SUBMISSION FORM SECTION */}
      {isFormOpen && (
        <div className="bg-[#FFF0F6]/80 border-2 border-[#FF1493]/30 rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in space-y-6">
          <div className="flex items-center justify-between border-b border-[#FFD6EA] pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#FF1493]">
                Rate &amp; Review
              </span>
              <h3 className="font-serif text-xl text-slate-900 font-medium">
                Share Your Experience with {product.name}
              </h3>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-full hover:bg-pink-100 transition-colors"
              aria-label="Close review form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Verification Status Banner if User is Signed In */}
          {user && (
            <div>
              {checkingPurchase ? (
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <span className="animate-spin text-[#FF1493]">✦</span>
                  <span>Verifying order history for verified purchaser badge...</span>
                </div>
              ) : isPurchased ? (
                <div className="p-3 bg-[#FFF0F6] border border-[#FFC1E3] rounded-xl text-xs text-[#FF1493] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF1493] shrink-0" />
                  <span>
                    <strong>Verified Purchase Confirmed:</strong> Registered to Order #{matchedOrderNumber}.
                    Your review will proudly display the <strong>Verified Buyer</strong> badge.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-5 text-xs">
            {/* Interactive Star Rating Selector */}
            <div>
              <label className="block text-slate-900 font-semibold uppercase tracking-wider mb-2">
                Overall Rating *
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const active = hoverRating ? starValue <= hoverRating : starValue <= rating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(starValue)}
                        className="p-1 text-[#D4AF37] focus:outline-none transition-transform hover:scale-125"
                        aria-label={`Rate ${starValue} stars`}
                      >
                        <Star
                          className={`w-6 h-6 sm:w-7 sm:h-7 ${
                            active ? 'fill-[#D4AF37]' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="font-medium text-xs text-[#FF1493] bg-white px-3 py-1.5 rounded-lg border border-[#FFC1E3] shadow-2xs">
                  {ratingDescriptions[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Reviewer Name & Variation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-900 font-semibold uppercase tracking-wider mb-1.5">
                  Your Name / Nickname *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faria Rahman or Anonymous Skincare Fan"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
                />
              </div>

              {product.variations && product.variations.length > 0 && (
                <div>
                  <label className="block text-slate-900 font-semibold uppercase tracking-wider mb-1.5">
                    Formula Size / Variation Selected
                  </label>
                  <select
                    value={chosenVariation}
                    onChange={(e) => setChosenVariation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
                  >
                    {product.variations.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name} ({v.color})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Review Headline / Title */}
            <div>
              <label className="block text-slate-900 font-semibold uppercase tracking-wider mb-1.5">
                Review Headline *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cleared my active breakouts and leaves a glowing, non-greasy glass-skin finish!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
              />
            </div>

            {/* Detailed Feedback Text */}
            <div>
              <label className="block text-slate-900 font-semibold uppercase tracking-wider mb-1.5">
                Detailed Comments &amp; Skincare Experience *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe your skin type (oily, dry, sensitive), absorption speed, soothing sensation, breakout reduction, or how it layers with your daily routine..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
              />
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500">
                {user ? `Posting as ${user.email}` : 'Sign in with Google to authenticate your submission'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold uppercase tracking-wider text-xs transition-colors"
                >
                  Cancel
                </button>

                {!user ? (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={isSigningIn}
                    className="px-6 py-2.5 bg-[#FF1493] hover:bg-[#E00078] disabled:opacity-50 text-white rounded-xl font-semibold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-pink-100" />
                    <span>{isSigningIn ? 'Signing in...' : 'Sign In with Google to Submit'}</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#FF1493] hover:bg-[#E00078] disabled:bg-slate-400 text-white rounded-xl font-semibold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(255,20,147,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Publishing to Firestore...' : 'Publish Customer Review'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Sort Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Star Filter Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setFilterRating('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterRating === 'all'
                  ? 'bg-[#FF1493] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalReviews})
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setFilterRating(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  filterRating === s
                    ? 'bg-[#FF1493] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{s}</span>
                <Star className={`w-3 h-3 ${filterRating === s ? 'fill-white text-white' : 'fill-[#D4AF37] text-[#D4AF37]'}`} />
              </button>
            ))}
          </div>

          {/* Verified Buyers Only Toggle */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              verifiedOnly
                ? 'bg-[#FFF0F6] border-[#FFC1E3] text-[#FF1493]'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF1493]" />
            <span>Verified Buyers Only</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF1493]"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Active Filter Notice & Reset */}
      {(filterRating !== 'all' || verifiedOnly) && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
          <span>
            Showing <strong>{filteredReviews.length}</strong> of {totalReviews} reviews
            {filterRating !== 'all' && ` matching ${filterRating} stars`}
            {verifiedOnly && ' from verified buyers'}
          </span>
          <button
            onClick={() => {
              setFilterRating('all');
              setVerifiedOnly(false);
            }}
            className="text-[#FF1493] font-semibold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="animate-spin text-[#FF1493] font-bold">✦</span>
            <span>Gathering customer reviews from Firestore...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-[#FF1493] mx-auto stroke-[1.5]" />
            <h3 className="font-serif text-lg text-slate-900 font-medium">
              {filterRating !== 'all' || verifiedOnly
                ? 'No reviews match your selected filter'
                : 'Be the first to review this formula'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterRating !== 'all' || verifiedOnly
                ? 'Try clearing the filters to view all customer impressions.'
                : 'Rate this skincare item and share your routine results with other girls.'}
            </p>
            {filterRating !== 'all' || verifiedOnly ? (
              <button
                onClick={() => {
                  setFilterRating('all');
                  setVerifiedOnly(false);
                }}
                className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-2 px-5 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,20,147,0.35)] cursor-pointer"
              >
                Rate This Product
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {filteredReviews.map((rev) => {
              const isAuthor = user?.uid === rev.userId;
              const canDelete = isAuthor || isAdmin;
              const hasVotedHelpful = !!helpfulVotes[rev.id];
              const initials = rev.userName
                ? rev.userName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'AN';

              return (
                <div key={rev.id} className="p-6 sm:p-7 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Reviewer identity & badges */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {rev.userName}
                          </span>
                          {rev.verifiedPurchase && (
                            <span className="px-2 py-0.5 bg-[#FFF0F6] border border-[#FFC1E3] text-[#FF1493] text-[10px] font-semibold uppercase tracking-wider rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-[#FF1493]" />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                        </div>
                        {(rev.variationChosen || rev.variationName || rev.metalVariationChosen) && (
                          <span className="text-[11px] text-[#FF1493] font-medium">
                            Choice: {rev.variationChosen || rev.variationName || rev.metalVariationChosen}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stars and submission date */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-[#D4AF37]">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-[#D4AF37]' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      {canDelete && (
                        <button
                          onClick={() => handleDelete(rev.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Title & Comments */}
                  <div className="space-y-1.5 pt-1">
                    {rev.title && (
                      <h4 className="font-serif text-sm font-semibold text-slate-900">
                        {rev.title}
                      </h4>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>

                  {/* Helpful feedback interactive row */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        hasVotedHelpful
                          ? 'bg-[#FFF0F6] border-[#FFC1E3] text-[#FF1493] font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${hasVotedHelpful ? 'fill-[#FF1493] text-[#FF1493]' : ''}`} />
                      <span>{hasVotedHelpful ? 'Helpful' : 'Mark as helpful'}</span>
                      {(rev.helpfulCount || 0) > 0 && (
                        <span className="font-mono text-[10px] ml-0.5">({rev.helpfulCount})</span>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-400">Authentic ANFA BD customer impression</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
