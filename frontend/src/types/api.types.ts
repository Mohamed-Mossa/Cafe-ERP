export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface User {
  id: string; username: string; fullName: string; role: Role;
  maxDiscountPercent: number; active: boolean; pin?: string;
}

export type Role = 'OWNER' | 'MANAGER' | 'SUPERVISOR' | 'CASHIER' | 'WAITER' | 'KITCHEN' | 'BARISTA';

export interface AuthResponse {
  accessToken: string; refreshToken: string;
  username: string; fullName: string; role: Role;
  maxDiscountPercent: number;
}

export interface Category { id: string; name: string; icon?: string; displayOrder: number; active: boolean; }

export interface Product {
  id: string; sku: string; name: string; sellingPrice: number; categoryId: string;
  active: boolean; hidden: boolean; availableInMatchMode: boolean; imageUrl?: string;
  displayOrder: number;
}

export type OrderSource = 'TABLE' | 'GAMING' | 'TAKEAWAY';

export interface Order {
  id: string; orderNumber: number; source: OrderSource;
  tableId?: string; tableName?: string; deviceId?: string; deviceName?: string;
  cashierId: string; cashierName?: string;
  customerId?: string; customerName?: string;
  status: 'OPEN' | 'PENDING_PAYMENT' | 'CLOSED' | 'CANCELLED';
  subtotal: number; discountAmount: number; discountType?: string;
  taxAmount: number; grandTotal: number;
  promoCodeId?: string; promoCodeApplied?: string;
  loyaltyPointsEarned?: number;
  lines: OrderLine[]; payments: Payment[];
  createdAt: string; closedAt?: string;
}

export interface OrderLine {
  id: string; productId: string; productName: string;
  quantity: number; unitPrice: number; totalPrice: number;
  notes?: string; kitchenStatus: 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
}

export interface Payment { id: string; method: PaymentMethod; amount: number; reference?: string; paidAt: string; }
export type PaymentMethod = 'CASH' | 'CARD' | 'EWALLET' | 'CREDIT';

export interface Device {
  id: string; name: string; type: 'PS4' | 'PS5';
  xPos: number; yPos: number;
  status: 'IDLE' | 'IN_SESSION' | 'ACTIVE';
  currentSessionId?: string;
  singleRate: number;
  multiRate: number;
}

export interface GamingSession {
  id: string; deviceId: string; deviceName: string;
  customerId?: string;
  sessionType: 'SINGLE' | 'MULTI';
  currentType: 'SINGLE' | 'MULTI';
  status: 'ACTIVE' | 'CLOSED';
  startedAt: string; endedAt?: string;
  durationMinutes?: number; totalAmount?: number;
  gamingAmount?: number;
}

export interface CafeTable {
  id: string; name: string; capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'BILLING' | 'RESERVED';
  currentOrderId?: string; currentAmount?: number;
}

export interface InventoryItem {
  id: string; name: string; sku?: string; category?: string; unit: string;
  currentStock: number; reorderLevel: number; safetyStock: number;
  averageCost: number; averageDailyUsage: number; isActive: boolean;
}

export interface Shift {
  id: string; cashierId: string; cashierName: string;
  openingBalance: number; expectedCash?: number; actualCash?: number;
  cashVariance?: number; totalSales: number; totalExpenses: number; netCash: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string; closedAt?: string; closingNotes?: string;
}

export interface Customer {
  id: string; fullName: string; phone: string; email?: string;
  loyaltyPoints: number; totalSpent: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  createdAt: string;
}

export interface PromoCode {
  id: string; code: string; discountType: 'PERCENT' | 'FIXED';
  discountValue: number; minOrderAmount: number;
  maxUses?: number; usedCount: number;
  validFrom: string; validTo: string; active: boolean;
}
