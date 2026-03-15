import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks';
import AppShell from '../components/layout/AppShell';
import LoginPage from '../features/auth/components/LoginPage';
import POSPage from '../features/pos/components/POSPage';
import GamingPage from '../features/gaming/components/GamingPage';
import FloorPage from '../features/floor/components/FloorPage';
import InventoryPage from '../features/inventory/components/InventoryPage';
import StockForecastPage from '../features/inventory/components/StockForecastPage';
import ShiftPage from '../features/shift/components/ShiftPage';
import CRMPage from '../features/crm/components/CRMPage';
import PromotionsPage from '../features/promotions/components/PromotionsPage';
import ReportsPage from '../features/reports/components/ReportsPage';
import MenuPage from '../features/menu/components/MenuPage';
import UsersPage from '../features/users/components/UsersPage';
import KDSPage from '../features/kds/components/KDSPage';
import ReservationsPage from '../features/reservations/components/ReservationsPage';
import SuppliersPage from '../features/suppliers/components/SuppliersPage';
import HappyHourPage from '../features/happyhour/components/HappyHourPage';
import ReceiptPage from '../features/receipt/components/ReceiptPage';
import ActivityLogPage from '../features/activitylog/components/ActivityLogPage';
import OrderHistoryPage from '../features/orders/components/OrderHistoryPage';
import QRMenuPage from '../features/qrmenu/components/QRMenuPage';
import MatchModePage from '../features/matchmode/components/MatchModePage';
import MembershipsPage from '../features/memberships/components/MembershipsPage';
import TournamentsPage from '../features/tournaments/components/TournamentsPage';
import ExpensesPage from '../features/expenses/components/ExpensesPage';
import SettingsPage from '../features/settings/components/SettingsPage';
import DebtManagementPage from '../features/debt/components/DebtManagementPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAppSelector(s => s.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Receipt is standalone (printable) — no AppShell */}
        <Route path="/receipt/:id" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
        {/* QR Menu is fully public — no auth required */}
        <Route path="/qr-menu" element={<QRMenuPage />} />
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos"            element={<POSPage />} />
          <Route path="floor"          element={<FloorPage />} />
          <Route path="gaming"         element={<GamingPage />} />
          <Route path="kds"            element={<KDSPage />} />
          <Route path="shifts"         element={<ShiftPage />} />
          <Route path="inventory"      element={<InventoryPage />} />
          <Route path="stock-forecast" element={<StockForecastPage />} />
          <Route path="customers"      element={<CRMPage />} />
          <Route path="reservations"   element={<ReservationsPage />} />
          <Route path="promotions"     element={<PromotionsPage />} />
          <Route path="happy-hours"    element={<HappyHourPage />} />
          <Route path="menu"           element={<MenuPage />} />
          <Route path="staff"          element={<UsersPage />} />
          <Route path="suppliers"      element={<SuppliersPage />} />
          <Route path="reports"        element={<ReportsPage />} />
          <Route path="activity-log"  element={<ActivityLogPage />} />
          <Route path="order-history"  element={<OrderHistoryPage />} />
          <Route path="match-mode"     element={<MatchModePage />} />
          <Route path="memberships"    element={<MembershipsPage />} />
          <Route path="tournaments"    element={<TournamentsPage />} />
          <Route path="expenses"       element={<ExpensesPage />} />
          <Route path="settings"       element={<SettingsPage />} />
          <Route path="debt"           element={<DebtManagementPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
