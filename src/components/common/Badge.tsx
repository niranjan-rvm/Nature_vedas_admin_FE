import React from 'react';
import { Order, OrderStatus } from '../../types';
import { CheckCircle2, Clock, XCircle, Banknote, RotateCcw } from 'lucide-react';

interface BadgeProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const OrderStatusBadge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status?.toLowerCase() || '';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  switch (normalized) {
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Pending
        </span>
      );
    case 'confirmed':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          Confirmed
        </span>
      );
    case 'shipped':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          Shipped
        </span>
      );
    case 'delivered':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Delivered
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize ${sizeClasses}`}>
          {status || 'Unknown'}
        </span>
      );
  }
};

export interface EffectivePaymentStatus {
  isPaid: boolean;
  isFailed: boolean;
  isCod: boolean;
  isRefunded: boolean;
  statusLabel: 'Paid' | 'Failed' | 'Pending' | 'COD' | 'Refunded';
  method?: string | null;
}

/**
 * Derives the true payment state from order data sent by the backend.
 * Checks order.payment_status first, followed by order.payments, explicit status, and fallback heuristics.
 */
export const getEffectivePaymentStatus = (order?: Order, explicitStatus?: string): EffectivePaymentStatus => {
  const normalize = (val?: string | null) => (val || '').toLowerCase().trim();

  const directStatus = normalize(explicitStatus);
  const orderPaymentStatus = normalize(order?.payment_status);

  // Check payments array from backend if present
  const payments = order?.payments || [];
  const latestPayment = payments[0];
  const paymentRecordStatus = normalize(latestPayment?.paymentstatus);
  const resolvedMethod = latestPayment?.method || null;

  const hasPaidInPayments = payments.some((p) => {
    const s = normalize(p.paymentstatus);
    return s === 'paid' || s === 'captured' || s === 'completed' || s === 'success';
  });

  const hasFailedInPayments = payments.some((p) => {
    const s = normalize(p.paymentstatus);
    return s === 'failed' || s === 'failure' || s === 'declined' || s === 'error';
  });

  // 1. Paid determination:
  // If backend provides payment_status as 'paid' (or 'captured', 'completed', 'success')
  const isPaid =
    ['paid', 'captured', 'completed', 'success'].includes(orderPaymentStatus) ||
    ['paid', 'captured', 'completed', 'success'].includes(directStatus) ||
    ['paid', 'captured', 'completed', 'success'].includes(paymentRecordStatus) ||
    hasPaidInPayments;

  // 2. Failed determination:
  // If backend provides payment_status as 'failed' (or 'failure', 'declined', 'error')
  const isFailed =
    !isPaid && (
      ['failed', 'failure', 'declined', 'error'].includes(orderPaymentStatus) ||
      ['failed', 'failure', 'declined', 'error'].includes(directStatus) ||
      ['failed', 'failure', 'declined', 'error'].includes(paymentRecordStatus) ||
      hasFailedInPayments
    );

  // 3. Refunded determination:
  const isRefunded =
    !isPaid &&
    (orderPaymentStatus === 'refunded' ||
      directStatus === 'refunded' ||
      paymentRecordStatus === 'refunded');

  // 4. COD determination:
  const isCod =
    !isPaid &&
    !isFailed &&
    !isRefunded &&
    (orderPaymentStatus === 'cod' ||
      directStatus === 'cod' ||
      normalize(resolvedMethod) === 'cod' ||
      normalize(order?.order_status) === 'cod');

  // 5. Fallback if payment_status is unset or empty
  let finalPaid = isPaid;
  if (!finalPaid && !isFailed && !isCod && !isRefunded && order?.order_status) {
    const ordSt = normalize(order.order_status);
    if (['confirmed', 'shipped', 'delivered'].includes(ordSt)) {
      finalPaid = true;
    }
  }

  let statusLabel: 'Paid' | 'Failed' | 'Pending' | 'COD' | 'Refunded' = 'Pending';
  if (finalPaid) {
    statusLabel = 'Paid';
  } else if (isFailed) {
    statusLabel = 'Failed';
  } else if (isRefunded) {
    statusLabel = 'Refunded';
  } else if (isCod) {
    statusLabel = 'COD';
  }

  return {
    isPaid: finalPaid,
    isFailed,
    isCod,
    isRefunded,
    statusLabel,
    method: resolvedMethod,
  };
};

interface PaymentBadgeProps {
  order?: Order;
  status?: string;
  method?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentStatusBadge: React.FC<PaymentBadgeProps> = ({ 
  order, 
  status, 
  method, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  const resolved = getEffectivePaymentStatus(order, status);
  const finalMethod = method || resolved.method;

  if (resolved.isPaid) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 ${sizeClasses}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Paid</span>
        {finalMethod && (
          <span className="text-[10px] text-emerald-600 font-medium uppercase px-1 rounded bg-emerald-100/60">
            {finalMethod}
          </span>
        )}
      </span>
    );
  }

  if (resolved.isFailed) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-300 ${sizeClasses}`}>
        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Failed</span>
      </span>
    );
  }

  if (resolved.isRefunded) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-300 ${sizeClasses}`}>
        <RotateCcw className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span>Refunded</span>
      </span>
    );
  }

  if (resolved.isCod) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-300 ${sizeClasses}`}>
        <Banknote className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span>COD</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
      <span>Pending</span>
    </span>
  );
};
