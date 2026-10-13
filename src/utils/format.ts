export const DEFAULT_CURRENCY = 'BDT';
export const CURRENCY_SYMBOL = '৳';

export function formatPrice(amount: number): string {
  if (isNaN(amount)) return `${CURRENCY_SYMBOL} 0`;
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString('en-US')}`;
}

export function generateOrderNumber(): string {
  const prefix = 'AL';
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}${random}`;
}

export function calculateDiscountPercentage(price: number, comparePrice?: number): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
