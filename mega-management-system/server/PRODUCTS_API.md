# Products API Documentation

Complete API documentation for the Products endpoint in MEGA Management System.

## Base URL
```
http://localhost:5000/api/products
```

---

## Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all products (with filters) | No |
| GET | `/:id` | Get single product | No |
| GET | `/categories` | Get all categories | No |
| GET | `/low-stock` | Get low stock products | Yes |
| POST | `/` | Create new product | Yes (Admin) |
| PUT | `/:id` | Update product | Yes (Admin) |
| DELETE | `/:id` | Delete product | Yes (Admin) |
| DELETE | `/:id/images/:imageId` | Delete product image | Yes (Admin) |
| PATCH | `/:id/images/:imageId/primary` | Set primary image | Yes (Admin) |
| POST | `/bulk-upload` | Bulk upload from Excel | Yes (Admin) |

---

## 1. Get All Products

**GET** `/api/products`

Retrieve all products with pagination, search, filtering, and sorting.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `search` | string | '' | Search in name, description, SKU |
| `category` | string | '' | Filter by category |
| `status` | string | '' | Filter by status (active/inactive) |
| `minPrice` | number | 0 | Minimum price |
| `maxPrice` | number | ∞ | Maximum price |
| `sortBy` | string | createdAt | Sort field (name, price, createdAt) |
| `sortOrder` | string | desc | Sort order (asc/desc) |

### Example Request
```bash
GET /api/products?page=1&limit=10&search=hose&category=Hoses - Canvas&status=active&sortBy=price&sortOrder=asc
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "sku": "PROD-20250110-1234",
      "name": "Canvas Fire Hose - 2 inch",
      "description": "High-quality canvas fire hose...",
      "category": "Hoses - Canvas",
      "price": 1500,
      "currency": "INR",
      "specifications": {
        "Length": "15 meters",
        "Diameter": "2 inches",
        "Material": "Canvas",
        "Pressure Rating": "250 PSI"
      },
      "images": [
        {
          "url": "https://res.cloudinary.com/...",
          "publicId": "mega/products/...",
          "isPrimary": true,
          "uploadedAt": "2025-01-10T10:00:00.000Z"
        }
      ],
      "status": "active",
      "stock": {
        "quantity": 50,
        "unit": "pieces",
        "lowStockThreshold": 10
      },
      "isLowStock": false,
      "primaryImage": {
        "url": "https://res.cloudinary.com/...",
        "isPrimary": true
      },
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## 2. Get Single Product

**GET** `/api/products/:id`

Retrieve detailed information about a specific product.

### Example Request
```bash
GET /api/products/65a1b2c3d4e5f6g7h8i9j0k1
```

### Response
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "sku": "PROD-20250110-1234",
    "name": "Canvas Fire Hose - 2 inch",
    "description": "High-quality canvas fire hose...",
    "category": "Hoses - Canvas",
    "price": 1500,
    "currency": "INR",
    "specifications": { ... },
    "images": [ ... ],
    "stock": { ... },
    "priceHistory": [
      {
        "price": 1400,
        "currency": "INR",
        "changedAt": "2025-01-01T10:00:00.000Z",
        "changedBy": {
          "name": "Admin User",
          "email": "admin@mega.com"
        }
      }
    ],
    "createdBy": {
      "name": "Admin User",
      "email": "admin@mega.com"
    },
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-10T10:00:00.000Z"
  }
}
```

---

## 3. Get Categories

**GET** `/api/products/categories`

Retrieve all available product categories.

### Response
```json
{
  "success": true,
  "data": {
    "predefined": [
      "Hoses - Canvas",
      "Hoses - PVC",
      "Hoses - Rubber-lined",
      "Connectors",
      "Safety Equipment",
      "Custom"
    ],
    "custom": [
      "Nozzles & Accessories",
      "Storage & Accessories"
    ]
  }
}
```

---

## 4. Create Product

**POST** `/api/products`

Create a new product. Supports both JSON data and multipart form data for image uploads.

### Request Body (JSON)
```json
{
  "name": "Canvas Fire Hose - 2 inch",
  "description": "High-quality canvas fire hose...",
  "category": "Hoses - Canvas",
  "price": 1500,
  "currency": "INR",
  "specifications": {
    "Length": "15 meters",
    "Diameter": "2 inches",
    "Material": "Canvas"
  },
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "isPrimary": true
    }
  ],
  "stock": {
    "quantity": 50,
    "unit": "pieces",
    "lowStockThreshold": 10
  },
  "status": "active"
}
```

### Request Body (Form Data with File Upload)
```
Content-Type: multipart/form-data

name: Canvas Fire Hose - 2 inch
description: High-quality canvas fire hose...
category: Hoses - Canvas
price: 1500
currency: INR
specifications: {"Length":"15 meters","Diameter":"2 inches"}
images: [file1.jpg, file2.jpg]  // Multiple files
stock[quantity]: 50
stock[unit]: pieces
stock[lowStockThreshold]: 10
status: active
```

### Response
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": { ... }
}
```

---

## 5. Update Product

**PUT** `/api/products/:id`

Update an existing product. Partial updates are supported.

### Request Body
```json
{
  "name": "Updated Product Name",
  "price": 1600,
  "stock": {
    "quantity": 45
  }
}
```

### Response
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": { ... }
}
```

---

## 6. Delete Product

**DELETE** `/api/products/:id`

Delete a product and all associated images from Cloudinary.

### Response
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 7. Delete Product Image

**DELETE** `/api/products/:id/images/:imageId`

Delete a specific image from a product.

### Response
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": { ... }
}
```

---

## 8. Set Primary Image

**PATCH** `/api/products/:id/images/:imageId/primary`

Set a specific image as the primary product image.

### Response
```json
{
  "success": true,
  "message": "Primary image updated successfully",
  "data": { ... }
}
```

---

## 9. Get Low Stock Products

**GET** `/api/products/low-stock`

Retrieve all active products that are below their low stock threshold.

### Response
```json
{
  "success": true,
  "count": 5,
  "data": [ ... ]
}
```

---

## 10. Bulk Upload

**POST** `/api/products/bulk-upload`

Upload multiple products from an Excel file.

### Request (Form Data)
```
Content-Type: multipart/form-data

file: products.xlsx
```

### Excel File Format

Required columns:
- `SKU` (optional - auto-generated if not provided)
- `Name` (required)
- `Description`
- `Category` (Hoses - Canvas, Hoses - PVC, etc.)
- `CustomCategory` (only if Category is "Custom")
- `Price` (required)
- `Currency` (default: INR)
- `Stock` (quantity)
- `Unit` (default: pieces)
- `LowStockThreshold` (default: 10)
- `Specifications` (JSON string)
- `ImageURL` (comma-separated URLs)
- `Status` (active/inactive)

### Example Excel Data
| SKU | Name | Description | Category | Price | Stock | Specifications |
|-----|------|-------------|----------|-------|-------|----------------|
| PROD-001 | Canvas Hose | High-quality... | Hoses - Canvas | 1500 | 50 | {"Length":"15m"} |

### Response
```json
{
  "success": true,
  "message": "Successfully uploaded 10 products",
  "data": {
    "inserted": 10,
    "total": 10
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    "Product name is required",
    "Price cannot be negative"
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Product not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Error fetching products",
  "error": "Database connection failed"
}
```

---

## Product Schema

```javascript
{
  sku: String (unique, auto-generated),
  name: String (required, max 200 chars),
  description: String (max 2000 chars),
  specifications: Map<String, String>,
  category: String (enum),
  customCategory: String (max 100 chars),
  price: Number (required, min 0),
  currency: String (default: 'INR'),
  images: [{
    url: String,
    publicId: String,
    isPrimary: Boolean,
    uploadedAt: Date
  }],
  status: String (active/inactive),
  stock: {
    quantity: Number,
    unit: String,
    lowStockThreshold: Number
  },
  priceHistory: [{
    price: Number,
    currency: String,
    changedAt: Date,
    changedBy: ObjectId (ref: User)
  }],
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  timestamps: true
}
```

---

## Categories

### Predefined Categories
- `Hoses - Canvas`
- `Hoses - PVC`
- `Hoses - Rubber-lined`
- `Connectors`
- `Safety Equipment`
- `Custom` (requires `customCategory` field)

---

## Integration with Quotations

The Quotation model has been updated to include promotional products:

```javascript
{
  promotionalProducts: [{
    product: ObjectId (ref: Product),
    displayOrder: Number
  }]
}
```

When creating/updating quotations, you can add products that will be displayed at the bottom of the quotation PDF for promotional purposes.

---

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the server directory:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
MONGODB_URI=mongodb://localhost:27017/mega-management
```

### 2. Seed Sample Data

```bash
npm run seed:products
```

This will populate your database with 10 sample products.

### 3. Test the API

```bash
# Start the server
npm run dev

# Test endpoints
curl http://localhost:5000/api/products
curl http://localhost:5000/api/products/categories
```

---

## Features Implemented

✅ Complete CRUD operations
✅ Image upload to Cloudinary (multiple images per product)
✅ Advanced search and filtering
✅ Pagination and sorting
✅ Category management (predefined + custom)
✅ Stock management with low stock alerts
✅ Price history tracking
✅ Bulk upload via Excel
✅ Excel template generation
✅ Image management (delete, set primary)
✅ Integration with Quotations
✅ Comprehensive validation
✅ Error handling

---

## Next Steps

1. **Authentication**: Uncomment auth middleware in routes when ready
2. **Frontend Integration**: Build React components to consume this API
3. **Real Images**: Replace placeholder images with actual product photos
4. **Testing**: Write unit and integration tests
5. **Documentation**: Add Swagger/OpenAPI documentation
6. **Optimization**: Add Redis caching for frequently accessed products
