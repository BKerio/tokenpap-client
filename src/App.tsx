// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider } from '@/components/theme-provider';
import RequireAuth from '@/components/requireAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Login from '@/pages/login';
import Dashboard from '@/pages/admin_dashboard';
import Vendors from '@/pages/admin/Vendors';
import Meters from '@/pages/admin/Meters';
import Account from '@/pages/admin/Account';
import SystemConfigPage from '@/pages/system-config';
import AdminMeter from '@/pages/admin/admin_meter';
import Branding from '@/pages/vendor/Branding';
import CustomerManagement from '@/pages/vendor/CustomerManagement';
import CompanyDashboard from '@/pages/vendor/CompanyDashboard';
import IndividualDashboard from '@/pages/vendor/IndividualDashboard';
import LipaTokenNaMpesa from '@/pages/vendor/LipaTokenNaMpesa';
import VendingSettingsPage from '@/pages/admin/vending';


function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <Router future={{ v7_relativeSplatPath: true }}>
        <div className='min-h-screen bg-white dark:bg-gray-900'>

          <Routes>

            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route path="account" element={<Account />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="vendor-overview" element={<AdminMeter />} />
              <Route path="meters" element={<Meters />} />
              <Route path="customer-management" element={<CustomerManagement />} />
              <Route path="vending-control" element={<VendingSettingsPage />} />
              <Route path="system-config" element={<SystemConfigPage />} />
              <Route path="lipa-mpesa" element={<LipaTokenNaMpesa />} />
              <Route path="branding" element={<Branding />} />
              <Route path="company" element={<CompanyDashboard />} />
              <Route path="individual" element={<IndividualDashboard />} />
              <Route index element={<Dashboard />} />

            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>

        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;