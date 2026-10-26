import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { QuickViewModal } from './components/QuickViewModal';
import { ToastContainer } from './components/ToastContainer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { Product, ProductVariation, Order } from './types';
import { fetchProducts } from './services/productService';

function AppContent() {
  const { authError, clearAuthError } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { addItem, setIsCartDrawerOpen } = useCart();

  // Load products from Firestore
  const loadCatalogue = async () => {
    try {
      const items = await fetchProducts();
      setProducts(items);
    } catch (e) {
      console.error('Failed to load products from Firestore:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, []);

  // Navigation handler
  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page);
    if (page === 'track-order' && param) {
      setTrackingOrderId(param);
    } else if (param) {
      setSelectedCategory(param);
    } else if (page === 'shop' && !param) {
      setSelectedCategory('All');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Product selection handler
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct Buy Now handler from product detail
  const handleBuyNow = (product: Product, variation: ProductVariation, quantity: number) => {
    addItem(product, variation, quantity);
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Order placement success
  const handleOrderSuccess = (order: Order) => {
    setConfirmedOrder(order);
    setCurrentPage('order-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#241D20] font-sans antialiased">
      {/* Global Navbar */}
      <Navbar
        activeTab={currentPage}
        activeCategory={selectedCategory}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Auth Error Banner with direct link for Unauthorized Domain */}
      {authError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs md:text-sm text-amber-900 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto flex items-start md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
              <div>
                <span className="font-semibold">{authError}</span>
                <span className="block md:inline md:ml-2 text-amber-800">
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0282419252/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold hover:text-amber-950 inline-flex items-center gap-1"
                  >
                    Open Firebase Console Settings
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              </div>
            </div>
            <button
              onClick={clearAuthError}
              className="text-amber-600 hover:text-amber-900 p-1 rounded transition-colors"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#FF1493] border-t-transparent animate-spin" />
            <p className="font-serif text-sm tracking-widest uppercase text-[#FF1493]">
              Connecting to Maison Vaults...
            </p>
          </div>
        ) : (
          <>
            {currentPage === 'home' && (
              <HomePage
                products={products}
                onSelectProduct={handleSelectProduct}
                onQuickView={(p) => setQuickViewProduct(p)}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'shop' && (
              <ShopPage
                products={products}
                initialCategory={selectedCategory}
                onSelectProduct={handleSelectProduct}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            )}

            {currentPage === 'product' && selectedProduct && (
              <ProductDetailPage
                product={selectedProduct}
                allProducts={products}
                onSelectProduct={handleSelectProduct}
                onNavigate={handleNavigate}
                onBuyNow={handleBuyNow}
              />
            )}

            {currentPage === 'cart' && (
              <CartPage
                onNavigate={handleNavigate}
                onProceedToCheckout={() => handleNavigate('checkout')}
              />
            )}

            {currentPage === 'checkout' && (
              <CheckoutPage
                onNavigate={handleNavigate}
                onOrderSuccess={handleOrderSuccess}
              />
            )}

            {currentPage === 'order-confirmation' && confirmedOrder && (
              <OrderConfirmationPage
                order={confirmedOrder}
                onNavigate={handleNavigate}
              />
            )}

            {(currentPage === 'account' || currentPage === 'wishlist') && (
              <AccountPage
                products={products}
                onSelectProduct={handleSelectProduct}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'track-order' && (
              <OrderTrackingPage
                initialOrderId={trackingOrderId}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'admin' && (
              <AdminPage
                onNavigate={handleNavigate}
                onRefreshData={loadCatalogue}
              />
            )}
          </>
        )}
      </main>

      {/* Luxury Brand Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onCheckout={() => handleNavigate('checkout')}
        onViewBag={() => handleNavigate('cart')}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onViewProductDetail={(p) => {
          setQuickViewProduct(null);
          handleSelectProduct(p);
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={handleSelectProduct}
        onSearchAll={(q) => {
          setSelectedCategory('All');
          handleNavigate('shop');
        }}
      />

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
