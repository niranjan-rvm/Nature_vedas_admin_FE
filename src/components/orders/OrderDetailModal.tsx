import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { 
  Order, 
  OrderStatus 
} from '../../types';
import { Modal } from '../common/Modal';
import { OrderStatusBadge, PaymentStatusBadge } from '../common/Badge';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  Ban,
  Receipt,
  CreditCard,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: number, newStatus: OrderStatus) => Promise<void>;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      await onUpdateStatus(order.id, status);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order #ORD-${order.id}`}
      subtitle={`Placed on ${new Date(order.createdAt).toLocaleDateString()} at ${new Date(order.createdAt).toLocaleTimeString()}`}
      maxWidth="3xl"
    >
      <div className="space-y-5 text-xs">
        {/* Top Two Cards: Payment Status & Fulfillment Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Payment Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment Status
              </span>
              <PaymentStatusBadge order={order} size="sm" />
            </div>

            <div className="pt-1 space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold uppercase">{paymentRecord?.method || 'Online / Razorpay'}</span>
              </div>
              {paymentRecord?.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-[11px] text-slate-800">{paymentRecord.razorpayPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-emerald-800 text-sm">₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                Order Status
              </span>
              <OrderStatusBadge status={effectiveOrderStatus} size="sm" />
            </div>

            {/* Quick Status Update Buttons */}
            <div className="pt-1">
              <span className="text-slate-500 block mb-1.5">Change Order Stage:</span>
              <div className="flex flex-wrap gap-1">
                {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={updating || effectiveOrderStatus === st}
                    className={`px-2 py-1 rounded text-[11px] font-medium capitalize cursor-pointer transition-colors ${
                      effectiveOrderStatus === st
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fulfillment Stepper (if not cancelled) */}
        {!isCancelled && (
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="relative flex items-center justify-between px-4 sm:px-8 py-2">
              <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-100 -z-0">
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 font-bold'
                          : isPassed
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-white border border-slate-300 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[11px] font-medium mt-1 ${isPassed ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Customer
            </span>
            <div className="font-bold text-slate-900 text-xs">{order.user?.username || `Customer #${order.userId}`}</div>
            <div className="text-slate-600">{order.user?.email || 'No email provided'}</div>
            <div className="text-slate-600">{order.user?.mobileNo || 'No phone provided'}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Shipping Address
            </span>
            {order.address ? (
              <div className="text-slate-700 leading-relaxed">
                <div className="font-medium text-slate-900">{order.address.address_line1 || order.address.street || order.address.name}</div>
                {order.address.address_line2 && <div className="text-slate-500 text-[11px]">{order.address.address_line2}</div>}
                <div>{order.address.city}, {order.address.state} - {order.address.pincode || order.address.postal_code}</div>
                <div className="text-slate-500 text-[11px]">{order.address.country || 'India'}</div>
              </div>
            ) : (
              <div className="text-slate-400 italic">No delivery address saved.</div>
            )}
          </div>
        </div>

        {/* Ordered Items */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between font-bold text-slate-600 text-[11px] uppercase tracking-wider">
            <span>Ordered Items ({order.orderItems?.length || 0})</span>
            <span>Total</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {order.orderItems?.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{item.productName}</div>
                  <div className="text-slate-500 text-[11px]">
                    Qty: {item.quantity} &times; ₹{Number(item.unit_price).toFixed(2)}
                  </div>
                </div>
                <div className="font-bold text-slate-900">
                  ₹{Number(item.total_price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-1 text-slate-600 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">₹{Number(order.subTotal || 0).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-₹{Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Fee:</span>
              <span>₹{Number(order.shipping_amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
              <span>Total Amount:</span>
              <span className="text-emerald-700">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/orders/${order.id}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Dedicated Page</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
