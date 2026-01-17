import type { EnumDict } from '#/types/global';

import { $t } from '@vben/locales';

/**
 * 认证模式
 */
export type CertificateMode = 'client' | 'server';

/**
 * 证书格式
 */
export type CertificateFormat = 'JKS' | 'PEM' | 'PFX';

/**
 * 证书类型
 */
export type CertificateType = 'common';

/**
 * 认证方式
 */
export type CertificateAuthenticationMethod = 'binomial' | 'single';

export const CERTIFICATE_MODE_ENUMS: Record<
  CertificateMode,
  EnumDict<CertificateMode> & { color: string }
> = {
  server: {
    value: 'server',
    get label() {
      return $t('certificate.modes.server');
    },
    get text() {
      return $t('certificate.modes.server');
    },
    color: 'processing',
  },
  client: {
    value: 'client',
    get label() {
      return $t('certificate.modes.client');
    },
    get text() {
      return $t('certificate.modes.client');
    },
    color: 'warning',
  },
};

export const CERTIFICATE_FORMAT_ENUMS: Record<
  CertificateFormat,
  EnumDict<CertificateFormat> & { color: string }
> = {
  PFX: {
    value: 'PFX',
    get label() {
      return $t('certificate.formats.PFX');
    },
    get text() {
      return $t('certificate.formats.PFX');
    },
    color: 'purple',
  },
  JKS: {
    value: 'JKS',
    get label() {
      return $t('certificate.formats.JKS');
    },
    get text() {
      return $t('certificate.formats.JKS');
    },
    color: 'cyan',
  },
  PEM: {
    value: 'PEM',
    get label() {
      return $t('certificate.formats.PEM');
    },
    get text() {
      return $t('certificate.formats.PEM');
    },
    color: 'default',
  },
};

export const CERTIFICATE_TYPE_ENUMS: Record<
  CertificateType,
  EnumDict<CertificateType> & { color: string }
> = {
  common: {
    value: 'common',
    get label() {
      return $t('certificate.types.common');
    },
    get text() {
      return $t('certificate.types.common');
    },
    color: 'blue',
  },
};

export const CERTIFICATE_AUTH_METHOD_ENUMS: Record<
  CertificateAuthenticationMethod,
  EnumDict<CertificateAuthenticationMethod> & { color: string }
> = {
  single: {
    value: 'single',
    get label() {
      return $t('certificate.authMethods.single');
    },
    get text() {
      return $t('certificate.authMethods.single');
    },
    color: 'default',
  },
  binomial: {
    value: 'binomial',
    get label() {
      return $t('certificate.authMethods.binomial');
    },
    get text() {
      return $t('certificate.authMethods.binomial');
    },
    color: 'success',
  },
};
