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
  "status": "success",
  "data": {
    "access": "<jwt-access-token>",
    "refresh": "<jwt-refresh-token>"
  }
}
```

**Errors:**
- 403: User is not allowed to access this system (not platform admin or tenant admin)

---

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
  "status": "success",
  "data": {
    "access": "<jwt-access-token>"
  }
}
```

---

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
{
  "status": "success",
  "data": {
    "valid": true
  }
}
```

---

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

---

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

---

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

### Tenant Administration API

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

---

#### Get Tenant Detail
```
GET /api/v1/core/tenants/{tenant_id}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
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
}
```

---

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

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Tenant A",
    "address": "Bangkok",
    "extra_info": {},
    "is_active": true,
    "created_at": "2026-08-12T00:00:00Z",
    "updated_at": "2026-08-12T00:00:00Z"
  }
}
```

**Errors:**
- 409: Tenant already exists (CONFLICT)

---

#### Update Tenant
```
PUT /api/v1/core/tenants/{tenant_id}
```

**Request:**
```json
{
  "name": "Tenant A Updated",
  "address": "New Address",
  "extra_info": {"key": "value"},
  "is_active": true
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Tenant A Updated",
    "address": "New Address",
    "extra_info": {"key": "value"},
    "is_active": true,
    "created_at": "2026-08-12T00:00:00Z",
    "updated_at": "2026-09-09T10:30:00Z",
    "admin_count": 1,
    "user_count": 20,
    "device_count": 5
  }
}
```

---

#### Deactivate Tenant (Soft Delete)
```
DELETE /api/v1/core/tenants/{tenant_id}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Tenant A",
    "address": "Bangkok",
    "extra_info": {},
    "is_active": false,
    "created_at": "2026-08-12T00:00:00Z",
    "updated_at": "2026-09-09T10:30:00Z",
    "admin_count": 1,
    "user_count": 20,
    "device_count": 5
  }
}
```

---

#### Activate Tenant
```
POST /api/v1/core/tenants/{tenant_id}/activate
```

**Response (200):** Same as Get Tenant Detail with `is_active: true`

---

#### List Tenant Admins for Tenant
```
GET /api/v1/core/tenants/{tenant_id}/admins
```

**Query Parameters:** `pageIndex`, `pageSize`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "auth_user": {
          "id": 1,
          "username": "tenant01-admin",
          "email": "admin@example.com",
          "first_name": "Tenant",
          "last_name": "Admin",
          "is_staff": false,
          "is_superuser": false,
          "role": "tenant_admin",
          "tenant": {...}
        },
        "tenant_admin": {
          "id": 1,
          "tenant_id": 1,
          "is_active": true
        }
      }
    ],
    "count": 1,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

#### List Tenant Users for Tenant
```
GET /api/v1/core/tenants/{tenant_id}/users
```

**Query Parameters:** `pageIndex`, `pageSize`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "tenant": 1,
        "phone_number": "0901234567",
        "name": "John Doe",
        "is_active": true,
        "balance": "100000.00",
        "created_at": "2026-08-12T00:00:00Z",
        "updated_at": "2026-08-12T00:00:00Z",
        "rfid_cards": [
          {
            "id": 1,
            "card_id": "478C3063",
            "extra_info": {"label": "Blue card"},
            "is_active": true,
            "user": 1,
            "created_at": "2026-08-12T00:00:00Z",
            "updated_at": "2026-08-12T00:00:00Z"
          }
        ]
      }
    ],
    "count": 20,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

#### List Tenant Devices and Status
```
GET /api/v1/core/tenants/{tenant_id}/devices
```

**Query Parameters:** `pageIndex`, `pageSize`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "uuid": "20260812001",
        "tenant_id": 1,
        "type_name": "mdb_cashless",
        "firmware": "1.0.0",
        "register_date": "2026-08-12",
        "status": "online",
        "is_active": true,
        "extra_config": {},
        "hw_uuid": "HW_TEST_001",
        "last_seen_at": "2026-09-09T10:30:00Z",
        "created_at": "2026-08-12T00:00:00Z",
        "updated_at": "2026-09-09T10:30:00Z",
        "stats": {
          "transaction_count": 150,
          "successful_transaction_count": 145,
          "total_sales": 1500000
        }
      }
    ],
    "count": 5,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

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

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "tenant_id": 1,
    "total_sales": "1500000.00",
    "transaction_count": 145,
    "external_total_sales": "500000.00",
    "external_transaction_count": 50,
    "by_device": [
      {
        "device_uuid": "20260812001",
        "total_sales": "1000000.00",
        "transaction_count": 100
      }
    ],
    "by_external_device": [
      {
        "device_sn": "TCN-SN-001",
        "total_sales": "500000.00",
        "transaction_count": 50
      }
    ],
    "by_payment_method": [
      {
        "payment_method": "card",
        "total_sales": "800000.00",
        "transaction_count": 80
      },
      {
        "payment_method": "qr_code",
        "total_sales": "700000.00",
        "transaction_count": 65
      }
    ],
    "by_external_payment_method": [
      {
        "pay_method": "card",
        "total_sales": "300000.00",
        "transaction_count": 30
      }
    ]
  }
}
```

---

#### List All Tenant Admins
```
GET /api/v1/core/tenant-admins
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `pageIndex` | integer | Page number (default 1) |
| `pageSize` | integer | Items per page (default 20) |
| `tenant_id` | integer | Optional filter by tenant |

**Response (200):** Same format as List Tenant Admins for Tenant

---

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

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "auth_user": {
      "id": 2,
      "username": "tenant01-admin",
      "email": "admin@example.com",
      "first_name": "Tenant",
      "last_name": "Admin",
      "is_staff": false,
      "is_superuser": false,
      "role": "tenant_admin",
      "tenant": {...}
    },
    "tenant_admin": {
      "id": 2,
      "tenant_id": 1,
      "is_active": true
    }
  }
}
```

**Errors:**
- 404: Tenant not found
- 409: Login user already exists

---

#### Update Tenant Admin
```
PUT /api/v1/core/tenant-admins/{auth_user_id}
```

**Request:**
```json
{
  "email": "new@example.com",
  "first_name": "Updated",
  "last_name": "Admin",
  "password": "new-password",
  "is_active": true
}
```

**Response (200):** Same format as Create Tenant Admin

### Tenant User Management API

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

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "tenant": 1,
        "phone_number": "0901234567",
        "name": "John Doe",
        "is_active": true,
        "balance": "100000.00",
        "created_at": "2026-08-12T00:00:00Z",
        "updated_at": "2026-08-12T00:00:00Z",
        "rfid_cards": [
          {
            "id": 1,
            "card_id": "478C3063",
            "extra_info": {"label": "Blue card"},
            "is_active": true,
            "user": 1,
            "created_at": "2026-08-12T00:00:00Z",
            "updated_at": "2026-08-12T00:00:00Z"
          }
        ]
      }
    ],
    "count": 20,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

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

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "tenant": 1,
    "phone_number": "0901234567",
    "name": "John Doe",
    "is_active": true,
    "balance": "0.00",
    "created_at": "2026-09-09T10:30:00Z",
    "updated_at": "2026-09-09T10:30:00Z",
    "rfid_cards": []
  }
}
```

**Errors:**
- 409: Phone number already exists

---

#### Get Tenant User by Phone
```
GET /api/v1/core/tenant/users/by-phone/{phone_number}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `tenant_id` | integer | Administration only: tenant filter |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "tenant": 1,
    "phone_number": "0901234567",
    "name": "John Doe",
    "is_active": true,
    "balance": "100000.00",
    "created_at": "2026-08-12T00:00:00Z",
    "updated_at": "2026-08-12T00:00:00Z",
    "rfid_cards": [...]
  }
}
```

---

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

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "balance": "150000.00"
  }
}
```

---

#### Get Tenant User Detail
```
GET /api/v1/core/tenant/users/{user_id}
```

**Response (200):** Same as Get Tenant User by Phone

---

#### Update Tenant User
```
PUT /api/v1/core/tenant/users/{user_id}
```

**Request:**
```json
{
  "phone_number": "0901234567",
  "name": "John Doe Updated",
  "is_active": true
}
```

**Response (200):** Same format as Get Tenant User Detail

**Errors:**
- 409: Phone number already exists

---

#### Deactivate Tenant User
```
DELETE /api/v1/core/tenant/users/{user_id}
```

**Response (200):** Same format with `is_active: false`

---

#### Activate Tenant User
```
POST /api/v1/core/tenant/users/{user_id}/activate
```

**Response (200):** Same format with `is_active: true`

---

#### Get User Balance
```
GET /api/v1/core/tenant/users/{user_id}/balance
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "phone_number": "0901234567",
    "name": "John Doe",
    "balance": "100000.00"
  }
}
```

---

#### Top Up User Balance
```
POST /api/v1/core/tenant/users/{user_id}/topup
```

**Request:**
```json
{
  "amount": "50000.00",
  "reason": "Cash top-up"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "balance": "150000.00"
  }
}
```

---

#### List Balance Logs
```
GET /api/v1/core/tenant/users/{user_id}/balance-logs
```

**Query Parameters:** `pageIndex`, `pageSize`, `limit` (legacy)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "user": 1,
        "amount": "50000.00",
        "balance_after": "100000.00",
        "reason": "Cash top-up",
        "created_at": "2026-09-09T10:30:00Z"
      }
    ],
    "count": 10,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

#### List User Transactions
```
GET /api/v1/core/tenant/users/{user_id}/transactions
```

**Query Parameters:** `pageIndex`, `pageSize`, `limit` (legacy)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": 1,
        "tx_number": "TX_110999_123",
        "device_uuid": "20260812001",
        "time": "2026-09-09T10:30:00Z",
        "payment_method": "card",
        "payment_source_id": "478C3063",
        "user_info": {...},
        "item": "6",
        "price": "10000.00",
        "reason": "OK",
        "is_success": true,
        "is_sniff": false,
        "note": null
      }
    ],
    "count": 50,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

---

#### List RFID Cards
```
GET /api/v1/core/tenant/users/{user_id}/rfid-cards
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageIndex` | integer | 1 | Page number |
| `pageSize` | integer | 20 | Items per page |
| `include_inactive` | boolean | false | Include inactive cards |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "card_id": "478C3063",
        "extra_info": {"label": "Blue card"},
        "is_active": true,
        "user": 1,
        "created_at": "2026-08-12T00:00:00Z",
        "updated_at": "2026-08-12T00:00:00Z"
      }
    ],
    "count": 1,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

#### Register RFID Card
```
POST /api/v1/core/tenant/users/{user_id}/rfid-cards
```

**Request:**
```json
{
  "card_id": "478C3063",
  "extra_info": {
    "label": "Blue card"
  }
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "card_id": "478C3063",
    "extra_info": {"label": "Blue card"},
    "is_active": true,
    "user": 1,
    "created_at": "2026-09-09T10:30:00Z",
    "updated_at": "2026-09-09T10:30:00Z"
  }
}
```

---

#### Deactivate RFID Card
```
DELETE /api/v1/core/tenant/users/{user_id}/rfid-cards/{card_id}
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

---

#### List Tenant Device Status
```
GET /api/v1/core/tenant/devices/status
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `pageIndex` | integer | Page number (default 1) |
| `pageSize` | integer | Items per page (default 20) |
| `tenant_id` | integer | Administration only: tenant filter |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "uuid": "20260812001",
        "status": "online",
        "is_active": true,
        "firmware": "1.0.0",
        "last_seen_at": "2026-09-09T10:30:00Z",
        "updated_at": "2026-09-09T10:30:00Z"
      }
    ],
    "count": 5,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

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

**Response (200):** Same format as Administration Sales Report

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

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "phone_number": "0901234567",
    "name": "John Doe",
    "tenant": 1,
    "is_active": true,
    "balance": "100000.00"
  }
}
```

**Errors:**
- 400: Invalid payment method, inactive user, or user not allowed on device (BUSINESS_ERROR)
- 404: Device not found (NOT_FOUND)

---

#### Check User Balance - Mobile Pay
```
POST /api/v1/core/balance/check
```

**Request:**
```json
{
  "device_uuid": "20260812001",
  "check_type": "mobile_pay",
  "check_value": "0901234567"
}
```

**Response (200):** Same format as above

---

#### Check User Balance - QR Code
```
POST /api/v1/core/balance/check
```

**Request:**
```json
{
  "device_uuid": "20260812001",
  "check_type": "qr_code",
  "check_value": "TX-0001ABCD-1234"
}
```

**Response (200):** Same format as above

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

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "uuid": "20260812001",
        "tenant_id": 1,
        "type_name": "mdb_cashless",
        "firmware": "1.0.0",
        "register_date": "2026-08-12",
        "status": "online",
        "is_active": true,
        "extra_config": {"prices": {"1": 10000, "2": 15000}, "settings": {"timeout": 30}},
        "hw_uuid": "HW_TEST_001",
        "last_seen_at": "2026-09-09T10:30:00Z",
        "created_at": "2026-08-12T00:00:00Z",
        "updated_at": "2026-09-09T10:30:00Z",
        "stats": {
          "transaction_count": 150,
          "successful_transaction_count": 145,
          "total_sales": 1500000
        }
      }
    ],
    "count": 10,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

#### Register Device (Administration Only)
```
POST /api/v1/core/devices
```

**Request:**
```json
{
  "type_name": "mdb_cashless",
  "hw_uuid": "HW_NEW_001",
  "firmware": "2.0.0",
  "tenant": 1,
  "status": "offline"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "uuid": "20260812001",
    "tenant_id": 1,
    "type_name": "mdb_cashless",
    "firmware": "2.0.0",
    "register_date": "2026-09-09",
    "status": "offline",
    "is_active": false,
    "extra_config": null,
    "hw_uuid": "HW_NEW_001",
    "last_seen_at": null,
    "created_at": "2026-09-09T10:30:00Z",
    "updated_at": "2026-09-09T10:30:00Z",
    "stats": {
      "transaction_count": 0,
      "successful_transaction_count": 0,
      "total_sales": 0
    }
  }
}
```

---

#### Get Device Detail
```
GET /api/v1/core/devices/{uuid}
```

**Response (200):** Same format as List Devices item with stats

---

#### Update Device (Administration Only)
```
PUT /api/v1/core/devices/{uuid}
```

**Request:**
```json
{
  "firmware": "2.0.1",
  "status": "maintenance",
  "is_active": true,
  "extra_config": {"timeout": 60}
}
```

**Response (200):** Same format as Get Device Detail with updated fields

---

#### Deactivate Device (Administration Only)
```
DELETE /api/v1/core/devices/{uuid}
```

**Response (200):** Device with `is_active: false` and `status: "offline"`

---

#### Activate Device (Administration Only)
```
POST /api/v1/core/devices/{uuid}/activate
```

**Response (200):** Device with `is_active: true`

---

#### Get Device Config
```
GET /api/v1/core/devices/{uuid}/config
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "uuid": "20260812001",
    "type_name": "mdb_cashless",
    "default_config": {
      "settings": {"timeout": 30}
    },
    "extra_config": {"prices": {"1": 10000, "2": 15000}, "settings": {"timeout": 30}}
  }
}
```

---

#### Update Device Config (Administration Only)
```
PUT /api/v1/core/devices/{uuid}/config
```

**Request:**
```json
{
  "extra_config": {
    "prices": {
      "1": 10000,
      "2": 15000
    },
    "settings": {
      "timeout": 30
    }
  }
}
```

**Response (200):** Same format as Get Device Config with updated `extra_config`

---

#### Get Device Status
```
GET /api/v1/core/devices/{uuid}/status
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "uuid": "20260812001",
    "status": "online",
    "is_active": true,
    "last_seen_at": "2026-09-09T10:30:00Z",
    "updated_at": "2026-09-09T10:30:00Z"
  }
}
```

---

#### List Device Transactions
```
GET /api/v1/core/devices/{uuid}/transactions
```

**Query Parameters:** `pageIndex`, `pageSize`, `limit` (legacy)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": 1,
        "tx_number": "TX_110999_123",
        "device_uuid": "20260812001",
        "time": "2026-09-09T10:30:00Z",
        "payment_method": "card",
        "payment_source_id": "478C3063",
        "user_info": {...},
        "item": "6",
        "price": "10000.00",
        "reason": "OK",
        "is_success": true,
        "is_sniff": false,
        "note": null
      }
    ],
    "count": 50,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

---

### Device Types API

**Base URL:** `/api/v1/core/device-types/`

---

#### List Device Types
```
GET /api/v1/core/device-types
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageIndex` | integer | 1 | Page number |
| `pageSize` | integer | 20 | Items per page |
| `include_inactive` | boolean | false | Include inactive device types |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "name": "mdb_cashless",
        "default_config": {
          "settings": {"timeout": 30}
        },
        "description": "MDB cashless reader",
        "status": "active",
        "created_at": "2026-08-12T00:00:00Z",
        "updated_at": "2026-08-12T00:00:00Z",
        "device_count": 5
      }
    ],
    "count": 2,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

#### Create Device Type (Administration Only)
```
POST /api/v1/core/device-types
```

**Request:**
```json
{
  "name": "mdb_cashless",
  "default_config": {
    "settings": {
      "timeout": 30
    }
  },
  "description": "MDB cashless reader",
  "status": "active"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "name": "mdb_cashless",
    "default_config": {"settings": {"timeout": 30}},
    "description": "MDB cashless reader",
    "status": "active",
    "created_at": "2026-09-09T10:30:00Z",
    "updated_at": "2026-09-09T10:30:00Z",
    "device_count": 0
  }
}
```

**Errors:**
- 409: Device type already exists

---

#### Get Device Type
```
GET /api/v1/core/device-types/{name}
```

**Response (200):** Same format as List Device Types item

---

#### Update Device Type (Administration Only)
```
PUT /api/v1/core/device-types/{name}
```

**Request:**
```json
{
  "default_config": {"settings": {"timeout": 60}},
  "description": "Updated description",
  "status": "active"
}
```

**Response (200):** Same format with updated fields

---

#### Deactivate Device Type (Administration Only)
```
DELETE /api/v1/core/device-types/{name}
```

**Response (200):** Device type with `status: "inactive"`

---

#### Activate Device Type (Administration Only)
```
POST /api/v1/core/device-types/{name}/activate
```

**Response (200):** Device type with `status: "active"`

---

### Device Configuration API (Legacy)

**Base URL:** `/api/v1/core/config/`

Backward-compatible device config endpoints. Prefer `/api/v1/core/devices` for new management clients.

Requires JWT management authentication. Administration users can register and update devices. Tenant admins can read only devices that belong to their tenant; for status dashboards prefer `/api/v1/core/tenant/devices/status`.

All endpoints require JWT authentication:
```
Authorization: Bearer <jwt-access-token>
```

---

#### Get Device by UUID
```
GET /api/v1/core/config/device?uuid=20260812001
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uuid` | string | Yes | Device UUID |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "uuid": "20260812001",
    "tenant": 1,
    "type": "mdb_cashless",
    "firmware": "1.0.0",
    "register_date": "2026-08-12",
    "status": "online",
    "is_active": true,
    "extra_config": {},
    "hw_uuid": "HW_TEST_001"
  }
}
```

---

#### Register New Device (Administration Only)
```
POST /api/v1/core/config/device
```

**Request Body:**
```json
{
  "type_name": "mdb_cashless",
  "hw_uuid": "HW_NEW_001",
  "firmware": "2.0.0",
  "register_date": "2026-08-12",
  "status": "offline",
  "tenant": 1
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "uuid": "20260812001",
    "tenant": 1,
    "type": "mdb_cashless",
    "firmware": "2.0.0",
    "register_date": "2026-08-12",
    "status": "offline",
    "is_active": false,
    "extra_config": null,
    "hw_uuid": "HW_NEW_001"
  }
}
```

---

#### Update Device (Administration Only)
```
PUT /api/v1/core/config/device?uuid=20260812001
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uuid` | string | Yes | Device UUID |

**Request Body:**
```json
{
  "firmware": "2.0.0",
  "status": "maintenance",
  "is_active": true,
  "extra_config": {"timeout": 60}
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "uuid": "20260812001",
    "firmware": "2.0.0",
    "status": "maintenance",
    "is_active": true,
    "extra_config": {"timeout": 60}
  }
}
```

---

### Transaction API

**Base URL:** `/api/v1/core/transaction/`

---

#### Insert Payment Transaction
```
POST /api/v1/core/transaction/insert
```

**Request Body:**
```json
{
  "device_uuid": "20260812001",
  "tx_number": "TX_110999_123",
  "payment_method": "card",
  "payment_source_id": "478C3063",
  "price": "10000.00",
  "item": "6",
  "reason": "OK",
  "success": true
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `device_uuid` | string | Yes | Device UUID (10-20 chars) |
| `tx_number` | string | Yes | Unique transaction number (10-50 chars) |
| `payment_method` | string | Yes | `cash`, `coin`, `card`, `mobile_pay`, `qr_code`, `other` |
| `payment_source_id` | string | Yes | RFID card ID or phone number (5-100 chars) |
| `price` | decimal | Yes | Transaction amount (> 0, max 12 digits, 2 decimal places) |
| `item` | string | Yes | Item code (1-10 chars) |
| `reason` | string | No | Transaction reason (max 100 chars) |
| `success` | boolean | Yes | Whether transaction succeeded |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "record_count": 2
  }
}
```

**Behavior:**
- For cashless payments (`card`, `mobile_pay`, `qr_code`): Validates user, deducts balance if successful
- For cash/coin: Records as sniff transaction (no balance change)

---

#### TCN Android Transaction Log (Webhook)
```
POST /api/v1/core/transaction/t_a_tx
Headers:
  X-API-KEY: <api_key>
  X-Signature-SHA256: <hmac_sha256_signature>
```

**Request Body:**
```json
{
  "orders": [
    {
      "order_id": 123,
      "order_no": "ORD_001",
      "device_sn": "SN_001",
      "price": "10000",
      "pay_amount": "10000",
      "pay_method": "card",
      "pay_status": 1,
      "refund_status": 0
    }
  ]
}
```

The endpoint accepts either an object with `orders` or a raw list of order objects. Each order is saved with the original payload in `raw_data` and mapped into report fields. Both snake_case and common camelCase names are accepted, including:

| Incoming keys | Saved field |
|---------------|-------------|
| `order_id`, `orderId` | `order_id` |
| `order_no`, `orderNo` | `order_no` |
| `device_sn`, `deviceSn` | `device_sn` |
| `temina_id`, `teminaId`, `terminal_id`, `terminalId` | `temina_id` |
| `business_temina_id`, `businessTeminaId`, `business_terminal_id`, `businessTerminalId` | `business_temina_id` |
| `price` | `price` |
| `pay_amount`, `payAmount` | `pay_amount` |
| `pay_method`, `payMethod` | `pay_method` |
| `pay_status`, `payStatus` | `pay_status` |
| `refund_status`, `refundStatus` | `refund_status` |
| `total_amout`, `total_amount`, `totalAmount` | `total_amount` |
| `modify_at`, `modifyAt` | `modify_at` |
| `create_at`, `createAt` | `create_at` |

If `device_sn` matches an active external device registered under `/api/v1/core/external-devices`, the log is linked to that tenant and included in tenant sales reports. These devices are not managed MQTT/API devices; they exist only for external sales review.

**Headers:**
- `X-API-KEY`: Configured webhook API key (from `WEBHOOK_API_KEY` setting)
- `X-Signature-SHA256`: HMAC-SHA256 of request body using webhook secret (from `WEBHOOK_SECRET` setting)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "status": "success",
    "count": 1
  }
}
```

**Errors:**
- 401: Invalid API Key
- 401: Invalid Signature

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

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageIndex` | integer | 1 | Page number |
| `pageSize` | integer | 20 | Items per page |
| `tenant_id` | integer | *auto* | Administration only: filter by tenant |
| `include_inactive` | boolean | false | Include inactive devices |
| `search` | string | - | Search in device_sn, name, location |

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "tenant": 1,
        "device_sn": "TCN-SN-001",
        "name": "Lobby TCN",
        "location": "Building A",
        "is_active": true,
        "extra_info": {},
        "created_at": "2026-08-12T00:00:00Z",
        "updated_at": "2026-08-12T00:00:00Z",
        "stats": {
          "transaction_count": 100,
          "paid_transaction_count": 95,
          "total_sales": "950000.00"
        }
      }
    ],
    "count": 5,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

#### Register External Device
```
POST /api/v1/core/external-devices
```

**Request:**
```json
{
  "tenant_id": 1,
  "device_sn": "TCN-SN-001",
  "name": "Lobby TCN",
  "location": "Building A",
  "is_active": true,
  "extra_info": {}
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "tenant": 1,
    "device_sn": "TCN-SN-001",
    "name": "Lobby TCN",
    "location": "Building A",
    "is_active": true,
    "extra_info": {},
    "created_at": "2026-09-09T10:30:00Z",
    "updated_at": "2026-09-09T10:30:00Z",
    "stats": {
      "transaction_count": 0,
      "paid_transaction_count": 0,
      "total_sales": "0"
    }
  }
}
```

**Errors:**
- 404: Tenant not found
- 409: External device already exists

---

#### Get External Device Detail
```
GET /api/v1/core/external-devices/{device_sn}
```

**Response (200):** Same format as List External Devices item with stats

---

#### Update External Device
```
PUT /api/v1/core/external-devices/{device_sn}
```

**Request:**
```json
{
  "tenant_id": 1,
  "name": "Updated Name",
  "location": "Updated Location",
  "is_active": true,
  "extra_info": {"key": "value"}
}
```

**Response (200):** Same format with updated fields

**Note:** Administration users can change `tenant_id` (will also update linked TCN transaction logs). Tenant admins cannot change tenant.

---

#### Deactivate External Device
```
DELETE /api/v1/core/external-devices/{device_sn}
```

**Response (200):** Same format with `is_active: false`

---

#### List External Device Transactions
```
GET /api/v1/core/external-devices/{device_sn}/transactions
```

**Query Parameters:** `pageIndex`, `pageSize`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "raw_data": {...},
        "tenant": 1,
        "external_device": 1,
        "order_id": 123,
        "order_no": "ORD_001",
        "device_sn": "TCN-SN-001",
        "temina_id": "TERM_001",
        "business_temina_id": "BIZ_001",
        "price": "10000.00",
        "pay_amount": "10000.00",
        "pay_method": "card",
        "pay_status": 1,
        "refund_status": 0,
        "total_amount": "10000.00",
        "modify_at": "2026-09-09T10:30:00Z",
        "create_at": "2026-09-09T10:30:00Z",
        "created_at": "2026-09-09T10:30:00Z"
      }
    ],
    "count": 100,
    "pageIndex": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

### MQTT Publish Settings

Set these environment variables when the API should publish async payment results directly to MQTT:

| Setting | Description |
|---------|-------------|
| `MQTT_PUBLISH_ENABLED` | Set `True` to publish from API webhook handlers |
| `MQTT_BROKER` | MQTT broker hostname |
| `MQTT_PORT` | MQTT broker port, default `8883` |
| `MQTT_USERNAME` | MQTT username |
| `MQTT_PASSWORD` | MQTT password |
| `MQTT_CLIENT_ID` | API MQTT client ID, default `ims_api_hub` |
| `MQTT_NO_TLS` | Set `1` to disable TLS for local brokers |
| `MQTT_TLS_CA_PATH` | Optional CA certificate path |

### MQTT Proxy API (for ESP32/Proxy Integration)

**Base URL:** `/api/v1/mqtt/`

The following endpoints are designed for the MQTT Proxy to communicate with devices via MQTT bridge. These endpoints receive messages from the proxy and return responses to be published back to the device.

---

#### Device Message Handler
```
POST /api/v1/mqtt/device-message
```

**Request Body (wrapped by proxy):**
```json
{
  "topic": "devices/TIC_E47171BA2010/request",
  "uuid": "TIC_E47171BA2010",
  "kind": "request",
  "payload": {
    "action": "qr_request",
    "device_id": "TIC_E47171BA2010",
    "transaction_id": "TX-0001ABCD-1234",
    "item": 7,
    "price": 15000
  }
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "publish": true,
    "topic": "devices/TIC_E47171BA2010/response",
    "payload": {
      "action": "qr",
      "transaction_id": "TX-0001ABCD-1234",
      "qr_data": "00020101021238570010A000000727..."
    }
  }
}
```

**Actions supported in payload:**

| Action | Flow Type | Description |
|--------|-----------|-------------|
| `config` | - | Get device configuration |
| `qr_request` | Credit | Initiate QR payment (external provider) |
| `rfidcard` | Debit | Validate RFID card/phone, check balance |
| `vend` | Both | Finalize transaction |

---

#### Config Action (`action: "config"`)

**Request Payload:**
```json
{
  "action": "config",
  "uuid": "TIC_E47171BA2010"
}
```

**Response to Device (via proxy):**
```json
{
  "action": "config",
  "uuid": "TIC_E47171BA2010",
  "config": {
    "device_type": "mdb_cashless",
    "firmware": "1.0.0",
    "prices": {"1": 10000, "2": 15000},
    "settings": {"timeout": 30}
  }
}
```

---

#### QR Payment Request (`action: "qr_request"`) - Credit Flow

**Request Payload:**
```json
{
  "action": "qr_request",
  "uuid": "TIC_E47171BA2010",
  "device_id": "TIC_E47171BA2010",
  "transaction_id": "TX-0001ABCD-1234",
  "item": 7,
  "price": 15000
}
```

**Response to Device (via proxy):**
```json
{
  "action": "qr",
  "transaction_id": "TX-0001ABCD-1234",
  "qr_data": "00020101021238570010A000000727..."
}
```

`qr_data` is a VietQR/EMVCo bank transfer payload generated from server settings:

| Setting | Description |
|---------|-------------|
| `VIETQR_BANK` | Vietnamese bank name/alias such as `VIETCOMBANK`, `VIETINBANK`, `BIDV`, `AGRIBANK`, `TECHCOMBANK`, `MBBANK`, or a direct six-digit bank BIN |
| `VIETQR_ACCOUNT_NUMBER` | Receiver account number |
| `VIETQR_ACCOUNT_NAME` | Receiver account name shown in banking apps |

The payment message is always `<device_id>_<transaction_id>`, for example `TIC_E47171BA2010_TX-0001ABCD-1234`.

**Flow:**
1. Device requests QR payment
2. API creates pending transaction + QRPayment record
3. Returns QR code data (EMVCo format)
4. User scans QR, pays via external provider
5. Provider calls webhook `/api/v1/webhook/qr-payment`
6. API publishes `payment_result` to `backend/devices/{uuid}/response` when `MQTT_PUBLISH_ENABLED=True`
7. Proxy forwards it to `devices/{uuid}/response`
8. Device sends `vend` with `success: true` when vending completes

**Async payment result MQTT payload:**
```json
{
  "action": "payment_result",
  "transaction_id": "TX-0001ABCD-1234",
  "paid": true,
  "message": "OK"
}
```

---

#### RFID Card Validation (`action: "rfidcard"`) - Debit Flow

**Request Payload:**
```json
{
  "action": "rfidcard",
  "uuid": "TIC_E47171BA2010",
  "card_id": "478C3063",
  "transaction_id": "TX-0002EFGH-5678"
}
```

**Or with phone number:**
```json
{
  "action": "rfidcard",
  "uuid": "TIC_E47171BA2010",
  "phone_number": "0901234567",
  "transaction_id": "TX-0002EFGH-5678"
}
```

**Response to Device (via proxy) - Valid:**
```json
{
  "action": "rfidcard_result",
  "transaction_id": "TX-0002EFGH-5678",
  "valid": true,
  "balance": "50000.00",
  "user_name": "John Doe",
  "message": "OK"
}
```

**Response to Device (via proxy) - Invalid:**
```json
{
  "action": "rfidcard_result",
  "transaction_id": "TX-0002EFGH-5678",
  "valid": false,
  "balance": null,
  "user_name": null,
  "message": "Card not registered"
}
```

**Other error messages:**
- "Phone number not registered"
- "User account inactive"
- "User not allowed on this device"
- "Insufficient balance" (when price provided and balance < price)

---

#### Vend Finalization (`action: "vend"`) - Both Flows

**Request Payload (Credit - QR payment completed):**
```json
{
  "action": "vend",
  "uuid": "TIC_E47171BA2010",
  "transaction_id": "TX-0001ABCD-1234",
  "item": 7,
  "price": 15000,
  "payment_method": "qr_code",
  "payment_source_id": "PROVIDER_PAY_123",
  "success": true
}
```

**Request Payload (Debit - RFID/Phone payment):**
```json
{
  "action": "vend",
  "uuid": "TIC_E47171BA2010",
  "transaction_id": "TX-0002EFGH-5678",
  "item": 3,
  "price": 10000,
  "payment_method": "card",
  "payment_source_id": "478C3063",
  "success": true
}
```

**Request Payload (Cash/Coin - Sniff mode):**
```json
{
  "action": "vend",
  "uuid": "TIC_E47171BA2010",
  "transaction_id": "TX-0003HIJK-9012",
  "item": 1,
  "price": 5000,
  "payment_method": "cash",
  "payment_source_id": "",
  "success": true
}
```

**Response to Device (via proxy):**
```json
{
  "action": "vend_result",
  "transaction_id": "TX-0001ABCD-1234",
  "success": true,
  "message": "OK"
}
```

**Error Response:**
```json
{
  "action": "vend_result",
  "transaction_id": "TX-0001ABCD-1234",
  "success": false,
  "message": "QR payment not paid"
}
```

---

#### Device Status Update
```
POST /api/v1/mqtt/device-status
```

**Request Body (wrapped by proxy):**
```json
{
  "topic": "devices/TIC_E47171BA2010/status",
  "uuid": "TIC_E47171BA2010",
  "status": "online"
}
```

**Status values:** `online`, `offline`, `maintenance`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "status": "ok"
  }
}
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

**Request Body:**
```json
{
  "transaction_id": "TX-0001ABCD-1234",
  "provider_order_id": "ORDER_123",
  "provider_payment_id": "PAY_123",
  "status": "paid",
  "amount": 15000,
  "payment_method": "qr_code",
  "paid_at": "2026-09-09T10:30:00Z"
}
```

**Headers:**
- `X-Webhook-Key`: Configured webhook API key (from `WEBHOOK_API_KEY` setting)
- `X-Signature-SHA256`: HMAC-SHA256 of request body using webhook secret (from `WEBHOOK_SECRET` setting)

**Status values:** `paid`, `failed`, `cancelled`, `expired`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "status": "ok",
    "publish": true,
    "topic": "backend/devices/20260812001/response",
    "payload": {
      "action": "payment_result",
      "transaction_id": "TX-0001ABCD-1234",
      "paid": true,
      "message": "OK"
    },
    "mqtt_publish": true
  }
}
```

**Response when already processed:**
```json
{
  "status": "success",
  "data": {
    "status": "ok",
    "message": "Already processed",
    "publish": true,
    "topic": "backend/devices/20260812001/response",
    "payload": {...},
    "mqtt_publish": true
  }
}
```

**Errors:**
- 401: Invalid webhook key
- 401: Invalid signature
- 400: Missing transaction_id
- 400: Invalid amount
- 400: Amount mismatch
- 400: Unknown status

---

#### Poll QR Payment Status (for Proxy)
```
POST /api/v1/webhook/qr-payment/poll
```

**Request Body:**
```json
{
  "transaction_ids": ["TX-0001ABCD-1234", "TX-0002EFGH-5678"]
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "transaction_id": "TX-0001ABCD-1234",
        "status": "paid",
        "paid_at": "2026-09-09T10:30:00Z",
        "provider_payment_id": "PAY_123",
        "provider_order_id": "ORDER_123",
        "publish": true,
        "topic": "devices/20260812001/response",
        "payload": {
          "action": "payment_result",
          "transaction_id": "TX-0001ABCD-1234",
          "paid": true,
          "message": "OK"
        }
      },
      {
        "transaction_id": "TX-0002EFGH-5678",
        "status": "pending",
        "paid_at": null,
        "provider_payment_id": null,
        "provider_order_id": null,
        "publish": false,
        "topic": "devices/20260812001/response",
        "payload": {
          "action": "payment_result",
          "transaction_id": "TX-0002EFGH-5678",
          "paid": false,
          "message": "Payment pending"
        }
      }
    ]
  }
}
```

---

## Data Models

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

---

### User (Tenant User)
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| tenant | ForeignKey | Tenant reference |
| phone_number | String(15) | Unique phone number |
| name | String(100) | User name |
| is_active | Boolean | Active status |
| balance | Decimal(12,2) | Account balance (≥0) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

### TenantAdmin
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| auth_user | OneToOne | Django login account |
| tenant | ForeignKey | Tenant this admin can manage |
| is_active | Boolean | Tenant-admin access status |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

### DeviceType
| Field | Type | Description |
|-------|------|-------------|
| name | String(50) | Primary key, unique |
| default_config | JSON | Default configuration |
| description | String(255) | Description |
| status | Choice | `active`, `inactive` |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

### Device
| Field | Type | Description |
|-------|------|-------------|
| uuid | String(12) | Primary key, unique |
| tenant | ForeignKey | Tenant reference |
| type | ForeignKey | DeviceType reference |
| firmware | String(50) | Firmware version |
| register_date | Date | Registration date |
| status | Choice | `online`, `offline`, `maintenance`, `decommissioned` |
| is_active | Boolean | Active status |
| extra_config | JSON | Extra configuration |
| hw_uuid | String(100) | Hardware UUID (unique) |
| last_seen_at | DateTime | Last seen timestamp |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

### DeviceTransaction
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| user_id | Integer | User ID (nullable) |
| tx_number | String(50) | Unique transaction number |
| device_uuid | String(12) | Device UUID |
| time | DateTime | Transaction timestamp |
| payment_method | Choice | Payment type |
| payment_source_id | String(100) | Payment source identifier |
| user_info | JSON | User snapshot at transaction time |
| item | String(10) | Item code |
| price | Decimal(12,2) | Transaction amount |
| reason | String(100) | Reason |
| is_success | Boolean | Success status |
| is_sniff | Boolean | Sniff mode flag |
| note | String(255) | Additional notes |

---

### QRPayment
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| transaction_id | String(50) | Unique transaction ID |
| device_uuid | String(12) | Device UUID |
| device_id | String(50) | Device ID for payment provider |
| item | String(10) | Item code |
| price | Decimal(12,2) | Transaction amount |
| qr_data | Text | QR code data string |
| provider_order_id | String(100) | Payment provider order ID |
| provider_payment_id | String(100) | Payment provider payment ID |
| status | Choice | `pending`, `paid`, `failed`, `expired`, `cancelled` |
| paid_at | DateTime | Payment completion time |
| expired_at | DateTime | Expiration time |
| raw_callback_data | JSON | Raw webhook callback data |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

### RfidCard
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| card_id | String(100) | Unique card ID |
| extra_info | JSON | Extra information |
| is_active | Boolean | Active status |
| user | ForeignKey | User reference |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

### BalanceLog
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| user | ForeignKey | User reference |
| amount | Decimal(12,2) | Amount changed |
| balance_after | Decimal(12,2) | Balance after change |
| reason | String(255) | Reason for change |
| created_at | DateTime | Creation timestamp |

---

### ExternalDevice
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| tenant | ForeignKey | Tenant reference |
| device_sn | String(50) | Unique device serial number |
| name | String(100) | Device name |
| location | String(255) | Device location |
| is_active | Boolean | Active status |
| extra_info | JSON | Extra information |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

### TCNAndroidTxLog
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| raw_data | JSON | Original webhook payload |
| tenant | ForeignKey | Tenant reference (nullable) |
| external_device | ForeignKey | ExternalDevice reference (nullable) |
| order_id | Integer | Order ID |
| order_no | String(50) | Order number |
| device_sn | String(50) | Device serial number |
| temina_id | String(50) | Terminal ID |
| business_temina_id | String(50) | Business terminal ID |
| price | Decimal(12,2) | Listed price |
| pay_amount | Decimal(12,2) | Actual paid amount |
| pay_method | String(50) | Payment method |
| pay_status | Integer | Payment status |
| refund_status | Integer | Refund status |
| total_amount | Decimal(12,2) | Total amount |
| modify_at | DateTime | Modification time |
| create_at | DateTime | Creation time |
| created_at | DateTime | Record creation timestamp |

---

### BankResultLog
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| raw_data | JSON | Original webhook payload |
| result_code | String(50) | Result code |
| result_msg | String(255) | Result message |
| order_no | String(50) | Order number |
| device_sn | String(50) | Device serial number |
| pay_method | String(50) | Payment method |
| pay_status | Integer | Payment status |
| refund_status | Integer | Refund status |
| modify_at | DateTime | Modification time |
| create_at | DateTime | Creation time |
| created_at | DateTime | Record creation timestamp |

### Credit Flow (QR Code - External Payment)
1. **Device** → `qr_request` → **API** → Returns QR code
2. **User** scans QR → Pays via **External Provider**
3. **Provider** → Webhook `/webhook/qr-payment` → **API** → Updates status
4. **Device** → `vend` (payment_method=qr_code, success=true) → **API** → Completes transaction

### Debit Flow (RFID/Phone - Internal Balance)
1. **Device** → `rfidcard` → **API** → Returns user info + balance
2. **Device** → `vend` (payment_method=card/mobile_pay, success=true) → **API** → Deducts balance, logs transaction

### Cash/Coin Flow (Sniff Mode)
1. **Device** → `vend` (payment_method=cash/coin, is_sniff=true) → **API** → Logs transaction only

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

## Payment Types

| Value | Description |
|-------|-------------|
| cash | Physical cash |
| coin | Coins |
| card | RFID/Card payment |
| mobile_pay | Mobile payment (QR/App) |
| qr_code | QR code payment |
| other | Other payment methods |

---

## Device Types

| Value | Description | Supported Payment Methods |
|-------|-------------|---------------------------|
| mdb_cashless | MDB Cashless device | card, mobile_pay, qr_code |
| mdb_sniff | MDB Sniffing device | (none - passive monitoring) |

---

## Device Statuses

| Value | Description |
|-------|-------------|
| online | Device connected and operational |
| offline | Device disconnected |
| maintenance | Device under maintenance |
| decommissioned | Device retired |

---

## QR Payment Statuses

| Value | Description |
|-------|-------------|
| pending | QR generated, awaiting payment |
| paid | Payment completed successfully |
| failed | Payment failed |
| expired | QR code expired |
| cancelled | Payment cancelled |

---

## Webhook Security

All webhook endpoints use HMAC-SHA256 for request verification:

1. Client computes: `HMAC-SHA256(request_body, webhook_secret)`
2. Sends signature in `X-Signature-SHA256` header
3. Server verifies using constant-time comparison

**Example (Python):**
```python
import hmac
import hashlib
import requests

secret = "your_webhook_secret"
body = b'{"orders": [...]}'
signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

headers = {
    "X-API-KEY": "your_api_key",
    "X-Signature-SHA256": signature,
    "Content-Type": "application/json",
}
requests.post(url, data=body, headers=headers)
```

### Webhook Endpoints and Headers

| Endpoint | Key Header | Signature Header |
|----------|------------|------------------|
| `/core/transaction/t_a_tx` | `X-API-KEY` | `X-Signature-SHA256` |
| `/webhook/qr-payment` | `X-Webhook-Key` | `X-Signature-SHA256` |

Both use the same `WEBHOOK_API_KEY` and `WEBHOOK_SECRET` from settings.
