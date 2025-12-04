<script setup lang="tsx">
import type { ConfigMetadata } from '#/types/config-metadata';

import { useVbenForm } from '#/adapter';
import { useYlConfigMetadataForm } from '#/components/yl-config-metadata-form';

const longMarkdown = `
# MQTT Client Configuration Guide

This comprehensive guide details how to configure your MQTT client for optimal performance and security.

## 1. Introduction

MQTT (Message Queuing Telemetry Transport) is a lightweight, publish-subscribe network protocol that transports messages between devices. It is ideal for remote locations with devices that have a small code footprint or are on networks with expensive or low bandwidth.

## 2. Basic Connection Settings

To establish a connection, you must provide the basic broker details.

### 2.1 Host
The **Host** is the IP address or domain name of your MQTT broker.
- Example:
- Example IP:

### 2.2 Port
The **Port** determines the communication channel.
- **1883**: Default non-secure port.
- **8883**: Default secure port (TLS/SSL).

### 2.3 Client Type
Choose the role of this client:
- **Publisher**: Sends messages to topics.
- **Subscriber**: Listens for messages on topics.

## 3. Security Settings

Security is paramount in IoT networks.

### 3.1 Use TLS
Enable **Use TLS** to encrypt the connection. This is highly recommended for production environments to prevent eavesdropping and tampering.

### 3.2 Authentication
(Not yet implemented in this form, but conceptually important)
- **Username/Password**: Basic auth.
- **Client Certificates**: Mutual TLS authentication.

## 4. Advanced Features (Conceptual)

### 4.1 Quality of Service (QoS)
- **QoS 0**: At most once (fire and forget).
- **QoS 1**: At least once (guaranteed delivery).
- **QoS 2**: Exactly once (guaranteed no duplicates).

### 4.2 Retained Messages
Messages that are stored by the broker and sent to new subscribers immediately.

### 4.3 Last Will and Testament (LWT)
A message sent by the broker if the client disconnects ungracefully.

## 5. Troubleshooting

If you cannot connect:
1. Check network connectivity.
2. Verify Host and Port.
3. Ensure firewall rules allow traffic on the specified port.
4. Check broker logs for authentication errors.

## 6. Example Configuration



## 7. Appendix

### 7.1 Glossary
- **Broker**: The server that routes messages.
- **Topic**: The string used to filter messages.

---
*End of Document*


  `;
const basicMetadata: ConfigMetadata = {
  name: 'Simple MQTT Config',
  description: 'A flat configuration example',
  document: longMarkdown,
  properties: [
    {
      property: 'host',
      name: 'Host',
      type: { type: 'STRING', expands: { required: true, span: 24 } },
    },
    {
      property: 'port',
      name: 'Port',
      type: {
        type: 'INTEGER',
        expands: { required: true, span: 24, defaultValue: 1883 },
      },
    },
    {
      property: 'useTls',
      name: 'Use TLS',
      type: { type: 'BOOLEAN', expands: { defaultValue: false } },
    },
    {
      property: 'type',
      name: 'Client Type',
      type: {
        type: 'ENUM',
        expands: {
          options: [
            { label: 'Publisher', value: 'PUB' },
            { label: 'Subscriber', value: 'SUB' },
          ],
          required: true,
        },
      },
    },
  ],
};

const [register] = useYlConfigMetadataForm({
  metadata: basicMetadata,
});

const [Form] = useVbenForm({
  schema: [
    {
      component: 'Input',
      fieldName: 'roleName',
      label: '角色名称',
    },
    {
      component: 'Input',
      fieldName: 'roleKey',
      label: '权限字符',
    },
    {
      fieldName: 'configuration',
      component: 'YlConfigMetadataForm',
      componentProps: {
        onRegister: register,
      },
    },
  ],
});
</script>

<template>
  <Form />
</template>

<style scoped></style>
