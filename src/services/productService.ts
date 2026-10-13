import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { INITIAL_SKINCARE_PRODUCTS } from '../data/sampleProducts';
import { cleanForFirestore } from './orderService';

const PRODUCTS_COLLECTION = 'products';
const VALID_SKINCARE_CATEGORIES = [
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
];

// Helper to format in-memory sample skincare items
function getFallbackSampleProducts(): Product[] {
  return INITIAL_SKINCARE_PRODUCTS.map((item) => ({
    ...item,
    id: `prod_${item.slug}`,
  }));
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      console.log('Firestore products collection is empty. Returning initial ANFA BD skincare catalogue.');
      return getFallbackSampleProducts();
    }

    const products: Product[] = [];
    snap.forEach((d) => {
      products.push({ id: d.id, ...d.data() } as Product);
    });

    // Check if the documents contain skincare items
    const skincareProducts = products.filter((p) =>
      VALID_SKINCARE_CATEGORIES.includes(p.category)
    );

    if (skincareProducts.length > 0) {
      return skincareProducts;
    }

    console.log('Serving fresh ANFA BD skincare catalogue.');
    return getFallbackSampleProducts();
  } catch (err) {
    console.warn('Could not retrieve products from Firestore, using initial skincare collection:', err);
    return getFallbackSampleProducts();
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Product;
      if (VALID_SKINCARE_CATEGORIES.includes(data.category)) {
        return { ...data, id: snap.id };
      }
    }
  } catch (err) {
    console.warn(`Could not fetch product ${id} from Firestore:`, err);
  }

  // Fallback to sample catalogue
  const fallback = INITIAL_SKINCARE_PRODUCTS.find(
    (p) => `prod_${p.slug}` === id || p.slug === id
  );
  if (fallback) {
    return { ...fallback, id: `prod_${fallback.slug}` };
  }
  return null;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(colRef, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0];
      const data = docData.data() as Product;
      if (VALID_SKINCARE_CATEGORIES.includes(data.category)) {
        return { ...data, id: docData.id };
      }
    }
  } catch (err) {
    console.warn(`Could not query product ${slug} from Firestore:`, err);
  }

  // Fallback to sample catalogue
  const fallback = INITIAL_SKINCARE_PRODUCTS.find((p) => p.slug === slug);
  if (fallback) {
    return { ...fallback, id: `prod_${fallback.slug}` };
  }
  return null;
}

export async function saveProduct(productData: Omit<Product, 'id'>, id?: string): Promise<Product> {
  const targetId = id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, PRODUCTS_COLLECTION, targetId);
  const now = new Date().toISOString();

  // Recalculate totalStock from variations if available
  const totalStock = productData.variations && productData.variations.length > 0
    ? productData.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : (productData.totalStock || 0);

  const finalPayload: Product = {
    ...productData,
    id: targetId,
    totalStock,
    createdAt: productData.createdAt || now,
    updatedAt: now,
  };

  try {
    const cleanedPayload = cleanForFirestore(finalPayload);
    await setDoc(docRef, cleanedPayload, { merge: true });
    return finalPayload;
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, `${PRODUCTS_COLLECTION}/${targetId}`);
    throw err;
  }
}

export async function removeProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
    throw err;
  }
}

export async function seedSampleProducts(): Promise<Product[]> {
  const seededProducts: Product[] = [];
  try {
    for (const item of INITIAL_SKINCARE_PRODUCTS) {
      const docId = `prod_${item.slug}`;
      const docRef = doc(db, PRODUCTS_COLLECTION, docId);
      const payload: Product = {
        ...item,
        id: docId,
      };
      await setDoc(docRef, payload);
      seededProducts.push(payload);
    }
    return seededProducts;
  } catch (err) {
    console.warn('Could not seed products to Firestore (requires admin permission):', err);
    return getFallbackSampleProducts();
  }
}
