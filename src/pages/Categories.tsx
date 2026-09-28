import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Category, Product } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { Layers, Plus, Edit2, Trash2, RefreshCw, Package, ArrowRight, ExternalLink, Eye, Search, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { resolveProductImageUrl } from '../utils/imageStorage';

interface CategoriesPageProps {
  categories?: Category[];
  products?: Product[];
  isLoading?: boolean;
  onRefresh: () => void;
  onCreateCategory: (cat: { name: string; description: string }) => Promise<void>;
  onUpdateCategory: (id: number, cat: { name: string; description: string }) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories = [],
  products = [],
  isLoading = false,
  onRefresh,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search params
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || '';

  const [currentPage, setCurrentPage] = useState<number>(Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);
  const [categorySearch, setCategorySearch] = useState<string>(searchParam);
  const pageSize = 6;

  useEffect(() => {
    if (!Number.isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage(pageParam);
    }
  }, [pageParam]);

  useEffect(() => {
    setCategorySearch(searchParam);
  }, [searchParam]);

  // API Categories State
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Fetch categories from API with pagination and search
  const fetchCategoriesFromApi = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await api.getCategories({
        page: currentPage,
        limit: pageSize,
        search: categorySearch.trim() || undefined,
      });
      setApiCategories(res.categories);
      setTotalItems(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
      toastError(msg);
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, pageSize, categorySearch, toastError]);

  useEffect(() => {
    fetchCategoriesFromApi();
  }, [fetchCategoriesFromApi]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleSearchChange = (q: string) => {
    setCategorySearch(q);
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

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Products under currently clicked category
  const viewingCategoryProducts = useMemo(() => {
    if (!viewingCategory) return [];
    return products.filter((p) => 
      p.categoryId === viewingCategory.id || 
      p.category?.id === viewingCategory.id || 
      (p.category?.name && p.category.name.toLowerCase() === viewingCategory.name.toLowerCase())
    );
  }, [products, viewingCategory]);

  const handleOpenAdd = () => {
    setName('');
    setDescription('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name || '');
    setDescription(c.description || '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (name || '').trim();
    if (!cleanName) return;
    setIsSubmitting(true);
    try {
      await onCreateCategory({ 
        name: cleanName, 
        description: (description || '').trim() 
      });
      await fetchCategoriesFromApi();
      toastSuccess(`Category "${cleanName}" created.`);
      setIsAddOpen(false);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (name || '').trim();
    if (!editingCategory || !cleanName) return;
    setIsSubmitting(true);
    try {
      await onUpdateCategory(editingCategory.id, { 
        name: cleanName, 
        description: (description || '').trim() 
      });
      await fetchCategoriesFromApi();
      toastSuccess(`Category "${cleanName}" updated.`);
      setEditingCategory(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
      await onDeleteCategory(deletingCategory.id);
      await fetchCategoriesFromApi();
      toastSuccess(`Category deleted.`);
      setDeletingCategory(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCategories = (apiCategories.length > 0 || categorySearch || isFetching)
    ? apiCategories
    : categories.slice(0, pageSize);
  const effectiveTotal = totalItems > 0 ? totalItems : (apiCategories.length > 0 ? apiCategories.length : categories.length);

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h3 className="text-base font-bold text-slate-900">Product Categories</h3>
          <p className="text-xs text-slate-500">Organize and classify Ayurvedic formulations with API-level pagination</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Search Input */}
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
            {categorySearch && (
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
            onClick={() => {
              onRefresh();
              fetchCategoriesFromApi();
            }}
            disabled={isFetching || isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${(isFetching || isLoading) ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {isFetching && displayCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">Loading categories from server...</p>
        </div>
      ) : displayCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 text-center">
          <Layers className="w-10 h-10 text-slate-300 mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No categories found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {categorySearch ? `No categories match "${categorySearch}". Try a different keyword.` : 'Get started by creating your first category.'}
          </p>
          {categorySearch ? (
            <button
              onClick={() => handleSearchChange('')}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
            >
              Add Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCategories.map((c) => {
            const catProducts = products.filter((p) => 
              p.categoryId === c.id || 
              p.category?.id === c.id || 
              (p.category?.name && p.category.name.toLowerCase() === c.name.toLowerCase())
            );
            const count = catProducts.length;

            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/products?categoryId=${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/products?categoryId=${c.id}`);
                  }
                }}
                className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between cursor-pointer group text-left relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                        ID #{c.id}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 flex items-center gap-1 border border-slate-100 group-hover:border-emerald-200 transition-colors">
                      <Package className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      <span>{count} product{count === 1 ? '' : 's'}</span>
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-800 transition-colors">{c.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'No description provided.'}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>View products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingCategory(c);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Quick Preview Items"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(c);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCategory(c);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* API Level Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={effectiveTotal}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Category">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Herbal Teas & Infusions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Description of the category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title="Edit Category">
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name || ''}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description || ''}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deletingCategory} onClose={() => setDeletingCategory(null)} title="Delete Category" maxWidth="sm">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete <strong className="text-slate-900">{deletingCategory?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingCategory(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Products under Category Modal */}
      <Modal
        isOpen={!!viewingCategory}
        onClose={() => setViewingCategory(null)}
        title={viewingCategory ? `Products in "${viewingCategory.name}"` : 'Category Products'}
        subtitle={
          viewingCategory
            ? `${viewingCategoryProducts.length} product${viewingCategoryProducts.length === 1 ? '' : 's'} assigned to this category`
            : ''
        }
        maxWidth="2xl"
      >
        {viewingCategory && (
          <div className="space-y-4 text-xs">
            {viewingCategory.description && (
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed italic">
                "{viewingCategory.description}"
              </p>
            )}

            {viewingCategoryProducts.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700 text-sm">No products in this category yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You can assign products to "{viewingCategory.name}" when creating or editing items in the Products section.
                </p>
                <div className="pt-2">
                  <Link
                    to={`/products?categoryId=${viewingCategory.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>View in Products Catalog (ID #{viewingCategory.id})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingCategoryProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all flex items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                        {p.image ? (
                          <img
                            src={resolveProductImageUrl(p.image)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="font-bold text-slate-900 text-xs truncate" title={p.name}>
                            {p.name}
                          </h5>
                          <span className="font-bold text-emerald-800 text-xs shrink-0">
                            ₹{Number(p.price).toFixed(2)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {p.description || 'Ayurvedic formulation'}
                        </p>

                        <div className="flex items-center justify-between text-[10px] mt-2 pt-1.5 border-t border-slate-100">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full ${
                              p.quantity > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}
                          >
                            {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full font-medium ${
                              p.is_available
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {p.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Showing {viewingCategoryProducts.length} product{viewingCategoryProducts.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetId = viewingCategory.id;
                    setViewingCategory(null);
                    navigate(`/products?categoryId=${targetId}`);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors text-xs flex items-center gap-1.5"
                >
                  <span>Open in Products Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
