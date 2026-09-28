import React, { useState } from 'react';
import type { 
  Order, 
  OrderStatus 
} from '../types';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { 
  Search, 
  CheckCircle2, 
  Truck, 
  Package, 
  Clock, 
  Ban, 
  User, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  CreditCard,
  Phone,
  Mail,
  Receipt,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface OrderStatusCheckerProps {
  orders: Order[];
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
}

export const OrderStatusChecker: React.FC<OrderStatusCheckerProps> = ({
  orders = [],
  onUpdateStatus,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    orders.length > 0 ? orders[0].id : null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);

  // Determine active order from props or direct fetch
  const matchedOrderFromProps = orders.find((o) => o.id === selectedOrderId);
  const activeOrder = matchedOrderFromProps || (fetchedOrder?.id === selectedOrderId ? fetchedOrder : null) || orders[0] || null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    // Check if numeric order ID
    const cleanId = query.replace(/^#?ORD-?/i, '');
    const num = parseInt(cleanId, 10);

    if (!isNaN(num)) {
      const match = orders.find((o) => o.id === num);
      if (match) {
        setSelectedOrderId(match.id);
        toastSuccess(`Found Order #ORD-${match.id}`);
        return;
      }

      // If not in local array, search directly via API
      setIsSearchingApi(true);
      try {
        const fetched = await api.getOrderById(num);
        if (fetched && fetched.id) {
          setFetchedOrder(fetched);
          setSelectedOrderId(fetched.id);
          toastSuccess(`Loaded Order #ORD-${fetched.id} from server`);
          return;
        }
      } catch {
        // Fall through to error
      } finally {
        setIsSearchingApi(false);
      }
      toastError(`Order #${num} not found.`);
    } else {
      // Text search by customer name, email, or phone
      const q = query.toLowerCase();
      const match = orders.find((o) => 
        o.user?.username?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o.user?.mobileNo?.includes(q)
      );

      if (match) {
        setSelectedOrderId(match.id);
        toastSuccess(`Found Order #ORD-${match.id} for "${query}"`);
      } else {
        toastError(`No orders found matching "${query}".`);
      }
    }
  };

  const handleUpdate = async (status: OrderStatus) => {
    if (!activeOrder) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(activeOrder.id, status);
      if (fetchedOrder && fetchedOrder.id === activeOrder.id) {
        setFetchedOrder({ ...fetchedOrder, order_status: status });
      }
      toastSuccess(`Order #ORD-${activeOrder.id} status updated to ${status.toUpperCase()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating order status';
      toastError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const stages: { key: OrderStatus; title: string; subtitle: string; icon: React.ElementType }[] = [
    { key: 'pending', title: 'Pending Placed', subtitle: 'Order received', icon: Clock },
    { key: 'confirmed', title: 'Confirmed & Packed', subtitle: 'Ready for shipping', icon: CheckCircle2 },
    { key: 'shipped', title: 'Shipped (In Transit)', subtitle: 'Handed to courier', icon: Truck },
    { key: 'delivered', title: 'Delivered', subtitle: 'Received by customer', icon: Package },
  ];

  const effectiveOrderStatus = (activeOrder?.order_status || 'pending') as OrderStatus;
  const currentStageIndex = activeOrder
    ? stages.findIndex((s) => s.key === effectiveOrderStatus)
    : -1;
  const isCancelled = effectiveOrderStatus === 'cancelled';
  const paymentRecord = activeOrder?.payments?.[0];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Search Bar Container */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Order Status Tracker</h2>
          <p className="text-xs text-slate-500">Track and update the full status of any customer order in real-time</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID (e.g. 1, #ORD-2) or Customer name/email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none text-slate-900 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingApi}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSearchingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Search Order</span>
          </button>
        </form>

        {/* Quick Order Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-2 border-t border-slate-100">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">Quick Select:</span>
          {orders.slice(0, 8).map((o) => {
            const isSelected = activeOrder?.id === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                #ORD-{o.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Order Details Card */}
      {activeOrder ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-6">
          {/* Header Status Row: Order ID, Date & Cancel Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-slate-900">
                  Order #ORD-{activeOrder.id}
                </h3>
                <OrderStatusBadge status={effectiveOrderStatus} size="md" />
                <PaymentStatusBadge order={activeOrder} size="md" />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Placed on {new Date(activeOrder.createdAt).toLocaleDateString()} at {new Date(activeOrder.createdAt).toLocaleTimeString()}</span>
              </p>
            </div>

            {/* Only the Cancel button */}
            {!isCancelled ? (
              <button
                onClick={() => handleUpdate('cancelled')}
                disabled={isUpdating}
                className="px-3.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs border border-rose-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto"
              >
                {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                <span>Cancel</span>
              </button>
            ) : (
              <button
                onClick={() => handleUpdate('pending')}
                disabled={isUpdating}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <span>Reopen Order</span>
              </button>
            )}
          </div>

          {/* Stepper Progress Timeline */}
          {isCancelled ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start sm:items-center justify-between gap-3 text-rose-800 text-xs">
              <div className="flex items-center gap-3">
                <Ban className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">This Order is Cancelled:</span> Fulfillment has stopped.
                </div>
              </div>
              <button
                onClick={() => handleUpdate('pending')}
                disabled={isUpdating}
                className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 rounded-lg text-[11px] cursor-pointer transition-colors"
              >
                Reopen Order
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Fulfillment Timeline & Stage
                </span>
                <span className="text-[11px] text-slate-400">
                  Click any stage to update status
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {stages.map((st, idx) => {
                  const isPassed = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;
                  const Icon = st.icon;

                  return (
                    <div
                      key={st.key}
                      onClick={() => !isUpdating && handleUpdate(st.key)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-emerald-50/80 border-emerald-500 font-bold text-slate-900 shadow-xs ring-2 ring-emerald-500/20'
                          : isPassed
                          ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-300'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                      title={`Set status to ${st.title}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : isPassed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900">{st.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 pl-8">{st.subtitle}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details 2-Column: Customer Information & Payment Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Customer & Shipping Address */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Customer & Delivery Information
              </span>
              <div className="font-bold text-slate-900 text-sm">{activeOrder.user?.username || `Customer #${activeOrder.userId}`}</div>
              
              <div className="space-y-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{activeOrder.user?.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{activeOrder.user?.mobileNo || 'No phone number provided'}</span>
                </div>
              </div>

              {activeOrder.address ? (
                <div className="pt-2 border-t border-slate-200/80 text-slate-700">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>Shipping Destination</span>
                  </div>
                  <div className="font-medium text-slate-900">{activeOrder.address.address_line1 || activeOrder.address.street || activeOrder.address.name}</div>
                  {activeOrder.address.address_line2 && <div className="text-slate-500 text-[11px]">{activeOrder.address.address_line2}</div>}
                  <div className="text-slate-600">{activeOrder.address.city}, {activeOrder.address.state} - {activeOrder.address.pincode || activeOrder.address.postal_code}</div>
                  <div className="text-slate-400 text-[10px]">{activeOrder.address.country || 'India'}</div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200/80 text-slate-400 italic">
                  No delivery address saved for this order.
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  Payment Verification
                </span>
                <PaymentStatusBadge order={activeOrder} size="sm" />
              </div>

              <div className="space-y-1.5 text-slate-700 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Gateway / Method:</span>
                  <span className="font-bold text-slate-900 uppercase">{paymentRecord?.method || 'Online / Razorpay'}</span>
                </div>

                {paymentRecord?.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono text-slate-900 font-semibold">{paymentRecord.razorpayPaymentId}</span>
                  </div>
                )}

                {paymentRecord?.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Razorpay Order ID:</span>
                    <span className="font-mono text-slate-700">{paymentRecord.razorpayOrderId}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-slate-200/80 font-bold">
                  <span className="text-slate-700">Total Charged:</span>
                  <span className="text-emerald-700 text-sm">₹{Number(activeOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Products & Full Cost Breakdown */}
          <div className="space-y-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              Order Items ({activeOrder.orderItems?.length || 0}) & Price Breakdown
            </span>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeOrder.orderItems && activeOrder.orderItems.length > 0 ? (
                    activeOrder.orderItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600">
                          &times; {item.quantity}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">
                          ₹{Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          ₹{Number(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        No item breakdown available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="p-4 bg-slate-50/60 border-t border-slate-200 space-y-1.5 text-slate-600 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{Number(activeOrder.subTotal || activeOrder.totalAmount).toFixed(2)}
                  </span>
                </div>
                {Number(activeOrder.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Promotional Discount:</span>
                    <span>-₹{Number(activeOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                {Number(activeOrder.tax) > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span>₹{Number(activeOrder.tax).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping & Delivery Fee:</span>
                  <span className="text-slate-800 font-medium">
                    {Number(activeOrder.shipping_amount) > 0
                      ? `₹${Number(activeOrder.shipping_amount).toFixed(2)}`
                      : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-900 text-base">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">₹{Number(activeOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-700 text-sm">No order selected</p>
          <p className="mt-1">Enter an order ID or select an order from the list above.</p>
        </div>
      )}
    </div>
  );
};
