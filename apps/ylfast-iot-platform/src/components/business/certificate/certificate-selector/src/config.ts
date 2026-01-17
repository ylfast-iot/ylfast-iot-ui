import type { QueryParamEntity } from '#/adapter';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { YlDcFormSchema } from '#/components/yl-dc-form';
import type {
  CertificateAuthenticationMethod,
  CertificateFormat,
  CertificateMode,
  CertificateType,
} from '#/enums/certificate';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { IotCertificateApi } from '#/api/iot/certificate';
import {
  CERTIFICATE_AUTH_METHOD_ENUMS,
  CERTIFICATE_FORMAT_ENUMS,
  CERTIFICATE_MODE_ENUMS,
  CERTIFICATE_TYPE_ENUMS,
} from '#/enums/certificate';

export function useCertificateSelectorConfig() {
  const searchFormSchemas = computed<YlDcFormSchema[]>(() => [
    {
      component: 'Input',
      field: 'name',
      label: $t('certificate.fields.name'),
      termTypes: ['eq', 'like'],
    },
    {
      component: 'Select',
      componentProps: {
        options: Object.values(CERTIFICATE_TYPE_ENUMS),
      },
      field: 'type',
      label: $t('certificate.fields.type'),
      termTypes: ['eq'],
    },
    {
      component: 'Select',
      componentProps: {
        options: Object.values(CERTIFICATE_MODE_ENUMS),
      },
      field: 'mode',
      label: $t('certificate.fields.mode'),
      termTypes: ['eq'],
    },
  ]);

  const tableColumns = computed<VxeGridProps['columns']>(() => [
    { field: 'name', minWidth: 150, title: $t('certificate.fields.name') },
    {
      field: 'type',
      slots: { default: 'type' },
      title: $t('certificate.fields.type'),
    },
    {
      field: 'format',
      slots: { default: 'format' },
      title: $t('certificate.fields.format'),
    },
    {
      field: 'mode',
      slots: { default: 'mode' },
      title: $t('certificate.fields.mode'),
    },
    {
      field: 'authenticationMethod',
      slots: { default: 'authenticationMethod' },
      title: $t('certificate.fields.authenticationMethod'),
    },
  ]);

  return {
    searchFormSchemas,
    tableColumns,
  };
}

export async function queryCertificateList(params: QueryParamEntity) {
  const { data, total } = await IotCertificateApi.basicCrudApis.postQuery({
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: params.terms || [],
  });
  return {
    data,
    pageIndex: params.pageIndex || 0,
    pageSize: params.pageSize || 10,
    total,
  };
}

export async function queryCertificateListNoPaging(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const res = await IotCertificateApi.basicCrudApis.postQueryNoPaging({
    paging: false,
    terms: [
      {
        column: 'id',
        termType: 'in',
        value: ids.join(','),
      },
    ],
  });
  return res || [];
}

export function getCertificateTypeInfo(type: any) {
  const typeValue = (type?.value || type) as CertificateType;
  return (
    CERTIFICATE_TYPE_ENUMS[typeValue] || {
      color: 'default',
      label: typeValue,
    }
  );
}

export function getCertificateModeInfo(mode: any) {
  const modeValue = (mode?.value || mode) as CertificateMode;
  return (
    CERTIFICATE_MODE_ENUMS[modeValue] || {
      color: 'default',
      label: modeValue,
    }
  );
}

export function getCertificateFormatInfo(format: any) {
  const formatValue = (format?.value || format) as CertificateFormat;
  return (
    CERTIFICATE_FORMAT_ENUMS[formatValue] || {
      color: 'default',
      label: formatValue,
    }
  );
}

export function getCertificateAuthMethodInfo(method: any) {
  const methodValue = (method?.value ||
    method) as CertificateAuthenticationMethod;
  return (
    CERTIFICATE_AUTH_METHOD_ENUMS[methodValue] || {
      color: 'default',
      label: methodValue,
    }
  );
}
