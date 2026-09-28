import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  ShieldCheck, 
  Search,
  X,
  ShoppingBag,
  Package,
  Layers,
  Users,
  SearchCheck,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import type { AdminTab, Order, Product, Category, Blog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { OrderStatusBadge } from '../common/Badge';

interface HeaderProps {
  currentTab?: AdminTab;
  onToggleMobileSidebar?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  orders?: Order[];
  products?: Product[];
  categories?: Category[];
  blogs?: Blog[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab: propCurrentTab,
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
  orders = [],
  products = [],
  categories = [],
  blogs = [],
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derive current active tab from route if not provided explicitly
  const activeTab: AdminTab = React.useMemo(() => {
    if (propCurrentTab) return propCurrentTab;
    const path = location.pathname;
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/order-status')) return 'order-status';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/categories')) return 'categories';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/blogs')) return 'blogs';
    return 'dashboard';
  }, [propCurrentTab, location.pathname]);

  const titles: Record<AdminTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Performance, sales metrics, and store summary',
    },
    orders: {
      title: location.pathname.match(/\/orders\/\d+/) ? 'Order Details' : 'Orders Management',
      subtitle: location.pathname.match(/\/orders\/\d+/) 
        ? 'Inspection, item breakdown, and status timeline'
        : 'Manage fulfillment and verify payment status',
    },
    'order-status': {
      title: 'Order Status Checker',
      subtitle: 'Verify live tracking state and update fulfillment stages',
    },
    products: {
      title: 'Products Catalog',
      subtitle: 'Manage inventory, prices, descriptions, and stock',
    },
    categories: {
      title: 'Product Categories',
      subtitle: 'Organize Ayurvedic remedies and catalog taxonomy',
    },
    customers: {
      title: 'Customer Directory',
      subtitle: 'Accounts, contact details, and order history',
    },
    blogs: {
      title: 'Blog & Content Management',
      subtitle: 'Publish, curate, and update Ayurvedic wellness articles',
    },
  };

  const currentInfo = titles[activeTab] || {
    title: 'Admin Console',
    subtitle: 'Nature Vedas Management',
  };

  const getPlaceholder = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Search anything (orders, products, customers, blogs, pages)...';
      case 'products':
        return 'Search products by name, price, stock...';
      case 'customers':
        return 'Search customers by name, email, phone...';
      case 'orders':
        return 'Search orders (ID, customer, payment status)...';
      case 'blogs':
        return 'Search blogs by title, category, author...';
      default:
        return 'Search anything across store...';
    }
  };

  // Universal Search Results calculation
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { pages: [], orders: [], products: [], categories: [], customers: [], blogs: [], total: 0 };

    // 1. Pages / Navigation
    const allPages = [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard, category: 'Overview & metrics' },
      { name: 'All Orders', path: '/orders', icon: ShoppingBag, category: 'Fulfillment & payments' },
      { name: 'Order Status Checker', path: '/order-status', icon: SearchCheck, category: 'Live status tracking' },
      { name: 'Products Catalog', path: '/products', icon: Package, category: 'Inventory & pricing' },
      { name: 'Product Categories', path: '/categories', icon: Layers, category: 'Product taxonomy' },
      { name: 'Customer Directory', path: '/customers', icon: Users, category: 'Customer accounts' },
      { name: 'Blogs & Articles', path: '/blogs', icon: BookOpen, category: 'Ayurvedic wellness content' },
    ];
    const pages = allPages.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));

    // 2. Orders (by ID, username, email, status)
    const matchingOrders = (orders || []).filter(o => {
      const idMatch = o.id.toString().includes(q) || `ord-${o.id}`.includes(q);
      const userMatch = o.user?.username?.toLowerCase().includes(q) || false;
      const emailMatch = o.user?.email?.toLowerCase().includes(q) || false;
      const statusMatch =
        o.order_status?.toLowerCase().includes(q) ||
        o.payment_status?.toLowerCase().includes(q);
      return idMatch || userMatch || emailMatch || statusMatch;
    }).slice(0, 4);

    // 3. Products (by name, description)
    const matchingProducts = (products || []).filter(p => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      return nameMatch || descMatch;
    }).slice(0, 4);

    // 4. Categories
    const matchingCategories = (categories || []).filter(c => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const descMatch = c.description?.toLowerCase().includes(q);
      return nameMatch || descMatch;
    }).slice(0, 3);

    // 5. Customers (extracted from orders)
    const customerMap = new Map<number, { id: number; name: string; email: string; phone?: string | null }>();
    (orders || []).forEach(o => {
      if (o.user && !customerMap.has(o.user.id)) {
        customerMap.set(o.user.id, {
          id: o.user.id,
          name: o.user.username,
          email: o.user.email,
          phone: o.user.mobileNo,
        });
      }
    });
    const matchingCustomers = Array.from(customerMap.values()).filter(c => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      );
    }).slice(0, 3);

    // 6. Blogs
    const matchingBlogs = (blogs || []).filter(b => {
      const titleMatch = (b.title || '').toLowerCase().includes(q);
      const catMatch = (b.category || '').toLowerCase().includes(q);
      const authorMatch = (b.author || '').toLowerCase().includes(q);
      return titleMatch || catMatch || authorMatch;
    }).slice(0, 3);

    const total = pages.length + matchingOrders.length + matchingProducts.length + matchingCategories.length + matchingCustomers.length + matchingBlogs.length;

    return { pages, orders: matchingOrders, products: matchingProducts, categories: matchingCategories, customers: matchingCustomers, blogs: matchingBlogs, total };
  }, [searchQuery, orders, products, categories, blogs]);

  const handleSelectResult = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {currentInfo.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Universal Search Bar & User Avatar */}
        <div className="flex items-center gap-3">
          {/* Universal Search Container */}
          <div className="relative w-64 sm:w-96" ref={searchContainerRef}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={getPlaceholder()}
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                }
              }}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-800 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Instant Floating Search Results Dropdown */}
            {isDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 max-h-[460px] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 p-2.5 divide-y divide-slate-100 text-xs">
                {searchResults.total === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Search className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                    <p className="font-semibold text-slate-700">No matching results</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No orders, products, or pages matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Navigation Pages */}
                    {searchResults.pages.length > 0 && (
                      <div className="pb-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Pages & Navigation</span>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.pages.map((p) => {
                            const Icon = p.icon;
                            return (
                              <button
                                key={p.path}
                                onClick={() => handleSelectResult(() => navigate(p.path))}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 transition-colors text-left cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1 rounded-md bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700">
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-900">
                                      {p.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{p.category}</div>
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Matching Orders */}
                    {searchResults.orders.length > 0 && (
                      <div className="py-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3 text-emerald-600" />
                            <span>Orders ({searchResults.orders.length})</span>
                          </div>
                          <Link
                            to="/orders"
                            onClick={() => setIsDropdownOpen(false)}
                            className="text-[10px] text-emerald-700 hover:underline font-semibold"
                          >
                            View in Orders &rarr;
                          </Link>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.orders.map((o) => (
                            <button
                              key={o.id}
                              onClick={() => handleSelectResult(() => navigate(`/orders/${o.id}`))}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 group-hover:text-emerald-700 text-xs">
                                  #ORD-{o.id}
                                </span>
                                <span className="text-slate-600 text-[11px] truncate max-w-[120px]">
                                  {o.user?.username || `User #${o.userId}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <OrderStatusBadge status={(o.order_status || 'pending') as any} size="sm" />
                                <span className="font-bold text-slate-900 text-xs">
                                  ₹{Number(o.totalAmount).toFixed(0)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Products */}
                    {searchResults.products.length > 0 && (
                      <div className="py-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-emerald-600" />
                            <span>Products ({searchResults.products.length})</span>
                          </div>
                          <Link
                            to="/products"
                            onClick={() => setIsDropdownOpen(false)}
                            className="text-[10px] text-emerald-700 hover:underline font-semibold"
                          >
                            All Products &rarr;
                          </Link>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.products.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleSelectResult(() => {
                                onSearchChange(p.name);
                                navigate('/products');
                              })}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 truncate max-w-[200px]">
                                <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                  <Package className="w-3 h-3 text-emerald-600" />
                                </div>
                                <div className="truncate">
                                  <div className="font-semibold text-xs text-slate-900 truncate group-hover:text-emerald-700">
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400">Stock: {p.quantity}</div>
                                </div>
                              </div>
                              <span className="font-bold text-emerald-800 text-xs shrink-0">
                                ₹{Number(p.price).toFixed(2)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Categories */}
                    {searchResults.categories.length > 0 && (
                      <div className="py-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Layers className="w-3 h-3 text-emerald-600" />
                          <span>Categories</span>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.categories.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleSelectResult(() => navigate(`/products?categoryId=${c.id}`))}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                                <span className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                                  {c.name}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                {c.description}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Customers */}
                    {searchResults.customers.length > 0 && (
                      <div className="pt-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-600" />
                          <span>Customers</span>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.customers.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleSelectResult(() => {
                                onSearchChange(c.name);
                                navigate('/customers');
                              })}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="truncate">
                                  <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700 truncate">
                                    {c.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">{c.email}</div>
                                </div>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Blogs */}
                    {searchResults.blogs && searchResults.blogs.length > 0 && (
                      <div className="pt-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          <span>Blogs & Wellness Articles</span>
                        </div>
                        <div className="space-y-0.5">
                          {searchResults.blogs.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => handleSelectResult(() => {
                                onSearchChange(b.title);
                                navigate('/blogs');
                              })}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <BookOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                                <div className="truncate">
                                  <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700 truncate">
                                    {b.title}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {b.category} • By {b.author}
                                  </div>
                                </div>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Admin User Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {user?.username?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.username || 'Admin'}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> Admin
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
