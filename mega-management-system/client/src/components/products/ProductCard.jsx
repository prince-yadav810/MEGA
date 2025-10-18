import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

export default function ProductCard({ product, onEdit, onDelete, onView }) {
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.url || 'https://via.placeholder.com/300x200?text=No+Image';


  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />

        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* SKU */}
        <p className="text-xs text-gray-500 mb-1">SKU: {product.sku}</p>

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate" title={product.name}>
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={product.description}>
          {product.description || 'No description available'}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(product)}
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            onClick={() => onEdit(product)}
            className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(product)}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
