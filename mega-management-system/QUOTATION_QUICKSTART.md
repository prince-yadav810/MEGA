# Quotation Management - Quick Start Guide

## Prerequisites
- MongoDB running on `localhost:27017`
- Node.js installed
- Backend server running on port 5001
- Frontend running on port 3000

## Starting the Application

### 1. Start MongoDB
```bash
# macOS (if using Homebrew)
brew services start mongodb-community

# Or manually
mongod --dbpath /path/to/your/db
```

### 2. Start Backend Server
```bash
cd server
npm install  # If not already installed
npm run dev  # Runs on port 5001
```

### 3. Start Frontend
```bash
cd client
npm install  # If not already installed
npm start    # Runs on port 3000
```

## Testing the Excel Upload Feature

### Option 1: Use the Sample CSV Template
1. Open the file: `sample_quotations_template.csv`
2. Save it as an Excel file (.xlsx) using Excel, Google Sheets, or LibreOffice
3. Navigate to http://localhost:3000/quotations
4. Click "Upload Excel" button
5. Select the Excel file
6. Wait for the upload to complete
7. You should see the quotations appear in the list

### Option 2: Create Your Own Excel File

Create an Excel file with these columns:

| Column Name | Required | Example |
|------------|----------|---------|
| Quote Number | Yes | Q-2024-001 |
| Client | Yes | ABC Industries |
| Title | Yes | Industrial Equipment |
| Amount | Yes | ₹2,50,000 |
| Status | No | pending |
| Valid Until | Yes | 2024-12-31 |
| Items | No | 10 |
| Created Date | No | 2024-12-01 |

**Sample Data:**
```
Quote Number: Q-2024-001
Client: ABC Industries
Title: Industrial Hoses & Connectors
Amount: ₹2,50,000
Status: pending
Valid Until: 2024-12-31
Items: 12
Created Date: 2024-12-01
```

## Features to Test

### 1. Search Functionality
Try searching for:
- Quote number: "Q-2024-001"
- Client name: "ABC"
- Title: "Industrial"
- Amount: "250000"

### 2. Filter Functionality
Click the "Filter" button and select:
- All Quotations
- Pending
- Approved
- Rejected
- Expired

### 3. Combined Search & Filter
1. Select a filter (e.g., "Pending")
2. Then search within those results

### 4. Upload Scenarios

#### Valid Upload
- Upload the sample Excel file
- Should show success message with statistics
- List should refresh automatically

#### Duplicate Handling
- Upload the same file twice
- Second upload should update existing records

#### Invalid File
- Try uploading a .txt or .pdf file
- Should show error: "Please upload a valid Excel file"

#### Missing Required Fields
- Create Excel with missing "Client" column
- Should show parse errors in response

## API Testing (Optional)

### Get All Quotations
```bash
curl http://localhost:5001/api/quotations
```

### Upload Excel (Using curl)
```bash
curl -X POST http://localhost:5001/api/quotations/upload \
  -F "file=@/path/to/your/file.xlsx"
```

## Troubleshooting

### Issue: "Failed to load quotations"
**Solution:**
- Check if backend server is running on port 5001
- Check if MongoDB is running
- Check browser console for errors

### Issue: "Upload failed"
**Solution:**
- Verify file is .xls or .xlsx format
- Check all required columns exist
- Ensure dates are valid
- Check backend logs for detailed errors

### Issue: "No quotations displayed"
**Solution:**
- Upload at least one Excel file first
- Check if MongoDB has data: `mongo mega-management > db.quotations.find()`
- Refresh the page

### Issue: "Search not working"
**Solution:**
- Make sure quotations are loaded first
- Check if any filters are applied
- Try clearing filters and searching again

## Database Verification

Check if data is saved in MongoDB:

```bash
# Connect to MongoDB
mongosh

# Use the database
use mega-management

# View all quotations
db.quotations.find().pretty()

# Count quotations
db.quotations.countDocuments()

# Find specific quotation
db.quotations.findOne({ number: "Q-2024-001" })

# Delete all quotations (for testing)
db.quotations.deleteMany({})
```

## Expected Behavior

### After Uploading Excel File:

1. **Upload Button**: Shows loading spinner with percentage
2. **Success Message**: Shows statistics:
   - Total processed
   - Successfully saved
   - Parse errors (if any)
   - Save errors (if any)

3. **List Updates**: Automatically refreshes to show new/updated quotations

4. **Statistics Update**:
   - Total Quotes count
   - Pending count
   - Approved count
   - Total Value (in Lakhs)

### Search & Filter:

1. **Search**: Type in search box → Results filter instantly
2. **Filter**: Click filter → Select status → List updates
3. **Combined**: Filter by status → Search within results
4. **Clear**: Clear search/select "All" to reset

## Next Steps

Once you've verified the basic functionality works:

1. Test with larger Excel files (100+ rows)
2. Test with various date formats
3. Test with different currency formats
4. Test error handling with invalid data
5. Consider adding more features from `QUOTATION_IMPLEMENTATION.md`

## Support Files

- `QUOTATION_IMPLEMENTATION.md` - Complete implementation details
- `QUOTATION_EXCEL_FORMAT.md` - Detailed Excel format specifications
- `sample_quotations_template.csv` - Sample data to convert to Excel

## Notes

- **Port Numbers**: Backend runs on 5001, Frontend on 3000
- **Database**: MongoDB must be running for the app to work
- **File Size Limit**: Maximum 10MB per Excel file
- **Duplicate Handling**: Quotations with same "Quote Number" will be updated
- **Date Format**: Supports various formats (DD/MM/YYYY, YYYY-MM-DD, Excel dates)
