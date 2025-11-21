import React, { useState, useEffect } from 'react';
import { Search, X, Check, Filter, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import { getProducts } from '../../services/productService'; // We'll add this export

const AdvertisementProductModal = ({ isOpen, onClose, onSelect, initialSelectedIds = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [isOpen, initialSelectedIds]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      if (response.success) {
        setProducts(response.data.filter(p => p.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (productId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedIds(newSelected);
  };

  const handleSubmit = () => {
    onSelect(Array.from(selectedIds));
    onClose();
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Advertisement Products"
      size="4xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 p-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Selected Count */}
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.size} products selected
          </span>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-1">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const isSelected = selectedIds.has(product._id);
                const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                
                return (
                  <div
                    key={product._id}
                    onClick={() => handleToggleSelect(product._id)}
                    className={`
                      relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden
                      ${isSelected 
                        ? 'border-primary-600 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-300 bg-white'
                      }
                    `}
                  >
                    {/* Selection Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 bg-primary-600 text-white p-1 rounded-full">
                        <Check className="w-4 h-4" />
                      </div>
                    )}

                    <div className="aspect-video bg-gray-100 relative">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {product.category}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Search className="w-12 h-12 mb-2 text-gray-300" />
              <p>No products found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Save Selection
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AdvertisementProductModal;

