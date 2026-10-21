import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Package,
  Layers,
  Tag,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils/format';

interface DeleteProductWarningModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirmDelete: (product: Product) => Promise<void> | void;
  isDeleting?: boolean;
}

export const DeleteProductWarningModal: React.FC<DeleteProductWarningModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  // Reset acknowledgment when a new product is selected
  useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
    }
  }, [isOpen, product?.id]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !product) return null;

  const variantCount = product.variations?.length || 0;
  const effectivePrice =
    product.salePrice !== undefined && product.salePrice < product.basePrice
      ? product.salePrice
      : product.basePrice;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-red-200 overflow-hidden my-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 p-6 border-b border-rose-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100/90 text-red-600 flex items-center justify-center shrink-0 border border-red-200 shadow-sm animate-pulse-soft">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider mb-1.5 shadow-2xs">
              <ShieldAlert className="w-3 h-3" />
              <span>Permanent Deletion Warning</span>
            </div>
            <h3
              id="delete-product-title"
              className="font-serif text-xl sm:text-2xl font-bold text-slate-900 leading-tight"
            >
              Delete Skincare Product?
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              You are about to permanently remove this product and all its variations from the
              ANFA BD boutique catalogue.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Target Product Dossier Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 items-center">
            {product.mainImage ? (
              <img
                src={product.mainImage}
                alt={product.name}
                className="w-16 h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-2xs bg-white"
              />
            ) : (
              <div className="w-16 h-20 rounded-xl border border-slate-200 bg-pink-50 flex items-center justify-center text-[10px] text-[#FF1493] font-bold shrink-0">
                ANFA
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF1493] block">
                {product.category || 'Skincare'}
              </span>
              <h4 className="font-serif text-sm sm:text-base font-bold text-slate-900 truncate">
                {product.name}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span>SKU: <strong className="font-mono text-slate-800">{product.sku || 'N/A'}</strong></span>
                <span>•</span>
                <span>Price: <strong className="text-slate-900">{formatPrice(effectivePrice)}</strong></span>
                <span>•</span>
                <span>Stock: <strong className="text-slate-900">{product.totalStock ?? 0} units</strong></span>
              </div>
              {variantCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 w-fit">
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  <span>{variantCount} variant {variantCount === 1 ? 'option' : 'options'} will also be removed</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning Impact Checklist */}
          <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-4 space-y-2.5">
            <h5 className="font-bold text-red-950 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Consequences of this action:</span>
            </h5>
            <ul className="space-y-1.5 text-slate-700 pl-6 list-disc text-[11.5px] leading-relaxed">
              <li>
                This product will be <strong className="text-red-900 font-semibold">permanently erased</strong> from the Firestore database.
              </li>
              <li>
                It will be <strong className="text-red-900 font-semibold">immediately delisted</strong> from public storefront carousels, category pages, and search.
              </li>
              <li>
                Customers with direct URLs (<code className="font-mono text-[10px] bg-red-100 px-1 py-0.2 rounded">/product/{product.slug}</code>) will see a Product Not Found notice.
              </li>
              <li>
                Active client shopping bags containing this product will be invalidated upon checkout.
              </li>
              <li>
                <strong className="text-red-900 font-bold">This operation cannot be undone or recovered.</strong>
              </li>
            </ul>
          </div>

          {/* Safety Acknowledgment Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              id="confirm-delete-ack"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              disabled={isDeleting}
              className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
            />
            <span className="text-xs text-slate-800 leading-snug">
              I understand that deleting <strong className="text-slate-900">"{product.name}"</strong> is permanent and will completely remove it from the boutique catalogue.
            </span>
          </label>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer text-center"
          >
            Cancel &amp; Keep Product
          </button>

          <button
            type="button"
            onClick={() => onConfirmDelete(product)}
            disabled={!acknowledged || isDeleting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Deleting Product...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
