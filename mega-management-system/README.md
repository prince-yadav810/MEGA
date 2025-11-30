# MEGA Management System

A comprehensive business management system for MEGA Enterprises, featuring client management, quotations, tasks, attendance tracking, and more.

## 🌐 Domain Configuration

This application is designed to work with a professional subdomain structure:

- **megaenterprise.in** → Landing page (public-facing marketing website)
- **app.megaenterprise.in** → Management application (this system)

📘 **See [SUBDOMAIN_SETUP.md](SUBDOMAIN_SETUP.md) for complete setup instructions**

## ✨ Features

- 👥 **User Management** - Role-based access control (Admin, Manager, Employee)
- 🏢 **Client Management** - Track clients, contacts, and business cards
- 📄 **Quotations** - Create and manage quotations with PDF generation
- ✅ **Task Management** - Assign and track tasks with real-time updates
- 📍 **Attendance Tracking** - Location-based check-in/check-out
- 💰 **Wallet & Payments** - Track payments and payment reminders
- 📊 **Dashboard** - Real-time analytics and insights
- 💬 **WhatsApp Integration** - Automated payment reminders
- 🔔 **Real-time Notifications** - Socket.IO powered updates
- ☁️ **Cloud Storage** - Cloudinary integration for files and images

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Cloudinary account (for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mega-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**
   
   Create `server/.env` file (see [ENV_TEMPLATE.md](ENV_TEMPLATE.md)):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mega-management
   JWT_SECRET=your_secret_key
   CLIENT_URL=http://localhost:3000
   
   # Cloudinary (required)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Start backend (from server directory)
   cd server
   npm run dev

   # Terminal 2 - Start frontend (from client directory)
   cd client
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🏗️ Production Deployment

### Deploy to Google Cloud Run

See [CLOUD_RUN_DEPLOYMENT.md](CLOUD_RUN_DEPLOYMENT.md) for detailed instructions.

Quick deploy:
```bash
gcloud run deploy mega-management \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

### Configure Custom Domain

Map your subdomain to Cloud Run:
```bash
gcloud run domain-mappings create \
  --service mega-management \
  --domain app.megaenterprise.in \
  --region asia-south1
```

See [SUBDOMAIN_SETUP.md](SUBDOMAIN_SETUP.md) for complete domain configuration.

## 📚 Documentation

- [SUBDOMAIN_SETUP.md](SUBDOMAIN_SETUP.md) - Configure app.megaenterprise.in subdomain
- [ENV_TEMPLATE.md](ENV_TEMPLATE.md) - Environment variables reference
- [CLOUD_RUN_DEPLOYMENT.md](CLOUD_RUN_DEPLOYMENT.md) - Production deployment
- [WHATSAPP_PAYMENT_REMINDER_SETUP.md](WHATSAPP_PAYMENT_REMINDER_SETUP.md) - WhatsApp integration
- [AUTH_SETUP.md](AUTH_SETUP.md) - Authentication setup
- [START_HERE.md](START_HERE.md) - Getting started guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Rate limiting
- Environment-based configuration

## 🛠️ Technology Stack

### Frontend
- React 19
- React Router v6
- Axios for API calls
- Socket.IO client for real-time updates
- Tailwind CSS for styling
- React Hot Toast for notifications

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT authentication
- Socket.IO for real-time communication
- Cloudinary for file storage
- Twilio for WhatsApp integration
- Node-cron for scheduled tasks

## 📖 API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software of MEGA Enterprises.

## 🆘 Support

For issues and questions:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review relevant documentation files
3. Check application logs for errors
4. Contact the development team

---

**Made with ❤️ for MEGA Enterprises**
