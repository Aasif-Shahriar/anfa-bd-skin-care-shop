import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const USERS_COLLECTION = 'users';

/**
 * Fetch the user's saved wishlist product IDs from Firestore.
 */
export async function getUserWishlist(userId: string): Promise<string[]> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return [];

    const data = snap.data();
    return Array.isArray(data.wishlist) ? data.wishlist : [];
  } catch (err) {
    console.warn(`Could not load wishlist for user ${userId} from Firestore:`, err);
    return [];
  }
}

/**
 * Persist the entire wishlist array for a logged-in user in Firestore.
 */
export async function saveUserWishlist(userId: string, wishlist: string[]): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userDocRef,
      {
        wishlist,
        wishlistUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}/wishlist`);
    throw err;
  }
}

/**
 * Merge local anonymous wishlist items with cloud Firestore wishlist upon login.
 */
export async function syncWishlistOnLogin(
  userId: string,
  localWishlist: string[]
): Promise<string[]> {
  try {
    const remoteWishlist = await getUserWishlist(userId);
    // Combine unique items from both remote and local
    const merged = Array.from(new Set([...remoteWishlist, ...localWishlist]));

    // If new items were merged in from local session, persist the combined list to Firestore
    if (merged.length !== remoteWishlist.length) {
      await saveUserWishlist(userId, merged);
    }

    return merged;
  } catch (err) {
    console.warn('Wishlist synchronization warning:', err);
    return localWishlist;
  }
}
