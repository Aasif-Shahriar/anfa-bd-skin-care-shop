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
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product, ProductVariation, Order, OrderStatus, Category } from '../types';
import { formatPrice, slugify } from '../utils/format';
import { OrderReceiptModal } from '../components/OrderReceiptModal';
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
import { uploadImageToStorage } from '../services/storageService';

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
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Product Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Sheet mask');
  const [basePrice, setBasePrice] = useState<number>(1850);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [active, setActive] = useState(true);
  const [variations, setVariations] = useState<ProductVariation[]>([]);

  // Order Details Modal State
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.all([fetchProducts(), fetchOrders()]);
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
  const lowStockProducts = products.filter((p) => (p.totalStock ?? 0) <= 5);

  // Open modal to add product
  const handleAddNewProduct = () => {
    setEditingProductId(null);
    setName('');
    setCategory('Sheet mask');
    setBasePrice(1850);
    setCompareAtPrice(undefined);
    setDescription('');
    setMainImage('https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80');
    setFeatured(false);
    setBestseller(false);
    setNewArrival(true);
    setActive(true);
    setVariations([
      {
        id: `var_${Date.now()}_1`,
        name: '30ml Standard Dropper',
        color: 'Dewy Glow',
        colorCode: '#A7F3D0',
        images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80'],
        stock: 25,
        sku: 'ANFA-SRM-30M',
        active: true,
      },
      {
        id: `var_${Date.now()}_2`,
        name: '50ml Jumbo Glow Value',
        color: 'Hydra Clear',
        colorCode: '#059669',
        images: ['https://images.unsplash.com/photo-1608248597359-0a6245e3ea1e?auto=format&fit=crop&w=1000&q=80'],
        stock: 18,
        sku: 'ANFA-SRM-50M',
        active: true,
      },
      {
        id: `var_${Date.now()}_3`,
        name: '100ml Value Size',
        color: 'Calming Green',
        colorCode: '#34D399',
        images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80'],
        stock: 12,
        sku: 'ANFA-SRM-100M',
        active: true,
      },
    ]);
    setIsProductModalOpen(true);
  };

  // Open modal to edit existing product
  const handleEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setBasePrice(prod.basePrice);
    setCompareAtPrice(prod.compareAtPrice);
    setDescription(prod.description);
    setMainImage(prod.mainImage);
    setFeatured(Boolean(prod.featured));
    setBestseller(Boolean(prod.bestseller));
    setNewArrival(Boolean(prod.newArrival));
    setActive(Boolean(prod.active));
    setVariations(prod.variations && prod.variations.length > 0 ? prod.variations : []);
    setIsProductModalOpen(true);
  };

  // Save product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mainImage.trim()) {
      addToast('Validation Error', 'Product name and main image are mandatory.', 'warning');
      return;
    }

    try {
      const slug = slugify(name);
      const totalStock = variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

      const productPayload: Omit<Product, 'id'> = {
        name,
        slug,
        category,
        basePrice: Number(basePrice),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        description,
        mainImage,
        images: [mainImage, ...variations.flatMap((v) => v.images || [])],
        variations,
        featured,
        bestseller,
        newArrival,
        active,
        totalStock,
        createdAt: new Date().toISOString(),
      };

      await saveProduct(productPayload, editingProductId || undefined);
      addToast('Product Saved', `${name} has been published to Firestore.`, 'success');
      setIsProductModalOpen(false);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error saving product:', err);
      addToast('Save Failed', 'Unable to persist product in Firestore.', 'error');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${prodName}" from the catalogue?`)) {
      try {
        await removeProduct(id);
        addToast('Product Removed', `${prodName} deleted from Firestore.`, 'info');
        await loadData();
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.error('Failed to remove product:', err);
        addToast('Delete Failed', 'Could not delete product.', 'error');
      }
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

  // Image upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetVariationIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImageToStorage(file);
      if (targetVariationIndex !== undefined) {
        setVariations((prev) =>
          prev.map((v, idx) =>
            idx === targetVariationIndex ? { ...v, images: [url, ...(v.images || [])] } : v
          )
        );
      } else {
        setMainImage(url);
      }
      addToast('Image Uploaded', 'Image uploaded successfully.', 'success');
    } catch (err) {
      console.error('Upload failed:', err);
      addToast('Upload Error', 'Failed to upload image.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Variations helper: Add variation
  const addVariation = () => {
    const newVar: ProductVariation = {
      id: `var_${Date.now()}`,
      name: '50ml Standard Bottle',
      color: 'Dewy Glow',
      colorCode: '#A7F3D0',
      images: [mainImage || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80'],
      stock: 15,
      sku: `ANFA-SKU-${Math.floor(100 + Math.random() * 900)}`,
      active: true,
    };
    setVariations((prev) => [...prev, newVar]);
  };

  const removeVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    setVariations((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, [field]: value } : v))
    );
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

  // Filtered lists
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#FF1493]"
              />
              <Search className="w-4 h-4 text-[#FF1493] absolute left-3 top-2.5" />
            </div>

            <button
              onClick={handleAddNewProduct}
              className="px-5 py-2.5 bg-[#FF1493] hover:bg-[#6B0037] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Product</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Base Price</th>
                    <th className="py-3.5 px-4">Variations</th>
                    <th className="py-3.5 px-4">Total Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {prod.mainImage ? (
                            <img
                              src={prod.mainImage}
                              alt={prod.name}
                              className="w-12 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-14 rounded-lg border border-slate-200 bg-pink-50 flex items-center justify-center text-[9px] text-slate-400 shrink-0">
                              Skincare
                            </div>
                          )}
                          <div>
                            <span className="font-serif text-sm font-medium block text-slate-900">
                              {prod.name}
                            </span>
                            <div className="flex gap-1.5 mt-0.5">
                              {prod.bestseller && (
                                <span className="text-[9px] bg-[#D4AF37]/20 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                  Bestseller
                                </span>
                              )}
                              {prod.newArrival && (
                                <span className="text-[9px] bg-[#FFE4F2] text-[#FF1493] font-bold px-1.5 py-0.2 rounded">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {prod.category}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#6B0037]">
                        {formatPrice(prod.basePrice)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          {prod.variations?.map((v) => (
                            <span
                              key={v.id}
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: v.colorCode }}
                              title={`${v.name} (${v.stock} in stock)`}
                            />
                          ))}
                          <span className="text-[11px] text-slate-500 ml-1">
                            ({prod.variations?.length || 0})
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            (prod.totalStock ?? 0) <= 5 ? 'text-amber-700' : 'text-slate-900'
                          }`}
                        >
                          {prod.totalStock ?? 0} units
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            prod.active
                              ? 'bg-[#FFE4F2] text-[#FF1493]'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {prod.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditProduct(prod)}
                            className="p-1.5 text-[#FF1493] hover:bg-[#FFF0F6] rounded transition-colors"
                            title="Edit Product & Variations"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
                    <th className="py-3.5 px-4">Items & Variations</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4 text-right">View</th>
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

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-50 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="font-serif text-xl font-medium text-slate-900">
                {editingProductId ? 'Edit Skincare Product' : 'Add New Skincare Product'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-800 font-semibold uppercase tracking-wider mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Glass Skin Niacinamide 10% Glow Serum"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-semibold uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#FF1493] text-slate-800"
                  >
                    <option value="Sheet mask">Sheet mask</option>
                    <option value="Mud mask">Mud mask</option>
                    <option value="Sleeping mask">Sleeping mask</option>
                    <option value="Bubble mask">Bubble mask</option>
                    <option value="Eye mask">Eye mask</option>
                    <option value="Lip mask">Lip mask</option>
                    <option value="Sunscream">Sunscream</option>
                    <option value="Bodywash">Bodywash</option>
                    <option value="Nose strip">Nose strip</option>
                    <option value="Blackhead remover">Blackhead remover</option>
                    <option value="Makeup remover">Makeup remover</option>
                    <option value="Applicator">Applicator</option>
                    <option value="Foot mask">Foot mask</option>
                    <option value="Combo offer">Combo offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-semibold uppercase tracking-wider mb-1">
                    Base Price (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-semibold uppercase tracking-wider mb-1">
                    Compare-at / Original Price (BDT)
                  </label>
                  <input
                    type="number"
                    value={compareAtPrice ?? ''}
                    onChange={(e) =>
                      setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Optional original price"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-semibold uppercase tracking-wider mb-1">
                    Main Hero Image URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={mainImage}
                      onChange={(e) => setMainImage(e.target.value)}
                      placeholder="https://images.unsplash..."
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#FF1493]"
                    />
                    <label className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-[#FF1493] rounded-lg cursor-pointer flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e)}
                      />
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-800 font-semibold uppercase tracking-wider mb-1">
                    Formula Description &amp; Usage Notes
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed ingredients, skin type suitability, morning/night usage instructions..."
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#FF1493]"
                  />
                </div>
              </div>

              {/* Marketing Toggles */}
              <div className="flex flex-wrap gap-6 p-4 bg-white rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="accent-[#FF1493]"
                  />
                  <span className="font-semibold text-slate-900">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bestseller}
                    onChange={(e) => setBestseller(e.target.checked)}
                    className="accent-[#FF1493]"
                  />
                  <span className="font-semibold text-slate-900">Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newArrival}
                    onChange={(e) => setNewArrival(e.target.checked)}
                    className="accent-[#FF1493]"
                  />
                  <span className="font-semibold text-slate-900">New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-[#FF1493]"
                  />
                  <span className="font-semibold text-slate-900">Published Active</span>
                </label>
              </div>

              {/* PRODUCT VARIATION MANAGER (Critical Requirement) */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base font-medium text-slate-900">
                      Product Variations (Color, Metal, Stock & Specific Images)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Each variation switches the photo automatically in the client storefront.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariation}
                    className="px-3 py-1.5 bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3] hover:bg-[#FF1493] hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variation</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {variations.map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/20"
                            style={{ backgroundColor: v.colorCode }}
                          />
                          <span className="font-semibold text-xs text-slate-900">
                            Variation #{idx + 1}: {v.name}
                          </span>
                        </div>
                        {variations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariation(idx)}
                            className="text-red-700 hover:text-red-900"
                            title="Remove variation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                            Variation Name
                          </label>
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVariation(idx, 'name', e.target.value)}
                            placeholder="50ml Standard Bottle"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                            Color Category
                          </label>
                          <select
                            value={v.color}
                            onChange={(e) => updateVariation(idx, 'color', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
                          >
                            <option value="Dewy Glow">Dewy Glow</option>
                            <option value="Hydra Clear">Hydra Clear</option>
                            <option value="Calming Green">Calming Green</option>
                            <option value="Soft Cream">Soft Cream</option>
                            <option value="Velvet Sheer">Velvet Sheer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                            Color Swatch Hex
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={v.colorCode}
                              onChange={(e) => updateVariation(idx, 'colorCode', e.target.value)}
                              className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={v.colorCode}
                              onChange={(e) => updateVariation(idx, 'colorCode', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                            Variation Stock *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) => updateVariation(idx, 'stock', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                            Variation SKU
                          </label>
                          <input
                            type="text"
                            value={v.sku || ''}
                            onChange={(e) => updateVariation(idx, 'sku', e.target.value)}
                            placeholder="ANFA-SRM-50M"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                            Price Override (Optional)
                          </label>
                          <input
                            type="number"
                            value={v.priceOverride ?? ''}
                            onChange={(e) =>
                              updateVariation(
                                idx,
                                'priceOverride',
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            placeholder="Leave empty for base price"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                            Variation Image URL (Primary)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={v.images?.[0] || ''}
                              onChange={(e) => updateVariation(idx, 'images', [e.target.value])}
                              placeholder="Image that displays when customer clicks this color"
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#FF1493]"
                            />
                            <label className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#FF1493] rounded cursor-pointer flex items-center shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, idx)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF1493] hover:bg-[#6B0037] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-colors"
                >
                  Save Product to Cloud Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl mt-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#FF1493]" />
                    <span>Customer: <strong>{viewingOrder.customer.email}</strong></span>
                  </div>
                  <button
                    onClick={() => setPrintingOrder(viewingOrder)}
                    className="py-2 px-4 bg-[#FF1493] hover:bg-[#E00078] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Receipt / Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Receipt & Email Audit Modal */}
      <OrderReceiptModal
        order={printingOrder}
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
        onToast={addToast}
      />
    </div>
  );
};
