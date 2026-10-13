import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CartItem,
  Product,
  ProductVariation,
  DeliveryZone,
  DeliveryZoneOption,
  DELIVERY_ZONES,
} from '../types';
import { useAuth } from './AuthContext';
import { saveUserWishlist, syncWishlistOnLogin } from '../services/wishlistService';

interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variation: ProductVariation, quantity?: number) => { success: boolean; message: string };
  removeItem: (productId: string, variationId: string) => void;
  updateQuantity: (productId: string, variationId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryZone: DeliveryZone;
  setDeliveryZone: (zone: DeliveryZone) => void;
  deliveryZoneOption: DeliveryZoneOption;
  shippingFee: number;
  total: number;
  totalItems: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toasts: ToastMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'anfa_cart_items_v1';
const WISHLIST_STORAGE_KEY = 'anfa_wishlist_items_v1';
const FREE_SHIPPING_THRESHOLD = 5000;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem('aurelia_cart_items_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY) || localStorage.getItem('aurelia_wishlist_items_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Synchronize wishlist with Firestore when authenticated user logs in
  useEffect(() => {
    if (user?.uid) {
      syncWishlistOnLogin(user.uid, wishlist)
        .then((merged) => {
          setWishlist(merged);
        })
        .catch((err) => {
          console.warn('Failed syncing wishlist from Firestore:', err);
        });
    }
  }, [user?.uid]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed saving cart to localStorage:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed saving wishlist to localStorage:', e);
    }
  }, [wishlist]);

  const addToast = (title: string, message?: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addItem = (
    product: Product,
    variation: ProductVariation,
    quantity = 1
  ): { success: boolean; message: string } => {
    const itemId = `${product.id}_${variation.id}`;
    const effectivePrice = variation.priceOverride ?? product.basePrice;
    const availableStock = variation.stock ?? product.totalStock ?? 0;

    if (availableStock <= 0) {
      addToast('Out of Stock', `${product.name} in ${variation.name} is currently sold out.`, 'warning');
      return { success: false, message: 'Item is out of stock' };
    }

    const existingIndex = items.findIndex((i) => i.id === itemId);
    const primaryImage =
      variation.images && variation.images.length > 0
        ? variation.images[0]
        : product.mainImage;

    if (existingIndex > -1) {
      const currentQty = items[existingIndex].quantity;
      const desiredQty = currentQty + quantity;

      if (desiredQty > availableStock) {
        addToast(
          'Maximum Stock Reached',
          `Only ${availableStock} units of ${variation.name} are available.`,
          'warning'
        );
        return { success: false, message: 'Exceeds available stock' };
      }

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: desiredQty } : item
        )
      );
    } else {
      if (quantity > availableStock) {
        addToast(
          'Maximum Stock Reached',
          `Only ${availableStock} units of ${variation.name} are available.`,
          'warning'
        );
        return { success: false, message: 'Exceeds available stock' };
      }

      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        mainImage: primaryImage,
        variation,
        price: effectivePrice,
        quantity,
        maxStock: availableStock,
      };

      setItems((prev) => [...prev, newItem]);
    }

    addToast('Added to Skincare Bag', `${product.name} (${variation.name}) has been added.`, 'success');
    setIsCartDrawerOpen(true);
    return { success: true, message: 'Added to cart' };
  };

  const removeItem = (productId: string, variationId: string) => {
    const itemId = `${productId}_${variationId}`;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    addToast('Item Removed', 'The item was removed from your bag.', 'info');
  };

  const updateQuantity = (productId: string, variationId: string, newQty: number) => {
    const itemId = `${productId}_${variationId}`;
    if (newQty <= 0) {
      removeItem(productId, variationId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const clamped = Math.min(newQty, item.maxStock);
          if (newQty > item.maxStock) {
            addToast('Stock Limit', `Maximum available stock is ${item.maxStock}`, 'warning');
          }
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const nextList = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      if (exists) {
        addToast('Removed from Wishlist', 'Item removed from your saved pieces.', 'info');
      } else {
        addToast(
          'Saved to Wishlist',
          user ? 'Piece saved to your Maison account & synced across devices.' : 'Piece added to your private wishlist.',
          'success'
        );
      }

      // Persist to Firestore if user is authenticated
      if (user?.uid) {
        saveUserWishlist(user.uid, nextList).catch((err) => {
          console.warn('Failed to sync wishlist change to Firestore:', err);
        });
      }

      return nextList;
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('inside_dhaka');
  const deliveryZoneOption = DELIVERY_ZONES[deliveryZone] || DELIVERY_ZONES.inside_dhaka;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = items.length === 0 ? 0 : deliveryZoneOption.fee;
  const total = subtotal + shippingFee;
  const totalItems = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryZone,
        setDeliveryZone,
        deliveryZoneOption,
        shippingFee,
        total,
        totalItems,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
