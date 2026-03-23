import type { Role } from '../types/api.types';

export const canViewCustomerPhones = (role: Role | null | undefined) => role === 'OWNER';

export const customerPhoneHiddenLabel = (isRTL: boolean) => (isRTL ? 'للمالك فقط' : 'Owner only');

export function customerMetaText(
  phone: string | null | undefined,
  tier: string | null | undefined,
  canViewPhone: boolean,
  hiddenPhoneLabel: string,
) {
  const parts: string[] = [];
  if (canViewPhone && phone) {
    parts.push(phone);
  } else if (!canViewPhone) {
    parts.push(hiddenPhoneLabel);
  }
  if (tier) {
    parts.push(tier);
  }
  return parts.join(' · ');
}
