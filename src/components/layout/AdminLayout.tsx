import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AdminTab, Order, Product, Category, Blog } from '../../types';

interface AdminLayoutProps {
  currentTab?: AdminTab;
  onSelectTab?: (tab: AdminTab) => void;
  pendingOrdersCount: number;
  lowStockCount: number;
  onOpenAddProduct?: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  orders?: Order[];
  products?: Product[];
  categories?: Category[];
  blogs?: Blog[];
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  pendingOrdersCount,
  lowStockCount,
  onOpenAddProduct,
  onRefreshAll,
  isRefreshing,
  searchQuery,
  onSearchChange,
  orders = [],
  products = [],
  categories = [],
  blogs = [],
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row">
      {/* Desktop Side Panel */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
          onOpenAddProduct={onOpenAddProduct}
          onRefreshAll={onRefreshAll}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="w-72 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                onSelectTab?.(tab);
                setMobileSidebarOpen(false);
              }}
              pendingOrdersCount={pendingOrdersCount}
              lowStockCount={lowStockCount}
              onOpenAddProduct={() => {
                onOpenAddProduct?.();
                setMobileSidebarOpen(false);
              }}
              onRefreshAll={onRefreshAll}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          orders={orders}
          products={products}
          categories={categories}
          blogs={blogs}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
