export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface User {
  id: number;
  username: string;
  email: string;
  mobileNo?: string | null;
  role: 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: number;
  userId?: number;
  name?: string;
  street?: string;
  address_line1?: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code?: string;
  pincode?: string;
  country?: string;
  is_default?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total_price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: number;
  userId: number;
  orderId?: number | null;
  amount: number;
  currency: string;
  method?: string | null;
  paymentstatus: 'pending' | 'captured' | 'failed' | 'refunded' | string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  userId: number;
  addressId?: number | null;
  subTotal: number;
  discount: number;
  shipping_amount: number;
  tax: number;
  totalAmount: number;
  order_status: OrderStatus;
  payment_status: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
  address?: Address | null;
  user?: User | null;
  payments?: Payment[];
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
  price: number;
  quantity: number;
  is_available: boolean;
  categoryId?: number | null;
  category?: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  search?: string;
  q?: string;
}

export interface GetProductsParams extends PaginationParams {
  categoryId?: number | string;
  category?: number | string;
  stock?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetOrdersParams extends PaginationParams {
  status?: string;
  order_status?: string;
  payment_status?: string;
  sortBy?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | string;
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetCategoriesParams extends PaginationParams {}

export interface PaginatedCategoriesResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetBlogsParams extends PaginationParams {
  category?: string;
  status?: 'all' | 'published' | 'draft' | string;
  tag?: string;
}

export interface PaginatedBlogsResponse {
  blogs: Blog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerSummary {
  userId: number;
  username: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  latestOrderDate: string;
}

export interface GetCustomersParams extends PaginationParams {}

export interface PaginatedCustomersResponse {
  customers: CustomerSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Blog {
  id: number;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  image?: string | null;
  cover_image?: string | null;
  read_time?: string;
  author: string;
  category: string;
  tags?: string[];
  is_published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  lowStockCount: number;
  totalBlogs?: number;
}

export type AdminTab = 
  | 'dashboard'
  | 'orders'
  | 'order-status'
  | 'products'
  | 'categories'
  | 'customers'
  | 'blogs';
