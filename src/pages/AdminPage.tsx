import React, { useState, useEffect } from 'react';
import {
  Shield,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Upload,
  RefreshCw,
  Search,
  ChevronDown,
  Layers,
  Sparkles,
  Printer,
  Download,
  Copy,
  ExternalLink,
  Tag,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product, ProductVariation, Order, OrderStatus, Category, ProductStatus } from '../types';
import { formatPrice, slugify, calculateDiscountPercentage } from '../utils/format';
import { OrderReceiptModal } from '../components/OrderReceiptModal';
import { ProductFormModal } from '../components/ProductFormModal';
import { DeleteProductWarningModal } from '../components/DeleteProductWarningModal';
import { downloadReceiptPdf } from '../utils/pdfGenerator';
import {
  fetchProducts,
  saveProduct,
  removeProduct,
  seedSampleProducts,
} from '../services/productService';
import {
  fetchOrders,
  updateOrderStatus,
  computeOrderMetrics,
} from '../services/orderService';

interface AdminPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onRefreshData?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, onRefreshData }) => {
  const { user, isAdmin, claims, isSigningIn, signInWithGoogle, refreshAdminStatus } = useAuth();
  const { addToast } = useCart();
  const [isRefreshingClaims, setIsRefreshingClaims] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter in Admin
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'All' | 'published' | 'draft' | 'archived' | 'low-stock'>('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Product Add / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Product Deletion Warning Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Order Details Modal State
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [downloadingPdfAdminId, setDownloadingPdfAdminId] = useState<string | null>(null);

  // Load Data: fetches ALL products including drafts for store administrators
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.all([fetchProducts(true), fetchOrders()]);
      setProducts(prodRes);
      setOrders(orderRes);
    } catch (e) {
      console.error('Failed to load admin data:', e);
      addToast('Data Sync Issue', 'Could not refresh catalog or orders from Firestore.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const metrics = computeOrderMetrics(orders);
  const lowStockProducts = products.filter((p) => (p.totalStock ?? 0) <= (p.lowStockThreshold ?? 5));

  // Open modal to add a brand new product
  const handleAddNewProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  // Open modal to edit an existing product
  const handleEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  // Duplicate an existing product as a new draft
  const handleDuplicateProduct = (prod: Product) => {
    const clone: Product = {
      ...prod,
      id: '',
      name: `${prod.name} (Copy)`,
      slug: `${prod.slug}-copy`,
      sku: `${prod.sku || 'SKU'}-CPY`,
      status: 'draft',
      active: false,
    };
    setProductToEdit(clone);
    setIsProductModalOpen(true);
  };

  // Unified save handler from ProductFormModal
  const handleSaveProductSubmit = async (productData: Omit<Product, 'id'>, id?: string) => {
    try {
      const saved = await saveProduct(productData, id);
      addToast(
        'Product Persisted',
        `"${saved.name}" has been successfully saved to Firestore catalogue.`,
        'success'
      );
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Error saving product in AdminPage:', err);
      throw err;
    }
  };

  // Prompt delete warning dialog
  const handlePromptDeleteProduct = (prod: Product) => {
    setProductToDelete(prod);
  };

  // Confirmed delete execution after warning
  const handleConfirmDeleteProduct = async (prod: Product) => {
    setIsDeletingProduct(true);
    try {
      await removeProduct(prod.id);
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      addToast(
        'Product Deleted',
        `"${prod.name}" was permanently deleted from the boutique catalogue.`,
        'info'
      );
      setProductToDelete(null);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Failed to remove product:', err);
      addToast('Delete Failed', err?.message || 'Could not delete product.', 'error');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Update order status in Firestore
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      addToast('Status Updated', `Order #${orderId} marked as ${newStatus}.`, 'success');
    } catch (err) {
      console.error('Failed to update order status:', err);
      addToast('Update Failed', 'Could not save order status to Firestore.', 'error');
    }
  };

  // Seed sample products
  const handleSeedProducts = async () => {
    if (window.confirm('Seed the initial ANFA BD girls skincare catalogue into Firestore?')) {
      setLoading(true);
      try {
        await seedSampleProducts();
        addToast('Catalog Seeded', 'Sample skincare products inserted into Firestore.', 'success');
        await loadData();
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.error('Seed error:', err);
        addToast('Seed Error', 'Failed to insert sample collection.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };



  // If user does not possess custom claim { admin: true }
  if (!isAdmin) {
    const handleRefresh = async () => {
      setIsRefreshingClaims(true);
      try {
        const hasClaim = await refreshAdminStatus();
        if (hasClaim) {
          addToast('Authorization Granted', 'Firebase Custom Claim { admin: true } verified.', 'success');
          loadData();
        } else {
          addToast('Claims Refreshed', 'No { admin: true } claim found on this ID token.', 'info');
        }
      } catch (err) {
        addToast('Refresh Failed', 'Could not refresh ID token claims.', 'error');
      } finally {
        setIsRefreshingClaims(false);
      }
    };

    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-sm">
          <Shield className="w-8 h-8 stroke-[1.5]" />
        </div>

        {!user ? (
          <>
            <h1 className="font-serif text-2xl font-medium text-slate-900 mb-2">
              Store Admin Authorization Required
            </h1>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed max-w-sm mx-auto">
              Access to catalogue management, inventory modification, and client orders is strictly
              governed by Firebase Custom Claims. Please sign in with an authorized administrator account.
            </p>
            <div className="space-y-3">
              <button
                disabled={isSigningIn}
                onClick={() => signInWithGoogle()}
                className="w-full py-3.5 px-6 bg-[#FF1493] hover:bg-[#6B0037] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-colors"
              >
                {isSigningIn ? 'Connecting...' : 'Sign In with Google'}
              </button>
              <button
                onClick={() => onNavigate('shop')}
                className="w-full py-2.5 px-4 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl transition-colors"
              >
                Return to Boutique
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold uppercase tracking-wider rounded-full mb-3">
              Customer Account • Missing Admin Claim
            </div>
            <h1 className="font-serif text-2xl font-medium text-slate-900 mb-2">
              Administrative Access Denied
            </h1>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed max-w-md mx-auto">
              Your session is authenticated as <strong className="text-slate-900">{user.email}</strong>, but
              does not have the server-side Firebase custom claim{' '}
              <code className="bg-[#FFF0F6] px-1.5 py-0.5 rounded text-[#B8005A] border border-[#FFC1E3] font-mono font-bold">
                &#123; "admin": true &#125;
              </code>
              .
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs mb-6 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-600 pb-2 border-b border-slate-200">
                <span>Firebase User ID:</span>
                <span className="font-mono text-[10px] text-slate-900 truncate max-w-[200px]">{user.uid}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                <span>Active Token Claims: </span>
                <span className="font-mono text-[10px] text-[#FF1493] font-semibold">
                  {Object.keys(claims).length > 0 ? JSON.stringify(claims) : 'None (Standard Client)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Firestore Security Rules strictly reject all product write, variation edit, and order
                management requests from accounts lacking <code className="font-mono text-[#FF1493]">request.auth.token.admin == true</code>.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshingClaims}
                className="w-full py-3 px-6 bg-[#FF1493] hover:bg-[#6B0037] disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingClaims ? 'animate-spin' : ''}`} />
                <span>{isRefreshingClaims ? 'Refreshing ID Token Claims...' : 'Check / Refresh Admin Custom Claims'}</span>
              </button>

              <button
                onClick={() => onNavigate('shop')}
                className="w-full py-2.5 px-4 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl transition-colors"
              >
                Return to Boutique
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Filtered products with status tabs and multi-field search
  const filteredProducts = products.filter((p) => {
    if (productStatusFilter === 'published') {
      const isPublished = p.status === 'published' || (p.active && p.status !== 'draft' && p.status !== 'archived');
      if (!isPublished) return false;
    } else if (productStatusFilter === 'draft') {
      if (p.status !== 'draft') return false;
    } else if (productStatusFilter === 'archived') {
      if (p.status !== 'archived') return false;
    } else if (productStatusFilter === 'low-stock') {
      const threshold = p.lowStockThreshold ?? 5;
      if ((p.totalStock ?? 0) > threshold) return false;
    }

    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchCat && !matchBrand && !matchSku && !matchTag) return false;
    }
    return true;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.customer.name.toLowerCase().includes(q);
      const matchPhone = o.customer.phone.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Top Header */}
      <div className="bg-[#6B0037] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-pink-500/30">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
            <Shield className="w-4 h-4" />
            <span>ANFA BD Store Console</span>
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-wide mt-1 text-white">
            Girls Skincare Store & Inventory Dashboard
          </h1>
          <p className="text-xs text-pink-100/90 mt-1.5 flex flex-wrap items-center gap-2">
            <span>Logged in: <strong className="text-white">{user?.email || 'Admin'}</strong></span>
            <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-mono font-semibold rounded-md flex items-center gap-1">
              <Shield className="w-3 h-3 text-pink-400" />
              <span>
                {claims.admin === true
                  ? 'Verified Custom Claim: { "admin": true }'
                  : 'Authenticated Administrator • Store Manager'}
              </span>
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Cloud Data</span>
          </button>

          <button
            onClick={handleSeedProducts}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#BFA030] text-[#1F1518] text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-md transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seed Sample Skincare</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8 text-xs uppercase tracking-wider font-semibold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'border-b-2 border-[#FF1493] text-[#6B0037] font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-b-2 border-[#FF1493] text-[#6B0037] font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Catalogue ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-b-2 border-[#FF1493] text-[#6B0037] font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders Management ({orders.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <span className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
                Total Gross Revenue
              </span>
              <h3 className="font-serif text-3xl font-bold text-[#6B0037] mt-2">
                {formatPrice(metrics.totalRevenue)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Across all confirmed customer orders</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <span className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
                Total Orders Placed
              </span>
              <h3 className="font-serif text-3xl font-bold text-slate-900 mt-2">
                {metrics.totalOrders}
              </h3>
              <div className="flex gap-2 text-[11px] mt-1">
                <span className="text-amber-800 font-medium">{metrics.pendingOrders} Pending</span>
                <span>•</span>
                <span className="text-[#FF1493] font-medium">{metrics.deliveredOrders} Delivered</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <span className="text-xs uppercase tracking-wider text-slate-600 font-semibold">
                Catalogue Products
              </span>
              <h3 className="font-serif text-3xl font-bold text-slate-900 mt-2">
                {products.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {products.reduce((sum, p) => sum + (p.variations?.length || 1), 0)} Variation SKUs
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <span className="text-xs uppercase tracking-wider text-slate-600 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock Products
              </span>
              <h3 className="font-serif text-3xl font-bold text-amber-800 mt-2">
                {lowStockProducts.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Fewer than 5 units remaining in inventory</p>
            </div>
          </div>

          {/* Recent Orders & Low Stock Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recent Orders (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-serif text-lg font-medium text-slate-900">
                  Recent Client Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[#FF1493] font-semibold hover:underline"
                >
                  View All Orders
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No orders recorded yet. Make a test order from the shop!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#B8005A]">#{ord.orderNumber}</span>
                        <p className="font-medium text-slate-900 mt-0.5">{ord.customer.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} items
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="font-serif font-bold text-sm text-slate-900 block">
                          {formatPrice(ord.total)}
                        </span>
                        <select
                          value={ord.status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                          className="px-2 py-0.5 text-[10px] rounded border border-slate-200 font-semibold bg-slate-50 cursor-pointer text-slate-800"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alerts (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="font-serif text-lg font-medium text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Vault Low Stock Alerts</span>
              </h3>

              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#FF1493] font-medium">
                  All skincare collections have healthy inventory.
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3"
                    >
                      {prod.mainImage ? (
                        <img
                          src={prod.mainImage}
                          alt={prod.name}
                          className="w-10 h-12 object-cover rounded border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-12 rounded border border-slate-200 bg-pink-50 flex items-center justify-center text-[9px] text-slate-400">
                          Skincare
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-xs font-medium text-slate-900 truncate">
                          {prod.name}
                        </p>
                        <p className="text-[10px] text-amber-800 font-bold mt-0.5">
                          Total Stock: {prod.totalStock} units
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditProduct(prod)}
                        className="p-1.5 text-[#FF1493] hover:bg-white rounded transition-colors"
                        title="Restock"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Header controls: Search, Filter Tabs & Add Product Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {[
                { id: 'All', label: 'All Products', count: products.length },
                {
                  id: 'published',
                  label: 'Published',
                  count: products.filter((p) => p.status === 'published' || (p.active && p.status !== 'draft' && p.status !== 'archived')).length,
                },
                {
                  id: 'draft',
                  label: 'Drafts',
                  count: products.filter((p) => p.status === 'draft').length,
                },
                {
                  id: 'archived',
                  label: 'Archived',
                  count: products.filter((p) => p.status === 'archived').length,
                },
                {
                  id: 'low-stock',
                  label: 'Low Stock',
                  count: products.filter((p) => (p.totalStock ?? 0) <= (p.lowStockThreshold ?? 5)).length,
                },
              ].map((tab) => {
                const isActive = productStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProductStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#FF1493] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Add Product Button */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search name, brand, SKU, tags..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#FF1493] focus:bg-white transition-colors"
                />
                <Search className="w-4 h-4 text-[#FF1493] absolute left-3 top-2.5" />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={handleAddNewProduct}
                className="px-5 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Product &amp; SKU</th>
                    <th className="py-3.5 px-4">Category &amp; Brand</th>
                    <th className="py-3.5 px-4">Pricing (BDT)</th>
                    <th className="py-3.5 px-4">Stock &amp; Variants</th>
                    <th className="py-3.5 px-4">Visibility</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-xs text-slate-700">No products match the filter.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try clearing the search query or status filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const effectiveSalePrice = prod.salePrice !== undefined && prod.salePrice < prod.basePrice ? prod.salePrice : undefined;
                      const discount = calculateDiscountPercentage(effectiveSalePrice ?? prod.basePrice, effectiveSalePrice ? prod.basePrice : undefined);
                      const isLowStock = (prod.totalStock ?? 0) <= (prod.lowStockThreshold ?? 5);
                      const isOutOfStock = (prod.totalStock ?? 0) <= 0;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Product & SKU */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {prod.mainImage ? (
                                <img
                                  src={prod.mainImage}
                                  alt={prod.name}
                                  className="w-12 h-14 object-cover rounded-xl border border-slate-200 shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-14 rounded-xl border border-slate-200 bg-pink-50 flex items-center justify-center text-[9px] text-[#FF1493] font-bold shrink-0">
                                  ANFA
                                </div>
                              )}
                              <div className="min-w-0 max-w-xs">
                                <span className="font-serif text-sm font-semibold block text-slate-900 truncate">
                                  {prod.name}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 block">
                                  SKU: {prod.sku || 'N/A'}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {prod.bestseller && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                      Bestseller
                                    </span>
                                  )}
                                  {prod.newArrival && (
                                    <span className="text-[9px] bg-[#FFF0F6] text-[#FF1493] font-bold px-1.5 py-0.2 rounded border border-[#FFC1E3]">
                                      New
                                    </span>
                                  )}
                                  {prod.featured && (
                                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                                      Featured
                                    </span>
                                  )}
                                  {prod.comboOffer && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                      Combo
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Brand */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">
                              {prod.category}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {prod.brand || 'ANFA Skincare'}
                            </span>
                            {prod.specifications?.volume && (
                              <span className="text-[10px] text-pink-600 block mt-0.5 font-medium">
                                {prod.specifications.volume}
                              </span>
                            )}
                          </td>

                          {/* Pricing (Regular, Sale, Cost) */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm">
                                  {formatPrice(effectiveSalePrice ?? prod.basePrice)}
                                </span>
                                {effectiveSalePrice && (
                                  <span className="text-[11px] text-slate-400 line-through">
                                    {formatPrice(prod.basePrice)}
                                  </span>
                                )}
                              </div>
                              {discount > 0 && (
                                <span className="text-[10px] font-bold text-[#FF1493] bg-pink-50 px-1.5 py-0.2 rounded border border-pink-200 inline-block">
                                  {discount}% OFF
                                </span>
                              )}
                              {prod.costPrice !== undefined && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono pt-0.5" title="Cost Price (Admin only)">
                                  <Lock className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Cost: {formatPrice(prod.costPrice)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Stock & Variants */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isOutOfStock
                                    ? 'bg-red-100 text-red-800'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                <span>({prod.totalStock ?? 0} pcs)</span>
                              </span>

                              {prod.variations && prod.variations.length > 0 && (
                                <div className="flex items-center gap-1 pt-1">
                                  {prod.variations.slice(0, 4).map((v) => (
                                    <span
                                      key={v.id}
                                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                                      style={{ backgroundColor: v.colorCode || '#FF1493' }}
                                      title={`${v.name}: ${v.stock} pcs`}
                                    />
                                  ))}
                                  {prod.variations.length > 4 && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      +{prod.variations.length - 4}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-500 ml-1">
                                    ({prod.variations.length} vars)
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Visibility Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                                prod.status === 'published' || (prod.active && prod.status !== 'draft' && prod.status !== 'archived')
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : prod.status === 'draft'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {prod.status === 'draft' ? 'Draft' : prod.status === 'archived' ? 'Archived' : 'Published'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View on storefront */}
                              <button
                                onClick={() => onNavigate('product-detail', prod.slug)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="View on Storefront"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit product */}
                              <button
                                onClick={() => handleEditProduct(prod)}
                                className="p-1.5 text-[#FF1493] hover:bg-[#FFF0F6] rounded-lg transition-colors cursor-pointer"
                                title="Edit Product Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Duplicate product */}
                              <button
                                onClick={() => handleDuplicateProduct(prod)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Duplicate as Draft"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Delete product */}
                              <button
                                onClick={() => handlePromptDeleteProduct(prod)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete from Catalogue"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search by order #, client, phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#FF1493]"
                />
                <Search className="w-4 h-4 text-[#FF1493] absolute left-3 top-2.5" />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs py-2 px-3 rounded-lg focus:outline-none focus:border-[#FF1493] text-slate-800"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <span className="text-xs text-slate-600 font-medium">
              Showing {filteredOrders.length} orders
            </span>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Order Ref</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Items &amp; Variations</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#6B0037]">
                        #{ord.orderNumber}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        {ord.customer.name}
                        <span className="block text-[10px] text-slate-500 truncate max-w-[140px]">
                          {ord.customer.email}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {ord.customer.phone}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.variation.colorCode }}
                              />
                              <span className="truncate max-w-[150px] font-medium text-slate-800">
                                {item.productName} ({item.variation.color}) × {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-serif font-bold text-[#6B0037]">
                        {formatPrice(ord.total)}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        {ord.paymentMethod}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-semibold border cursor-pointer ${
                            ord.status === 'Delivered'
                              ? 'bg-[#FFF0F6] text-[#FF1493] border-[#FFB0DA]'
                              : ord.status === 'Shipped'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : ord.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={async () => {
                              setDownloadingPdfAdminId(ord.id);
                              try {
                                await downloadReceiptPdf(ord);
                              } finally {
                                setDownloadingPdfAdminId(null);
                              }
                            }}
                            disabled={downloadingPdfAdminId === ord.id}
                            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer disabled:opacity-50"
                            title="Download PDF Receipt / Order Record"
                          >
                            <Download className={`w-4 h-4 text-[#FF1493] ${downloadingPdfAdminId === ord.id ? 'animate-bounce' : ''}`} />
                          </button>
                          <button
                            onClick={() => setPrintingOrder(ord)}
                            className="p-1.5 text-slate-600 hover:text-[#FF1493] hover:bg-[#FFF0F6] rounded transition-colors cursor-pointer"
                            title="Print Receipt / Order Record"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewingOrder(ord)}
                            className="p-1.5 text-[#FF1493] hover:bg-[#FFF0F6] rounded transition-colors cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL COMPLETE PRODUCT ADD / EDIT MODAL */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProductSubmit}
        onDelete={(prod) => {
          setIsProductModalOpen(false);
          handlePromptDeleteProduct(prod);
        }}
        productToEdit={productToEdit}
        existingProducts={products}
      />

      {/* PERMANENT PRODUCT DELETION WARNING MODAL */}
      <DeleteProductWarningModal
        isOpen={Boolean(productToDelete)}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirmDelete={handleConfirmDeleteProduct}
        isDeleting={isDeletingProduct}
      />

      {/* VIEW ORDER DETAILS MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-50 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-fade-in">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#FF1493] tracking-widest">
                  Order Dossier
                </span>
                <h3 className="font-mono text-lg font-bold text-[#6B0037]">
                  #{viewingOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Order Status changer */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-600 font-medium">Current Status:</span>
                  <span className="ml-2 font-bold text-slate-900">{viewingOrder.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Change:</span>
                  <select
                    value={viewingOrder.status}
                    onChange={(e) =>
                      handleStatusChange(viewingOrder.id, e.target.value as OrderStatus)
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold bg-slate-50 cursor-pointer text-slate-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Customer info */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
                <h4 className="font-serif text-sm font-medium text-slate-900 border-b border-slate-100 pb-2">
                  Customer & Shipping Address
                </h4>
                <p>
                  <strong className="text-slate-900">Name:</strong> {viewingOrder.customer.name}
                </p>
                <p>
                  <strong className="text-slate-900">Phone:</strong> {viewingOrder.customer.phone}
                </p>
                <p>
                  <strong className="text-slate-900">Email:</strong> {viewingOrder.customer.email}
                </p>
                <p>
                  <strong className="text-slate-900">Destination:</strong>{' '}
                  {viewingOrder.customer.address}, {viewingOrder.customer.city}
                  {viewingOrder.customer.postalCode ? ` - ${viewingOrder.customer.postalCode}` : ''}
                </p>
                {viewingOrder.customer.deliveryNotes && (
                  <p className="text-amber-900 pt-1">
                    <strong>Special Client Notes:</strong> {viewingOrder.customer.deliveryNotes}
                  </p>
                )}
              </div>

              {/* Ordered Items */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <h4 className="font-serif text-sm font-medium text-slate-900 border-b border-slate-100 pb-2">
                  Ordered Skincare Products
                </h4>
                <div className="divide-y divide-slate-100">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                      {item.mainImage ? (
                        <img
                          src={item.mainImage}
                          alt={item.productName}
                          className="w-12 h-14 object-cover rounded border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-14 rounded border border-slate-200 bg-pink-50 flex items-center justify-center text-[9px] text-slate-400">
                          Skincare
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-serif text-xs font-semibold text-slate-900">
                          {item.productName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#FF1493]">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.variation.colorCode }}
                          />
                          <span>
                            {item.variation.name} ({item.variation.color})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600">
                          {item.quantity} × {formatPrice(item.price)}
                        </span>
                        <p className="font-bold text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-1 text-right">
                  <p>
                    <span className="text-slate-600">Subtotal: </span>
                    <strong className="text-slate-900">{formatPrice(viewingOrder.subtotal)}</strong>
                  </p>
                  <p>
                    <span className="text-slate-600">
                      Shipping ({viewingOrder.deliveryZone || viewingOrder.customer?.deliveryZone || 'Delivery'}):{' '}
                    </span>
                    <strong className="text-slate-900">{formatPrice(viewingOrder.shippingFee)}</strong>
                  </p>
                  <p className="text-base font-bold text-[#6B0037] pt-1">
                    Total: {formatPrice(viewingOrder.total)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Payment Method: {viewingOrder.paymentMethod}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl mt-3">
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-[#FF1493]" />
                    <span>Customer Tax Invoice &amp; Official Order Record</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        setDownloadingPdfAdminId(viewingOrder.id);
                        try {
                          await downloadReceiptPdf(viewingOrder);
                        } finally {
                          setDownloadingPdfAdminId(null);
                        }
                      }}
                      disabled={downloadingPdfAdminId === viewingOrder.id}
                      className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Download className={`w-3.5 h-3.5 text-[#FF1493] ${downloadingPdfAdminId === viewingOrder.id ? 'animate-bounce' : ''}`} />
                      <span>{downloadingPdfAdminId === viewingOrder.id ? 'Generating...' : 'Download PDF'}</span>
                    </button>
                    <button
                      onClick={() => setPrintingOrder(viewingOrder)}
                      className="py-2 px-4 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Receipt & PDF Modal */}
      <OrderReceiptModal
        order={printingOrder}
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
        onToast={addToast}
      />
    </div>
  );
};
