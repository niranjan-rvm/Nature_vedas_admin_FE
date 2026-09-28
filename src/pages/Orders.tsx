import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { 
  Order, 
  OrderStatus 
} from '../types';
import { api } from '../services/api';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { 
  Eye, 
  RefreshCw, 
  ShoppingBag, 
  ArrowUpDown, 
  Calendar 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface OrdersPageProps {
  orders?: Order[];
  isLoading?: boolean;
  onRefresh: () => void;
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders = [],
  isLoading = false,
  onRefresh,
  onUpdateStatus,
  searchQuery,
  onSearchChange,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search params (e.g. ?status=pending&page=1&sortBy=date-desc)
  const statusParam = searchParams.get('status') || searchParams.get('order_status') || 'all';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const sortParam = (searchParams.get('sortBy') as any) || 'date-desc';

  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>(sortParam);
  const [currentPage, setCurrentPage] = useState<number>(Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);
  const pageSize = 8;

  // Sync state with URL params
  useEffect(() => {
    setStatusFilter(statusParam);
  }, [statusParam]);

  useEffect(() => {
    if (!Number.isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage(pageParam);
    }
  }, [pageParam]);

  useEffect(() => {
    setSortBy(sortParam);
  }, [sortParam]);

  // API Orders State
  const [apiOrders, setApiOrders] = useState<Order[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Fetch orders from API with pagination, status, sort, and search
  const fetchOrdersFromApi = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await api.getOrders({
        page: currentPage,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy,
        search: searchQuery.trim() || undefined,
      });
      setApiOrders(res.orders);
      setTotalItems(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch orders';
      toastError(msg);
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, pageSize, statusFilter, sortBy, searchQuery, toastError]);

  useEffect(() => {
    fetchOrdersFromApi();
  }, [fetchOrdersFromApi]);

  // URL param updater handlers
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === 'all') {
      newParams.delete('status');
      newParams.delete('order_status');
    } else {
      newParams.set('status', newStatus);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', newSort);
    setSearchParams(newParams);
  };

  const handleStatusUpdateAction = async (orderId: number, newStatus: OrderStatus) => {
    await onUpdateStatus(orderId, newStatus);
    await fetchOrdersFromApi();
  };

  // Status counts for tabs (derived from global orders if provided)
  const counts = useMemo(() => {
    const c = { all: orders.length, pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => {
      const st = (o.order_status || 'pending').toLowerCase() as OrderStatus;
      if (st && st in c) {
        c[st]++;
      }
    });
    return c;
  }, [orders]);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar - Clean & Minimal */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Order Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
              { id: 'shipped', label: 'Shipped', count: counts.shipped },
              { id: 'delivered', label: 'Delivered', count: counts.delivered },
              { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${active ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Tools: Sort & Refresh */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="amount-desc">High Amount</option>
              <option value="amount-asc">Low Amount</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              onRefresh();
              fetchOrdersFromApi();
            }}
            disabled={isFetching || isLoading}
            title="Refresh Orders"
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isFetching || isLoading) ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 sm:px-6">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(isFetching || isLoading) ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading orders from API (Page {currentPage})...</span>
                  </td>
                </tr>
              ) : apiOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No orders matching filter</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchQuery ? `No results for "${searchQuery}"` : 'No orders in this category.'}
                    </p>
                  </td>
                </tr>
              ) : (
                apiOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                      {/* ID & Date */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <Link 
                          to={`/orders/${order.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 transition-colors inline-block"
                          title="View complete order page"
                        >
                          #ORD-{order.id}
                        </Link>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {order.user?.username || `User #${order.userId}`}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {order.user?.email || order.user?.mobileNo || 'N/A'}
                        </div>
                      </td>

                      {/* Payment Status (PAID vs UNPAID) */}
                      <td className="py-3.5 px-4">
                        <PaymentStatusBadge order={order} size="sm" />
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={(order.order_status || 'pending') as OrderStatus} size="sm" />
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          title="View Order Details"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold text-xs border border-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination (API Level) */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

