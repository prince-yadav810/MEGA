import React, { useState } from 'react';
import { X, Package, Tag, Calendar, User, Image as ImageIcon, IndianRupee } from 'lucide-react';

export default function ProductDetailModal({ product, onClose }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price, currency = 'INR') => {
    if (!price && price !== 0) return 'Not set';
    const currencySymbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return `${currencySymbols[currency] || '₹'}${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const currentImage = product.images?.[selectedImageIndex]?.url || 'https://via.placeholder.com/600x400?text=No+Image';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-2xl font-bold text-white">{product.name}</h2>
            <p className="text-blue-100 text-sm mt-1">Product ID: {product.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Images */}
              <div>
                <div className="mb-4">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ paddingBottom: '75%' }}>
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                      }}
                    />
                  </div>
                </div>

                {/* Image Thumbnails */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer ${
                          selectedImageIndex === index ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'
                        }`}
                        style={{ paddingBottom: '75%' }}
                      >
                        <img
                          src={img.url}
                          alt={`${product.name} ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                          }}
                        />
                        {img.isPrimary && (
                          <div className="absolute top-1 right-1">
                            <span className="px-1 py-0.5 bg-blue-500 text-white text-xs rounded">Primary</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(!product.images || product.images.length === 0) && (
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg text-gray-500">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    <span className="text-sm">No images available</span>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Category */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Tag className="w-5 h-5 text-gray-700 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Category</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {product.category === 'Custom' && product.customCategory
                      ? product.customCategory
                      : product.category}
                  </p>
                </div>

                {/* Pricing Information */}
                {(product.costPrice || product.sellPrice) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <IndianRupee className="w-5 h-5 text-gray-700 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Pricing</span>
                    </div>
                    <div className="space-y-2">
                      {product.costPrice && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Cost Price:</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatPrice(product.costPrice, product.currency)}
                          </span>
                        </div>
                      )}
                      {product.sellPrice && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sell Price:</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatPrice(product.sellPrice, product.currency)}
                          </span>
                        </div>
                      )}
                      {product.costPrice && product.sellPrice && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-600 font-medium">Margin:</span>
                          <span className="text-lg font-semibold text-green-600">
                            {formatPrice(product.sellPrice - product.costPrice, product.currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-gray-700" />
                    Description
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {product.description ? (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">No description available</p>
                    )}
                  </div>
                </div>

                {/* Specifications */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium text-gray-700 sm:w-1/3 mb-1 sm:mb-0">{key}:</span>
                          <span className="text-gray-900 sm:w-2/3 break-words">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium mr-2">Created:</span>
                      <span>{formatDate(product.createdAt)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium mr-2">Last Updated:</span>
                      <span>{formatDate(product.updatedAt)}</span>
                    </div>
                    {product.createdBy && (
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium mr-2">Created By:</span>
                        <span>{product.createdBy.name || product.createdBy.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
