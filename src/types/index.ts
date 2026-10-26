export type Category =
  | 'Sheet Mask'
  | 'Mud Mask'
  | 'Sleeping Mask'
  | 'Bubble Mask'
  | 'Eye Mask'
  | 'Lip Mask'
  | 'Sunscreen'
  | 'Body Wash'
  | 'Nose Strip'
  | 'Blackhead Remover'
  | 'Makeup Remover'
  | 'Applicator'
  | 'Foot Mask'
  | 'Combo Offer'
  // Legacy aliases for backward compatibility with initial sample data
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
  | 'Foot mask'
  | 'Combo offer';

export const EXACT_14_CATEGORIES = [
  'Sheet Mask',
  'Mud Mask',
  'Sleeping Mask',
  'Bubble Mask',
  'Eye Mask',
  'Lip Mask',
  'Sunscreen',
  'Body Wash',
  'Nose Strip',
  'Blackhead Remover',
  'Makeup Remover',
  'Applicator',
  'Foot Mask',
  'Combo Offer',
] as const;

export const ALL_CATEGORIES: Category[] = [
  'Sheet Mask',
  'Mud Mask',
  'Sleeping Mask',
  'Bubble Mask',
  'Eye Mask',
  'Lip Mask',
  'Sunscreen',
  'Body Wash',
  'Nose Strip',
  'Blackhead Remover',
  'Makeup Remover',
  'Applicator',
  'Foot Mask',
  'Combo Offer',
];

export interface ProductVariation {
  id: string;
  name: string; // e.g. "50ml Dropper", "Shade 21 Ivory", "Single Pack", "3-Pack Value"
  color?: string; // color or shade label, e.g. "Dewy Glow", "Clear", "Fair"
  colorCode?: string; // hex swatch code, e.g. "#A7F3D0"
  images: string[]; // images specific to this variation
  sku?: string;
  stock: number;
  priceOverride?: number; // optional price override for this variation
  active: boolean;
}

export type ProductStatus = 'draft' | 'published' | 'archived';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Backorder Allowed';

export interface SkincareSpecifications {
  skinType?: string; // legacy string representation
  skinTypes?: string[]; // e.g. ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive', 'All Skin Types']
  concerns?: string[] | string; // e.g. ['Acne', 'Dryness', 'Dullness', 'Uneven Tone', 'Excess Oil', 'Dehydration', 'Barrier Repair'] or comma string
  skinConcerns?: string[]; // alias for multi-select concerns
  keyIngredients?: string; // e.g. "Centella Asiatica 80%, Niacinamide 5%, Ceramide NP"
  fullIngredients?: string; // Full INCI ingredient list
  benefits?: string; // Key clinical & cosmetic benefits
  howToUse?: string; // Step-by-step application instructions
  volume?: string; // Net Weight / Volume, such as "50 g" or "100 ml"
  origin?: string; // e.g. "South Korea", "Japan", "China", "France"
  expiryDate?: string; // Expiry date or shelf life, e.g. "2027-08 / 12M after opening"
  warnings?: string; // Warnings and precautions
  spfRating?: string; // applicable to sunscreen products only (e.g. "SPF 50+")
  paRating?: string; // applicable to sunscreen products only (e.g. "PA++++")
  attributes?: string[]; // ['Fragrance-Free', 'Alcohol-Free', 'Vegan', 'Cruelty-Free', 'Dermatologist-Tested']
  routineStep?: string; // e.g. "Step 3: Treatment & Serum (AM & PM)"
  dermatologistTested?: boolean;
}

// Backward compatibility alias
export type JewellerySpecifications = SkincareSpecifications;

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Category;
  brand?: string;
  sku?: string;
  shortDescription?: string;
  description: string;
  tags?: string[];

  // Pricing & Currency (BDT / ৳)
  basePrice: number; // Regular Price (৳) *
  salePrice?: number; // Sale Price (৳), optional
  compareAtPrice?: number; // Optional compare-at price
  costPrice?: number; // Cost Price (৳), visible ONLY to authorized administrators

  // Media
  mainImage: string;
  images: string[];
  mainImagePublicId?: string;
  imagePublicIds?: string[];

  // Inventory & Stock
  trackInventory?: boolean;
  totalStock: number;
  lowStockThreshold?: number;
  allowBackorders?: boolean;
  hasVariants?: boolean;
  stockStatus?: StockStatus;

  // Variations
  variations: ProductVariation[];

  // Skincare Specifics
  specifications?: SkincareSpecifications;

  // Storefront & Marketing
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  comboOffer?: boolean;
  active: boolean; // Published / Visible in Shop
  status?: ProductStatus; // 'draft' | 'published' | 'archived'
  displayPriority?: number;
  sortOrder?: number;
  relatedProductIds?: string[];
  seoTitle?: string;
  seoDescription?: string;

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
