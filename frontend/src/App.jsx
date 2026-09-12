import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StaffLoginPage from './pages/StaffLoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import DashboardPage from './pages/admin/DashboardPage.jsx';
import BrandsPage from './pages/admin/BrandsPage.jsx';
import MenuPage from './pages/admin/MenuPage.jsx';
import BannersPage from './pages/admin/BannersPage.jsx';
import TablesPage from './pages/admin/TablesPage.jsx';
import OrdersPage from './pages/admin/OrdersPage.jsx';
import CustomersPage from './pages/admin/CustomersPage.jsx';
import PromoCodesPage from './pages/admin/PromoCodesPage.jsx';
import EmployeesPage from './pages/admin/EmployeesPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/staff/login" element={<StaffLoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['boss', 'admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="banners" element={<BannersPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="promocodes" element={<PromoCodesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Operator, Courier, Ofitsiant and Customer routes are built in the
          next vertical slices and will be added here without touching
          the routes above. */}

      <Route path="*" element={<Navigate to="/staff/login" replace />} />
    </Routes>
  );
}
