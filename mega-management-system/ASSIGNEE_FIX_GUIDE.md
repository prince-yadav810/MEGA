# Assignee Display Fix Guide

## Problem
Tasks are showing "[No assignees]" even after assigning team members when creating a task.

## Root Cause
The application may be using **localStorage** instead of the actual **API** to display tasks. Old tasks in localStorage don't have valid assignees.

## Solution

### Step 1: Clear Browser Cache
1. Open your application in the browser
2. Go to: `http://localhost:3000/clear-cache.html`
3. Click "Clear Cache" button
4. Refresh the application

**OR** manually clear in browser console:
```javascript
localStorage.clear();
location.reload();
```

### Step 2: Verify API is Working
Open browser console (F12) and check for these messages:
- ✓ `Using API - Tasks fetched: X` means API is working
- ⚠️ `API not available, using localStorage` means API is down or unreachable

### Step 3: Create a New Task
1. Click "New Task" button
2. Fill in task details
3. **Select one or more assignees** (they should highlight in blue)
4. Click "Create Task"
5. Check browser console for:
   - `Creating task via API with assignees: ["68e806efc81efb0b836779c6", ...]`
   - `✓ Task created via API`

### Step 4: Verify Display
The new task should now show assignee avatars instead of "[No assignees]"

## What Was Fixed

### 1. Created Real Users in Database
- Ran seed script to create 5 users matching the team members
- Users now have valid MongoDB ObjectIds

### 2. Updated Frontend Team Members
File: `client/src/utils/sampleData.js`
- Changed from numeric IDs (1, 2, 3) to MongoDB ObjectIds
- Now matches actual users in database

### 3. Updated Auth Middleware
File: `server/src/middleware/auth.js`
- Changed dummy user ID to a real user ID from the database

### 4. Added Debug Logging
File: `client/src/services/taskService.js`
- Added console logs to show if API or localStorage is being used
- Helps identify connection issues

## Troubleshooting

### If assignees still don't show:

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5001/api/tasks
   ```

2. **Check backend logs:**
   Look for these messages when creating a task:
   ```
   Received assignees from request: [ '68e806efc81efb0b836779c6', ... ]
   Filtered assignees: [ '68e806efc81efb0b836779c6', ... ]
   Task created successfully: ObjectId(...)
   ```

3. **Verify assignees in database:**
   ```bash
   cd server
   node -e "
   const mongoose = require('mongoose');
   const Task = require('./src/models/Task');
   const User = require('./src/models/User');
   require('dotenv').config();

   mongoose.connect(process.env.MONGO_URI).then(async () => {
     const task = await Task.findOne().sort({createdAt: -1})
       .populate('assignees', 'name email avatar');
     console.log('Latest task assignees:', task.assignees);
     process.exit(0);
   });
   "
   ```

4. **Check frontend is using correct API URL:**
   File: `client/src/services/api.js`
   Should be: `http://localhost:5001/api`

## Team Member IDs
Use these IDs when assigning tasks:

| Name | ID |
|------|-----|
| Rajesh Kumar | 68e806efc81efb0b836779c6 |
| Priya Sharma | 68e806efc81efb0b836779c7 |
| Amit Patel | 68e806efc81efb0b836779c8 |
| Sneha Reddy | 68e806efc81efb0b836779c9 |
| Vikash Singh | 68e806efc81efb0b836779ca |

## Re-seed Users (if needed)
```bash
cd server
node src/scripts/seedUsers.js
```

This will show you the User IDs - make sure they match the IDs in `client/src/utils/sampleData.js`.
