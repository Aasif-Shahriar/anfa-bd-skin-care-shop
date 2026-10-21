export const DEFAULT_CURRENCY = 'BDT';
export const CURRENCY_SYMBOL = '৳';

export function formatPrice(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${CURRENCY_SYMBOL} 0`;
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString('en-US')}`;
}

export function generateOrderNumber(): string {
  const prefix = 'ANFA';
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}${random}`;
}

export function calculateDiscountPercentage(price: number, comparePrice?: number): number {
  if (!comparePrice || comparePrice <= price || comparePrice <= 0) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function computeStockStatus(
  stock: number,
  lowStockThreshold: number = 5,
  allowBackorders: boolean = false
): 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Backorder Allowed' {
  if (stock <= 0) {
    return allowBackorders ? 'Backorder Allowed' : 'Out of Stock';
  }
  if (stock <= lowStockThreshold) {
    return 'Low Stock';
  }
  return 'In Stock';
}

export function generateSku(name: string, category: string, variantName?: string): string {
  const brandCode = 'ANFA';
  const catCode = category
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();
  const nameCode = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();
  const variantCode = variantName
    ? '-' + variantName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()
    : '';
  const rand = Math.floor(100 + Math.random() * 900);
  return `${brandCode}-${catCode}-${nameCode}${variantCode}-${rand}`;
}

/**
 * Normalizes categories so both Title Case and lowercase/legacy variants
 * (e.g., 'Sheet Mask' vs 'Sheet mask', 'Sunscreen' vs 'Sunscream', 'Body Wash' vs 'Bodywash') match accurately.
 */
export function normalizeCategory(cat: string): string {
  if (!cat) return '';
  const clean = cat.toLowerCase().replace(/[\s-_]/g, '');
  if (clean === 'sunscream' || clean === 'sunscreen') return 'sunscreen';
  if (clean === 'bodywash') return 'bodywash';
  if (clean === 'sheetmask') return 'sheetmask';
  if (clean === 'mudmask') return 'mudmask';
  if (clean === 'sleepingmask') return 'sleepingmask';
  if (clean === 'bubblemask') return 'bubblemask';
  if (clean === 'eyemask') return 'eyemask';
  if (clean === 'lipmask') return 'lipmask';
  if (clean === 'nosestrip') return 'nosestrip';
  if (clean === 'blackheadremover') return 'blackheadremover';
  if (clean === 'makeupremover') return 'makeupremover';
  if (clean === 'applicator') return 'applicator';
  if (clean === 'footmask') return 'footmask';
  if (clean === 'combooffer') return 'combooffer';
  return clean;
}
