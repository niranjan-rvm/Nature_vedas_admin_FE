import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Order, OrderStatus } from '../types';
import { OrderStatusBadge, PaymentStatusBadge, getEffectivePaymentStatus } from '../components/common/Badge';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  Ban, 
  User, 
  MapPin, 
  Calendar, 
  Receipt, 
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface OrderDetailPageProps {
  orders: Order[];
  onUpdateStatus: (orderId: number, status: OrderStatus) => Promise<void>;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orders = [],
  onUpdateStatus,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const orderId = Number(id);

  useEffect(() => {
    // Check in existing list first
    const found = orders.find((o) => o.id === orderId);
    if (found) {
      setOrder(found);
    } else if (orderId) {
      // Fetch directly from backend
      setLoading(true);
      api.getOrderById(orderId)
        .then((fetched) => setOrder(fetched))
        .catch((err) => {
          toastError(err instanceof Error ? err.message : 'Order not found');
        })
        .finally(() => setLoading(false));
    }
  }, [orderId, orders, toastError]);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
        <span>Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-lg mx-auto space-y-3">
        <p className="font-bold text-slate-800 text-base">Order Not Found</p>
        <p className="text-xs text-slate-500">We couldn't find an order matching #{id}.</p>
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </button>
      </div>
    );
  }

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      await onUpdateStatus(order.id, status);
      setOrder((prev) => (prev ? { ...prev, order_status: status } : null));
      toastSuccess(`Order #${order.id} status updated to ${status.toUpperCase()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status';
      toastError(msg);
    } finally {
      setUpdating(false);
    }
  };

  const steps: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
    { key: 'pending', label: 'Placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Package },
  ];

  const effectiveOrderStatus = (order.order_status || 'pending') as OrderStatus;
  const currentStepIndex = steps.findIndex((s) => s.key === effectiveOrderStatus);
  const isCancelled = effectiveOrderStatus === 'cancelled';
  const paymentRecord = order.payments?.[0];

  return (
    <div className="space-y-4 max-w-4xl mx-auto text-xs">
      {/* Back Button & Title Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </button>

        <div className="flex items-center gap-2">
          <OrderStatusBadge status={effectiveOrderStatus} size="md" />
          <PaymentStatusBadge order={order} size="md" />
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-6">
        {/* Title & Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Order #ORD-{order.id}
            </h2>
            <div className="text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Grand Total</span>
            <span className="text-xl font-black text-slate-900">₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Fulfillment Timeline (if not cancelled) */}
        {isCancelled ? (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
            <Ban className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Cancelled:</span> This order was marked as cancelled.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Order Stage
            </span>
            <div className="relative flex items-center justify-between px-4 sm:px-10">
              <div className="absolute top-1/2 left-10 right-10 -translate-y-1/2 h-1 bg-slate-200 -z-0">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{
                    width: `${Math.max(0, currentStepIndex) / (steps.length - 1) * 100}%`,
                  }}
                ></div>
              </div>

              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 font-bold'
                          : isPassed
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[11px] font-medium mt-1.5 ${isPassed ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Actions */}
        <div className="p-3 rounded-lg bg-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">Update Order Status:</span>
          <div className="flex flex-wrap gap-1">
            {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                disabled={updating || effectiveOrderStatus === st}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  effectiveOrderStatus === st
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column: Customer Details & Payment Verification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer & Shipping */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Customer Information
            </span>
            <div className="font-bold text-slate-900 text-sm">{order.user?.username || `Customer #${order.userId}`}</div>
            <div className="text-slate-600">{order.user?.email || 'No email on record'}</div>
            <div className="text-slate-600">{order.user?.mobileNo || 'No phone on record'}</div>
            {order.address && (
              <div className="pt-2 border-t border-slate-100 text-slate-600 leading-relaxed">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">SHIPPING ADDRESS</span>
                <div>{order.address.address_line1 || order.address.street || order.address.name}</div>
                {order.address.address_line2 && <div className="text-slate-500 text-[11px]">{order.address.address_line2}</div>}
                <div>{order.address.city}, {order.address.state} - {order.address.pincode || order.address.postal_code}</div>
                <div className="text-slate-400 text-[10px]">{order.address.country || 'India'}</div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                Payment Verification
              </span>
              <PaymentStatusBadge order={order} size="sm" />
            </div>

            <div className="pt-1 space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold uppercase">{paymentRecord?.method || 'Online'}</span>
              </div>
              {paymentRecord?.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-slate-800">{paymentRecord.razorpayPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                <span className="text-slate-700">
                  {getEffectivePaymentStatus(order).isPaid ? 'Amount Paid:' : getEffectivePaymentStatus(order).isFailed ? 'Payment Failed:' : 'Amount Due:'}
                </span>
                <span className={`text-sm ${getEffectivePaymentStatus(order).isPaid ? 'text-emerald-700' : getEffectivePaymentStatus(order).isFailed ? 'text-rose-700' : 'text-slate-900'}`}>
                  ₹{Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px] flex justify-between">
            <span>Ordered Products ({order.orderItems?.length || 0})</span>
            <span>Total</span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.orderItems?.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{item.productName}</div>
                  <div className="text-slate-400 text-[11px]">
                    Qty: {item.quantity} &times; ₹{Number(item.unit_price).toFixed(2)}
                  </div>
                </div>
                <div className="font-bold text-slate-900">
                  ₹{Number(item.total_price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50/60 border-t border-slate-200 space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{Number(order.subTotal || 0).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-₹{Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>₹{Number(order.shipping_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Grand Total:</span>
              <span className="text-emerald-700">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
