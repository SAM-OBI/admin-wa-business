# Admin Dashboard Setup Guide

## Overview
Separate admin dashboard for Wa Vendors platform management.

## Prerequisites
- Node.js installed
- Backend server running on port 5000
- Admin account in database (role: 'ADMIN')

## Installation

### Step 1: Fix PowerShell Execution Policy (If Needed)
```powershell
# Open PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 2: Install Dependencies
```bash
cd "c:\Users\HP\whatsappvendors stores\admin-dashboard"
npm install
```

### Step 3: Run Development Server
```bash
npm run dev
```

Admin dashboard will run on: **http://localhost:3001**

## Login
- Email: Your admin email
- Password: Your admin password
- **Note:** Only users with `role: 'ADMIN'` can access

## Features

### Dashboard
- Total users, vendors, products statistics
- Pending complaints & court cases
- Unverified vendors alert

### User Management
- View all users with filters (role, status)
- Activate/deactivate users
- Suspend/unsuspend accounts

### Vendor Management
- View all vendors
- Filter by verification status
- View risk scores

### Product Management
- View all products
- Activate/deactivate products
- Filter by category, status

### Complaints
- View all complaints
- Resolve complaints
- Escalate to court

### Court Cases
- View all cases
- Submit judgments
- Track case timeline

### Reviews
- View app reviews
- Reply to reviews

### Risk Management
- View high-risk vendors
- Recalculate risk scores
- Monitor violations

### Audit Logs
- View all system actions
- Filter by user, action, severity
- Track admin activities

## Tech Stack
- React 18
- TypeScript
- Vite
- Zustand (state management)
- React Router v6
- Axios
- React Icons

## API Endpoints
All endpoints require admin auth:
- `GET /api/admin/dashboard-stats`
- `GET /api/admin/users`
- `GET /api/admin/vendors`
- `GET /api/admin/products`
- `GET /api/admin/complaints`
- `GET /api/admin/court-cases`
- `GET /api/admin/reviews`
- `GET /api/admin/risk/high-risk-vendors`
- `GET /api/audit/all` (audit logs)

## Production Build
```bash
npm run build
```
Output in `dist/` folder

## Troubleshooting

### Cannot run npm commands
Use CMD instead of PowerShell, or fix execution policy

### 401 Unauthorized
Check that user has `role: 'ADMIN'` in database

### Cannot connect to backend
Ensure backend is running on http://localhost:5000

## Support
Contact development team for issues
# admin-wa-business  
