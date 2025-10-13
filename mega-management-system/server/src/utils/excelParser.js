const XLSX = require('xlsx');

/**
 * Parse Excel file for products bulk upload
 * Expected columns: SKU, Name, Description, Category, CustomCategory, Price, Currency, Stock, Unit, Specifications, ImageURL
 * @param {Object} file - File object from multer or express-fileupload
 * @returns {Array} Array of product objects
 */
exports.parseProductsFile = async (file) => {
  try {
    // Read the workbook
    const workbook = XLSX.read(file.data || file.buffer, { type: 'buffer' });

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      throw new Error('No data found in Excel file');
    }

    // Map Excel data to product schema
    const products = data.map((row, index) => {
      try {
        // Parse specifications from JSON string or object
        let specifications = {};
        if (row.Specifications) {
          try {
            specifications = typeof row.Specifications === 'string'
              ? JSON.parse(row.Specifications)
              : row.Specifications;
          } catch (e) {
            console.error(`Error parsing specifications at row ${index + 2}:`, e);
          }
        }

        // Parse image URLs (comma-separated)
        let images = [];
        if (row.ImageURL || row.ImageURLs || row['Image URLs']) {
          const imageUrls = (row.ImageURL || row.ImageURLs || row['Image URLs'])
            .split(',')
            .map(url => url.trim())
            .filter(url => url);

          images = imageUrls.map((url, idx) => ({
            url,
            isPrimary: idx === 0
          }));
        } else {
          // Default placeholder image
          images = [{
            url: 'https://via.placeholder.com/400x300?text=Product+Image',
            isPrimary: true
          }];
        }

        const product = {
          sku: row.SKU || row.sku,
          name: row.Name || row.name,
          description: row.Description || row.description || '',
          category: row.Category || row.category || 'Custom',
          customCategory: row.CustomCategory || row.customCategory || '',
          price: parseFloat(row.Price || row.price || 0),
          currency: row.Currency || row.currency || 'INR',
          specifications,
          images,
          status: row.Status || row.status || 'active',
          stock: {
            quantity: parseInt(row.Stock || row.stock || row.Quantity || 0),
            unit: row.Unit || row.unit || 'pieces',
            lowStockThreshold: parseInt(row.LowStockThreshold || row.lowStockThreshold || 10)
          }
        };

        // Validate required fields
        if (!product.name) {
          throw new Error(`Missing required field 'Name' at row ${index + 2}`);
        }
        if (!product.price || product.price <= 0) {
          throw new Error(`Invalid price at row ${index + 2}`);
        }

        return product;
      } catch (error) {
        console.error(`Error processing row ${index + 2}:`, error);
        return null;
      }
    }).filter(product => product !== null);

    return products;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

/**
 * Generate Excel template for products
 * @returns {Buffer} Excel file buffer
 */
exports.generateProductTemplate = () => {
  const templateData = [
    {
      SKU: 'PROD-20250110-1234',
      Name: 'Canvas Fire Hose - 2 inch',
      Description: 'High-quality canvas fire hose suitable for industrial use',
      Category: 'Hoses - Canvas',
      CustomCategory: '',
      Price: 1500,
      Currency: 'INR',
      Stock: 50,
      Unit: 'pieces',
      LowStockThreshold: 10,
      Specifications: '{"Length":"15 meters","Diameter":"2 inches","Material":"Canvas","Pressure":"250 PSI"}',
      ImageURL: 'https://via.placeholder.com/400x300?text=Canvas+Hose'
    },
    {
      SKU: 'PROD-20250110-1235',
      Name: 'PVC Hose - 1.5 inch',
      Description: 'Flexible PVC hose for general purposes',
      Category: 'Hoses - PVC',
      CustomCategory: '',
      Price: 800,
      Currency: 'INR',
      Stock: 100,
      Unit: 'pieces',
      LowStockThreshold: 20,
      Specifications: '{"Length":"10 meters","Diameter":"1.5 inches","Material":"PVC"}',
      ImageURL: 'https://via.placeholder.com/400x300?text=PVC+Hose'
    },
    {
      SKU: 'PROD-20250110-1236',
      Name: 'Brass Connector - 2 inch',
      Description: 'Heavy-duty brass connector',
      Category: 'Connectors',
      CustomCategory: '',
      Price: 350,
      Currency: 'INR',
      Stock: 200,
      Unit: 'pieces',
      LowStockThreshold: 30,
      Specifications: '{"Size":"2 inches","Material":"Brass","Type":"Male/Female"}',
      ImageURL: 'https://via.placeholder.com/400x300?text=Brass+Connector'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // SKU
    { wch: 30 }, // Name
    { wch: 50 }, // Description
    { wch: 20 }, // Category
    { wch: 20 }, // CustomCategory
    { wch: 10 }, // Price
    { wch: 10 }, // Currency
    { wch: 10 }, // Stock
    { wch: 10 }, // Unit
    { wch: 15 }, // LowStockThreshold
    { wch: 60 }, // Specifications
    { wch: 50 }  // ImageURL
  ];

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Export products to Excel
 * @param {Array} products - Array of product documents
 * @returns {Buffer} Excel file buffer
 */
exports.exportProductsToExcel = (products) => {
  try {
    const exportData = products.map(product => ({
      SKU: product.sku,
      Name: product.name,
      Description: product.description || '',
      Category: product.category,
      CustomCategory: product.customCategory || '',
      Price: product.price,
      Currency: product.currency,
      Stock: product.stock?.quantity || 0,
      Unit: product.stock?.unit || 'pieces',
      Status: product.status,
      Specifications: JSON.stringify(Object.fromEntries(product.specifications || new Map())),
      ImageURL: product.images?.map(img => img.url).join(', ') || '',
      CreatedAt: product.createdAt,
      UpdatedAt: product.updatedAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 20 },
      { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 15 }, { wch: 60 }, { wch: 50 },
      { wch: 20 }, { wch: 20 }
    ];

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export products to Excel');
  }
};
