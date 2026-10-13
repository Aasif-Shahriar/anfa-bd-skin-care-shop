import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Review, Order } from '../types';
import { cleanForFirestore } from './orderService';
import { INITIAL_SAMPLE_REVIEWS } from '../data/sampleReviews';

const REVIEWS_COLLECTION = 'reviews';
const ORDERS_COLLECTION = 'orders';

/**
 * Fetch reviews for a specific product from Firestore.
 * Merges with curated sample reviews if few reviews exist, ensuring a vibrant luxury display.
 */
export async function fetchProductReviews(productId: string, productSlug?: string): Promise<Review[]> {
  try {
    const colRef = collection(db, REVIEWS_COLLECTION);
    const q = query(colRef, where('productId', '==', productId));
    const snap = await getDocs(q);

    const firestoreReviews: Review[] = [];
    snap.forEach((d) => {
      firestoreReviews.push({ id: d.id, ...d.data() } as Review);
    });

    // Also check by productSlug if different
    if (productSlug && productSlug !== productId) {
      const qSlug = query(colRef, where('productId', '==', productSlug));
      const snapSlug = await getDocs(qSlug);
      snapSlug.forEach((d) => {
        if (!firestoreReviews.some(r => r.id === d.id)) {
          firestoreReviews.push({ id: d.id, ...d.data() } as Review);
        }
      });
    }

    // Sort descending by date
    firestoreReviews.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // If no Firestore reviews yet, inject default curated initial reviews tailored to this product
    if (firestoreReviews.length === 0) {
      const samples = (INITIAL_SAMPLE_REVIEWS[productId] || INITIAL_SAMPLE_REVIEWS.default).map((s) => ({
        ...s,
        productId,
      }));
      return samples;
    }

    return firestoreReviews;
  } catch (err) {
    console.warn(`Could not load reviews for ${productId} from Firestore, using initial samples:`, err);
    return INITIAL_SAMPLE_REVIEWS.default.map((s) => ({ ...s, productId }));
  }
}

/**
 * Check if an authenticated user has purchased this product (or placed an order containing it).
 */
export async function checkUserPurchaseStatus(
  userId: string,
  productId: string,
  productSlug?: string,
  productName?: string
): Promise<{ purchased: boolean; matchedVariation?: string; orderNumber?: string }> {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const order = d.data() as Order;
      // Skip cancelled orders
      if (order.status === 'Cancelled') continue;

      for (const item of order.items || []) {
        const matchesId = item.productId === productId;
        const matchesSlug = productSlug && (item.productId === productSlug || item.productId === `prod_${productSlug}`);
        const matchesName = productName && item.productName?.toLowerCase() === productName.toLowerCase();

        if (matchesId || matchesSlug || matchesName) {
          return {
            purchased: true,
            matchedVariation: item.variation?.name,
            orderNumber: order.orderNumber,
          };
        }
      }
    }

    return { purchased: false };
  } catch (err) {
    console.warn('Could not verify purchase status against orders:', err);
    return { purchased: false };
  }
}

/**
 * Submit a customer review to Firestore.
 */
export async function submitProductReview(
  reviewData: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> {
  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fullPayload: Review = {
    ...reviewData,
    id: reviewId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const cleaned = cleanForFirestore(fullPayload);
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await setDoc(docRef, cleaned);
    return fullPayload;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${REVIEWS_COLLECTION}/${reviewId}`);
    throw err;
  }
}

/**
 * Remove a review (author or admin)
 */
export async function deleteProductReview(reviewId: string): Promise<void> {
  try {
    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${REVIEWS_COLLECTION}/${reviewId}`);
    throw err;
  }
}
