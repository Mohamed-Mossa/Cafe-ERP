import { Role } from '../../types/api.types'
import { useAppSelector } from '../../app/hooks'

interface Props {
  allowedRoles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 0, MANAGER: 1, SUPERVISOR: 2, CASHIER: 3, WAITER: 4
}

export function RoleGuard({ allowedRoles, children, fallback = null }: Props) {
  const { role } = useAppSelector(s => s.auth)
  if (!role) return <>{fallback}</>
  const hasAccess = allowedRoles.some(r => ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[r])
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

export function useHasRole(requiredRole: Role): boolean {
  const { role } = useAppSelector(s => s.auth)
  if (!role) return false
  return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[requiredRole]
}
