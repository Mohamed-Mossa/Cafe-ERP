import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import type { Role } from '../types/api.types';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAppSelector(s => s.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ allowed, children }: { allowed: Role[]; children: React.ReactNode }) {
  const { role } = useAppSelector(s => s.auth);
  if (!role || !allowed.includes(role)) return <RoleHome />;
  return <>{children}</>;
}

function RoleHome() {
  const { role } = useAppSelector(s => s.auth);
  // KITCHEN and BARISTA staff go straight to the KDS — no POS access
  if (role === 'KITCHEN' || role === 'BARISTA') return <Navigate to="/kds" replace />;
  return <Navigate to="/pos" replace />;
}

const POS_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR', 'CASHIER', 'WAITER'];
const FLOOR_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR', 'CASHIER', 'WAITER'];
const KDS_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR', 'CASHIER', 'KITCHEN', 'BARISTA'];
const GAMING_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR', 'CASHIER'];
const SHIFT_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR', 'CASHIER'];
const INVENTORY_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR'];
const CUSTOMER_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR', 'CASHIER'];
const MANAGER_ROLES: Role[] = ['OWNER', 'MANAGER'];
const DEBT_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR'];
const ORDER_HISTORY_ROLES: Role[] = ['OWNER', 'MANAGER', 'SUPERVISOR', 'KITCHEN', 'BARISTA'];

const withRole = (allowed: Role[], element: React.ReactNode) => (
  <RoleRoute allowed={allowed}>{element}</RoleRoute>
);

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Receipt is standalone (printable) — no AppShell */}
        <Route path="/receipt/:id" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
        {/* QR Menu is fully public — no auth required */}
        <Route path="/qr-menu" element={<QRMenuPage />} />
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<RoleHome />} />
          <Route path="pos"            element={withRole(POS_ROLES, <POSPage />)} />
          <Route path="floor"          element={withRole(FLOOR_ROLES, <FloorPage />)} />
          <Route path="gaming"         element={withRole(GAMING_ROLES, <GamingPage />)} />
          <Route path="kds"            element={withRole(KDS_ROLES, <KDSPage />)} />
          <Route path="shifts"         element={withRole(SHIFT_ROLES, <ShiftPage />)} />
          <Route path="inventory"      element={withRole(INVENTORY_ROLES, <InventoryPage />)} />
          <Route path="stock-forecast" element={withRole(INVENTORY_ROLES, <StockForecastPage />)} />
          <Route path="customers"      element={withRole(CUSTOMER_ROLES, <CRMPage />)} />
          <Route path="reservations"   element={withRole(CUSTOMER_ROLES, <ReservationsPage />)} />
          <Route path="promotions"     element={withRole(MANAGER_ROLES, <PromotionsPage />)} />
          <Route path="happy-hours"    element={withRole(MANAGER_ROLES, <HappyHourPage />)} />
          <Route path="menu"           element={withRole(MANAGER_ROLES, <MenuPage />)} />
          <Route path="staff"          element={withRole(MANAGER_ROLES, <UsersPage />)} />
          <Route path="suppliers"      element={withRole(INVENTORY_ROLES, <SuppliersPage />)} />
          <Route path="reports"        element={withRole(MANAGER_ROLES, <ReportsPage />)} />
          <Route path="activity-log"   element={withRole(MANAGER_ROLES, <ActivityLogPage />)} />
          <Route path="order-history"  element={withRole(ORDER_HISTORY_ROLES, <OrderHistoryPage />)} />
          <Route path="match-mode"     element={withRole(CUSTOMER_ROLES, <MatchModePage />)} />
          <Route path="memberships"    element={withRole(CUSTOMER_ROLES, <MembershipsPage />)} />
          <Route path="tournaments"    element={withRole(CUSTOMER_ROLES, <TournamentsPage />)} />
          <Route path="expenses"       element={withRole(MANAGER_ROLES, <ExpensesPage />)} />
          <Route path="settings"       element={withRole(['OWNER'], <SettingsPage />)} />
          <Route path="debt"           element={withRole(DEBT_ROLES, <DebtManagementPage />)} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
