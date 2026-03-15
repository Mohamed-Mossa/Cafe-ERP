import { Role } from '../types/api.types';
const ROLE_RANK: Record<Role, number> = { OWNER: 5, MANAGER: 4, SUPERVISOR: 3, CASHIER: 2, WAITER: 1 };
export const hasMinRole = (userRole: Role, minRole: Role): boolean => ROLE_RANK[userRole] >= ROLE_RANK[minRole];
