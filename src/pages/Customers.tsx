import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomerSummary, Order } from '../types';
import { api } from '../services/api';
import { Pagination } from '../components/common/Pagination';
import { Users, Search, ShoppingBag, Mail, Phone, Calendar, RefreshCw, X } from 'lucide-react';

interface CustomersPageProps {
  orders?: Order[];
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ 
  orders = [], 
  searchQuery = '', 
  onSearchChange 
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search params
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || searchQuery || '';

  const [currentPage, setCurrentPage] = useState<number>(Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);
  const [customerSearch, setCustomerSearch] = useState<string>(searchParam);
  const pageSize = 8;

  // Sync state if URL search params change
  useEffect(() => {
    if (!Number.isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage(pageParam);
    }
  }, [pageParam]);

  useEffect(() => {
    setCustomerSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== customerSearch) {
      setCustomerSearch(searchQuery);
      setCurrentPage(1);
    }
  }, [searchQuery]);

  // API Customers State
  const [apiCustomers, setApiCustomers] = useState<CustomerSummary[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Fetch customers from API with pagination and search
  const fetchCustomersFromApi = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await api.getCustomers({
        page: currentPage,
        limit: pageSize,
        search: customerSearch.trim() || undefined,
      });
      setApiCustomers(res.customers);
      setTotalItems(res.total);
    } catch (err: unknown) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, pageSize, customerSearch]);

  useEffect(() => {
    fetchCustomersFromApi();
  }, [fetchCustomersFromApi]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleSearchChange = (q: string) => {
    setCustomerSearch(q);
    if (onSearchChange) onSearchChange(q);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (q.trim()) {
      newParams.set('search', q.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Group orders by user as initial or local fallback
  const localGrouped = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const map = new Map<number, CustomerSummary>();

    orders.forEach((o) => {
      const uId = o.userId;
      const existing = map.get(uId);

      const username = o.user?.username || `Customer #${uId}`;
      const email = o.user?.email || 'N/A';
      const phone = o.user?.mobileNo || 'N/A';
      const amount = Number(o.totalAmount || 0);

      if (existing) {
        existing.ordersCount++;
        existing.totalSpent += amount;
        if (new Date(o.createdAt).getTime() > new Date(existing.latestOrderDate).getTime()) {
          existing.latestOrderDate = o.createdAt;
        }
      } else {
        map.set(uId, {
          userId: uId,
          username,
          email,
          phone,
          ordersCount: 1,
          totalSpent: amount,
          latestOrderDate: o.createdAt,
        });
      }
    });

    let list = Array.from(map.values());
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.username.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }
    return list;
  }, [orders, customerSearch]);

  const displayCustomers = (apiCustomers.length > 0 || isFetching || customerSearch)
    ? apiCustomers
    : localGrouped.slice(0, pageSize);
  const effectiveTotal = totalItems > 0 ? totalItems : (apiCustomers.length > 0 ? apiCustomers.length : localGrouped.length);

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h3 className="text-base font-bold text-slate-900">Customer Directory</h3>
          <p className="text-xs text-slate-500">Active accounts and order history with API-level pagination</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer by name or email..."
              value={customerSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
            {customerSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => fetchCustomersFromApi()}
            disabled={isFetching}
            title="Refresh Customers"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Customer Name & ID</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Orders Placed</th>
                <th className="py-3.5 px-4">Lifetime Value</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Latest Order Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isFetching && displayCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                    <p className="font-semibold text-slate-700">Loading customers from server...</p>
                  </td>
                </tr>
              ) : displayCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No customers found</p>
                    {customerSearch && (
                      <button
                        onClick={() => handleSearchChange('')}
                        className="mt-2 text-xs text-emerald-600 hover:underline cursor-pointer"
                      >
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayCustomers.map((c) => (
                  <tr key={c.userId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {c.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{c.username}</div>
                          <div className="text-[11px] text-slate-400">User ID #{c.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        <ShoppingBag className="w-3 h-3 text-emerald-600" />
                        <span>{c.ordersCount} {c.ordersCount === 1 ? 'order' : 'orders'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                      ₹{c.totalSpent.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right text-slate-500">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(c.latestOrderDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={effectiveTotal}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};
