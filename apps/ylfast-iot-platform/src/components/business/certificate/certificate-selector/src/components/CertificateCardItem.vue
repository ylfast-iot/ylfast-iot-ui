<script setup lang="ts">
import type { IotCertificateApi } from '#/api/iot/certificate';

import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

import {
  getCertificateAuthMethodInfo,
  getCertificateFormatInfo,
  getCertificateModeInfo,
  getCertificateTypeInfo,
} from '../config';

defineProps<{
  isSelected?: boolean;
  item: IotCertificateApi.IotCertificate;
}>();

const CheckIcon = createIconifyIcon('lucide:check-circle');
const CertificateIcon = createIconifyIcon('lucide:file-key');
</script>

<template>
  <div
    class="group relative flex cursor-pointer items-start gap-4 rounded-lg border border-border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md dark:border-border/60 dark:bg-[#1c1e23]"
    :class="[isSelected ? '!border-primary ring-1 ring-primary/20' : '']"
  >
    <!-- Selection Checkmark -->
    <div
      v-if="isSelected"
      class="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#1c1e23]"
    >
      <CheckIcon class="size-full text-primary" />
    </div>

    <!-- Left: Icon -->
    <div class="shrink-0">
      <div
        class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm dark:bg-primary/20"
      >
        <CertificateIcon class="size-6" />
      </div>
    </div>

    <!-- Right: Content -->
    <div
      class="flex flex-1 flex-col justify-start self-stretch overflow-hidden"
    >
      <!-- Header -->
      <div class="mb-2 flex items-start justify-between gap-2">
        <span
          class="line-clamp-1 text-sm font-bold leading-tight text-foreground"
          :title="item.name"
        >
          {{ item.name }}
        </span>
        <Tag
          v-if="item.type"
          :color="getCertificateTypeInfo(item.type).color"
          class="!mr-0 shrink-0 text-[10px]"
        >
          {{ getCertificateTypeInfo(item.type).label }}
        </Tag>
      </div>

      <!-- Body: Details -->
      <div class="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <!-- Format -->
        <div class="flex items-center justify-between">
          <span>{{ $t('certificate.fields.format') }}</span>
          <span class="font-medium text-foreground">
            {{ getCertificateFormatInfo(item.format).label }}
          </span>
        </div>

        <!-- Mode -->
        <div class="flex items-center justify-between">
          <span>{{ $t('certificate.fields.mode') }}</span>
          <span class="font-medium text-foreground">
            {{ getCertificateModeInfo(item.mode).label }}
          </span>
        </div>

        <!-- Auth Method (if available) -->
        <div
          v-if="item.authenticationMethod"
          class="flex items-center justify-between"
        >
          <span>{{ $t('certificate.fields.authenticationMethod') }}</span>
          <span class="font-medium text-foreground">
            {{ getCertificateAuthMethodInfo(item.authenticationMethod).label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
