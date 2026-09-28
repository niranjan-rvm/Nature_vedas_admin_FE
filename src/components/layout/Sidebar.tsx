import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  SearchCheck, 
  Package, 
  Layers, 
  Users, 
  LogOut, 
  PlusCircle, 
  Leaf,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { AdminTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab?: AdminTab;
  onSelectTab?: (tab: AdminTab) => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  onOpenAddProduct?: () => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  onOpenAddProduct,
  onRefreshAll,
  isRefreshing = false,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard' as AdminTab,
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
    },
    {
      id: 'orders' as AdminTab,
      label: 'All Orders',
      path: '/orders',
      icon: ShoppingBag,
      description: 'Manage & track orders',
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} new` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'order-status' as AdminTab,
      label: 'Order Status Checker',
      path: '/order-status',
      icon: SearchCheck,
      description: 'Check & update status',
      highlight: true,
    },
    {
      id: 'products' as AdminTab,
      label: 'Products Catalog',
      path: '/products',
      icon: Package,
      description: 'Inventory & pricing',
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'categories' as AdminTab,
      label: 'Categories',
      path: '/categories',
      icon: Layers,
      description: 'Product taxonomy',
    },
    {
      id: 'customers' as AdminTab,
      label: 'Customers',
      path: '/customers',
      icon: Users,
      description: 'User accounts & logs',
    },
    {
      id: 'blogs' as AdminTab,
      label: 'Blogs & Articles',
      path: '/blogs',
      icon: BookOpen,
      description: 'Ayurvedic wellness content',
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-100 h-full flex flex-col border-r border-slate-800 shadow-xl shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-white">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Nature Vedas
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Admin
              </span>
            </h1>
            {/* <p className="text-xs text-slate-400 font-medium">Ayurvedic E-Commerce CMS</p> */}
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      {onOpenAddProduct && (
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={onOpenAddProduct}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      )}

      {/* Navigation Options List */}
      <div className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Management Options
        </div>

        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => onSelectTab?.(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white font-medium shadow-md shadow-emerald-950/40'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-700/60 text-white'
                      : 'bg-slate-800/60 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-sm font-medium leading-none">{item.label}</div>
                  <div
                    className={`text-[11px] mt-1 truncate ${
                      isActive ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-200" />}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Sync / Refresh Button */}
      {onRefreshAll && (
        <div className="px-4 py-2 border-t border-slate-800/60">
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing data...' : 'Refresh All Data'}</span>
          </button>
        </div>
      )}

      {/* Admin User Card & Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user?.username?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <div className="text-sm font-semibold text-white truncate flex items-center gap-1">
                {user?.username || 'Administrator'}
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@naturevedas.com'}</div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out of Admin Panel"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
