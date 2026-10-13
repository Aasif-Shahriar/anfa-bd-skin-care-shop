import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus, Product } from '../types';
import { sendOrderInvoiceEmail } from './emailService';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';

// Helper to recursively strip undefined fields which Firestore rejects
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        res[key] = cleanForFirestore(value);
      }
    }
    return res as T;
  }
  return obj;
}

export async function createOrder(
  orderInput: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    ...orderInput,
    id: orderId,
    invoiceEmailSent: true,
    invoiceEmailSentAt: now,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Write cleaned order document to Firestore
    const cleanedOrder = cleanForFirestore(newOrder);
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(orderDocRef, cleanedOrder);

    // Automatically trigger email invoice transmission
    sendOrderInvoiceEmail(newOrder).catch((err) => {
      console.warn('[ORDER INVOICE] Background email dispatch caught:', err);
    });

    // Safely decrement variation stock and overall product stock for each ordered item
    for (const item of orderInput.items) {
      try {
        const prodDocRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const prodSnap = await getDoc(prodDocRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as Product;
          if (prodData.variations && prodData.variations.length > 0) {
            const updatedVariations = prodData.variations.map((v) => {
              if (v.id === item.variation.id) {
                const newStock = Math.max(0, (v.stock || 0) - item.quantity);
                return { ...v, stock: newStock };
              }
              return v;
            });
            const newTotalStock = updatedVariations.reduce(
              (sum, v) => sum + (Number(v.stock) || 0),
              0
            );
            await updateDoc(prodDocRef, {
              variations: updatedVariations,
              totalStock: newTotalStock,
              updatedAt: now,
            });
          } else {
            const newTotalStock = Math.max(0, (prodData.totalStock || 0) - item.quantity);
            await updateDoc(prodDocRef, {
              totalStock: newTotalStock,
              updatedAt: now,
            });
          }
        }
      } catch (stockErr) {
        console.warn(`Could not decrement stock for product ${item.productId}:`, stockErr);
      }
    }

    return newOrder;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, ORDERS_COLLECTION);
    throw err;
  }
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const snap = await getDocs(colRef);
    const orders: Order[] = [];
    snap.forEach((d) => {
      orders.push({ id: d.id, ...d.data() } as Order);
    });

    // Sort descending by creation date
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ORDERS_COLLECTION);
    return [];
  }
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    const colRef = collection(db, ORDERS_COLLECTION);
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const orders: Order[] = [];
    snap.forEach((d) => {
      orders.push({ id: d.id, ...d.data() } as Order);
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ORDERS_COLLECTION);
    return [];
  }
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // Also try searching by orderNumber
      const colRef = collection(db, ORDERS_COLLECTION);
      const q = query(colRef, where('orderNumber', '==', id));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const d = querySnap.docs[0];
        return { id: d.id, ...d.data() } as Order;
      }
      return null;
    }
    return { id: snap.id, ...snap.data() } as Order;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${ORDERS_COLLECTION}/${id}`);
    return null;
  }
}

export async function trackOrderByReferenceAndEmail(
  orderIdentifier: string,
  email: string
): Promise<{ order: Order | null; error?: string }> {
  try {
    const cleanId = orderIdentifier.trim().replace(/^#/, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanId) {
      return { order: null, error: 'Please enter a valid Order ID or Reference number.' };
    }
    if (!cleanEmail) {
      return { order: null, error: 'Please enter the email address used when placing the order.' };
    }

    const colRef = collection(db, ORDERS_COLLECTION);

    // 1. First attempt: query by orderNumber
    const q1 = query(colRef, where('orderNumber', '==', cleanId));
    const snap1 = await getDocs(q1);

    let foundDoc: Order | null = null;

    if (!snap1.empty) {
      const d = snap1.docs[0];
      foundDoc = { id: d.id, ...d.data() } as Order;
    } else {
      // 2. Second attempt: query by uppercase orderNumber
      const q2 = query(colRef, where('orderNumber', '==', cleanId.toUpperCase()));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const d = snap2.docs[0];
        foundDoc = { id: d.id, ...d.data() } as Order;
      } else {
        // 3. Third attempt: try directly by document ID
        const docRef = doc(db, ORDERS_COLLECTION, cleanId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          foundDoc = { id: docSnap.id, ...docSnap.data() } as Order;
        }
      }
    }

    if (!foundDoc) {
      return {
        order: null,
        error: `No order found with Reference "${orderIdentifier}". Please double check your order confirmation details.`,
      };
    }

    // Verify email address match
    const orderCustomerEmail = foundDoc.customer?.email?.trim().toLowerCase();
    if (orderCustomerEmail !== cleanEmail) {
      return {
        order: null,
        error: 'The email address provided does not match the records for this order reference.',
      };
    }

    return { order: foundDoc };
  } catch (err) {
    console.error('Error in trackOrderByReferenceAndEmail:', err);
    return {
      order: null,
      error: 'Unable to connect to order tracking service. Please try again in a few moments.',
    };
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${ORDERS_COLLECTION}/${id}`);
    throw err;
  }
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

export function computeOrderMetrics(orders: Order[]): DashboardMetrics {
  let totalRevenue = 0;
  let pendingOrders = 0;
  let confirmedOrders = 0;
  let processingOrders = 0;
  let shippedOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;

  for (const o of orders) {
    if (o.status !== 'Cancelled') {
      totalRevenue += o.total || 0;
    }
    if (o.status === 'Pending') pendingOrders++;
    else if (o.status === 'Confirmed') confirmedOrders++;
    else if (o.status === 'Processing') processingOrders++;
    else if (o.status === 'Shipped') shippedOrders++;
    else if (o.status === 'Delivered') deliveredOrders++;
    else if (o.status === 'Cancelled') cancelledOrders++;
  }

  return {
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
  };
}
