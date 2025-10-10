# Products Module - Setup & Quick Start Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your credentials
nano .env
```

**Required Environment Variables:**
```env
MONGODB_URI=mongodb://localhost:27017/mega-management
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or if using Docker
docker run -d -p 27017:27017 --name mongo-mega mongo:latest
```

### 4. Seed Sample Data
```bash
npm run seed:products
```

This will create 10 sample products in your database with placeholder images.

### 5. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000`

---

## 🧪 Test the API

### Test Basic Endpoints

```bash
# Get all products
curl http://localhost:5000/api/products

# Get single product (replace ID with actual product ID from database)
curl http://localhost:5000/api/products/YOUR_PRODUCT_ID

# Get categories
curl http://localhost:5000/api/products/categories

# Get low stock products
curl http://localhost:5000/api/products/low-stock
```

### Test with Filters
```bash
# Search for "hose"
curl "http://localhost:5000/api/products?search=hose"

# Filter by category
curl "http://localhost:5000/api/products?category=Connectors"

# Filter by price range
curl "http://localhost:5000/api/products?minPrice=500&maxPrice=2000"

# Combine filters with pagination
curl "http://localhost:5000/api/products?search=hose&category=Hoses - Canvas&page=1&limit=5&sortBy=price&sortOrder=asc"
```

### Test Create Product (JSON)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "This is a test product",
    "category": "Connectors",
    "price": 999,
    "currency": "INR",
    "specifications": {
      "Size": "2 inches",
      "Material": "Brass"
    },
    "images": [
      {
        "url": "https://via.placeholder.com/400",
        "isPrimary": true
      }
    ],
    "stock": {
      "quantity": 100,
      "unit": "pieces"
    }
  }'
```

---

## 📁 File Structure

```
server/
├── src/
│   ├── models/
│   │   └── Product.js              # Product schema
│   ├── controllers/
│   │   └── productController.js    # Product CRUD logic
│   ├── routes/
│   │   └── products.js             # API routes
│   ├── config/
│   │   ├── cloudinary.js           # Cloudinary setup
│   │   └── multer.js               # File upload config
│   ├── utils/
│   │   └── excelParser.js          # Excel import/export
│   └── scripts/
│       └── seedProducts.js         # Sample data seeder
├── PRODUCTS_API.md                 # Complete API documentation
├── PRODUCTS_SETUP.md               # This file
└── .env.example                    # Environment template
```

---

## 🎨 Cloudinary Setup (for Image Uploads)

### 1. Create Free Cloudinary Account
- Visit: https://cloudinary.com/users/register/free
- Sign up for a free account

### 2. Get Your Credentials
- Go to Dashboard
- Copy: Cloud Name, API Key, API Secret

### 3. Add to .env
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Test Image Upload
```bash
curl -X POST http://localhost:5000/api/products \
  -F "name=Test Product with Image" \
  -F "category=Connectors" \
  -F "price=500" \
  -F "images=@/path/to/your/image.jpg"
```

---

## 📊 Bulk Upload via Excel

### 1. Download Template
You can generate a template programmatically or create one with these columns:

| Column | Type | Required | Example |
|--------|------|----------|---------|
| SKU | String | No | PROD-001 |
| Name | String | Yes | Canvas Hose |
| Description | String | No | High-quality... |
| Category | String | Yes | Hoses - Canvas |
| CustomCategory | String | No | |
| Price | Number | Yes | 1500 |
| Currency | String | No | INR |
| Stock | Number | No | 50 |
| Unit | String | No | pieces |
| LowStockThreshold | Number | No | 10 |
| Specifications | JSON String | No | {"Length":"15m"} |
| ImageURL | String | No | https://... |
| Status | String | No | active |

### 2. Upload Excel File
```bash
curl -X POST http://localhost:5000/api/products/bulk-upload \
  -F "file=@products.xlsx"
```

---

## 🔗 Integration with Quotations

The Product module is integrated with the Quotation system. You can add promotional products to quotations:

```javascript
// When creating a quotation
{
  "number": "Q-2025-001",
  "client": "ABC Industries",
  "amount": "50000",
  "promotionalProducts": [
    {
      "product": "65a1b2c3d4e5f6g7h8i9j0k1",
      "displayOrder": 1
    },
    {
      "product": "65a1b2c3d4e5f6g7h8i9j0k2",
      "displayOrder": 2
    }
  ]
}
```

These products will appear at the bottom of the quotation PDF.

---

## ✅ Features Checklist

- ✅ Product CRUD operations
- ✅ Multi-image upload (Cloudinary)
- ✅ Search & filter products
- ✅ Category management
- ✅ Stock tracking & low stock alerts
- ✅ Price history tracking
- ✅ Bulk upload via Excel
- ✅ Pagination & sorting
- ✅ Image management (delete, set primary)
- ✅ Integration with quotations
- ✅ Sample seed data

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:** Make sure MongoDB is running
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod
```

### Issue: "Cloudinary upload failed"
**Solution:** Verify your Cloudinary credentials in .env
```bash
# Test credentials
node -e "console.log(process.env.CLOUDINARY_CLOUD_NAME)"
```

### Issue: "Port 5000 already in use"
**Solution:** Change the port in .env
```env
PORT=5001
```

### Issue: "ValidationError: Product validation failed"
**Solution:** Check that required fields are provided:
- `name` (required)
- `category` (required)
- `price` (required, must be > 0)

---

## 📚 Next Steps

1. **Test all endpoints** using the API documentation
2. **Replace placeholder images** with real product photos
3. **Set up authentication** (uncomment auth middleware in routes)
4. **Build frontend** to consume this API
5. **Add more products** via bulk upload or API

---

## 🤝 Need Help?

- API Documentation: See `PRODUCTS_API.md`
- Check logs in console for detailed error messages
- Verify all environment variables are set correctly

Happy coding! 🚀
