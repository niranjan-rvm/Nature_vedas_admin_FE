import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { 
  Order, 
  Product, 
  Category, 
  Blog,
  AdminTab 
} from '../types';
import { OrderStatusBadge, PaymentStatusBadge, getEffectivePaymentStatus } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Package, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Eye,
  Plus,
  Search,
  X,
  Layers,
  ExternalLink,
  BookOpen,
  Calendar,
  Tag,
  User
} from 'lucide-react';

interface DashboardPageProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  blogs?: Blog[];
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectTab?: (tab: AdminTab) => void;
  onOpenOrderModal: (order: Order) => void;
  onOpenAddProduct?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  orders = [],
  products = [],
  categories = [],
  blogs = [],
  searchQuery = '',
  onSearchChange,
  onSelectTab,
  onOpenOrderModal,
  onOpenAddProduct,
}) => {
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);

  // Compute analytics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let pendingFulfillment = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    orders.forEach((o) => {
      const amount = Number(o.totalAmount || 0);
      totalRevenue += amount;

      const { isPaid } = getEffectivePaymentStatus(o);

      if (isPaid) {
        paidRevenue += amount;
        paidCount++;
      } else {
        pendingRevenue += amount;
        unpaidCount++;
      }

      const effectiveStatus = (o.order_status || 'pending').toLowerCase();
      if (effectiveStatus === 'pending') {
        pendingFulfillment++;
      }
    });

    const lowStock = products.filter((p) => p.quantity <= 10);
    const outOfStock = products.filter((p) => p.quantity <= 0);

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalOrders: orders.length,
      paidCount,
      unpaidCount,
      pendingFulfillment,
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      lowStockItems: lowStock.slice(0, 5),
    };
  }, [orders, products]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [orders]);

  const searchFilter = searchQuery.toLowerCase().trim();

  const matchedOrders = useMemo(() => {
    if (!searchFilter) return [];
    return orders.filter((o) => {
      const idMatch = o.id.toString().includes(searchFilter) || `ord-${o.id}`.includes(searchFilter);
      const userMatch = o.user?.username?.toLowerCase().includes(searchFilter) || false;
      const emailMatch = o.user?.email?.toLowerCase().includes(searchFilter) || false;
      const statusMatch =
        o.order_status?.toLowerCase().includes(searchFilter) ||
        o.payment_status?.toLowerCase().includes(searchFilter);
      return idMatch || userMatch || emailMatch || statusMatch;
    });
  }, [orders, searchFilter]);

  const matchedProducts = useMemo(() => {
    if (!searchFilter) return [];
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(searchFilter);
      const descMatch = p.description?.toLowerCase().includes(searchFilter);
      return nameMatch || descMatch;
    });
  }, [products, searchFilter]);

  const matchedCategories = useMemo(() => {
    if (!searchFilter) return [];
    return categories.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(searchFilter);
      const descMatch = c.description?.toLowerCase().includes(searchFilter);
      return nameMatch || descMatch;
    });
  }, [categories, searchFilter]);

  const matchedBlogs = useMemo(() => {
    if (!searchFilter) return [];
    return (blogs || []).filter((b) => {
      const titleMatch = typeof b.title === 'string' && b.title.toLowerCase().includes(searchFilter);
      const catMatch = typeof b.category === 'string' && b.category.toLowerCase().includes(searchFilter);
      const authorMatch = typeof b.author === 'string' && b.author.toLowerCase().includes(searchFilter);
      const excerptMatch = typeof b.excerpt === 'string' && b.excerpt.toLowerCase().includes(searchFilter);
      const contentMatch = typeof b.content === 'string' && b.content.toLowerCase().includes(searchFilter);
      return titleMatch || catMatch || authorMatch || excerptMatch || contentMatch;
    });
  }, [blogs, searchFilter]);

  const totalMatches = matchedOrders.length + matchedProducts.length + matchedCategories.length + matchedBlogs.length;

  return (
    <div className="space-y-5">
      {/* Universal Search Results Banner on Dashboard */}
      {searchFilter && (
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Store Search Results for "{searchQuery}"</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {totalMatches} found
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Searching across all products, orders, and categories
              </p>
            </div>
            {onSearchChange && (
              <button
                onClick={() => onSearchChange('')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Search</span>
              </button>
            )}
          </div>

          {totalMatches === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No store items matched "{searchQuery}"</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for a different product name, order ID, customer name, or category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Matched Orders */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    Orders ({matchedOrders.length})
                  </span>
                  <Link to="/orders" className="text-[11px] text-emerald-700 font-semibold hover:underline">
                    View All &rarr;
                  </Link>
                </div>
                {matchedOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No orders matched.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {matchedOrders.slice(0, 4).map((o) => (
                      <Link
                        key={o.id}
                        to={`/orders/${o.id}`}
                        className="block p-2 bg-white rounded-lg border border-slate-200 hover:border-emerald-400 transition-all group"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700">
                            #ORD-{o.id}
                          </span>
                          <span className="font-bold text-slate-900">₹{Number(o.totalAmount).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                          <span className="truncate max-w-[110px]">{o.user?.username || `User #${o.userId}`}</span>
                          <OrderStatusBadge status={o.order_status || 'pending'} size="sm" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Products */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    Products ({matchedProducts.length})
                  </span>
                  <Link to="/products" className="text-[11px] text-emerald-700 font-semibold hover:underline">
                    All Products &rarr;
                  </Link>
                </div>
                {matchedProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No products matched.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {matchedProducts.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="p-2 bg-white rounded-lg border border-slate-200 hover:border-emerald-400 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-xs truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400">Stock: {p.quantity} units</div>
                        </div>
                        <span className="font-bold text-emerald-800 text-xs shrink-0">
                          ₹{Number(p.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Categories */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Categories ({matchedCategories.length})
                  </span>
                  <Link to="/categories" className="text-[11px] text-emerald-700 font-semibold hover:underline">
                    Categories &rarr;
                  </Link>
                </div>
                {matchedCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No categories matched.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {matchedCategories.slice(0, 4).map((c) => (
                      <Link
                        key={c.id}
                        to={`/products?categoryId=${c.id}`}
                        className="block p-2 bg-white rounded-lg border border-slate-200 hover:border-emerald-400 transition-all group"
                      >
                        <div className="font-semibold text-slate-900 text-xs group-hover:text-emerald-700">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{c.description}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Blogs */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    Blogs ({matchedBlogs.length})
                  </span>
                  <Link to="/blogs" className="text-[11px] text-emerald-700 font-semibold hover:underline">
                    Blogs &rarr;
                  </Link>
                </div>
                {matchedBlogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No blogs matched.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {matchedBlogs.slice(0, 4).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setPreviewBlog(b)}
                        className="w-full text-left block p-2 bg-white rounded-lg border border-slate-200 hover:border-emerald-400 transition-all group cursor-pointer"
                      >
                        <div className="font-semibold text-slate-900 text-xs group-hover:text-emerald-700 truncate">
                          {b.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {b.category} • By {b.author}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Collected / Paid Revenue */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Collected Revenue</span>
            <span className="font-mono text-emerald-700 font-bold">PAID</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{stats.paidRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{stats.paidCount} paid orders</span>
            </div>
          </div>
        </div>

        {/* Pending / Unpaid Amount */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Pending Payment</span>
            <span className="font-mono text-amber-600 font-bold">UNPAID</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700">
              ₹{stats.pendingRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{stats.unpaidCount} unpaid orders</span>
            </div>
          </div>
        </div>

        {/* Total Orders & Pending Fulfillment */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Orders Total</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{stats.totalOrders}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span className="font-semibold text-slate-700">{stats.pendingFulfillment}</span> orders awaiting shipping
            </div>
          </div>
        </div>

        {/* Total Products & Low Stock */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Products</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{stats.totalProducts}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stats.lowStockCount > 0 ? (
                <span className="text-rose-600 font-bold">{stats.lowStockCount} items low stock</span>
              ) : (
                <span className="text-emerald-600 font-medium">All in stock</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Orders with Payment Status & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders Table (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200/80 p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
              <p className="text-[11px] text-slate-400">Latest customer transactions and payment states</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic">
                No orders recorded yet.
              </div>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Link
                      to={`/orders/${o.id}`}
                      className="font-bold text-slate-800 hover:text-emerald-700 transition-colors text-xs"
                      title="Open Order Details"
                    >
                      #ORD-{o.id}
                    </Link>
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">
                        {o.user?.username || `User #${o.userId}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Payment Status Badge */}
                    <PaymentStatusBadge order={o} size="sm" />
                    
                    {/* Fulfillment Badge */}
                    <OrderStatusBadge status={o.order_status || 'pending'} size="sm" />

                    <div className="text-right font-bold text-slate-900 min-w-[60px]">
                      ₹{Number(o.totalAmount).toFixed(2)}
                    </div>

                    <Link
                      to={`/orders/${o.id}`}
                      title="View Order Details"
                      className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Alerts (1 Column) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Stock Alerts</span>
              </h3>
              <p className="text-[11px] text-slate-400">Items requiring restock</p>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {stats.lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">Stock Healthy</p>
                <p className="text-[10px] text-slate-400">All products have sufficient units</p>
              </div>
            ) : (
              stats.lowStockItems.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <div className="font-medium text-slate-900 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400">₹{Number(p.price).toFixed(2)}</div>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      p.quantity <= 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {p.quantity <= 0 ? 'Out of stock' : `${p.quantity} left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ayurvedic Wellness Blogs & Articles Section */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Ayurvedic Wellness & Knowledge Blogs
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {blogs.length} {blogs.length === 1 ? 'Article' : 'Articles'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Educational wellness content, dosha balance advice, and seasonal herbal remedies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 transition-colors"
            >
              <span>Manage & Write Blogs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No blog articles published yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Share Ayurvedic health wisdom, seasonal diet tips, and herb benefits with your customers.
            </p>
            <Link
              to="/blogs"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Blog Article</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.slice(0, 3).map((blog) => (
              <div
                key={blog.id}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewBlog(blog)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPreviewBlog(blog);
                  }
                }}
                className="bg-slate-50/60 rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-md hover:border-emerald-400 transition-all flex flex-col group cursor-pointer text-left"
              >
                {/* Image & Status Tag */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  {blog.cover_image || blog.image ? (
                    <img
                      src={blog.cover_image || blog.image || ''}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-800">
                      <BookOpen className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-emerald-800 shadow-xs border border-emerald-100 backdrop-blur-xs">
                      {blog.category}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs ${
                        blog.is_published
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-slate-800/80 text-white'
                      }`}
                    >
                      {blog.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {typeof blog.title === 'string' ? blog.title : String(blog.title || '')}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {typeof blog.excerpt === 'string' && blog.excerpt
                        ? blog.excerpt
                        : typeof blog.content === 'string'
                        ? blog.content.slice(0, 110)
                        : ''}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-600 truncate max-w-[130px]">
                      By {typeof blog.author === 'string' ? blog.author : 'Nature Vedas'}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      Preview Article &rarr;
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blog Full Preview Modal - Read Only (No delete or update options on Dashboard) */}
      <Modal
        isOpen={!!previewBlog}
        onClose={() => setPreviewBlog(null)}
        title={typeof previewBlog?.title === 'string' ? previewBlog.title : 'Article Preview'}
        subtitle={`By ${typeof previewBlog?.author === 'string' ? previewBlog.author : 'Nature Vedas'} • ${typeof previewBlog?.category === 'string' ? previewBlog.category : 'Ayurveda'} • ${previewBlog?.read_time || '5 min read'}`}
        maxWidth="3xl"
      >
        {previewBlog && (
          <div className="space-y-5 text-slate-800 text-xs">
            {(previewBlog.cover_image || previewBlog.image) && (
              <div className="h-64 sm:h-72 rounded-xl overflow-hidden bg-slate-100 relative">
                <img
                  src={previewBlog.cover_image || previewBlog.image || ''}
                  alt={previewBlog.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-emerald-800 shadow-xs backdrop-blur-xs">
                    {previewBlog.category}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs ${
                      previewBlog.is_published
                        ? 'bg-emerald-600/90 text-white'
                        : 'bg-slate-800/80 text-white'
                    }`}
                  >
                    {previewBlog.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            )}

            {previewBlog.excerpt && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900 font-medium text-xs leading-relaxed italic">
                "{typeof previewBlog.excerpt === 'string' ? previewBlog.excerpt : ''}"
              </div>
            )}

            <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100 max-h-96 overflow-y-auto">
              {typeof previewBlog.content === 'string'
                ? previewBlog.content
                : JSON.stringify(previewBlog.content, null, 2)}
            </div>

            {Array.isArray(previewBlog.tags) && previewBlog.tags.length > 0 && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {previewBlog.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Preview mode • Read-only
              </span>
              <button
                type="button"
                onClick={() => setPreviewBlog(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer transition-colors text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
