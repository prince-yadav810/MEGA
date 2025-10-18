# Authentication System Setup Guide

## Overview

The MEGA Management System now includes a complete JWT-based authentication system with MongoDB user storage. This guide will help you get started with the authentication features.

## Features Implemented

✅ **JWT Token Authentication** - Secure token-based authentication
✅ **MongoDB User Storage** - Users stored in database with encrypted passwords
✅ **Login Page** - Clean, modern login UI matching the management system design
✅ **Protected Routes** - All management pages require authentication
✅ **401 Auto-Redirect** - Automatic redirect to login on unauthorized access
✅ **User Profile Display** - Shows logged-in user info in sidebar
✅ **Logout Functionality** - Secure logout with token cleanup
✅ **Admin from .env** - Admin credentials configured via environment variables

## Quick Start

### 1. Admin Credentials

The admin user is already configured in `/server/.env`:

```env
ADMIN_EMAIL=admin@mega.com
ADMIN_PASSWORD=Admin@123
```

### 2. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm install  # if you haven't already
npm start    # or npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm install  # if you haven't already
npm start
```

### 3. Login

1. Open your browser to http://localhost:3000
2. You'll be automatically redirected to the login page
3. Use the admin credentials:
   - Email: `admin@mega.com`
   - Password: `Admin@123`

### 4. Access Management System

After successful login, you'll be redirected to the workspace and can access all features!

## User Management

### Adding Users via .env

You can add user credentials directly in the `/server/.env` file:

```env
# Admin User (required)
ADMIN_EMAIL=admin@mega.com
ADMIN_PASSWORD=Admin@123

# Additional Users
USER1_EMAIL=rajesh@mega.com
USER1_PASSWORD=password123
```

After updating `.env`, run the seeder:

```bash
cd server
node src/scripts/seedUsers.js
```

### Existing Test Users

The following test users are already available (default password: `password123`):

- rajesh@mega.com
- priya@mega.com
- amit@mega.com
- sneha@mega.com
- vikash@mega.com

## API Endpoints

### Public Endpoints

- `POST /api/auth/login` - Login with email and password

### Protected Endpoints (Require JWT Token)

- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout user
- All other API routes (products, tasks, quotations, etc.)

## How It Works

### Backend (Server)

1. **JWT Configuration** (`/server/src/config/jwt.js`)
   - Token generation with 7-day expiration
   - Token verification and extraction utilities

2. **Auth Controller** (`/server/src/controllers/authController.js`)
   - `login()` - Validates credentials and returns JWT token
   - `getCurrentUser()` - Returns authenticated user info
   - `logout()` - Handles logout (token removed on client)

3. **Auth Middleware** (`/server/src/middleware/auth.js`)
   - `protect` - Verifies JWT token on protected routes
   - `restrictTo('admin')` - Restricts routes to specific roles

4. **Protected Routes** - All API routes now require authentication:
   - `/api/products/*` - Product management
   - `/api/tasks/*` - Task management
   - `/api/quotations/*` - Quotation management
   - `/api/users/*` - User management
   - `/api/clients/*` - Client management
   - `/api/notifications/*` - Notifications

### Frontend (Client)

1. **Auth Context** (`/client/src/context/AuthContext.js`)
   - Global authentication state management
   - `login()` - Login user and store token
   - `logout()` - Logout user and clear token
   - `isAuthenticated` - Check if user is logged in

2. **Auth Service** (`/client/src/services/authService.js`)
   - API calls for login, logout, getCurrentUser

3. **Login Page** (`/client/src/pages/Login.jsx`)
   - Clean, modern UI matching management system design
   - Form validation and error handling
   - Loading states and toast notifications

4. **Private Route** (`/client/src/components/PrivateRoute.jsx`)
   - Wraps protected routes
   - Redirects to login if not authenticated
   - Shows loading state during auth check

5. **Axios Interceptors** (`/client/src/services/api.js`)
   - Automatically adds JWT token to all API requests
   - Intercepts 401 responses and redirects to login

## Security Features

- **Password Hashing**: All passwords are hashed with bcryptjs (10 salt rounds)
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **HTTP-Only Storage**: Tokens stored in localStorage (consider HttpOnly cookies for production)
- **401 Auto-Redirect**: Automatic redirect to login on unauthorized access
- **Active User Check**: Middleware verifies user is still active in database
- **Role-Based Access**: Admin-only routes protected with `restrictTo('admin')`

## Troubleshooting

### "Invalid email or password"
- Check that you're using the correct credentials from `.env`
- Verify the user was created by running `node src/scripts/seedUsers.js`

### "Access denied. No token provided"
- Make sure you're logged in
- Check that the token is stored in localStorage
- Try logging out and logging in again

### "Token expired"
- Tokens expire after 7 days (configurable in `.env`)
- Simply log in again to get a new token

### MongoDB Connection Issues
- Make sure MongoDB is running: `mongod`
- Check the connection string in `/server/.env`

### Port Conflicts
- Backend runs on port 5000 (configurable in `/server/.env`)
- Frontend runs on port 3000
- Make sure these ports are available

## Configuration

### JWT Settings (server/.env)

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d  # Token expiration (7 days, 1h, 30m, etc.)
```

### API URL (client/src/services/api.js)

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## Production Deployment

Before deploying to production:

1. **Change JWT Secret**: Update `JWT_SECRET` in `.env` to a strong random string
2. **Update Admin Password**: Change `ADMIN_PASSWORD` to a strong password
3. **HTTPS Only**: Ensure your production app uses HTTPS
4. **Environment Variables**: Never commit `.env` files to version control
5. **HttpOnly Cookies**: Consider using HttpOnly cookies instead of localStorage for tokens
6. **CORS**: Update `CLIENT_URL` in server `.env` to your production domain

## File Structure

```
mega-management-system/
├── server/
│   ├── .env                              # Admin credentials & config
│   ├── src/
│   │   ├── config/
│   │   │   └── jwt.js                    # JWT utilities
│   │   ├── controllers/
│   │   │   └── authController.js         # Auth logic
│   │   ├── middleware/
│   │   │   └── auth.js                   # JWT verification
│   │   ├── routes/
│   │   │   └── auth.js                   # Auth endpoints
│   │   └── scripts/
│   │       └── seedUsers.js              # User seeder
│
├── client/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js            # Auth state
│   │   ├── services/
│   │   │   ├── api.js                    # Axios config
│   │   │   └── authService.js            # Auth API calls
│   │   ├── pages/
│   │   │   └── Login.jsx                 # Login page
│   │   ├── components/
│   │   │   ├── PrivateRoute.jsx          # Route protection
│   │   │   └── common/
│   │   │       └── Sidebar.jsx           # Logout button
│   │   └── App.jsx                       # Routes & providers
│
└── AUTH_SETUP.md                         # This file
```

## Support

For issues or questions about the authentication system, please contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-16  
**Author:** MEGA Development Team
