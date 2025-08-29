export enum USER_ROLE {
  USER = 'user',
  BREEDER = 'breeder',
  ADMIN = 'admin',
}

export const BR_ACCESS = [USER_ROLE.BREEDER, USER_ROLE.ADMIN];

export enum USER_STATUS {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}
