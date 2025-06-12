export const USER_ROLE = {
  USER: 'user',
  BREEDER: 'breeder',
  ADMIN: 'admin',
} as const;

export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;
