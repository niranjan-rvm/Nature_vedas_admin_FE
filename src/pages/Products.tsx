import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  Layers,
  Sparkles,
  Upload,
  Filter
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { processImageFile } from '../utils/imageUpload';
import { resolveProductImageUrl } from '../utils/imageStorage';

interface ProductsPageProps {
  products?: Product[];
  categories: Category[];
  isLoading?: boolean;
  onRefresh: () => void;
  onCreateProduct: (product: Partial<Product>) => Promise<void>;
  onUpdateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products = [],
  categories = [],
  isLoading = false,
  onRefresh,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  isAddModalOpen = false,
  onCloseAddModal,
  searchQuery,
  onSearchChange,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters (e.g. ?categoryId=2&page=1)
  const categoryParam = searchParams.get('categoryId') || searchParams.get('category') || 'all';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const stockParam = (searchParams.get('stock') as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock') || 'all';

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>(stockParam);
  const [currentPage, setCurrentPage] = useState<number>(Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);
  const pageSize = 8;

  // Sync state when URL search params change
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    if (!Number.isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage(pageParam);
    }
  }, [pageParam]);

  useEffect(() => {
    setStockFilter(stockParam);
  }, [stockParam]);

  // API Paginated Products state
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Fetch products directly from API with pagination, categoryId, search, and stock parameters
  const fetchProductsFromApi = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await api.getProducts({
        page: currentPage,
        limit: pageSize,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        stock: stockFilter !== 'all' ? stockFilter : undefined,
      });
      setApiProducts(res.products);
      setTotalItems(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch products';
      toastError(msg);
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, pageSize, selectedCategory, searchQuery, stockFilter, toastError]);

  // Trigger API fetch whenever page, category, search, or stock filters change
  useEffect(() => {
    fetchProductsFromApi();
  }, [fetchProductsFromApi]);

  // Strict filter safeguard: When a specific category is requested, display ONLY products of that category
  const displayedProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      return apiProducts;
    }
    const target = String(selectedCategory).trim().toLowerCase();
    return apiProducts.filter((p) => {
      const pCatId = p.categoryId !== undefined && p.categoryId !== null ? String(p.categoryId).trim().toLowerCase() : '';
      const nestedCatId = p.category?.id !== undefined && p.category?.id !== null ? String(p.category.id).trim().toLowerCase() : '';
      const nestedCatName = p.category?.name ? p.category.name.trim().toLowerCase() : '';
      return pCatId === target || nestedCatId === target || (nestedCatName !== '' && nestedCatName === target);
    });
  }, [apiProducts, selectedCategory]);

  // Strict total count safeguard
  const effectiveTotal = useMemo(() => {
    if (selectedCategory !== 'all') {
      if (apiProducts.length > 0 && displayedProducts.length === 0) return 0;
      return totalItems;
    }
    return totalItems;
  }, [selectedCategory, apiProducts.length, displayedProducts.length, totalItems]);

  // URL Param synchronizers
  const handleCategoryChange = (newCatId: string) => {
    setSelectedCategory(newCatId);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newCatId === 'all') {
      newParams.delete('categoryId');
      newParams.delete('category');
    } else {
      newParams.set('categoryId', newCatId);
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

  const handleStockChange = (newStock: typeof stockFilter) => {
    setStockFilter(newStock);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newStock === 'all') {
      newParams.delete('stock');
    } else {
      newParams.set('stock', newStock);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Modal states
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const isCreateOpen = isAddModalOpen || internalAddOpen;
  const closeCreate = () => {
    setInternalAddOpen(false);
    onCloseAddModal?.();
  };

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('/assets/products/neem-facewash.jpg');
  const [formPrice, setFormPrice] = useState<number | string>('299.00');
  const [formQuantity, setFormQuantity] = useState<number | string>('50');
  const [formCategory, setFormCategory] = useState<number | string>('');
  const [formAvailable, setFormAvailable] = useState<boolean>(true);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Presets for demo
  const sampleImages = [
    { label: 'Neem Face Wash', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
    { label: 'Kumkumadi Oil', url: 'https://images.unsplash.com/photo-1608248597359-2e18195e2820?auto=format&fit=crop&w=600&q=80' },
    { label: 'Brahmi Hair Oil', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
    { label: 'Chyawanprash', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
    { label: 'Ashwagandha Powder', url: 'https://images.unsplash.com/photo-1512290900672-1f55b9e078c5?auto=format&fit=crop&w=600&q=80' },
    { label: 'Herbal Shampoo', url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
  ];

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const processed = await processImageFile(file, 10);
      setFormImage(processed.url);
      setUploadedFileName(`${processed.fileName} (~${processed.sizeKB}KB)`);
      toastSuccess(`Product image "${processed.fileName}" prepared and ready to save!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process image';
      setUploadError(msg);
      toastError(msg);
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormImage(sampleImages[0].url);
    setFormPrice('299.00');
    setFormQuantity('50');
    setFormCategory(categories[0]?.id || '');
    setFormAvailable(true);
    setUploadedFileName(null);
    setUploadError(null);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name || '');
    setFormDesc(p.description || '');
    setFormImage(p.image || '');
    setFormPrice(p.price ?? 0);
    setFormQuantity(p.quantity ?? 0);
    setFormCategory(p.categoryId || '');
    setFormAvailable(p.is_available ?? true);
    setUploadedFileName(null);
    setUploadError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (formName || '').trim();
    const cleanDesc = (formDesc || '').trim();
    const cleanImage = (formImage || '').trim();

    if (!cleanName || !cleanDesc || !cleanImage) {
      toastError('Please fill in name, description, and image URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateProduct({
        name: cleanName,
        description: cleanDesc,
        image: cleanImage,
        price: Number(formPrice),
        quantity: Number(formQuantity),
        categoryId: formCategory ? Number(formCategory) : null,
        is_available: formAvailable,
      });
      await fetchProductsFromApi();
      toastSuccess(`Product "${cleanName}" created successfully!`);
      closeCreate();
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const cleanName = (formName || '').trim();
    const cleanDesc = (formDesc || '').trim();
    const cleanImage = (formImage || '').trim();

    if (!cleanName) {
      toastError('Product name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateProduct(editingProduct.id, {
        name: cleanName,
        description: cleanDesc,
        image: cleanImage,
        price: Number(formPrice),
        quantity: Number(formQuantity),
        categoryId: formCategory ? Number(formCategory) : null,
        is_available: formAvailable,
      });
      await fetchProductsFromApi();
      toastSuccess(`Product "${cleanName}" updated successfully!`);
      setEditingProduct(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update product';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    try {
      await onDeleteProduct(deletingProduct.id);
      await fetchProductsFromApi();
      toastSuccess(`Product "${deletingProduct.name}" deleted.`);
      setDeletingProduct(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (p: Product) => {
    const updated = !p.is_available;
    try {
      await onUpdateProduct(p.id, { is_available: updated });
      await fetchProductsFromApi();
      toastSuccess(`${p.name} is now ${updated ? 'Available' : 'Unavailable'}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update availability';
      toastError(msg);
    }
  };

  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find((c) => c.id.toString() === selectedCategory) || null;
  }, [categories, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name or herbs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Dropdown */}
          <div className="relative">
            <select
              value={stockFilter}
              onChange={(e) => handleStockChange(e.target.value as typeof stockFilter)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock (&gt;10)</option>
              <option value="low-stock">Low Stock (1-10)</option>
              <option value="out-of-stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Right Action: Add Product & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              onRefresh();
              fetchProductsFromApi();
            }}
            disabled={isFetching || isLoading}
            title="Refresh Products"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${(isFetching || isLoading) ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              resetForm();
              setInternalAddOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Product & Image</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(isFetching || isLoading) ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading products from API (Page {currentPage})...</span>
                  </td>
                </tr>
              ) : displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedCategory !== 'all'
                        ? `No products available under "${activeCategoryObj?.name || 'Category #' + selectedCategory}".`
                        : 'Try modifying your search or filters.'}
                    </p>
                    {selectedCategory !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleCategoryChange('all')}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        View All Products
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => {
                  const isLow = p.quantity > 0 && p.quantity <= 10;
                  const isOut = p.quantity <= 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-default"
                    >
                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                            {p.image ? (
                              <img
                                src={resolveProductImageUrl(p.image)}
                                alt={p.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80';
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">#{p.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                              {p.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                          <Layers className="w-3 h-3 text-emerald-600" />
                          <span>
                            {p.category?.name ||
                              categories.find((c) => String(c.id) === String(p.categoryId))?.name ||
                              'Ayurvedic Herb'}
                          </span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        ₹{Number(p.price).toFixed(2)}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {p.quantity} units
                          </span>
                          {isOut ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 uppercase tracking-wide">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wide">
                              Low
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Availability Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                            p.is_available
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.is_available ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                          <span>{p.is_available ? 'In Store' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Products Table Pagination (API Level) */}
        <Pagination
          currentPage={currentPage}
          totalItems={effectiveTotal}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modal: Create Product */}
      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        title="Add New Ayurvedic Product"
        subtitle="List a new product in the Nature Vedas catalog"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pure Triphala Churna"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Authentic Ayurvedic herbal blend for holistic digestion..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Initial Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Available for Customer Purchase</span>
              </label>
            </div>
          </div>

          {/* Cover / Product Image Upload (Max 10MB) or URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold uppercase tracking-wider text-slate-700">
                Product Image *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Max upload size: 10MB</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 font-semibold text-xs transition-colors shrink-0">
                <Upload className={`w-3.5 h-3.5 text-emerald-600 ${isProcessingImage ? 'animate-spin' : ''}`} />
                <span>{isProcessingImage ? 'Processing Image...' : 'Upload Picture (Max 10MB)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileUpload}
                />
              </label>

              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={formImage}
                  onChange={(e) => {
                    setFormImage(e.target.value);
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  placeholder="Or enter image URL / asset path..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900 text-xs"
                />
              </div>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {formImage && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                    <img
                      src={formImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Image ready for catalog'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
                      {formImage.startsWith('data:') ? 'Optimized image (<10MB, ready to save)' : formImage}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFormImage('');
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Quick Assets:</span>
              {sampleImages.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setFormImage(s.url);
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={closeCreate}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Product */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Edit "${editingProduct?.name}"`}
        subtitle="Modify product attributes, price, and stock levels"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Available for Customer Purchase</span>
              </label>
            </div>
          </div>

          {/* Cover / Product Image Upload (Max 10MB) or URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold uppercase tracking-wider text-slate-700">
                Product Image *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Max upload size: 10MB</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 font-semibold text-xs transition-colors shrink-0">
                <Upload className={`w-3.5 h-3.5 text-emerald-600 ${isProcessingImage ? 'animate-spin' : ''}`} />
                <span>{isProcessingImage ? 'Processing Image...' : 'Upload Picture (Max 10MB)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileUpload}
                />
              </label>

              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={formImage}
                  onChange={(e) => {
                    setFormImage(e.target.value);
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  placeholder="Or enter image URL / asset path..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900 text-xs"
                />
              </div>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {formImage && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                    <img
                      src={formImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Image ready for catalog'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
                      {formImage.startsWith('data:') ? 'Optimized image (<10MB, ready to save)' : formImage}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFormImage('');
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Quick Assets:</span>
              {sampleImages.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setFormImage(s.url);
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Confirm Delete Product"
        subtitle="This action will permanently remove the item from Nature Vedas"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800">
              Are you sure you want to delete <strong className="text-rose-950 font-bold">{deletingProduct?.name}</strong>?
              This will remove it from the online store.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setDeletingProduct(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Yes, Delete Product'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
