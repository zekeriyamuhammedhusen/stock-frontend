# Stock Management System

A full-stack stock and inventory management application built with React, Vite, Node.js, Express, and MongoDB.

The app is designed for day-to-day operations in a warehouse or trading business. It supports secure sign-in, role-based access, inventory tracking, product and warehouse master data, sales, purchases, transfers, finance records, approvals, and reporting.

## What The App Does

### Authentication and Access Control

- User login and logout
- Forgot password and reset password flow by email
- JWT-based authentication
- Role-based access control
- Fine-grained permission checks for each module and action
- Admin-only management screens for users, roles, and permissions

### Dashboard

- Summary cards for the main business modules
- Quick access to products, stock, transfers, sales, purchases, bank accounts, credits, and reports
- Dashboard metrics and visual summaries for operational insight

### Master Data Management

- Products
- Categories
- Units of measure
- Warehouses
- Users
- Roles
- Permissions

### Inventory Operations

- Stock in and stock out transactions
- Inventory balance tracking
- Stock movement history
- Product transfers between warehouses

### Sales and Purchasing

- Sales entry and sales history
- Purchase entry and purchase order management
- Purchase order status handling

### Finance

- Bank account management
- Credit tracking and credit records

### Approvals and Reporting

- Approval workflow for actions that need review
- Low stock reporting
- Profit and loss reporting
- Sales reporting
- Supplier performance reporting
- Dashboard metrics for the business overview

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- React Toastify
- Bootstrap
- Tailwind CSS 4
- Font Awesome

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Nodemailer for password reset emails

## Project Structure

- `backend/` contains the API server, controllers, models, middleware, services, and database setup
- `frontend/` contains the React UI, routing, API clients, components, and pages

## Requirements

- Node.js 18 or newer
- npm
- MongoDB instance running locally or remotely

## Environment Setup

### Backend `.env`

Create a `.env` file inside `backend/` with at least the following values:

```env
MONGO_URI=mongodb://localhost:27017/stock_management
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password_or_app_password
PORT=5000
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_admin_password
```

Notes:

- `FRONTEND_URL` should match the Vite dev server address so CORS and password reset links work correctly.
- `EMAIL_USER` and `EMAIL_PASS` are used for password reset emails.
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are used by the seed script.

### Frontend Configuration

The frontend currently points to the backend at `http://localhost:5000/api` in `frontend/src/api/apiConfig.js`.

If you move the backend to another host or port, update that base URL.

## Install Dependencies

Run the following commands from the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## How To Run

### 1. Start MongoDB

Make sure MongoDB is running before starting the backend.

### 2. Start the backend

```bash
cd backend
npm run dev
```

If you prefer the production-style start command:

```bash
npm start
```

The backend runs on port `5000` by default.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Vite normally starts the frontend on `http://localhost:5173`.

### 4. Open the app

Visit the frontend URL shown in the terminal, then sign in with a valid account.

## Optional Seed Data

The backend includes a seed script for creating initial data.

```bash
cd backend
npm run seed
```

Make sure `MONGO_URI`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` are set before running it.

## Main API Modules

The backend exposes these API areas:

- `/api/auth`
- `/api/users`
- `/api/roles`
- `/api/permissions`
- `/api/warehouses`
- `/api/categories`
- `/api/units`
- `/api/products`
- `/api/stock`
- `/api/transfers`
- `/api/sales`
- `/api/purchases`
- `/api/purchase-orders`
- `/api/reports`
- `/api/approvals`
- `/api/bank-accounts`
- `/api/credits`

## Common User Flow

1. Open the frontend and sign in.
2. The app loads the signed-in user profile and permissions.
3. The dashboard shows only the modules the user is allowed to access.
4. Users with the correct permissions can manage stock, products, transfers, sales, purchases, finance, and reports.
5. Admin users can manage users, roles, and permissions.

## Troubleshooting

- If login works but pages redirect back to the homepage, check the token and permission setup.
- If password reset links or CORS fail, confirm `FRONTEND_URL` in `backend/.env` matches the frontend URL.
- If the frontend cannot reach the backend, confirm the backend is running on port `5000` and `frontend/src/api/apiConfig.js` still points to the correct API URL.
- If MongoDB errors appear, verify `MONGO_URI` and that the database server is running.
