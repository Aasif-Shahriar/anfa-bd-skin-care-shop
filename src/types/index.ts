export type Category =
  | 'Sheet mask'
  | 'Mud mask'
  | 'Sleeping mask'
  | 'Bubble mask'
  | 'Eye mask'
  | 'Lip mask'
  | 'Sunscream'
  | 'Bodywash'
  | 'Nose strip'
  | 'Blackhead remover'
  | 'Makeup remover'
  | 'Applicator'
  | 'Foot mask'
  | 'Combo offer';

export const ALL_CATEGORIES: Category[] = [
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

export interface ProductVariation {
  id: string;
  name: string; // e.g. "50ml Standard", "100ml Jumbo Size", "Calming Centella", "Hydrating Glow"
  color: string; // e.g. "Dewy Glow", "Calming Herbal", "Hydra Blue", "Rose Velvet"
  colorCode: string; // hex swatch for formula/shade/type
  images: string[]; // images specific to this variation
  sku?: string;
  stock: number;
  priceOverride?: number; // optional price override for this variation
  active: boolean;
}

export interface SkincareSpecifications {
  skinType?: string; // e.g. "All Skin Types, Sensitive, Acne-Prone"
  keyIngredients?: string; // e.g. "Centella Asiatica, Niacinamide 5%, Ceramide NP"
  volume?: string; // e.g. "50ml / 1.69 fl. oz"
  routineStep?: string; // e.g. "Step 3: Treatment & Serum (AM & PM)"
  origin?: string; // e.g. "Made in South Korea"
  concerns?: string; // e.g. "Acne, Barrier Repair, Glass Skin Glow"
  dermatologistTested?: boolean;
}

// Backward compatibility alias
export type JewellerySpecifications = SkincareSpecifications;

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: Category;
  basePrice: number;
  compareAtPrice?: number;
  mainImage: string;
  images: string[];
  variations: ProductVariation[];
  specifications?: SkincareSpecifications;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  active: boolean;
  totalStock: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string; // combination of productId_variationId
  productId: string;
  productName: string;
  productSlug: string;
  mainImage: string;
  variation: ProductVariation;
  price: number;
  quantity: number;
  maxStock: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type DeliveryZone = 'inside_dhaka' | 'dhaka_sub_area' | 'outside_dhaka';

export interface DeliveryZoneOption {
  id: DeliveryZone;
  name: string;
  fee: number;
  description: string;
}

export const DELIVERY_ZONES: Record<DeliveryZone, DeliveryZoneOption> = {
  inside_dhaka: {
    id: 'inside_dhaka',
    name: 'Inside Dhaka',
    fee: 80,
    description: 'Dhaka Metropolitan Area (24–48 hours express delivery)',
  },
  dhaka_sub_area: {
    id: 'dhaka_sub_area',
    name: 'Dhaka sub-area',
    fee: 120,
    description: 'Gazipur, Savar, Keraniganj, Narayanganj, Tongi, Dhamrai (2–3 days)',
  },
  outside_dhaka: {
    id: 'outside_dhaka',
    name: 'Outside Dhaka',
    fee: 150,
    description: 'All other 63 districts nationwide via courier service (2–4 days)',
  },
};

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
  deliveryZone?: DeliveryZone | string;
  deliveryNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  deliveryZone?: string;
  total: number;
  currency: string;
  paymentMethod: string;
  status: OrderStatus;
  userId?: string | null;
  invoiceEmailSent?: boolean;
  invoiceEmailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;
  city?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  variationName?: string;
  variationChosen?: string;
  metalVariationChosen?: string;
  isPurchased?: boolean;
  verifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: string;
  updatedAt?: string;
}

