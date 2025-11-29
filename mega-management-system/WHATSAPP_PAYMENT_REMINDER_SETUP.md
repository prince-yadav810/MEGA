# 📱 WhatsApp Payment Reminder - Setup Guide

## 🎯 Overview

This system automatically sends payment reminder messages to clients via WhatsApp on a recurring schedule. It supports:
- ✅ Automatic recurring reminders
- ✅ Customizable message templates
- ✅ Multiple reminders per campaign
- ✅ Message tracking and delivery status
- ✅ Mock mode for testing without API
- ✅ Twilio Sandbox for quick testing
- ✅ Production-ready with real WhatsApp Business

---

## 🚀 Quick Start - Testing Mode (5 Minutes)

### Option 1: Mock Mode (No API needed)
Perfect for development and testing without sending real messages.

**Setup:**
1. Add to your `.env` file:
```env
WHATSAPP_PROVIDER=mock
COMPANY_NAME=MEGA Enterprises
COMPANY_PHONE=+91-1234567890
```

2. Restart your server:
```bash
npm run dev
```

3. Messages will be logged to console instead of being sent!

---

### Option 2: Twilio Sandbox (FREE Testing with Real WhatsApp)

#### Step 1: Create Twilio Account (2 minutes)
1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a FREE account
3. Verify your phone number

#### Step 2: Get WhatsApp Sandbox Credentials (1 minute)
1. Login to Twilio Console: https://console.twilio.com
2. Go to: **Messaging → Try it out → Send a WhatsApp message**
3. You'll see:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Click "View" to see it
   - **WhatsApp Number**: `+1 415 523 8886` (Twilio's shared sandbox number)
   - **Join Code**: Something like "join [word]-[word]"

#### Step 3: Configure Your .env File (1 minute)
Add these to `/server/.env`:

```env
# WhatsApp Configuration
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Company Information
COMPANY_NAME=MEGA Enterprises
COMPANY_PHONE=+91-1234567890
```

#### Step 4: Join Sandbox on Your WhatsApp (1 minute)
Before you can receive messages:
1. Open WhatsApp on your phone
2. Send a message to: **+1 415 523 8886**
3. Message text: `join [your-code]` (e.g., "join orange-tiger")
4. You'll get a confirmation message

**Repeat this for all team members who want to test (max 5 people)**

#### Step 5: Test It! (30 seconds)
```bash
# Restart your server
npm run dev
```

The system is now ready to send real WhatsApp messages to numbers that joined the sandbox!

---

## 📋 How to Use

### 1. Create a Payment Reminder Campaign

**From Frontend:**
- Go to Clients page
- Select a client
- Click "Create Payment Reminder"
- Fill in the form:
  - Invoice Number (optional)
  - Invoice Amount (optional)
  - Due Date (optional)
  - Message Template (use variables like {{clientName}}, {{invoiceNumber}})
  - Frequency in Days (e.g., 2 = every 2 days)
  - Total Messages to Send (e.g., 5)

**From API:**
```bash
POST /api/clients/:clientId/payment-reminders
Content-Type: application/json
Authorization: Bearer your_token

{
  "invoiceNumber": "INV-2024-001",
  "invoiceAmount": 50000,
  "dueDate": "2024-12-31",
  "messageTemplate": "Dear {{contactName}},\n\nThis is a friendly reminder regarding payment for {{clientName}}.\n\nInvoice: {{invoiceNumber}}\nAmount: {{invoiceAmount}}\nDue Date: {{dueDate}}\n\nPlease contact us if you have any questions.\n\nBest regards,\n{{companyName}}",
  "frequencyInDays": 2,
  "totalMessagesToSend": 5
}
```

### 2. Available Template Variables

Use these in your message templates:
- `{{clientName}}` - Client company name
- `{{contactName}}` - Contact person name
- `{{invoiceNumber}}` - Invoice/reference number
- `{{invoiceAmount}}` - Amount due (formatted with ₹)
- `{{dueDate}}` - Payment due date
- `{{companyName}}` - Your company name
- `{{companyPhone}}` - Your company phone

**Example Template:**
```
Dear {{contactName}},

This is a payment reminder from {{companyName}}.

Invoice: {{invoiceNumber}}
Amount Due: {{invoiceAmount}}
Due Date: {{dueDate}}

Please process the payment at your earliest convenience.

For any queries, contact us at {{companyPhone}}.

Thank you!
Best regards,
{{companyName}}
```

### 3. How the Scheduler Works

1. **Automatic Checking**: Every 5 minutes, the system checks for due reminders
2. **First Message**: Sent immediately after campaign creation
3. **Subsequent Messages**: Sent based on frequency (e.g., every 2 days)
4. **Completion**: Campaign stops after sending all messages
5. **Status Updates**: Real-time status tracking (active, completed, stopped)

### 4. Monitor Reminders

**Get All Reminders:**
```bash
GET /api/clients/payment-reminders/all?status=active
```

**Get Client Reminders:**
```bash
GET /api/clients/:clientId/payment-reminders
```

**Get Statistics:**
```bash
GET /api/clients/payment-reminders/stats
```

**Check Scheduler Status:**
```bash
GET /api/whatsapp/status
```

**Get Upcoming Reminders:**
```bash
GET /api/whatsapp/scheduler/upcoming?days=7
```

### 5. Manual Actions

**Send Message Manually:**
```bash
POST /api/clients/payment-reminders/:id/send
```

**Stop Campaign:**
```bash
PATCH /api/clients/payment-reminders/:id/stop
Body: { "reason": "Payment received" }
```

**Resume Campaign:**
```bash
PATCH /api/clients/payment-reminders/:id/resume
```

**Test WhatsApp Connection:**
```bash
POST /api/whatsapp/test
Body: {
  "phoneNumber": "+919876543210",
  "message": "Test message"
}
```

---

## 🏭 Production Setup (Real WhatsApp Business)

### Option 1: Twilio Production

#### Step 1: Get a Business Phone Number
You need a dedicated phone number for WhatsApp:
- Get a new mobile SIM (Jio/Airtel/Vi) (~₹300/month)
- OR use a virtual number
- Must NOT be registered on WhatsApp already

#### Step 2: Enable WhatsApp for Your Number
1. Login to Twilio Console
2. Go to: **Messaging → Senders → WhatsApp Senders**
3. Click "Add new WhatsApp Sender"
4. Follow the setup process (takes 1-2 hours)
5. Verify your business details with Facebook

#### Step 3: Update .env for Production
```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_WHATSAPP_FROM=whatsapp:+919876543210  # Your business number
COMPANY_NAME=MEGA Enterprises
COMPANY_PHONE=+91-9876543210
```

**Costs:**
- Phone Number: ~₹300-500/month
- Messages: ~₹0.35 per message
- Total for 1000 messages: ~₹650/month

---

### Option 2: Meta WhatsApp Business API (FREE Messages)

#### Requirements:
- Facebook Business Account
- Business phone number
- Business verification documents
- Website (optional but recommended)

#### Setup Process:
1. Create Facebook Business Account
2. Apply for WhatsApp Business API access
3. Complete business verification (7-14 days)
4. Configure webhooks and endpoints
5. Get approved message templates

**Benefits:**
- First 1000 conversations/month: FREE
- After 1000: ₹0.40-1.60 per conversation
- Official Meta support

**Setup Instructions:**
https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

---

## 🔧 Environment Variables Reference

Add these to `/server/.env`:

```env
# ============================================
# WhatsApp Configuration
# ============================================

# Provider: mock (testing) or twilio (production)
WHATSAPP_PROVIDER=mock

# Twilio Credentials (if using Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Twilio WhatsApp Number
# Sandbox: whatsapp:+14155238886
# Production: whatsapp:+919876543210 (your number)
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ============================================
# Company Information (for message templates)
# ============================================
COMPANY_NAME=MEGA Enterprises
COMPANY_PHONE=+91-1234567890

# ============================================
# Other Required Variables
# ============================================
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

---

## 📊 API Endpoints Reference

### Payment Reminders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients/payment-reminders/all` | Get all reminders |
| GET | `/api/clients/payment-reminders/stats` | Get statistics |
| GET | `/api/clients/:clientId/payment-reminders` | Get client reminders |
| POST | `/api/clients/:clientId/payment-reminders` | Create reminder |
| POST | `/api/clients/payment-reminders/:id/send` | Send manually |
| PATCH | `/api/clients/payment-reminders/:id/stop` | Stop campaign |
| PATCH | `/api/clients/payment-reminders/:id/resume` | Resume campaign |
| DELETE | `/api/clients/payment-reminders/:id` | Delete reminder |

### WhatsApp Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/status` | Get service status |
| POST | `/api/whatsapp/test` | Test connection |
| GET | `/api/whatsapp/scheduler/stats` | Get scheduler stats |
| POST | `/api/whatsapp/scheduler/trigger` | Manual trigger (admin) |
| GET | `/api/whatsapp/scheduler/upcoming` | Upcoming reminders |
| GET | `/api/whatsapp/scheduler/overdue` | Overdue reminders |
| POST | `/api/whatsapp/scheduler/reset-stats` | Reset stats (admin) |

---

## 🐛 Troubleshooting

### Issue: Messages not being sent

**Check 1: Verify service status**
```bash
curl http://localhost:5000/api/whatsapp/status
```

**Check 2: Check environment variables**
```bash
# In server directory
cat .env | grep WHATSAPP
cat .env | grep TWILIO
```

**Check 3: Check server logs**
Look for these messages on server startup:
- ✅ "WhatsApp Service initialized with Twilio"
- ✅ "Payment Reminder Scheduler started"

**Check 4: Verify credentials**
- Login to Twilio Console
- Check if credentials are correct
- Verify number format

---

### Issue: "Recipient has not joined sandbox"

**Solution:**
The recipient must join the Twilio sandbox first:
1. Send WhatsApp message to: +1 415 523 8886
2. Message text: `join [your-code]`
3. Wait for confirmation
4. Try sending again

---

### Issue: Invalid phone number

**Solution:**
Phone numbers must include country code:
- ✅ Good: `+919876543210`
- ✅ Good: `9876543210` (assumes +91)
- ❌ Bad: `9876543210` without country assumption

---

### Issue: Scheduler not running

**Check scheduler status:**
```bash
curl http://localhost:5000/api/whatsapp/scheduler/stats
```

**Manual trigger:**
```bash
curl -X POST http://localhost:5000/api/whatsapp/scheduler/trigger \
  -H "Authorization: Bearer your_token"
```

---

## 📈 Best Practices

### 1. Message Templates
- ✅ Keep messages professional and clear
- ✅ Include all relevant details
- ✅ Add contact information
- ✅ Be polite and friendly
- ❌ Don't use ALL CAPS
- ❌ Don't spam excessively

### 2. Frequency
- **Recommended**: 2-3 days between messages
- **Avoid**: Daily messages (too aggressive)
- **Maximum**: 5-10 messages per campaign

### 3. Testing
- Always test in MOCK or SANDBOX mode first
- Test with your own number before sending to clients
- Verify message formatting and variables

### 4. Monitoring
- Check scheduler stats regularly
- Monitor failed messages
- Review delivery reports

---

## 🎓 Example Use Cases

### Use Case 1: Invoice Payment Reminder
```javascript
{
  "invoiceNumber": "INV-2024-123",
  "invoiceAmount": 75000,
  "dueDate": "2024-12-25",
  "messageTemplate": "Dear {{contactName}},\n\nGentle reminder for invoice {{invoiceNumber}} amounting to {{invoiceAmount}}.\n\nDue date: {{dueDate}}\n\nKindly process at your earliest.\n\nRegards,\n{{companyName}}",
  "frequencyInDays": 3,
  "totalMessagesToSend": 5
}
```

### Use Case 2: Follow-up Reminder (No Invoice)
```javascript
{
  "messageTemplate": "Hi {{contactName}},\n\nThis is a follow-up regarding pending payment from {{clientName}}.\n\nPlease let us know the status.\n\nThank you!\n{{companyName}}\n{{companyPhone}}",
  "frequencyInDays": 2,
  "totalMessagesToSend": 3
}
```

---

## 🆘 Support

For issues or questions:
1. Check server logs: `npm run dev`
2. Check API response errors
3. Review this documentation
4. Check Twilio Console for API errors

---

## 🎉 You're All Set!

Your WhatsApp Payment Reminder system is now configured and ready to use!

**Next Steps:**
1. ✅ Test in MOCK mode first
2. ✅ Try Twilio Sandbox with team members
3. ✅ Create your first reminder campaign
4. ✅ Monitor the results
5. ✅ Upgrade to production when ready

Happy sending! 📱💰



