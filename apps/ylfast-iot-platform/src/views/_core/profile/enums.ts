export type ComponentKey =
  | 'basic'
  | 'binding'
  | 'message'
  | 'password'
  | 'subscription';

export const componentKeys: Record<ComponentKey, ComponentKey> = {
  basic: 'basic',
  binding: 'binding',
  message: 'message',
  password: 'password',
  subscription: 'subscription',
};
