import { 
  Order, 
  Product, 
  Category, 
  User, 
  OrderStatus, 
  Blog, 
  GetProductsParams, 
  PaginatedProductsResponse,
  GetOrdersParams,
  PaginatedOrdersResponse,
  GetCategoriesParams,
  PaginatedCategoriesResponse,
  GetBlogsParams,
  PaginatedBlogsResponse,
  GetCustomersParams,
  PaginatedCustomersResponse,
  CustomerSummary
} from '../types';
import { imageStorage } from '../utils/imageStorage';

const rawApiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').trim();
const API_BASE = rawApiUrl
  ? `${rawApiUrl.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

const DEFAULT_BLOGS: Blog[] = [
  {
    id: 1,
    title: 'The Healing Power of Triphala: Digestion & Detoxification',
    slug: 'healing-power-of-triphala',
    category: 'Herbal Remedies',
    author: 'Dr. V. Sharma (BAMS)',
    excerpt: 'Discover how this revered three-fruit Rasayana formulation balances all three doshas and enhances gastrointestinal wellness naturally.',
    content: `Triphala is one of the most celebrated herbal formulations in traditional Ayurvedic medicine. A harmonious synergy of three medicinal fruits native to India—Amalaki (Emblica officinalis), Bibhitaki (Terminalia bellirica), and Haritaki (Terminalia chebula)—it is revered as a Tridoshic Rasayana capable of balancing Vata, Pitta, and Kapha.

### The Three Sacred Fruits:
1. **Amalaki (Indian Gooseberry):** Exceptionally rich in natural Vitamin C and bioflavonoids, cooling to Pitta, and supportive of liver function.
2. **Bibhitaki:** Known for purifying Kapha dosha, clearing excess mucus, and supporting clear respiratory passages and lymphatic circulation.
3. **Haritaki:** Known in classical texts as the "King of Medicines", warming to Vata and promoting gentle natural elimination without habit-forming laxative properties.

### Daily Rituals:
Consume 1/2 teaspoon of pure Triphala powder stirred into warm water, or taken with raw honey and ghee, approximately 30 minutes before bed.`,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    cover_image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    read_time: '4 min read',
    tags: ['Triphala', 'Digestion', 'Detox', 'Rasayana'],
    is_published: true,
    publishedAt: '2026-09-20T10:00:00.000Z',
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 2,
    title: 'Kumkumadi Tailam: The Ancient Golden Elixir for Radiant Skin',
    slug: 'kumkumadi-tailam-radiant-skin',
    category: 'Ayurvedic Skincare',
    author: 'Pooja Hegde (Wellness Specialist)',
    excerpt: 'Formulated with 26 precious herbs including pure Kashmiri Saffron, learn the classical nighttime ritual for luminous complexion.',
    content: `Crafted according to millennia-old Ayurvedic texts like the Ashtanga Hridaya, Kumkumadi Tailam is considered the ultimate beauty nectar for youthful, glowing skin.

### Key Botanical Ingredients:
- **Kashmiri Kesar (Saffron):** Imparts luminosity and evens out pigmentation and blemishes.
- **Raktachandana (Red Sandalwood):** Calms inflammation and soothes redness.
- **Manjistha:** Known as a potent lymphatic purifier and blood refiner that clarifies skin blemishes.
- **Goat Milk & Pure Sesame Base:** Deeply penetrates all seven layers of the skin (Dhatus) to restore natural moisture barriers.

### Application Ritual:
After cleansing, mist your face with pure Damask Rose water. Dispense 2-3 drops of Kumkumadi Tailam onto clean fingertips and gently press into damp facial skin using upward strokes.`,
    image: 'https://images.unsplash.com/photo-1608248597359-2e18195e2820?auto=format&fit=crop&w=800&q=80',
    cover_image: 'https://images.unsplash.com/photo-1608248597359-2e18195e2820?auto=format&fit=crop&w=800&q=80',
    read_time: '5 min read',
    tags: ['Kumkumadi', 'Skincare', 'Saffron', 'Ayurveda'],
    is_published: true,
    publishedAt: '2026-09-18T14:30:00.000Z',
    createdAt: '2026-09-18T14:30:00.000Z',
  },
  {
    id: 3,
    title: 'Managing Stress and Sleep with Ashwagandha & Brahmi',
    slug: 'stress-sleep-ashwagandha-brahmi',
    category: 'Mental Wellness',
    author: 'Dr. K. Nambiar (Ayurveda Acharya)',
    excerpt: 'How adaptogenic roots regulate cortisol levels and promote deep restorative sleep without dependency or morning grogginess.',
    content: `In our fast-paced modern world, elevated Vata and cortisol often manifest as sleep disruptions, mental fatigue, and persistent anxiety. Classical Ayurveda offers Medhya Rasayanas—nootropic botanicals designed to nourish the nervous system (Majja Dhatu).

### Synergy of Ashwagandha & Brahmi:
- **Ashwagandha (Withania somnifera):** A renowned adaptogen that lowers serum cortisol, supports adrenal resilience, and grounds unseated Vata energy.
- **Brahmi (Bacopa monnieri):** Cools the mind, improves cognitive clarity, and promotes calm meditative focus without inducing lethargy.

### Suggested Evening Routine:
Prepare a warm cup of almond or A2 cow's milk infused with a pinch of nutmeg, cardamom, and Ashwagandha extract roughly one hour before bedtime.`,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    cover_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    read_time: '6 min read',
    tags: ['Ashwagandha', 'Brahmi', 'Stress Relief', 'Sleep'],
    is_published: true,
    publishedAt: '2026-09-15T09:15:00.000Z',
    createdAt: '2026-09-15T09:15:00.000Z',
  },
];

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('nature_vedas_admin_token');
  }

  private getHeaders(isJson = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      ...this.getHeaders(!(options.body instanceof FormData)),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        // If unauthorized, clear token and notify
        localStorage.removeItem('nature_vedas_admin_token');
        localStorage.removeItem('nature_vedas_admin_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        throw new Error('Session expired or unauthorized. Please login again.');
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(String(err) || 'Network error connecting to Nature Vedas server');
    }
  }

  // --- Health Check ---
  async checkServerHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (res.ok) return true;
      const fallback = await fetch(`${API_BASE}/products`, { method: 'GET' });
      return fallback.ok;
    } catch {
      return false;
    }
  }

  // --- Auth API ---
  async login(email: string, password: string): Promise<{ token: string; user: User; message: string }> {
    return this.request<{ token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    username: string;
    email: string;
    password: string;
    mobileNo?: string;
    role?: 'admin' | 'user';
  }): Promise<{ token: string; user: User; message: string }> {
    return this.request<{ token: string; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: data.role || 'admin' }),
    });
  }

  async getProfile(userId: number | 'me'): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  // --- Orders API ---
  async getAllOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders');
  }

  async getOrders(params?: GetOrdersParams): Promise<PaginatedOrdersResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Number(params?.limit || params?.pageSize) || 8);
    const status = params?.status || params?.order_status || params?.payment_status;
    const search = (params?.search || params?.q || '').trim();
    const sortBy = params?.sortBy || 'date-desc';

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (status && status !== 'all') {
      query.set('status', status);
      query.set('order_status', status);
    }
    if (search) {
      query.set('search', search);
      query.set('q', search);
    }
    if (sortBy) {
      query.set('sortBy', sortBy);
    }

    const queryString = `?${query.toString()}`;
    let fetchedList: Order[] = [];
    let serverTotal: number | null = null;
    let serverPage: number = page;
    let serverLimit: number = limit;

    try {
      const res = await this.request<any>(`/orders${queryString}`);
      if (Array.isArray(res)) {
        fetchedList = res;
      } else if (res && typeof res === 'object') {
        const list = res.orders || res.data || res.items || res.rows || [];
        if (Array.isArray(list)) fetchedList = list;
        if (typeof res.total === 'number') serverTotal = res.total;
        else if (typeof res.totalCount === 'number') serverTotal = res.totalCount;
        else if (typeof res.count === 'number') serverTotal = res.count;
        else if (typeof res.totalItems === 'number') serverTotal = res.totalItems;

        if (typeof res.page === 'number') serverPage = res.page;
        if (typeof res.limit === 'number') serverLimit = res.limit;
      }
    } catch (err) {
      console.warn('Backend getOrders failed, falling back to local/cached orders:', err);
    }

    // Fallback or unpaginated array handling
    if (serverTotal === null) {
      let filtered = [...fetchedList];
      if (status && status !== 'all') {
        const target = status.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.order_status?.toLowerCase() === target ||
            o.payment_status?.toLowerCase() === target
        );
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((o) => {
          const idMatch = o.id.toString().includes(q) || `ord-${o.id}`.includes(q);
          const userMatch = o.user?.username?.toLowerCase().includes(q) || false;
          const emailMatch = o.user?.email?.toLowerCase().includes(q) || false;
          const phoneMatch = o.user?.mobileNo?.includes(q) || false;
          const cityMatch = o.address?.city?.toLowerCase().includes(q) || false;
          return idMatch || userMatch || emailMatch || phoneMatch || cityMatch;
        });
      }

      filtered.sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'amount-desc') return Number(b.totalAmount) - Number(a.totalAmount);
        if (sortBy === 'amount-asc') return Number(a.totalAmount) - Number(b.totalAmount);
        return 0;
      });

      serverTotal = filtered.length;
      const start = (page - 1) * limit;
      fetchedList = filtered.slice(start, start + limit);
    }

    const total = serverTotal !== null ? serverTotal : fetchedList.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      orders: fetchedList,
      total,
      page: serverPage,
      limit: serverLimit,
      totalPages,
    };
  }

  async getOrderById(orderId: number): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<{ message: string; order: Order }> {
    return this.request<{ message: string; order: Order }>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ order_status: status }),
    });
  }

  async updatePaymentStatus(
    orderId: number,
    paymentStatus: 'paid' | 'failed' | 'pending' | 'cod' | string
  ): Promise<{ message: string; order: Order }> {
    return this.request<{ message: string; order: Order }>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
  }

  async cancelOrder(orderId: number): Promise<{ message: string; order: Order }> {
    return this.request<{ message: string; order: Order }>(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  // --- Products API ---
  private getLocalProducts(): Product[] {
    const raw = localStorage.getItem('nature_vedas_products');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
    return [];
  }

  private saveLocalProducts(products: Product[]): void {
    try {
      localStorage.setItem('nature_vedas_products', JSON.stringify(products));
    } catch {
      try {
        // Strip data URLs from localStorage mirror to avoid quota errors (IndexedDB holds images)
        const lightweight = products.map((p) => ({
          ...p,
          image: p.image?.startsWith('data:') ? undefined : p.image,
        }));
        localStorage.setItem('nature_vedas_products', JSON.stringify(lightweight));
      } catch {
        // Ignore
      }
    }
  }

  private addLocalProduct(product: Product): void {
    const list = this.getLocalProducts();
    const updated = [product, ...list.filter((p) => p.id !== product.id)];
    this.saveLocalProducts(updated);
  }

  private updateLocalProduct(product: Product): void {
    const list = this.getLocalProducts();
    const updated = list.map((p) => (p.id === product.id ? { ...p, ...product } : p));
    if (!list.some((p) => p.id === product.id)) {
      updated.unshift(product);
    }
    this.saveLocalProducts(updated);
  }

  private removeLocalProduct(id: number): void {
    const list = this.getLocalProducts();
    this.saveLocalProducts(list.filter((p) => p.id !== id));
  }

  async getProducts(params?: GetProductsParams): Promise<PaginatedProductsResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Number(params?.limit || params?.pageSize) || 8);
    const rawCategory = params?.categoryId ?? params?.category;
    const categoryId = rawCategory !== undefined && rawCategory !== null ? String(rawCategory).trim() : undefined;
    const search = (params?.search || params?.q || '').trim();
    const stock = params?.stock;

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    
    // Pass category ID parameter if selected and not 'all'
    if (categoryId && categoryId !== 'all') {
      query.set('categoryId', categoryId);
    }
    
    // Pass search parameter if present
    if (search) {
      query.set('search', search);
    }

    // Pass stock filter if specified
    if (stock && stock !== 'all') {
      query.set('stock', stock);
    }

    const queryString = `?${query.toString()}`;
    let fetchedList: Product[] = [];
    let serverTotal: number | null = null;
    let serverPage: number = page;
    let serverLimit: number = limit;

    try {
      const res = await this.request<any>(`/products${queryString}`);
      if (Array.isArray(res)) {
        fetchedList = res;
      } else if (res && typeof res === 'object') {
        const list = res.products || res.data || res.items || res.rows || [];
        if (Array.isArray(list)) {
          fetchedList = list;
        }
        if (typeof res.total === 'number') serverTotal = res.total;
        else if (typeof res.totalCount === 'number') serverTotal = res.totalCount;
        else if (typeof res.count === 'number') serverTotal = res.count;
        else if (typeof res.totalItems === 'number') serverTotal = res.totalItems;

        if (typeof res.page === 'number') serverPage = res.page;
        if (typeof res.limit === 'number') serverLimit = res.limit;
      }

      // If backend returned items and no filtering is applied, update local cache
      if (fetchedList.length > 0 && (!categoryId || categoryId === 'all') && !search && (!stock || stock === 'all')) {
        this.saveLocalProducts(fetchedList);
      }
    } catch (err) {
      console.warn('Backend getProducts failed, falling back to local data:', err);
    }

    // Helper for strict category matching
    const matchesCategory = (p: Product, targetCat: string): boolean => {
      const target = targetCat.trim().toLowerCase();
      const pCatId = p.categoryId !== undefined && p.categoryId !== null ? String(p.categoryId).trim().toLowerCase() : '';
      const nestedCatId = p.category?.id !== undefined && p.category?.id !== null ? String(p.category.id).trim().toLowerCase() : '';
      const nestedCatName = p.category?.name ? p.category.name.trim().toLowerCase() : '';
      return pCatId === target || nestedCatId === target || (nestedCatName !== '' && nestedCatName === target);
    };

    // If specific category is requested, strictly enforce that fetched items belong to that category ONLY
    if (categoryId && categoryId !== 'all') {
      fetchedList = fetchedList.filter((p) => matchesCategory(p, categoryId));
      if (serverTotal !== null && fetchedList.length === 0) {
        serverTotal = 0;
      }
    }

    // If server returned empty or failed (offline fallback)
    if (fetchedList.length === 0 && serverTotal === null) {
      let local = this.getLocalProducts();

      // Filter by category strictly
      if (categoryId && categoryId !== 'all') {
        local = local.filter((p) => matchesCategory(p, categoryId));
      }

      // Filter by search keyword
      if (search) {
        const q = search.toLowerCase();
        local = local.filter(
          (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
        );
      }

      // Filter by stock status
      if (stock === 'out-of-stock') {
        local = local.filter((p) => p.quantity <= 0);
      } else if (stock === 'low-stock') {
        local = local.filter((p) => p.quantity > 0 && p.quantity <= 10);
      } else if (stock === 'in-stock') {
        local = local.filter((p) => p.quantity > 10);
      }

      serverTotal = local.length;
      const start = (page - 1) * limit;
      fetchedList = local.slice(start, start + limit);
    }

    // If backend returned an unpaginated array (all matching items without slicing)
    if (serverTotal === null) {
      if (categoryId && categoryId !== 'all') {
        fetchedList = fetchedList.filter((p) => matchesCategory(p, categoryId));
      }
      if (search) {
        const q = search.toLowerCase();
        fetchedList = fetchedList.filter(
          (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
        );
      }
      if (stock === 'out-of-stock') {
        fetchedList = fetchedList.filter((p) => p.quantity <= 0);
      } else if (stock === 'low-stock') {
        fetchedList = fetchedList.filter((p) => p.quantity > 0 && p.quantity <= 10);
      } else if (stock === 'in-stock') {
        fetchedList = fetchedList.filter((p) => p.quantity > 10);
      }

      serverTotal = fetchedList.length;
      const start = (page - 1) * limit;
      fetchedList = fetchedList.slice(start, start + limit);
    }

    // Hydrate any custom images saved in persistent IndexedDB storage
    const savedImages = await imageStorage.getAllImages('product');
    const hydratedProducts = fetchedList.map((p) => {
      const savedImg = savedImages[String(p.id)] || (p.name ? savedImages[p.name] : null);
      if (savedImg && (!p.image || !p.image.startsWith('http') || p.image.length < 50)) {
        return { ...p, image: savedImg };
      }
      return p;
    });

    const finalTotal = serverTotal !== null ? serverTotal : hydratedProducts.length;
    const totalPages = Math.max(1, Math.ceil(finalTotal / limit));

    return {
      products: hydratedProducts,
      total: finalTotal,
      page: serverPage,
      limit: serverLimit,
      totalPages,
    };
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const res = await this.getProducts({ page: 1, limit: 1000 });
      return res.products;
    } catch {
      return this.getLocalProducts();
    }
  }

  async getProductById(id: number): Promise<Product> {
    const savedImg = await imageStorage.getImage('product', id);
    try {
      const p = await this.request<Product>(`/products/${id}`);
      if (savedImg && (!p.image || !p.image.startsWith('http'))) {
        return { ...p, image: savedImg };
      }
      return p;
    } catch {
      const local = this.getLocalProducts();
      const found = local.find((p) => p.id === id);
      if (found) {
        if (savedImg) found.image = savedImg;
        return found;
      }
      throw new Error(`Product #${id} not found`);
    }
  }

  async createProduct(product: Partial<Product>): Promise<{ message: string; product: Product }> {
    let createdProduct: Product | null = null;
    let message = 'Product created successfully';

    try {
      const res = await this.request<{ message: string; product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
      if (res?.product) {
        createdProduct = res.product;
        message = res.message || message;
      }
    } catch (err) {
      console.warn('Backend createProduct failed, falling back to local:', err);
    }

    if (!createdProduct) {
      createdProduct = {
        id: Date.now(),
        name: product.name || 'New Product',
        description: product.description || '',
        image: product.image || null,
        price: Number(product.price) || 0,
        quantity: Number(product.quantity) || 0,
        is_available: product.is_available ?? true,
        categoryId: product.categoryId ? Number(product.categoryId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Preserve the image if backend didn't save or return it
    if (product.image && !createdProduct.image) {
      createdProduct.image = product.image;
    }

    // Save image to persistent browser storage
    const imgToSave = product.image || createdProduct.image;
    if (imgToSave) {
      await imageStorage.saveImage('product', createdProduct.id, imgToSave);
      if (createdProduct.name) {
        await imageStorage.saveImage('product', createdProduct.name, imgToSave);
      }
    }

    this.addLocalProduct(createdProduct);
    return { message, product: createdProduct };
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<{ message: string; product: Product }> {
    // Persist image immediately to browser IndexedDB
    if (product.image) {
      await imageStorage.saveImage('product', id, product.image);
      if (product.name) {
        await imageStorage.saveImage('product', product.name, product.image);
      }
    }

    try {
      const res = await this.request<{ message: string; product: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      });
      const updatedProd = res.product || ({ ...product, id } as Product);
      if (product.image && !updatedProd.image) {
        updatedProd.image = product.image;
      }
      this.updateLocalProduct(updatedProd);
      return { message: res.message || 'Product updated successfully', product: updatedProd };
    } catch (err) {
      console.warn('Backend updateProduct failed, updating locally:', err);
      const localProducts = this.getLocalProducts();
      const existing = localProducts.find((p) => p.id === id);
      const updatedProd: Product = {
        ...(existing || ({} as Product)),
        ...product,
        id,
        updatedAt: new Date().toISOString(),
      };
      if (product.image) {
        updatedProd.image = product.image;
      }
      this.updateLocalProduct(updatedProd);
      return { message: 'Product updated successfully', product: updatedProd };
    }
  }

  async deleteProduct(id: number): Promise<{ message: string }> {
    await imageStorage.deleteImage('product', id);
    try {
      await this.request<{ message: string }>(`/products/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Backend failed, delete locally
    }
    this.removeLocalProduct(id);
    return { message: 'Product deleted successfully' };
  }

  // --- Categories API ---
  async getCategories(params?: GetCategoriesParams): Promise<PaginatedCategoriesResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Number(params?.limit || params?.pageSize) || 8);
    const search = (params?.search || params?.q || '').trim();

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (search) {
      query.set('search', search);
      query.set('q', search);
    }

    const queryString = `?${query.toString()}`;
    let fetchedList: Category[] = [];
    let serverTotal: number | null = null;
    let serverPage: number = page;
    let serverLimit: number = limit;

    try {
      const res = await this.request<any>(`/categories${queryString}`);
      if (Array.isArray(res)) {
        fetchedList = res;
      } else if (res && typeof res === 'object') {
        const list = res.categories || res.data || res.items || res.rows || [];
        if (Array.isArray(list)) fetchedList = list;
        if (typeof res.total === 'number') serverTotal = res.total;
        else if (typeof res.totalCount === 'number') serverTotal = res.totalCount;
        else if (typeof res.count === 'number') serverTotal = res.count;
        else if (typeof res.totalItems === 'number') serverTotal = res.totalItems;

        if (typeof res.page === 'number') serverPage = res.page;
        if (typeof res.limit === 'number') serverLimit = res.limit;
      }
    } catch (err) {
      console.warn('Backend getCategories failed:', err);
    }

    if (serverTotal === null) {
      let filtered = [...fetchedList];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((c) => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
      }
      serverTotal = filtered.length;
      const start = (page - 1) * limit;
      fetchedList = filtered.slice(start, start + limit);
    }

    const total = serverTotal !== null ? serverTotal : fetchedList.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      categories: fetchedList,
      total,
      page: serverPage,
      limit: serverLimit,
      totalPages,
    };
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const res = await this.getCategories({ page: 1, limit: 1000 });
      return res.categories;
    } catch {
      return [];
    }
  }

  async createCategory(category: { name: string; description: string }): Promise<{ message: string; category?: Category }> {
    return this.request<{ message: string; category?: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: number, category: { name: string; description?: string }): Promise<{ message: string; category?: Category }> {
    return this.request<{ message: string; category?: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Blogs API ---
  private normalizeBlog(b: any): Blog {
    const contentStr = typeof b?.content === 'string' 
      ? b.content 
      : (b?.content?.rendered || (typeof b?.content === 'object' && b?.content ? JSON.stringify(b.content) : ''));
    const excerptStr = typeof b?.excerpt === 'string' 
      ? b.excerpt 
      : (b?.excerpt?.rendered || (contentStr ? contentStr.slice(0, 160) : ''));
    const titleStr = typeof b?.title === 'string' 
      ? b.title 
      : (b?.title?.rendered || 'Untitled Article');

    return {
      ...b,
      id: Number(b?.id || Date.now()),
      title: titleStr,
      slug: typeof b?.slug === 'string' ? b.slug : titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: excerptStr,
      content: contentStr,
      category: typeof b?.category === 'string' ? b.category : 'Herbal Remedies',
      author: typeof b?.author === 'string' ? b.author : (b?.author?.name || 'Nature Vedas Team'),
      tags: Array.isArray(b?.tags) ? b.tags : [],
      is_published: b?.is_published ?? true,
      cover_image: b?.cover_image || b?.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      image: b?.image || b?.cover_image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      read_time: typeof b?.read_time === 'string' ? b.read_time : '5 min read',
      createdAt: b?.createdAt || new Date().toISOString(),
    };
  }

  private getLocalBlogs(): Blog[] {
    const raw = localStorage.getItem('nature_vedas_blogs');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b) => this.normalizeBlog(b));
        }
      } catch {
        // Fallback to default
      }
    }
    this.saveLocalBlogs(DEFAULT_BLOGS);
    return DEFAULT_BLOGS;
  }

  private saveLocalBlogs(blogs: Blog[]): void {
    const normalized = blogs.map((b) => this.normalizeBlog(b));
    try {
      localStorage.setItem('nature_vedas_blogs', JSON.stringify(normalized));
    } catch {
      // If localStorage quota exceeded due to large base64 strings, save lightweight version (IndexedDB stores images)
      try {
        const lightweight = normalized.map((b) => ({
          ...b,
          image: b.image?.startsWith('data:') ? undefined : b.image,
          cover_image: b.cover_image?.startsWith('data:') ? undefined : b.cover_image,
        }));
        localStorage.setItem('nature_vedas_blogs', JSON.stringify(lightweight));
      } catch {
        // Ignore
      }
    }
  }

  async getBlogs(params?: GetBlogsParams): Promise<PaginatedBlogsResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Number(params?.limit || params?.pageSize) || 6);
    const category = params?.category;
    const status = params?.status;
    const search = (params?.search || params?.q || '').trim();

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (category && category !== 'all') {
      query.set('category', category);
    }
    if (status && status !== 'all') {
      query.set('status', status);
      query.set('is_published', status === 'published' ? 'true' : 'false');
    }
    if (search) {
      query.set('search', search);
      query.set('q', search);
    }

    const queryString = `?${query.toString()}`;
    let blogList: Blog[] = [];
    let serverTotal: number | null = null;
    let serverPage: number = page;
    let serverLimit: number = limit;

    try {
      const res = await this.request<any>(`/blogs${queryString}`);
      if (Array.isArray(res)) {
        blogList = res.map((b) => this.normalizeBlog(b));
      } else if (res && typeof res === 'object') {
        const list = res.blogs || res.data || res.items || res.rows || [];
        if (Array.isArray(list)) blogList = list.map((b) => this.normalizeBlog(b));
        if (typeof res.total === 'number') serverTotal = res.total;
        else if (typeof res.totalCount === 'number') serverTotal = res.totalCount;
        else if (typeof res.count === 'number') serverTotal = res.count;
        else if (typeof res.totalItems === 'number') serverTotal = res.totalItems;

        if (typeof res.page === 'number') serverPage = res.page;
        if (typeof res.limit === 'number') serverLimit = res.limit;
      }
    } catch {
      // Backend route not available, use local storage fallback
    }

    if (blogList.length === 0 && serverTotal === null) {
      let local = this.getLocalBlogs();
      if (category && category !== 'all') {
        local = local.filter((b) => b.category?.toLowerCase() === category.toLowerCase());
      }
      if (status === 'published') {
        local = local.filter((b) => b.is_published);
      } else if (status === 'draft') {
        local = local.filter((b) => !b.is_published);
      }
      if (search) {
        const q = search.toLowerCase();
        local = local.filter((b) =>
          b.title?.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q)
        );
      }
      serverTotal = local.length;
      const start = (page - 1) * limit;
      blogList = local.slice(start, start + limit);
    }

    if (serverTotal === null) {
      serverTotal = blogList.length;
      const start = (page - 1) * limit;
      blogList = blogList.slice(start, start + limit);
    }

    // Hydrate any custom images saved in persistent IndexedDB storage
    const savedImages = await imageStorage.getAllImages('blog');
    const hydratedBlogs = blogList.map((b) => {
      const savedImg = savedImages[String(b.id)] || (b.slug ? savedImages[b.slug] : null);
      if (savedImg) {
        return {
          ...b,
          cover_image: savedImg,
          image: savedImg,
        };
      }
      return b;
    });

    const total = serverTotal !== null ? serverTotal : hydratedBlogs.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      blogs: hydratedBlogs,
      total,
      page: serverPage,
      limit: serverLimit,
      totalPages,
    };
  }

  async getAllBlogs(): Promise<Blog[]> {
    try {
      const res = await this.getBlogs({ page: 1, limit: 1000 });
      return res.blogs;
    } catch {
      return this.getLocalBlogs();
    }
  }

  async getBlogById(id: number): Promise<Blog> {
    const savedImg = await imageStorage.getImage('blog', id);
    try {
      const b = await this.request<Blog>(`/blogs/${id}`);
      if (b) {
        const norm = this.normalizeBlog(b);
        if (savedImg) {
          norm.cover_image = savedImg;
          norm.image = savedImg;
        }
        return norm;
      }
    } catch {
      // Fallback to local
    }

    const blogs = this.getLocalBlogs();
    const found = blogs.find((b) => b.id === id);
    if (found) {
      if (savedImg) {
        found.cover_image = savedImg;
        found.image = savedImg;
      }
      return found;
    }
    throw new Error(`Blog #${id} not found`);
  }

  // --- Upload API ---
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('file', file);

    const endpoints = ['/upload', '/upload/image', '/products/upload', '/blogs/upload'];
    for (const ep of endpoints) {
      try {
        const res = await this.request<any>(ep, {
          method: 'POST',
          body: formData,
        });
        const url = res?.url || res?.imageUrl || res?.image || res?.path || res?.data?.url || res?.file?.url;
        if (typeof url === 'string' && url) {
          const fullUrl = url.startsWith('http')
            ? url
            : `${API_BASE.replace('/api/v1', '')}${url.startsWith('/') ? '' : '/'}${url}`;
          return { url: fullUrl };
        }
      } catch {
        // try next endpoint
      }
    }
    throw new Error('No dedicated upload endpoint available on server');
  }

  async createBlog(data: Partial<Blog>): Promise<{ message: string; blog: Blog }> {
    const img = data.cover_image || data.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80';
    const newBlog: Blog = {
      id: data.id || Date.now(),
      title: data.title || 'Untitled Post',
      slug: (data.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: data.excerpt || '',
      content: data.content || '',
      image: img,
      cover_image: img,
      read_time: data.read_time || '5 min read',
      author: data.author || 'Nature Vedas Team',
      category: data.category || 'Ayurveda',
      tags: data.tags || ['Ayurveda', 'Wellness'],
      is_published: data.is_published ?? true,
      publishedAt: data.is_published ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save image to persistent browser IndexedDB
    if (img) {
      await imageStorage.saveImage('blog', newBlog.id, img);
      if (newBlog.slug) {
        await imageStorage.saveImage('blog', newBlog.slug, img);
      }
    }

    try {
      const res = await this.request<{ message: string; blog: Blog }>('/blogs', {
        method: 'POST',
        body: JSON.stringify(newBlog),
      });
      if (res?.blog) {
        const normalized = this.normalizeBlog(res.blog);
        if (img && (!normalized.cover_image || !normalized.image)) {
          normalized.cover_image = img;
          normalized.image = img;
        }
        const blogs = this.getLocalBlogs();
        this.saveLocalBlogs([normalized, ...blogs.filter((b) => b.id !== normalized.id)]);
        return { message: res.message || 'Blog created successfully', blog: normalized };
      }
    } catch (err) {
      console.warn('Backend createBlog failed, falling back to local:', err);
    }

    const blogs = this.getLocalBlogs();
    const updatedList = [newBlog, ...blogs.filter((b) => b.id !== newBlog.id)];
    this.saveLocalBlogs(updatedList);
    return { message: 'Blog created successfully', blog: newBlog };
  }

  async updateBlog(id: number, data: Partial<Blog>): Promise<{ message: string; blog: Blog }> {
    const img = data.cover_image || data.image;
    if (img) {
      await imageStorage.saveImage('blog', id, img);
      if (data.slug) {
        await imageStorage.saveImage('blog', data.slug, img);
      }
    }

    const payload = {
      ...data,
      ...(img ? { image: img, cover_image: img } : {}),
    };

    try {
      const res = await this.request<{ message: string; blog: Blog }>(`/blogs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res?.blog) {
        const normalized = this.normalizeBlog(res.blog);
        if (img) {
          normalized.cover_image = img;
          normalized.image = img;
        }
        const blogs = this.getLocalBlogs();
        this.saveLocalBlogs(blogs.map((b) => (b.id === id ? normalized : b)));
        return { message: res.message || 'Blog updated successfully', blog: normalized };
      }
    } catch (err) {
      console.warn('Backend updateBlog failed, falling back to local:', err);
    }

    const blogs = this.getLocalBlogs();
    const existing = blogs.find((b) => b.id === id);
    const updatedBlog: Blog = {
      ...(existing || ({} as Blog)),
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    if (img) {
      updatedBlog.image = img;
      updatedBlog.cover_image = img;
    }
    const updatedList = blogs.map((b) => (b.id === id ? updatedBlog : b));
    this.saveLocalBlogs(updatedList);
    return { message: 'Blog updated successfully', blog: updatedBlog };
  }

  async deleteBlog(id: number): Promise<{ message: string }> {
    await imageStorage.deleteImage('blog', id);
    try {
      await this.request<{ message: string }>(`/blogs/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Backend not available, delete locally
    }

    const blogs = this.getLocalBlogs();
    this.saveLocalBlogs(blogs.filter((b) => b.id !== id));
    return { message: 'Blog deleted successfully' };
  }

  // --- Customers API ---
  async getCustomers(params?: GetCustomersParams): Promise<PaginatedCustomersResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Number(params?.limit || params?.pageSize) || 8);
    const search = (params?.search || params?.q || '').trim();

    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (search) {
      query.set('search', search);
      query.set('q', search);
    }

    const queryString = `?${query.toString()}`;
    let customerList: CustomerSummary[] = [];
    let serverTotal: number | null = null;
    let serverPage: number = page;
    let serverLimit: number = limit;

    try {
      const res = await this.request<any>(`/users${queryString}`);
      if (Array.isArray(res)) {
        customerList = res.map((u: any) => ({
          userId: Number(u.id || u.userId),
          username: u.username || `Customer #${u.id}`,
          email: u.email || 'N/A',
          phone: u.mobileNo || u.phone || 'N/A',
          ordersCount: Number(u.ordersCount) || 0,
          totalSpent: Number(u.totalSpent) || 0,
          latestOrderDate: u.latestOrderDate || u.createdAt || new Date().toISOString(),
        }));
      } else if (res && typeof res === 'object') {
        const list = res.users || res.customers || res.data || [];
        if (Array.isArray(list)) {
          customerList = list.map((u: any) => ({
            userId: Number(u.id || u.userId),
            username: u.username || `Customer #${u.id}`,
            email: u.email || 'N/A',
            phone: u.mobileNo || u.phone || 'N/A',
            ordersCount: Number(u.ordersCount) || 0,
            totalSpent: Number(u.totalSpent) || 0,
            latestOrderDate: u.latestOrderDate || u.createdAt || new Date().toISOString(),
          }));
        }
        if (typeof res.total === 'number') serverTotal = res.total;
        else if (typeof res.totalCount === 'number') serverTotal = res.totalCount;
        else if (typeof res.count === 'number') serverTotal = res.count;
        else if (typeof res.totalItems === 'number') serverTotal = res.totalItems;

        if (typeof res.page === 'number') serverPage = res.page;
        if (typeof res.limit === 'number') serverLimit = res.limit;
      }
    } catch {
      // Endpoint fallback
    }

    if (customerList.length === 0 && serverTotal === null) {
      const orders = await this.getAllOrders().catch(() => []);
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
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (c) =>
            c.username.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.includes(q)
        );
      }
      serverTotal = list.length;
      const start = (page - 1) * limit;
      customerList = list.slice(start, start + limit);
    }

    const total = serverTotal !== null ? serverTotal : customerList.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      customers: customerList,
      total,
      page: serverPage,
      limit: serverLimit,
      totalPages,
    };
  }
}

export const api = new ApiService();
