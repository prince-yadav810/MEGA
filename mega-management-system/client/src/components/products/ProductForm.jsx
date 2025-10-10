import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';

const CATEGORIES = [
  'Hoses - Canvas',
  'Hoses - PVC',
  'Hoses - Rubber-lined',
  'Connectors',
  'Safety Equipment',
  'Custom'
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export default function ProductForm({ product, onClose, onSuccess }) {
  const isEditMode = !!product;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Custom',
    customCategory: '',
    price: '',
    currency: 'INR',
    status: 'active',
    stock: {
      quantity: 0,
      unit: 'pieces',
      lowStockThreshold: 10
    },
    specifications: {},
    images: []
  });

  const [imageUrls, setImageUrls] = useState([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'Custom',
        customCategory: product.customCategory || '',
        price: product.price || '',
        currency: product.currency || 'INR',
        status: product.status || 'active',
        stock: {
          quantity: product.stock?.quantity || 0,
          unit: product.stock?.unit || 'pieces',
          lowStockThreshold: product.stock?.lowStockThreshold || 10
        },
        specifications: product.specifications ?
          (product.specifications instanceof Map ? Object.fromEntries(product.specifications) : product.specifications)
          : {},
        images: product.images || []
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('stock.')) {
      const stockField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        stock: {
          ...prev.stock,
          [stockField]: stockField === 'quantity' || stockField === 'lowStockThreshold'
            ? parseInt(value) || 0
            : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleAddSpecification = () => {
    if (newSpecKey && newSpecValue) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey]: newSpecValue
        }
      }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const handleRemoveSpecification = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData(prev => ({
      ...prev,
      specifications: newSpecs
    }));
  };

  const handleAddImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { url, isPrimary: prev.images.length === 0 }]
      }));
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      // If removed image was primary, make first image primary
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return {
        ...prev,
        images: newImages
      };
    });
  };

  const handleSetPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name || !formData.price) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.category === 'Custom' && !formData.customCategory) {
        toast.error('Please provide a custom category name');
        setLoading(false);
        return;
      }

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: {
          ...formData.stock,
          quantity: parseInt(formData.stock.quantity) || 0,
          lowStockThreshold: parseInt(formData.stock.lowStockThreshold) || 10
        }
      };

      let response;
      if (isEditMode) {
        response = await productService.updateProduct(product._id, submitData);
        toast.success('Product updated successfully!');
      } else {
        response = await productService.createProduct(submitData);
        toast.success('Product created successfully!');
      }

      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {formData.category === 'Custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={formData.category === 'Custom'}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stock Management */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Stock Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="stock.quantity"
                    value={formData.stock.quantity}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="stock.unit"
                    value={formData.stock.unit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    name="stock.lowStockThreshold"
                    value={formData.stock.lowStockThreshold}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Specifications</h3>

              {/* Existing Specifications */}
              {Object.keys(formData.specifications).length > 0 && (
                <div className="mb-4 space-y-2">
                  {Object.entries(formData.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <span className="font-medium text-sm flex-1">{key}:</span>
                      <span className="text-sm text-gray-600 flex-1">{value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecification(key)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Specification */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g., Length)"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., 15 meters)"
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddSpecification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Product Images</h3>

              {/* Existing Images */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`Product ${index + 1}`}
                        className={`w-full h-32 object-cover rounded-lg ${img.isPrimary ? 'ring-4 ring-blue-500' : ''}`}
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className="p-1 bg-white rounded text-xs text-blue-600 hover:bg-blue-50"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-1 bg-white rounded text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {img.isPrimary && (
                        <div className="absolute bottom-2 left-2">
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">Primary</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Image Button */}
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600"
              >
                <Upload className="w-5 h-5" />
                Add Image URL
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Note: For production, image file upload will be implemented with Cloudinary
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
