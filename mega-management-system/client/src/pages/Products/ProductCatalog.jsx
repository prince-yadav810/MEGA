import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Upload, Grid, List, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductCard from '../../components/products/ProductCard';
import ProductForm from '../../components/products/ProductForm';
import ProductDetailModal from '../../components/products/ProductDetailModal';
import productService from '../../services/productService';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Hoses - Canvas', label: 'Hoses - Canvas' },
  { value: 'Hoses - PVC', label: 'Hoses - PVC' },
  { value: 'Hoses - Rubber-lined', label: 'Hoses - Rubber-lined' },
  { value: 'Connectors', label: 'Connectors' },
  { value: 'Safety Equipment', label: 'Safety Equipment' },
  { value: 'Custom', label: 'Custom' }
];

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [productToView, setProductToView] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { ...filters };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await productService.getAllProducts(params);

      if (response.success) {
        setProducts(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 12, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await productService.deleteProduct(product._id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleViewProduct = (product) => {
    setProductToView(product);
    setShowDetailModal(true);
  };

  const handleFormSuccess = () => {
    fetchProducts();
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
            <div>
              {/* Desktop Title */}
              <h1 className="hidden sm:block text-xl font-semibold text-gray-900">Product Catalog</h1>
              <p className="hidden sm:block text-sm text-gray-600 mt-0.5">
                Manage your product inventory ({pagination.total} products)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddProduct}
                className="hidden sm:flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
              <button
                onClick={fetchProducts}
                className="hidden sm:flex px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Clear Filters and Product Count */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Clear Filters
            </button>
            <span className="text-sm text-gray-600">
              {pagination.total} {pagination.total === 1 ? 'product' : 'products'}
            </span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.category
                ? 'Try adjusting your filters'
                : 'Get started by adding your first product'}
            </p>
            <button
              onClick={handleAddProduct}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onView={handleViewProduct}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-4 py-2 rounded-lg ${
                        pagination.page === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={selectedProduct}
          onClose={() => {
            setShowForm(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Product Detail Modal */}
      {showDetailModal && (
        <ProductDetailModal
          product={productToView}
          onClose={() => {
            setShowDetailModal(false);
            setProductToView(null);
          }}
        />
      )}

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={handleAddProduct}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
