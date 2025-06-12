import { OAUTH_PROVIDER } from './auth.constants';

export type ProviderInfo = {
  provider: (typeof OAUTH_PROVIDER)[keyof typeof OAUTH_PROVIDER];
  providerId: string;
};
