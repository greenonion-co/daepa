import { OAUTH_PROVIDER } from './auth.constants';

export type ProviderInfo = {
  email: string;
  provider: (typeof OAUTH_PROVIDER)[keyof typeof OAUTH_PROVIDER];
  providerId: string;
};
