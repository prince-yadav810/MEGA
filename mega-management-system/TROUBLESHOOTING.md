# Troubleshooting Guide - Excel Upload Issue

## Problem: "Failed to upload Excel file. Please try again."

### Common Causes and Solutions

### 1. Using CSV File Instead of Excel

**Issue**: The `sample_quotations_template.csv` file cannot be uploaded directly because CSV files with commas in values (like amounts) cause parsing issues.

**Solution**: Use the provided Excel file:
- Upload the file: `sample_quotations.xlsx` (already created in the root directory)
- This file is properly formatted and ready to upload

**Alternative**: If you need to create your own file from the CSV template:
```bash
# Convert CSV to Excel using the provided script
cd /Users/krishnasoni/Documents/3D\ Object/SAAS/Mega/MEGA/mega-management-system
node create-sample-excel.js
```

### 2. Check Backend Server is Running

**Verify server is running**:
```bash
# Check if server is running on port 5001
lsof -i :5001
```

**If not running, start it**:
```bash
cd server
npm run dev
```

**Check server logs** for detailed error messages when you attempt an upload.

### 3. Check MongoDB is Running

**Verify MongoDB is running**:
```bash
# macOS with Homebrew
brew services list | grep mongodb

# Or check manually
ps aux | grep mongod
```

**Start MongoDB if needed**:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or manually
mongod --dbpath /path/to/your/db
```

### 4. Check Browser Console

Open your browser's Developer Tools (F12) and check the **Console** tab for errors when uploading.

Common errors you might see:
- **Network error**: Backend server not running or wrong port
- **CORS error**: Backend CORS configuration issue
- **File type error**: Invalid file format

### 5. File Format Issues

**Ensure your Excel file has**:
- Correct column headers (see format below)
- No extra commas in Amount field (use `₹250000` not `₹2,50,000`)
- Valid dates in proper format
- Required fields filled

**Required Columns**:
- Quote Number (required)
- Client (required)
- Title (required)
- Amount (required)
- Valid Until (required)
- Status (optional - defaults to 'pending')
- Items (optional - defaults to 0)
- Created Date (optional - defaults to current date)

### 6. Network/API Issues

**Test the API endpoint manually**:
```bash
# Test if backend is accessible
curl http://localhost:5001/api/quotations

# Test file upload (replace path with actual file)
curl -X POST http://localhost:5001/api/quotations/upload \
  -F "file=@/path/to/sample_quotations.xlsx"
```

### 7. Check File Size

Maximum file size is **10MB**. If your file is larger, you'll need to:
- Split it into smaller files
- Remove unnecessary data
- Or increase the limit in `server/server.js`

---

## Step-by-Step Debugging Process

### Step 1: Check What File You're Using

The issue you're experiencing is most likely because you're trying to upload the CSV file.

**DON'T USE**: `sample_quotations_template.csv`
**USE**: `sample_quotations.xlsx`

The .xlsx file has been created for you and is ready to use.

### Step 2: Open Browser Developer Tools

1. Open the application in your browser
2. Press **F12** or **Right-click → Inspect**
3. Go to the **Console** tab
4. Go to the **Network** tab
5. Try uploading the file again
6. Look for errors in both tabs

### Step 3: Check Backend Logs

In your terminal where the server is running, you should see logs like:
```
Upload request received
Files: { file: {...} }
File details: { name: 'sample_quotations.xlsx', mimetype: '...', size: ... }
Reading Excel file...
Sheet name: Quotations
Parsed rows: 5
First row sample: { ... }
```

If you don't see these logs, the request isn't reaching the backend.

### Step 4: Verify Frontend-Backend Connection

Check that the frontend is pointing to the correct backend URL:

**In `client/src/services/quotationService.js`**, line 3 should be:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

Note: Port is **5001** (not 5000)

### Step 5: Test with Sample Excel File

1. Navigate to: `/Users/krishnasoni/Documents/3D Object/SAAS/Mega/MEGA/mega-management-system/`
2. Find the file: `sample_quotations.xlsx`
3. Go to http://localhost:3000/quotations
4. Click "Upload Excel"
5. Select `sample_quotations.xlsx`
6. Upload

**Expected result**: Success message showing "Successfully uploaded! Total processed: 5, Saved: 5"

---

## Still Having Issues?

### Get Detailed Error Information

The error messages now include more details. When you see an error alert:
1. Read the full message
2. Check browser console for more details
3. Check backend terminal logs
4. Look for specific error messages

### Common Error Messages

#### "Please upload an Excel file"
**Cause**: File not received by backend
**Solution**: Check if file is selected, check network connection

#### "Please upload a valid Excel file (.xls, .xlsx, or .csv)"
**Cause**: Invalid file type
**Solution**: Make sure you're uploading .xlsx file, not .csv

#### "Excel file is empty or improperly formatted"
**Cause**: File has no data or headers are wrong
**Solution**: Use the provided `sample_quotations.xlsx` file

#### "Failed to upload Excel file"
**Cause**: Various backend errors
**Solution**: Check backend terminal logs for specific error details

### Reset and Try Again

1. **Clear browser cache**: Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. **Restart backend server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Start it again
   cd server
   npm run dev
   ```
3. **Restart frontend**:
   ```bash
   # Stop the frontend (Ctrl+C)
   # Start it again
   cd client
   npm start
   ```
4. **Check MongoDB is running**
5. **Try uploading `sample_quotations.xlsx` again**

---

## Quick Checklist

- [ ] MongoDB is running
- [ ] Backend server is running on port 5001
- [ ] Frontend is running on port 3000
- [ ] Using `sample_quotations.xlsx` file (NOT the .csv file)
- [ ] Browser console shows no errors
- [ ] Backend logs are visible in terminal
- [ ] File is less than 10MB
- [ ] You've checked the network tab for the API call

---

## Contact for Help

If none of the above solutions work:

1. Take a screenshot of:
   - The error message
   - Browser console
   - Network tab (showing the failed request)
   - Backend terminal logs

2. Note down:
   - Which file you're trying to upload
   - File size
   - Browser you're using
   - Any other error messages

3. Check the detailed logs in:
   - Browser console (F12 → Console)
   - Backend terminal (where `npm run dev` is running)
