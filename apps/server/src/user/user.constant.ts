export enum USER_ROLE {
  USER = 'user',
  BREEDER = 'breeder',
  ADMIN = 'admin',
}

export const USER_STATUS = {
  PENDING_REFRESH_TOKEN: 'pending_refresh_token',
  PENDING_ACCESS_TOKEN: 'pending_access_token',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;
