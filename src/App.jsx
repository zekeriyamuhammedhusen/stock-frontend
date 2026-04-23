import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UserList from './pages/users/UserList';
import UserCreate from './pages/users/UserCreate';
import UserEdit from './pages/users/UserEdit';
import UserProfile from './pages/users/UserProfile';
import RoleList from './pages/roles/RoleList';
import RoleCreate from './pages/roles/RoleCreate';
import RoleEdit from './pages/roles/RoleEdit';
import AssignRole from './pages/roles/AssignRole';
import PermissionList from './pages/permissions/PermissionList';
import PermissionCreate from './pages/permissions/PermissionCreate';
import PermissionEdit from './pages/permissions/PermissionEdit';
import ProductList from './pages/products/ProductList';
import StockMovement from './pages/inventory/StockMovement';
import TransferList from './pages/transfers/TransferList';
import SalesPage from './pages/sales/SalesPage';
import PurchasePage from './pages/purchases/PurchasePage';
import BankAccountPage from './pages/finance/BankAccountPage';
import CreditPage from './pages/finance/CreditPage';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import CategoryPage from './pages/masters/CategoryPage';
import UnitPage from './pages/masters/UnitPage';
import WarehousePage from './pages/masters/WarehousePage';
import ForgotPassword from './passwordmanagement/ForgotPassword';
import ResetPassword from './passwordmanagement/ResetPassword';
import { ToastContainer } from 'react-toastify';
import { getToken } from './utils/token';
import { getMe } from './api/userApi';
import {
  clearStoredPermissions,
  extractPermissionNames,
  getStoredPermissions,
  hasAnyPermission,
  isAdminRole,
  setStoredPermissions,
} from './utils/authAccess';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [authReady, setAuthReady] = useState(!getToken());

  useEffect(() => {
    const syncAccess = async () => {
      const token = getToken();
      if (!token) {
        clearStoredPermissions();
        setAuthReady(true);
        return;
      }

      try {
        clearStoredPermissions();
        const response = await getMe();
        const permissions = extractPermissionNames(response.data);
        setStoredPermissions(permissions);
      } catch (error) {
        console.error('Failed to load user access:', error);
      } finally {
        setAuthReady(true);
      }
    };

    syncAccess();
  }, [isAuthenticated]);

  const ProtectedRoute = ({ children, adminOnly = false, requiredPermissions = [] }) => {
    try {
      const hasToken = !!getToken();
      if (!isAuthenticated || !hasToken) {
        return <Navigate to="/" />;
      }

      if (!authReady) {
        return <div className="p-6">Loading access...</div>;
      }

      if (adminOnly && !isAdminRole()) {
        return <Navigate to="/dashboard" replace />;
      }

      if (!adminOnly && requiredPermissions.length > 0) {
        const storedPermissions = getStoredPermissions();
        if (!isAdminRole() && !hasAnyPermission(requiredPermissions, storedPermissions)) {
          return <Navigate to="/dashboard" replace />;
        }
      }

      return children;
    } catch (error) {
      console.error('ProtectedRoute error:', error);
      return <Navigate to="/" />;
    }
  };

  return (
    <ErrorBoundary>
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover />
      <Routes>
        <Route 
          path="/" 
          element={<Home setIsAuthenticated={setIsAuthenticated} />} 
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <UserList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/create"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <UserCreate />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/edit/:id"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <UserEdit />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/profile/:id"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <UserProfile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <RoleList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/create"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <RoleCreate />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/edit/:id"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <RoleEdit />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles/assign"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AssignRole />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/permissions"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <PermissionList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/permissions/create"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <PermissionCreate />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/permissions/edit/:id"
          element={
            <ProtectedRoute adminOnly>
              <Layout>
                <PermissionEdit />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute requiredPermissions={['view_product']}>
              <Layout>
                <ProductList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute requiredPermissions={['view_inventory', 'view_stock_transactions']}>
              <Layout>
                <StockMovement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfers"
          element={
            <ProtectedRoute requiredPermissions={['view_transfer']}>
              <Layout>
                <TransferList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute requiredPermissions={['view_sale']}>
              <Layout>
                <SalesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute requiredPermissions={['view_purchase_order']}>
              <Layout>
                <PurchasePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute requiredPermissions={['view_purchase_order']}>
              <Navigate to="/purchases" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bank-accounts"
          element={
            <ProtectedRoute requiredPermissions={['view_bank_account']}>
              <Layout>
                <BankAccountPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/credits"
          element={
            <ProtectedRoute requiredPermissions={['view_credit']}>
              <Layout>
                <CreditPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredPermissions={['view_dashboard_metrics', 'view_low_stock_report', 'view_profit_loss_report', 'view_sales_report', 'view_supplier_performance_report']}>
              <Layout>
                <ReportsDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute requiredPermissions={['view_category']}>
              <Layout>
                <CategoryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/units"
          element={
            <ProtectedRoute requiredPermissions={['view_unit']}>
              <Layout>
                <UnitPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/warehouses"
          element={
            <ProtectedRoute requiredPermissions={['view_warehouse']}>
              <Layout>
                <WarehousePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <div className="container mx-auto p-6">
              <h2 className="text-2xl font-bold text-red-600">404 - Page Not Found</h2>
              <a
                href="/"
                className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                Go to Home
              </a>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
