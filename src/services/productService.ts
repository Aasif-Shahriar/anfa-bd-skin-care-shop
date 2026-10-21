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
import { Product, ProductStatus } from '../types';
import { INITIAL_SKINCARE_PRODUCTS } from '../data/sampleProducts';
import { cleanForFirestore } from './orderService';
import { computeStockStatus, normalizeCategory, slugify } from '../utils/format';

const PRODUCTS_COLLECTION = 'products';

// Helper to format in-memory sample skincare items
function getFallbackSampleProducts(): Product[] {
  return INITIAL_SKINCARE_PRODUCTS.map((item) => ({
    ...item,
    id: `prod_${item.slug}`,
    status: (item.active ? 'published' : 'draft') as ProductStatus,
    stockStatus: computeStockStatus(item.totalStock ?? 10),
  }));
}

/**
 * Fetches products.
 * @param includeDrafts If false (default for storefront), filters out draft, archived, or inactive products.
 *                      If true (admin mode), returns all products.
 */
export async function fetchProducts(includeDrafts: boolean = false): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);

    let list: Product[] = [];

    if (!snap.empty) {
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Product);
      });
    }

    if (list.length === 0) {
      list = getFallbackSampleProducts();
    }

    // Filter for public storefront if includeDrafts is false
    if (!includeDrafts) {
      list = list.filter((p) => {
        const isDraft = p.status === 'draft';
        const isArchived = p.status === 'archived';
        const isInactive = p.active === false;
        return !isDraft && !isArchived && !isInactive;
      });
    }

    // Sort by sortOrder if available, then by createdAt desc
    list.sort((a, b) => {
      if (typeof a.sortOrder === 'number' && typeof b.sortOrder === 'number') {
        return a.sortOrder - b.sortOrder;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return list;
  } catch (err) {
    console.warn('Could not retrieve products from Firestore, using initial skincare collection:', err);
    let fallback = getFallbackSampleProducts();
    if (!includeDrafts) {
      fallback = fallback.filter((p) => p.active !== false && p.status !== 'draft');
    }
    return fallback;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...snap.data(), id: snap.id } as Product;
    }
  } catch (err) {
    console.warn(`Could not fetch product ${id} from Firestore:`, err);
  }

  // Fallback to sample catalogue
  const fallback = INITIAL_SKINCARE_PRODUCTS.find(
    (p) => `prod_${p.slug}` === id || p.slug === id
  );
  if (fallback) {
    return {
      ...fallback,
      id: `prod_${fallback.slug}`,
      status: 'published',
      stockStatus: computeStockStatus(fallback.totalStock ?? 10),
    };
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
      return { ...docData.data(), id: docData.id } as Product;
    }
  } catch (err) {
    console.warn(`Could not query product ${slug} from Firestore:`, err);
  }

  // Fallback to sample catalogue
  const fallback = INITIAL_SKINCARE_PRODUCTS.find((p) => p.slug === slug);
  if (fallback) {
    return {
      ...fallback,
      id: `prod_${fallback.slug}`,
      status: 'published',
      stockStatus: computeStockStatus(fallback.totalStock ?? 10),
    };
  }
  return null;
}

/**
 * Checks if a slug is already used by a DIFFERENT product.
 */
export async function isSlugTaken(slug: string, excludeProductId?: string): Promise<boolean> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(colRef, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return false;
    if (!excludeProductId) return true;
    return snap.docs.some((doc) => doc.id !== excludeProductId);
  } catch {
    return false;
  }
}

/**
 * Save product with full validation, unique slug enforcement, stock recalculation, and discount validation.
 */
export async function saveProduct(productData: Omit<Product, 'id'>, id?: string): Promise<Product> {
  const targetId = id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, PRODUCTS_COLLECTION, targetId);
  const now = new Date().toISOString();

  // Validate and sanitize prices
  const basePrice = Math.max(0, Number(productData.basePrice) || 0);
  let salePrice = productData.salePrice !== undefined && productData.salePrice !== null && productData.salePrice !== ('' as any)
    ? Math.max(0, Number(productData.salePrice))
    : undefined;

  // Validate: sale price cannot exceed regular price
  if (salePrice !== undefined && salePrice > basePrice) {
    salePrice = basePrice;
  }

  const costPrice = productData.costPrice !== undefined && productData.costPrice !== null && productData.costPrice !== ('' as any)
    ? Math.max(0, Number(productData.costPrice))
    : undefined;

  const compareAtPrice = productData.compareAtPrice !== undefined && productData.compareAtPrice !== null
    ? Math.max(0, Number(productData.compareAtPrice))
    : (salePrice !== undefined && salePrice < basePrice ? basePrice : undefined);

  // Recalculate totalStock from variations if available
  const hasVariants = Boolean(productData.hasVariants && productData.variations && productData.variations.length > 0);
  const totalStock = hasVariants
    ? productData.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : Math.max(0, Number(productData.totalStock) || 0);

  const lowStockThreshold = Number(productData.lowStockThreshold) || 5;
  const allowBackorders = Boolean(productData.allowBackorders);
  const stockStatus = computeStockStatus(totalStock, lowStockThreshold, allowBackorders);

  // Ensure unique slug
  let slug = slugify(productData.slug || productData.name || `product-${Date.now()}`);
  if (!slug) slug = `prod-${Date.now()}`;
  
  const taken = await isSlugTaken(slug, targetId);
  if (taken) {
    slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  // Determine status and active visibility
  const status: ProductStatus = productData.status || (productData.active ? 'published' : 'draft');
  const active = status === 'published' && productData.active !== false;

  const finalPayload: Product = {
    ...productData,
    id: targetId,
    slug,
    basePrice,
    salePrice,
    compareAtPrice,
    costPrice,
    totalStock,
    lowStockThreshold,
    allowBackorders,
    hasVariants,
    stockStatus,
    active,
    status,
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
        status: 'published',
        stockStatus: computeStockStatus(item.totalStock ?? 10),
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
