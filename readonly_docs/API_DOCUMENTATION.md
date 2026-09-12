# IMS API Hub - API Documentation

## Overview
The IMS API Hub is a Django-based REST API for managing vending machine transactions, devices, users, and payments.

**Base URL:** `/api/v1/`

**Authentication:**
- Management APIs: JWT Bearer token from Django Ninja JWT.
- Webhooks: API key + HMAC-SHA256 signature.

---

## Endpoints

### User Roles

| Role | Backing Model | Login | Scope |
|------|---------------|-------|-------|
| Administration | Django `auth.User` with `is_staff` or `is_superuser` | Yes | Global tenant, tenant admin, device, and config management |
| Tenant admin | Django `auth.User` + `TenantAdmin` profile | Yes | One tenant's users, RFID cards, topups, device status, and reports |
| Tenant user | `core.User` | No | Balance holder for RFID card or phone-number purchases |

Tenant users do not log in to the system. They are validated by RFID card or phone number during debit payment flows.

### Authentication API

All authentication endpoints are prefixed with `/api/v1/`.

#### JWT Token Endpoints

**Obtain JWT Token Pair**
```
POST /api/v1/auth/token/pair
```

**Request:**
```json
{
  "username": "tenant_admin",
  "password": "secret-password"
}
```

**Response (200):**
```json
{
  "username": "tenant_admin",
  "refresh": "<jwt-refresh-token>",
  "access": "<jwt-access-token>"
}
```

**Refresh JWT Token**
```
POST /api/v1/auth/token/refresh
```

**Request:**
```json
{
  "refresh": "<jwt-refresh-token>"
}
```

**Response (200):**
```json
{
  "refresh": "<jwt-refresh-token>",
  "access": "<jwt-access-token>"
}
```

**Verify JWT Token**
```
POST /api/v1/auth/token/verify
```

**Request:**
```json
{
  "token": "<jwt-access-or-refresh-token>"
}
```

**Response (200):**
```json
{}
```

#### Session Authentication Endpoints

**Session Login**
```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "username": "tenant_admin",
  "password": "secret-password"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "tenant_admin",
    "email": "admin@example.com",
    "first_name": "Tenant",
    "last_name": "Admin",
    "is_staff": false,
    "is_superuser": false,
    "role": "tenant_admin",
    "tenant": {
      "id": 1,
      "name": "Tenant A",
      "address": "Bangkok",
      "extra_info": {},
      "is_active": true,
      "created_at": "2026-08-12T00:00:00Z",
      "updated_at": "2026-08-12T00:00:00Z"
    }
  }
}
```

**Errors:**
- 400: Invalid username or password
- 400: User is not allowed to access this system

**Session Logout**
```
POST /api/v1/auth/logout
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "status": "ok"
  }
}
```

**Current User (requires JWT)**
```
GET /api/v1/auth/me
```

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "tenant_admin",
    "email": "admin@example.com",
    "first_name": "Tenant",
    "last_name": "Admin",
    "is_staff": false,
    "is_superuser": false,
    "role": "tenant_admin",
    "tenant": {
      "id": 1,
      "name": "Tenant A",
      "address": "Bangkok",
      "extra_info": {},
      "is_active": true,
      "created_at": "2026-08-12T00:00:00Z",
      "updated_at": "2026-08-12T00:00:00Z"
    }
  }
}
```

**Errors:**
- 401: Login required
- 400: User is not allowed to access this system

### Tenant Administration API (Admin Only)

**Base URL:** `/api/v1/core/`

Administration users only (platform admins with `is_staff` or `is_superuser`).

All endpoints require JWT authentication:
```
Authorization: Bearer <jwt-access-token>
```

---

#### List Tenants
```
GET /api/v1/core/tenants
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageIndex` | integer | 1 | Page number (1-indexed) |
| `pageSize` | integer | 20 | Items per page (max 100) |
| `include_inactive` | boolean | false | Include inactive tenants |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Tenant A",
        "address": "Bangkok",
        "extra_info": {},
        "is_active": true,
        "created_at": "2026-08-12T00:00:00Z",
        "updated_at": "2026-08-12T00:00:00Z",
        "admin_count": 1,
        "user_count": 20,
        "device_count": 5
      }
    ],
    "count": 1,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

#### Get Tenant Detail
```
GET /api/v1/core/tenants/{tenant_id}
```

#### Create Tenant
```
POST /api/v1/core/tenants
```

**Request:**
```json
{
  "name": "Tenant A",
  "address": "Bangkok",
  "extra_info": {},
  "is_active": true
}
```

#### Update Tenant
```
PUT /api/v1/core/tenants/{tenant_id}
```

#### Deactivate Tenant (Soft Delete)
```
DELETE /api/v1/core/tenants/{tenant_id}
```

#### Activate Tenant
```
POST /api/v1/core/tenants/{tenant_id}/activate
```

#### List Tenant Admins for Tenant
```
GET /api/v1/core/tenants/{tenant_id}/admins
```

#### List Tenant Users for Tenant
```
GET /api/v1/core/tenants/{tenant_id}/users
```

#### List Tenant Devices and Status
```
GET /api/v1/core/tenants/{tenant_id}/devices
```

#### Tenant Sales Report
```
GET /api/v1/core/tenants/{tenant_id}/reports/sales
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `device_uuid` | string | Optional device filter |
| `external_device_sn` | string | Optional external device filter |
| `date_from` | string | Optional `YYYY-MM-DD` filter |
| `date_to` | string | Optional `YYYY-MM-DD` filter |

#### List All Tenant Admins
```
GET /api/v1/core/tenant-admins
```

#### Create Tenant Admin
```
POST /api/v1/core/tenant-admins
```

**Request:**
```json
{
  "tenant_id": 1,
  "username": "tenant01-admin",
  "password": "change-me-strong",
  "email": "admin@example.com",
  "first_name": "Tenant",
  "last_name": "Admin",
  "is_active": true
}
```

#### Update Tenant Admin
```
PUT /api/v1/core/tenant-admins/{auth_user_id}
```

---

### Tenant Management API (Tenant Admin + Admin)

**Base URL:** `/api/v1/core/tenant/`

Tenant admins are automatically scoped to their tenant. Administration users must provide `tenant_id` where tenant scope is ambiguous.

All endpoints require JWT authentication:
```
Authorization: Bearer <jwt-access-token>
```

---

#### List Tenant Users
```
GET /api/v1/core/tenant/users
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageIndex` | integer | 1 | Page number |
| `pageSize` | integer | 20 | Items per page |
| `tenant_id` | integer | *auto* | Administration only: filter by tenant |
| `search` | string | - | Search by name or phone number |
| `include_inactive` | boolean | false | Include inactive users |

#### Create Tenant User
```
POST /api/v1/core/tenant/users
```

**Request:**
```json
{
  "tenant_id": 1,
  "phone_number": "0901234567",
  "name": "John Doe",
  "balance": "0.00",
  "is_active": true
}
```

#### Get Tenant User by Phone
```
GET /api/v1/core/tenant/users/by-phone/{phone_number}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `tenant_id` | integer | Administration only: tenant filter |

#### Top Up Tenant User by Phone
```
POST /api/v1/core/tenant/users/topup-by-phone
```

**Request:**
```json
{
  "tenant_id": 1,
  "phone_number": "0901234567",
  "amount": "50000.00",
  "reason": "Cash top-up"
}
```

#### Get Tenant User Detail
```
GET /api/v1/core/tenant/users/{user_id}
```

#### Update Tenant User
```
PUT /api/v1/core/tenant/users/{user_id}
```

#### Deactivate Tenant User
```
DELETE /api/v1/core/tenant/users/{user_id}
```

#### Activate Tenant User
```
POST /api/v1/core/tenant/users/{user_id}/activate
```

#### Get User Balance
```
GET /api/v1/core/tenant/users/{user_id}/balance
```

#### Top Up User Balance
```
POST /api/v1/core/tenant/users/{user_id}/topup
```

#### List Balance Logs
```
GET /api/v1/core/tenant/users/{user_id}/balance-logs
```

#### List User Transactions
```
GET /api/v1/core/tenant/users/{user_id}/transactions
```

#### List RFID Cards
```
GET /api/v1/core/tenant/users/{user_id}/rfid-cards
```

#### Register RFID Card
```
POST /api/v1/core/tenant/users/{user_id}/rfid-cards
```

#### Deactivate RFID Card
```
DELETE /api/v1/core/tenant/users/{user_id}/rfid-cards/{card_id}
```

#### List Tenant Device Status
```
GET /api/v1/core/tenant/devices/status
```

#### Tenant Sales Report
```
GET /api/v1/core/tenant/reports/sales
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `tenant_id` | integer | Required for administration users |
| `device_uuid` | string | Optional device filter |
| `external_device_sn` | string | Optional external device filter |
| `date_from` | string | Optional `YYYY-MM-DD` filter |
| `date_to` | string | Optional `YYYY-MM-DD` filter |

---

### Balance API

**Base URL:** `/api/v1/core/balance/`

Public balance lookup for device/customer flows. No authentication required.

---

#### Check User Balance
```
POST /api/v1/core/balance/check
```

**Request Body:**
```json
{
  "device_uuid": "20260812001",
  "check_type": "card",
  "check_value": "478C3063"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `device_uuid` | string | Yes | Device UUID (10-20 chars) |
| `check_type` | string | Yes | Payment type - `card`, `mobile_pay`, `qr_code` |
| `check_value` | string | Yes | RFID card ID or phone number (5-100 chars) |

---

### Device Management API

**Base URL:** `/api/v1/core/devices/`

Requires JWT management authentication.

Permissions:
- Administration users can create, update, activate, deactivate, and configure devices and device types.
- Tenant admins can list/read devices and device types, but device results are scoped to their own tenant.

All endpoints require JWT authentication:
```
Authorization: Bearer <jwt-access-token>
```

---

#### List Devices
```
GET /api/v1/core/devices
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageIndex` | integer | 1 | Page number |
| `pageSize` | integer | 20 | Items per page (max 100) |
| `tenant_id` | integer | *auto* | Administration only: filter by tenant |
| `status` | string | - | Filter by status (`online`, `offline`, `maintenance`, `decommissioned`) |
| `type_name` | string | - | Filter by device type name |
| `is_active` | boolean | - | Filter by active status |
| `search` | string | - | Search in uuid, hw_uuid, firmware |

#### Register Device (Administration Only)
```
POST /api/v1/core/devices
```

#### Get Device Detail
```
GET /api/v1/core/devices/{uuid}
```

#### Update Device (Administration Only)
```
PUT /api/v1/core/devices/{uuid}
```

#### Deactivate Device (Administration Only)
```
DELETE /api/v1/core/devices/{uuid}
```

#### Activate Device (Administration Only)
```
POST /api/v1/core/devices/{uuid}/activate
```

#### Get Device Config
```
GET /api/v1/core/devices/{uuid}/config
```

#### Update Device Config (Administration Only)
```
PUT /api/v1/core/devices/{uuid}/config
```

#### Get Device Status
```
GET /api/v1/core/devices/{uuid}/status
```

#### List Device Transactions
```
GET /api/v1/core/devices/{uuid}/transactions
```

---

### Device Types API

**Base URL:** `/api/v1/core/device-types/`

---

#### List Device Types
```
GET /api/v1/core/device-types
```

#### Create Device Type (Administration Only)
```
POST /api/v1/core/device-types
```

#### Get Device Type
```
GET /api/v1/core/device-types/{name}
```

#### Update Device Type (Administration Only)
```
PUT /api/v1/core/device-types/{name}
```

#### Deactivate Device Type (Administration Only)
```
DELETE /api/v1/core/device-types/{name}
```

#### Activate Device Type (Administration Only)
```
POST /api/v1/core/device-types/{name}/activate
```

---

### External Device APIs

**Base URL:** `/api/v1/core/external-devices/`

External devices are tenant-owned TCN/Android devices that are not managed by the IMS device runtime but can be used for sales reporting.

All endpoints require JWT authentication:
```
Authorization: Bearer <jwt-access-token>
```

---

#### List External Devices
```
GET /api/v1/core/external-devices
```

#### Register External Device
```
POST /api/v1/core/external-devices
```

#### Get External Device Detail
```
GET /api/v1/core/external-devices/{device_sn}
```

#### Update External Device
```
PUT /api/v1/core/external-devices/{device_sn}
```

#### Deactivate External Device
```
DELETE /api/v1/core/external-devices/{device_sn}
```

#### List External Device Transactions
```
GET /api/v1/core/external-devices/{device_sn}/transactions
```

---

### Legacy Configuration API

**Base URL:** `/api/v1/core/config/`

Backward-compatible device config endpoints. Prefer `/api/v1/core/devices` for new management clients.

---

#### Get Device by UUID
```
GET /api/v1/core/config/device?uuid=20260812001
```

#### Register New Device (Administration Only)
```
POST /api/v1/core/config/device
```

#### Update Device (Administration Only)
```
PUT /api/v1/core/config/device?uuid=20260812001
```

---

### Transaction API

**Base URL:** `/api/v1/core/transaction/`

---

#### Insert Payment Transaction
```
POST /api/v1/core/transaction/insert
```

#### TCN Android Transaction Log (Webhook)
```
POST /api/v1/core/transaction/t_a_tx
Headers:
  X-API-KEY: <api_key>
  X-Signature-SHA256: <hmac_sha256_signature>
```

---

### MQTT Proxy API (for ESP32/Proxy Integration)

**Base URL:** `/api/v1/mqtt/`

---

#### Device Message Handler
```
POST /api/v1/mqtt/device-message
```

#### Device Status Update
```
POST /api/v1/mqtt/device-status
```

---

### Payment Webhooks

---

#### QR Payment Completion Webhook
```
POST /api/v1/webhook/qr-payment
Headers:
  X-Webhook-Key: <webhook_api_key>
  X-Signature-SHA256: <hmac_sha256_signature>
```

#### Poll QR Payment Status (for Proxy)
```
POST /api/v1/webhook/qr-payment/poll
```

---

## Data Models

### User (from /auth/me)
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| username | String | Username |
| email | String | Email |
| first_name | String | First name |
| last_name | String | Last name |
| is_staff | Boolean | Staff status |
| is_superuser | Boolean | Superuser status |
| role | String | Role: `admin`, `tenant_admin` |
| tenant | Object | Tenant info (id, name, address, extra_info, is_active, created_at, updated_at) |

### Tenant
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| name | String(255) | Unique tenant name |
| address | String(255) | Address |
| extra_info | JSON | Additional data |
| is_active | Boolean | Active status |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| admin_count | Integer | Number of tenant admins |
| user_count | Integer | Number of tenant users |
| device_count | Integer | Number of devices |

### Device
| Field | Type | Description |
|-------|------|-------------|
| uuid | String(12) | Primary key, unique |
| tenant_id | Integer | Tenant reference |
| type_name | String(50) | Device type name |
| firmware | String(50) | Firmware version |
| register_date | Date | Registration date |
| status | Choice | `online`, `offline`, `maintenance`, `decommissioned` |
| is_active | Boolean | Active status |
| extra_config | JSON | Extra configuration |
| hw_uuid | String(100) | Hardware UUID (unique) |
| last_seen_at | DateTime | Last seen timestamp |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| stats | Object | Transaction stats |

### ExternalDevice
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| tenant_id | Integer | Tenant reference |
| device_sn | String(50) | Unique device serial number |
| name | String(100) | Device name |
| location | String(255) | Device location |
| is_active | Boolean | Active status |
| extra_info | JSON | Extra information |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| stats | Object | Transaction stats |

### Pagination Response Format
All list endpoints return:
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "count": 100,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## Error Responses

All error responses follow this format:
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": "Additional details"
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate/conflict |
| VALIDATION_ERROR | 422 | Input validation failed |
| UNAUTHORIZED | 401 | Authentication failed |
| FORBIDDEN | 403 | Permission denied |
| BUSINESS_ERROR | 400 | Business logic violation |
| INTERNAL_ERROR | 500 | Server error |

---

## Admin Roles Summary

### Admin (Platform Admin - is_staff/is_superuser)
- Manage Tenants (CRUD)
- Manage Tenant Admins (CRUD)
- Manage Devices (CRUD) - all tenants
- Manage Device Types (CRUD)
- Manage External Devices (CRUD) - all tenants
- View all reports
- Assign devices to tenants

### Tenant Admin
- Manage Tenant Users (CRUD) - own tenant only
- Manage RFID Cards - own tenant users
- Top up users - own tenant
- View Device Status - own tenant devices
- View Sales Reports - own tenant
- Manage External Devices - own tenant
- View assigned devices