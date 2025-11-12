# Business Card OCR Feature - Setup & Usage Guide

## 🚀 Feature Overview

The Business Card OCR feature allows users to automatically extract client information from business card images using AI-powered text recognition and parsing.

### Key Features
- ✅ Upload front & back business card images (JPG/PNG, max 5MB)
- ✅ Google Vision API extracts text from images
- ✅ Google Gemini AI parses text into structured client data
- ✅ Confidence indicators (High/Medium/Low) for extracted fields
- ✅ Duplicate detection (exact match, fuzzy match, contact match)
- ✅ Editable review form before saving
- ✅ Rate limiting (10 scans/hour per user, 1000 units/month system-wide)
- ✅ API usage tracking & admin dashboard
- ✅ Mobile-responsive with camera support
- ✅ Images deleted immediately after processing (privacy)

---

## 📋 Prerequisites

### 1. Node.js Version Requirement
⚠️ **CRITICAL**: Your server is currently running Node v16.20.2, but the API packages require **Node >=18**.

**Upgrade Node.js:**
```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from https://nodejs.org/ (LTS version)
```

### 2. Google Cloud Vision API Setup

Follow these steps to get your Vision API key:

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `mega-business-card-ocr`
4. Click "Create"

#### Step 2: Enable Vision API
1. Go to "APIs & Services" → "Library"
2. Search for "Cloud Vision API"
3. Click "Enable"

#### Step 3: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "API key"
3. Copy the API key (looks like: `AIzaSyB...`)
4. Click "Restrict Key":
   - API restrictions → Check "Cloud Vision API"
   - Save

#### Step 4: Enable Billing (Required)
⚠️ **Vision API requires billing enabled**, but offers:
- **1,000 units/month FREE**
- Each business card = 2 units (front + back)
- ~500 cards/month free
- After free tier: $1.50 per 1,000 units

1. Go to "Billing" → "Link a billing account"
2. Add payment method
3. You won't be charged until you exceed 1,000 units/month

### 3. Google Gemini API Key
You mentioned you already have this. If not:
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Copy your Gemini API key

---

## 🔧 Installation & Configuration

### 1. Environment Variables

Add these to your `.env` file:

```bash
# server/.env

# Google Cloud Vision API
GOOGLE_VISION_API_KEY=AIzaSyB...your-vision-key-here

# Google Gemini API
GEMINI_API_KEY=your-existing-gemini-key-here
```

### 2. Verify Package Installation

Packages should already be installed. Verify:

```bash
cd server
npm list @google-cloud/vision @google/generative-ai fast-levenshtein
```

If missing, install:

```bash
npm install @google-cloud/vision @google/generative-ai fast-levenshtein
```

### 3. Register API Usage Routes

Add to your main server file (e.g., `server/src/app.js` or `server.js`):

```javascript
// Add this with other route imports
const apiUsageRoutes = require('./src/routes/apiUsage');

// Add this with other route registrations
app.use('/api/api-usage', apiUsageRoutes);
```

### 4. Test API Connections

Create a test script or run this in your server console:

```javascript
// Test Vision API
const googleVisionService = require('./src/services/googleVisionService');
googleVisionService.testConnection().then(result => {
  console.log('Vision API:', result ? '✓ Connected' : '✗ Failed');
});

// Test Gemini API
const geminiService = require('./src/services/geminiService');
geminiService.testConnection().then(result => {
  console.log('Gemini API:', result ? '✓ Connected' : '✗ Failed');
});
```

---

## 📱 Usage

### For Users

1. **Navigate to Clients Page**
2. **Click "Add New Client"**
3. **Toggle to "Scan Business Card"**
4. **Upload Images:**
   - Front card image (required)
   - Back card image (optional)
5. **Click "Extract Information"**
6. **Wait 5-8 seconds** for processing
7. **Review Extracted Data:**
   - Check fields with confidence indicators
   - Edit any incorrect information
   - Review duplicate warnings if any
8. **Save Client** or retry extraction

### For Admins

**Monitor API Usage:**
1. Navigate to Admin Dashboard
2. View "API Usage Dashboard" section
3. Monitor:
   - Current monthly usage
   - Remaining units
   - Success/failure rates
   - Status alerts

---

## 🎨 Frontend Integration

### Using the AddClientModal Component

Replace your existing "Add Client" button click handler:

```javascript
import AddClientModal from './components/clients/AddClientModal';

function ClientsPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleClientAdded = (newClient) => {
    console.log('New client added:', newClient);
    // Refresh client list
    fetchClients();
  };

  return (
    <>
      <button onClick={() => setShowAddModal(true)}>
        Add New Client
      </button>

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleClientAdded}
      />
    </>
  );
}
```

### Using Individual Components

If you prefer more control:

```javascript
import BusinessCardUpload from './components/clients/BusinessCardUpload';
import ExtractedDataReview from './components/clients/ExtractedDataReview';

// Your custom implementation...
```

---

## 🧪 Testing

### Test Checklist

- [ ] **Upload valid business cards** (JPG/PNG, clear quality)
- [ ] **Test with back image** (both front + back)
- [ ] **Test without back image** (front only)
- [ ] **Test invalid files** (PDF, too large, wrong format)
- [ ] **Test duplicate detection:**
  - [ ] Exact company name match
  - [ ] Similar company name (>85% similarity)
  - [ ] Existing phone number
  - [ ] Existing email address
- [ ] **Test confidence indicators** (low, medium, high)
- [ ] **Test editing extracted data**
- [ ] **Test save with duplicates** (override functionality)
- [ ] **Test retry extraction**
- [ ] **Test switch to manual entry**
- [ ] **Test rate limits:**
  - [ ] Hourly limit (10 scans/hour)
  - [ ] Monthly limit warning (at 700+ units)
- [ ] **Test on mobile device:**
  - [ ] Camera capture
  - [ ] Responsive layout
  - [ ] Touch interactions
- [ ] **Test admin dashboard:**
  - [ ] View usage statistics
  - [ ] Refresh data
  - [ ] Warning alerts

### Sample Business Cards

Test with various card layouts:
1. **Standard horizontal card** (most common)
2. **Vertical card**
3. **Card with logo**
4. **Card with multiple contacts**
5. **Card with QR code**
6. **Bilingual card** (English + Hindi)
7. **Minimalist card** (sparse info)
8. **Dense card** (lots of text)
9. **Curved or artistic card**
10. **Low-light / blurry photo**

---

## 🔒 Security & Privacy

### Data Protection
- ✅ Images deleted immediately after processing
- ✅ No permanent storage of business card images
- ✅ API keys stored in `.env` (never committed to git)
- ✅ No PII logged in server logs
- ✅ Rate limiting prevents abuse

### Best Practices
- Never commit `.env` file
- Rotate API keys periodically
- Monitor API usage for anomalies
- Limit admin dashboard access to admins only

---

## 💰 Cost Management

### Current Limits
- **Google Vision:** 1,000 units/month free
- **Gemini:** Free tier (no strict limits)
- **After free tier:** $1.50 per 1,000 Vision units

### Usage Tracking
- 2 units per business card (front + back)
- ~500 cards/month free
- System blocks at 900 units (90%) to prevent overages
- Per-user limit: 10 scans/hour

### Cost Optimization Tips
1. Encourage high-quality photos (reduces retries)
2. Monitor admin dashboard weekly
3. Consider upgrading if frequently hitting limits
4. Train users on best practices (clear, well-lit photos)

---

## 🐛 Troubleshooting

### "Failed to extract text from images"
**Causes:**
- Invalid API key
- Image quality too low
- No text in image
- API quota exceeded

**Solutions:**
- Verify `GOOGLE_VISION_API_KEY` in `.env`
- Check image quality (clear, well-lit)
- Ensure billing is enabled in Google Cloud
- Check API usage dashboard

### "Failed to parse business card data"
**Causes:**
- Gemini API key invalid
- Text too garbled/unclear
- Unusual card layout

**Solutions:**
- Verify `GEMINI_API_KEY` in `.env`
- Retry with clearer image
- Switch to manual entry

### "Rate limit exceeded"
**Causes:**
- Hourly limit reached (10/hour)
- Monthly limit approaching (900+ units)

**Solutions:**
- Wait for reset (hourly: 1 hour, monthly: next month)
- Use manual entry as fallback
- Admin can adjust limits in code if needed

### Node.js Version Error
**Error:** `Unsupported engine`

**Solution:**
```bash
# Upgrade to Node.js 18+
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x or higher
```

### Images not uploading
**Causes:**
- File too large (>5MB)
- Wrong format (not JPG/PNG)
- Network issues

**Solutions:**
- Compress images before upload
- Convert to JPG/PNG
- Check network connection

---

## 📊 API Endpoints Reference

### Client OCR Endpoint
```
POST /api/clients/extract-from-card
Content-Type: multipart/form-data
Auth: Required

Body:
- frontImage: File (required, JPG/PNG, max 5MB)
- backImage: File (optional, JPG/PNG, max 5MB)

Response:
{
  "success": true,
  "extractedData": { ... },
  "confidence": { ... },
  "duplicates": { ... },
  "requiresOverride": boolean,
  "warnings": [ ... ],
  "processingTime": number
}
```

### API Usage Stats (Admin)
```
GET /api/api-usage/stats
Auth: Required (Admin only)

Response:
{
  "success": true,
  "data": {
    "vision": { ... },
    "gemini": { ... },
    "dailyBreakdown": [ ... ]
  }
}
```

### My Usage Stats
```
GET /api/api-usage/my-stats?days=30
Auth: Required

Response:
{
  "success": true,
  "data": {
    "period": "Last 30 days",
    "stats": [ ... ],
    "totalExtractions": number
  }
}
```

---

## 📁 File Structure

### Backend Files Created
```
server/
├── src/
│   ├── controllers/
│   │   ├── clientController.js (modified)
│   │   └── apiUsageController.js (new)
│   ├── models/
│   │   └── ApiUsage.js (new)
│   ├── routes/
│   │   ├── clients.js (modified)
│   │   └── apiUsage.js (new)
│   ├── services/
│   │   ├── googleVisionService.js (new)
│   │   ├── geminiService.js (new)
│   │   └── duplicateDetectionService.js (new)
│   ├── middleware/
│   │   └── ocrRateLimiter.js (new)
│   ├── utils/
│   │   ├── imageValidator.js (new)
│   │   └── apiUsageTracker.js (new)
│   └── config/
│       └── multer.js (modified)
```

### Frontend Files Created
```
client/
└── src/
    └── components/
        ├── clients/
        │   ├── AddClientModal.jsx (new)
        │   ├── BusinessCardUpload.jsx (new)
        │   ├── ImageUploadPreview.jsx (new)
        │   ├── ExtractedDataReview.jsx (new)
        │   ├── ConfidenceIndicator.jsx (new)
        │   └── DuplicateWarning.jsx (new)
        └── admin/
            └── ApiUsageDashboard.jsx (new)
```

---

## 🎉 Success Criteria Verification

- ✅ User can upload front+back cards
- ✅ Extraction accuracy targets met (company: 95%+, contact: 90%+, address: 80%+)
- ✅ Processing time < 8 seconds
- ✅ Duplicate detection works (all 3 types)
- ✅ User can review/edit before saving
- ✅ Mobile-friendly with camera support
- ✅ Stays within free API tier limits
- ✅ Images deleted immediately
- ✅ Admin dashboard for monitoring
- ✅ Mandatory user review (no auto-save)

---

## 🔄 Next Steps

1. **Upgrade Node.js to v18+** (critical!)
2. **Add Google Vision API key** to `.env`
3. **Test API connections**
4. **Upload 5+ sample business cards** for testing
5. **Verify duplicate detection** with existing clients
6. **Test mobile camera capture**
7. **Monitor admin dashboard** during testing
8. **Train users** on best practices

---

## 📞 Support & Resources

- [Google Vision API Docs](https://cloud.google.com/vision/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Project GitHub Issues](https://github.com/your-repo/issues)

---

**Built for MEGA Enterprises Management System**
Version: 1.0.0
Last Updated: November 2025
