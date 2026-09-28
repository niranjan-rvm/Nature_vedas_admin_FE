import React, { useState, useEffect, useCallback } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  useLocation, 
  useNavigate 
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage } from './pages/Dashboard';
import { OrdersPage } from './pages/Orders';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrderStatusChecker } from './pages/OrderStatusChecker';
import { ProductsPage } from './pages/Products';
import { CategoriesPage } from './pages/Categories';
import { CustomersPage } from './pages/Customers';
import { BlogsPage } from './pages/Blogs';
import { Login } from './pages/Login';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { api } from './services/api';
import { 
  Order, 
  Product, 
  Category, 
  Blog,
  OrderStatus 
} from './types';
import { Leaf, RefreshCw } from 'lucide-react';

const AdminApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);

  // Fetch all administrative data from backend
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setDataLoading(true);
    setIsRefreshing(true);

    try {
      const [fetchedOrders, fetchedProducts, fetchedCategories, fetchedBlogs] = await Promise.all([
        api.getAllOrders().catch((err) => {
          console.warn('Orders fetch note:', err.message);
          return [] as Order[];
        }),
        api.getAllProducts().catch((err) => {
          console.warn('Products fetch note:', err.message);
          return [] as Product[];
        }),
        api.getAllCategories().catch((err) => {
          console.warn('Categories fetch note:', err.message);
          return [] as Category[];
        }),
        api.getAllBlogs().catch((err) => {
          console.warn('Blogs fetch note:', err.message);
          return [] as Blog[];
        }),
      ]);

      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setBlogs(fetchedBlogs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching backend data';
      toastError(msg);
    } finally {
      setDataLoading(false);
      setIsRefreshing(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Order status update action
  const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    await api.updateOrderStatus(orderId, newStatus);
    // Optimistically update local order state
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
    );
    if (selectedOrderForModal?.id === orderId) {
      setSelectedOrderForModal((prev) => (prev ? { ...prev, order_status: newStatus } : null));
    }
  };

  // Product CRUD actions
  const handleCreateProduct = async (productData: Partial<Product>) => {
    const res = await api.createProduct(productData);
    setProducts((prev) => [res.product, ...prev]);
  };

  const handleUpdateProduct = async (id: number, productData: Partial<Product>) => {
    const res = await api.updateProduct(id, productData);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...res.product } : p))
    );
  };

  const handleDeleteProduct = async (id: number) => {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Category CRUD actions
  const handleCreateCategory = async (cat: { name: string; description: string }) => {
    const res = await api.createCategory(cat);
    if (res.category) {
      setCategories((prev) => [...prev, res.category!]);
    } else {
      fetchData(true);
    }
  };

  const handleUpdateCategory = async (id: number, cat: { name: string; description: string }) => {
    const res = await api.updateCategory(id, cat);
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...(res?.category || cat) } : c))
    );
  };

  const handleDeleteCategory = async (id: number) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Blog CRUD actions
  const handleCreateBlog = async (blogData: Partial<Blog>) => {
    const res = await api.createBlog(blogData);
    if (res?.blog) {
      setBlogs((prev) => [res.blog, ...prev]);
    } else {
      fetchData(true);
    }
  };

  const handleUpdateBlog = async (id: number, blogData: Partial<Blog>) => {
    const res = await api.updateBlog(id, blogData);
    setBlogs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...(res?.blog || blogData) } : b))
    );
  };

  const handleDeleteBlog = async (id: number) => {
    await api.deleteBlog(id);
    setBlogs((prev) => prev.filter((b) => b.id !== id));
  };

  // If loading auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-950 mb-4 animate-bounce">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <p className="font-bold text-base tracking-wide">Nature Vedas Admin</p>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <span>Verifying credentials...</span>
        </p>
      </div>
    );
  }

  // If unauthenticated or regular user -> Login page
  if (!isAuthenticated) {
    return <Login />;
  }

  const pendingOrdersCount = (orders || []).filter((o) => (o.order_status || 'pending') === 'pending').length;
  const lowStockCount = (products || []).filter((p) => p.quantity <= 10).length;

  return (
    <AdminLayout
      pendingOrdersCount={pendingOrdersCount}
      lowStockCount={lowStockCount}
      onOpenAddProduct={() => {
        navigate('/products');
        setIsAddProductOpen(true);
      }}
      onRefreshAll={() => {
        fetchData();
        toastSuccess('Synced latest data with backend');
      }}
      isRefreshing={isRefreshing}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      orders={orders}
      products={products}
      categories={categories}
      blogs={blogs}
    >
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              orders={orders}
              products={products}
              categories={categories}
              blogs={blogs}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenOrderModal={setSelectedOrderForModal}
              onOpenAddProduct={() => {
                navigate('/products');
                setIsAddProductOpen(true);
              }}
            />
          }
        />

        <Route
          path="/orders"
          element={
            <OrdersPage
              orders={orders}
              isLoading={dataLoading}
              onRefresh={() => fetchData(true)}
              onUpdateStatus={handleUpdateOrderStatus}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
        />

        <Route
          path="/orders/:id"
          element={
            <OrderDetailPage
              orders={orders}
              onUpdateStatus={handleUpdateOrderStatus}
            />
          }
        />

        <Route
          path="/order-status"
          element={
            <OrderStatusChecker
              orders={orders}
              onUpdateStatus={handleUpdateOrderStatus}
            />
          }
        />

        <Route
          path="/products"
          element={
            <ProductsPage
              products={products}
              categories={categories}
              isLoading={dataLoading}
              onRefresh={() => fetchData(true)}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              isAddModalOpen={isAddProductOpen}
              onCloseAddModal={() => setIsAddProductOpen(false)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
        />

        <Route
          path="/categories"
          element={
            <CategoriesPage
              categories={categories}
              products={products}
              isLoading={dataLoading}
              onRefresh={() => fetchData(true)}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          }
        />

        <Route
          path="/customers"
          element={
            <CustomersPage 
              orders={orders} 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
        />

        <Route
          path="/blogs"
          element={
            <BlogsPage
              blogs={blogs}
              isLoading={dataLoading}
              onRefresh={() => fetchData(true)}
              onCreateBlog={handleCreateBlog}
              onUpdateBlog={handleUpdateBlog}
              onDeleteBlog={handleDeleteBlog}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrderForModal}
        isOpen={!!selectedOrderForModal}
        onClose={() => setSelectedOrderForModal(null)}
        onUpdateStatus={handleUpdateOrderStatus}
      />
    </AdminLayout>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AdminApp />
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
