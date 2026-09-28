import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Blog } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  BookOpen, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Sparkles,
  FileText,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { processImageFile } from '../utils/imageUpload';

interface BlogsPageProps {
  blogs: Blog[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateBlog: (blog: Partial<Blog>) => Promise<void>;
  onUpdateBlog: (id: number, blog: Partial<Blog>) => Promise<void>;
  onDeleteBlog: (id: number) => Promise<void>;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const CATEGORIES = [
  'Herbal Remedies',
  'Ayurvedic Skincare',
  'Mental Wellness',
  'Nutrition & Diet',
  'Dinacharya & Lifestyle',
  'Seasonal Wellness (Ritucharya)',
];

const SAMPLE_IMAGES = [
  { label: 'Herbs & Mortar', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80' },
  { label: 'Oils & Essence', url: 'https://images.unsplash.com/photo-1608248597359-2e18195e2820?auto=format&fit=crop&w=800&q=80' },
  { label: 'Meditation & Calm', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80' },
  { label: 'Green Leaves', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80' },
  { label: 'Spices & Turmeric', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80' },
];

export const BlogsPage: React.FC<BlogsPageProps> = ({
  blogs = [],
  isLoading,
  onRefresh,
  onCreateBlog,
  onUpdateBlog,
  onDeleteBlog,
  searchQuery = '',
  onSearchChange,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search params
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const categoryParam = searchParams.get('category') || 'all';
  const statusParam = (searchParams.get('status') as 'all' | 'published' | 'draft') || 'all';
  const searchParam = searchParams.get('search') || searchQuery || '';

  const [currentPage, setCurrentPage] = useState<number>(Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>(statusParam);
  const [blogSearch, setBlogSearch] = useState<string>(searchParam);
  const pageSize = 6;

  // Sync state if URL search params change
  useEffect(() => {
    if (!Number.isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage(pageParam);
    }
  }, [pageParam]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setStatusFilter(statusParam);
  }, [statusParam]);

  useEffect(() => {
    setBlogSearch(searchParam);
  }, [searchParam]);

  // If searchQuery prop changes from Header search
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== blogSearch) {
      setBlogSearch(searchQuery);
      setCurrentPage(1);
    }
  }, [searchQuery]);

  // API Blogs State
  const [apiBlogs, setApiBlogs] = useState<Blog[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Fetch blogs from API with pagination, category, status, search
  const fetchBlogsFromApi = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await api.getBlogs({
        page: currentPage,
        limit: pageSize,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: blogSearch.trim() || undefined,
      });
      setApiBlogs(res.blogs);
      setTotalItems(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch blogs';
      toastError(msg);
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, pageSize, selectedCategory, statusFilter, blogSearch, toastError]);

  useEffect(() => {
    fetchBlogsFromApi();
  }, [fetchBlogsFromApi]);

  const updateUrlParams = (updates: { page?: number; category?: string; status?: string; search?: string }) => {
    const newParams = new URLSearchParams(searchParams);
    if (updates.page !== undefined) {
      newParams.set('page', String(updates.page));
    }
    if (updates.category !== undefined) {
      if (updates.category && updates.category !== 'all') {
        newParams.set('category', updates.category);
      } else {
        newParams.delete('category');
      }
    }
    if (updates.status !== undefined) {
      if (updates.status && updates.status !== 'all') {
        newParams.set('status', updates.status);
      } else {
        newParams.delete('status');
      }
    }
    if (updates.search !== undefined) {
      if (updates.search.trim()) {
        newParams.set('search', updates.search.trim());
      } else {
        newParams.delete('search');
      }
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    updateUrlParams({ category: cat, page: 1 });
  };

  const handleStatusChange = (st: 'all' | 'published' | 'draft') => {
    setStatusFilter(st);
    setCurrentPage(1);
    updateUrlParams({ status: st, page: 1 });
  };

  const handleSearchChange = (q: string) => {
    setBlogSearch(q);
    if (onSearchChange) onSearchChange(q);
    setCurrentPage(1);
    updateUrlParams({ search: q, page: 1 });
  };

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [deletingBlog, setDeletingBlog] = useState<Blog | null>(null);
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Ayurveda');
  const [formAuthor, setFormAuthor] = useState('Nature Vedas Team');
  const [formReadTime, setFormReadTime] = useState('5 min read');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImage, setFormImage] = useState(SAMPLE_IMAGES[0].url);
  const [formTags, setFormTags] = useState('Ayurveda, Wellness');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const processed = await processImageFile(file, 10);
      setFormImage(processed.url);
      setUploadedFileName(`${processed.fileName} (~${processed.sizeKB}KB)`);
      toastSuccess(`Picture "${processed.fileName}" prepared and ready to save!`);
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
    setFormTitle('');
    setFormCategory('Ayurveda');
    setFormAuthor('Nature Vedas Team');
    setFormReadTime('5 min read');
    setFormExcerpt('');
    setFormContent('');
    setFormImage(SAMPLE_IMAGES[0].url);
    setFormTags('Ayurveda, Wellness');
    setFormIsPublished(true);
    setUploadedFileName(null);
    setUploadError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (b: Blog) => {
    setEditingBlog(b);
    setFormTitle(typeof b.title === 'string' ? b.title : String(b.title || ''));
    setFormCategory(typeof b.category === 'string' ? b.category : 'Ayurveda');
    setFormAuthor(typeof b.author === 'string' ? b.author : 'Nature Vedas Team');
    setFormReadTime(b.read_time || '5 min read');
    setFormExcerpt(typeof b.excerpt === 'string' ? b.excerpt : '');
    setFormContent(typeof b.content === 'string' ? b.content : JSON.stringify(b.content || ''));
    setFormImage(b.cover_image || b.image || SAMPLE_IMAGES[0].url);
    setFormTags(Array.isArray(b.tags) ? b.tags.join(', ') : 'Ayurveda, Wellness');
    setFormIsPublished(b.is_published ?? true);
    setUploadedFileName(null);
    setUploadError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = (formTitle || '').trim();
    const cleanContent = (formContent || '').trim();
    const cleanExcerpt = (formExcerpt || '').trim();

    if (!cleanTitle || !cleanContent) {
      toastError('Please fill in both blog title and article content.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const chosenImg = (formImage || '').trim();

      await onCreateBlog({
        title: cleanTitle,
        category: formCategory || 'Ayurveda',
        author: (formAuthor || 'Nature Vedas Team').trim(),
        read_time: (formReadTime || '5 min read').trim(),
        excerpt: cleanExcerpt || cleanContent.slice(0, 160) + '...',
        content: cleanContent,
        image: chosenImg,
        cover_image: chosenImg,
        tags: tagsArray,
        is_published: formIsPublished,
        publishedAt: formIsPublished ? new Date().toISOString() : undefined,
      });

      await fetchBlogsFromApi();
      toastSuccess(`Blog "${cleanTitle}" created successfully!`);
      setIsCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create blog';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    const cleanTitle = (formTitle || '').trim();
    const cleanContent = (formContent || '').trim();
    const cleanExcerpt = (formExcerpt || '').trim();

    if (!cleanTitle || !cleanContent) {
      toastError('Please fill in both blog title and article content.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const chosenImg = (formImage || '').trim();

      await onUpdateBlog(editingBlog.id, {
        title: cleanTitle,
        category: formCategory || editingBlog.category || 'Ayurveda',
        author: (formAuthor || 'Nature Vedas Team').trim(),
        read_time: (formReadTime || '5 min read').trim(),
        excerpt: cleanExcerpt || cleanContent.slice(0, 160) + '...',
        content: cleanContent,
        image: chosenImg,
        cover_image: chosenImg,
        tags: tagsArray,
        is_published: formIsPublished,
      });

      await fetchBlogsFromApi();
      toastSuccess(`Blog "${cleanTitle}" updated successfully!`);
      setEditingBlog(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update blog';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBlog) return;
    setIsSubmitting(true);
    try {
      await onDeleteBlog(deletingBlog.id);
      await fetchBlogsFromApi();
      toastSuccess(`Blog "${deletingBlog.title}" deleted.`);
      setDeletingBlog(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete blog';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (b: Blog) => {
    const updated = !b.is_published;
    try {
      await onUpdateBlog(b.id, { is_published: updated });
      await fetchBlogsFromApi();
      toastSuccess(`Blog is now ${updated ? 'Published' : 'Moved to Drafts'}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toastError(msg);
    }
  };

  const displayBlogs = (apiBlogs.length > 0 || isFetching || selectedCategory !== 'all' || statusFilter !== 'all' || blogSearch)
    ? apiBlogs
    : blogs.slice(0, pageSize);
  const effectiveTotal = totalItems > 0 ? totalItems : (apiBlogs.length > 0 ? apiBlogs.length : blogs.length);

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>Blogs & Articles</span>
          </h2>
          <p className="text-xs text-slate-500">
            Publish educational herbal guides, wellness rituals, and classical Ayurvedic literature with API pagination
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Blog Search Input */}
          <div className="relative sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles..."
              value={blogSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 outline-none transition-all"
            />
            {blogSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as typeof statusFilter)}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          <button
            onClick={() => {
              onRefresh();
              fetchBlogsFromApi();
            }}
            disabled={isFetching || isLoading}
            title="Refresh Blogs"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${(isFetching || isLoading) ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Blog</span>
          </button>
        </div>
      </div>

      {/* Blogs Grid */}
      {(isFetching || isLoading) && displayBlogs.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <span className="text-xs font-medium">Loading Ayurvedic articles from server...</span>
        </div>
      ) : displayBlogs.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-700 text-sm">No blogs found</p>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search or filters.</p>
          {(selectedCategory !== 'all' || statusFilter !== 'all' || blogSearch) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setStatusFilter('all');
                handleSearchChange('');
              }}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer mr-2"
            >
              Reset Filters
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Blog</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayBlogs.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Card Image Header */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                {b.cover_image || b.image ? (
                  <img
                    src={b.cover_image || b.image || ''}
                    alt={b.title}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-700">
                    <BookOpen className="w-10 h-10 opacity-40" />
                  </div>
                )}

                {/* Category Badge Overlay */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-emerald-800 shadow-xs backdrop-blur-xs">
                    {b.category}
                  </span>
                </div>

                {/* Status Badge Overlay */}
                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(b)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer shadow-xs ${
                      b.is_published
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-800/90 text-slate-200 hover:bg-slate-900'
                    }`}
                    title="Click to toggle publish status"
                  >
                    {b.is_published ? 'Published' : 'Draft'}
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-2 hover:text-emerald-700 transition-colors">
                    {typeof b.title === 'string' ? b.title : String(b.title || '')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {typeof b.excerpt === 'string' && b.excerpt
                      ? b.excerpt
                      : typeof b.content === 'string'
                      ? b.content.slice(0, 140)
                      : ''}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.author}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPreviewBlog(b)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                    title="Edit Blog"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingBlog(b)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                    title="Delete Blog"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={effectiveTotal}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      {/* Modal: Create Blog */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Ayurvedic Blog Article"
        subtitle="Write and publish educational wellness articles for Nature Vedas"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Article Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. The Healing Power of Triphala: Digestion & Detoxification"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Author Name *
              </label>
              <input
                type="text"
                required
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                placeholder="e.g. Dr. V. Sharma (BAMS)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Estimated Read Time
              </label>
              <input
                type="text"
                value={formReadTime}
                onChange={(e) => setFormReadTime(e.target.value)}
                placeholder="e.g. 5 min read"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Short Excerpt / Summary *
            </label>
            <textarea
              required
              rows={2}
              placeholder="A brief overview summarizing the article for catalog preview..."
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Article Content *
            </label>
            <textarea
              required
              rows={7}
              placeholder="Write the full Ayurvedic article body, clinical benefits, botanical ingredients, and traditional rituals..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900 font-sans"
            />
          </div>

          {/* Cover Image Upload (Max 10MB) or URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold uppercase tracking-wider text-slate-700">
                Cover Image
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
                  value={formImage}
                  onChange={(e) => {
                    setFormImage(e.target.value);
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  placeholder="Or paste image URL (https://...)"
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
                      {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Image ready'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
                      {formImage.startsWith('data:') ? 'Local file (Base64 encoded, <10MB)' : formImage}
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

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
              {SAMPLE_IMAGES.map((s) => (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="e.g. Triphala, Digestion, Rasayana"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Publish Immediately to Store</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Create Blog Article'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Blog */}
      <Modal
        isOpen={!!editingBlog}
        onClose={() => setEditingBlog(null)}
        title={`Edit "${editingBlog?.title}"`}
        subtitle="Update article body, author attribution, and publication status"
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Article Title *
            </label>
            <input
              type="text"
              required
              value={formTitle || ''}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Author Name *
              </label>
              <input
                type="text"
                required
                value={formAuthor || ''}
                onChange={(e) => setFormAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Estimated Read Time
              </label>
              <input
                type="text"
                value={formReadTime}
                onChange={(e) => setFormReadTime(e.target.value)}
                placeholder="e.g. 5 min read"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Short Excerpt / Summary *
            </label>
            <textarea
              required
              rows={2}
              value={formExcerpt || ''}
              onChange={(e) => setFormExcerpt(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Article Content *
            </label>
            <textarea
              required
              rows={7}
              value={formContent || ''}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900 font-sans"
            />
          </div>

          {/* Cover Image Upload (Max 10MB) or URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold uppercase tracking-wider text-slate-700">
                Cover Image
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
                  value={formImage || ''}
                  onChange={(e) => {
                    setFormImage(e.target.value);
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  placeholder="Or paste image URL (https://...)"
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
                      {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Image set'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
                      {formImage.startsWith('data:') ? 'Local file (Base64 encoded, <10MB)' : formImage}
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

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
              {SAMPLE_IMAGES.map((s) => (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formTags || ''}
                onChange={(e) => setFormTags(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-900"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Published to Store</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingBlog(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Blog */}
      <Modal
        isOpen={!!deletingBlog}
        onClose={() => setDeletingBlog(null)}
        title="Confirm Delete Article"
        subtitle="This action will remove the article from the website"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-rose-800 leading-relaxed">
              Are you sure you want to delete <strong className="text-rose-950 font-bold">{deletingBlog?.title}</strong>?
              This article will be unlinked from the store catalog.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setDeletingBlog(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Yes, Delete Blog'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Preview Full Article */}
      <Modal
        isOpen={!!previewBlog}
        onClose={() => setPreviewBlog(null)}
        title={previewBlog?.title || 'Article Preview'}
        subtitle={`By ${previewBlog?.author || 'Nature Vedas'} • ${previewBlog?.category || 'Wellness'}`}
        maxWidth="3xl"
      >
        {previewBlog && (
          <div className="space-y-5 text-slate-800 text-xs">
            {(previewBlog.cover_image || previewBlog.image) && (
              <div className="h-60 rounded-xl overflow-hidden">
                <img
                  src={previewBlog.cover_image || previewBlog.image || ''}
                  alt={previewBlog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {previewBlog.excerpt && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900 font-medium text-xs leading-relaxed italic">
                "{typeof previewBlog.excerpt === 'string' ? previewBlog.excerpt : ''}"
              </div>
            )}

            <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line text-slate-700">
              {typeof previewBlog.content === 'string'
                ? previewBlog.content
                : JSON.stringify(previewBlog.content, null, 2)}
            </div>

            {previewBlog.tags && previewBlog.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {previewBlog.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setPreviewBlog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
