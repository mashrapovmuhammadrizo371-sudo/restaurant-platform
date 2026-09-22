import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AdminGate from './components/AdminGate.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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

import StaffLayout from './layouts/StaffLayout.jsx';
import OperatorPage from './pages/staff/OperatorPage.jsx';
import CourierPage from './pages/staff/CourierPage.jsx';
import OfitsiantPage from './pages/staff/OfitsiantPage.jsx';
import CashierPage from './pages/staff/CashierPage.jsx';

import CustomerProtectedRoute from './components/CustomerProtectedRoute.jsx';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import BrandListPage from './pages/customer/BrandListPage.jsx';
import BrandMenuPage from './pages/customer/BrandMenuPage.jsx';
import CartPage from './pages/customer/CartPage.jsx';
import MyOrdersPage from './pages/customer/MyOrdersPage.jsx';
import CustomerSettingsPage from './pages/customer/SettingsPage.jsx';
import RegisterPage from './pages/customer/RegisterPage.jsx';
import RestaurantsPage from './pages/customer/RestaurantsPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* -------- Staff / Big Admin --------
          Single entry point: "/admin" is the shared login page when
          logged out, and (for boss/admin) the Big Admin panel when
          logged in — see AdminGate.jsx. Old bookmarks to the previous
          separate login route still work. */}
      <Route path="/staff/login" element={<Navigate to="/admin" replace />} />

      <Route path="/admin" element={<AdminGate />}>
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

      <Route
        path="/operator"
        element={
          <ProtectedRoute roles={['operator']}>
            <StaffLayout title="Operator paneli"><OperatorPage /></StaffLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courier"
        element={
          <ProtectedRoute roles={['courier']}>
            <StaffLayout title="Kuryer paneli"><CourierPage /></StaffLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ofitsiant"
        element={
          <ProtectedRoute roles={['ofitsiant']}>
            <StaffLayout title="Ofitsiant paneli"><OfitsiantPage /></StaffLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cashier"
        element={
          <ProtectedRoute roles={['cashier']}>
            <StaffLayout title="Kassir paneli"><CashierPage /></StaffLayout>
          </ProtectedRoute>
        }
      />

      {/* -------- Customer --------
          No login/registration at all: an anonymous session is created
          automatically (see CustomerAuthContext). No /login, /register,
          /profile, or /leaderboard routes — points/leaderboard and the
          account-based profile are temporarily disabled customer-facing;
          Settings replaces Profile. */}
      <Route
        element={
          <CustomerProtectedRoute>
            <CustomerLayout />
          </CustomerProtectedRoute>
        }
      >
        <Route path="/" element={<BrandListPage />} />
        <Route path="/brand/:id" element={<BrandMenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/settings" element={<CustomerSettingsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
