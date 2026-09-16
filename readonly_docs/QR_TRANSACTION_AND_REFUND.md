# QR Payment, Transaction, and Refund GUI Changes

## Summary

Transaction logs now represent payments that actually happened. A QR scan/request no longer creates a `DeviceTransaction`.

New state fields on `DeviceTransaction`:

| Field | Values | GUI meaning |
|---|---|---|
| `vend_status` | `pending`, `success`, `failed`, `timeout` | Whether the machine delivered the item after payment |
| `refund_status` | `none`, `required`, `refunded`, `failed` | Whether operator refund action is needed |

Important rule:

```text
DeviceTransaction.is_success = item delivered successfully
QRPayment.status = payment provider/bank status
```

So a paid QR may still have `is_success=false` while waiting for vend result.

## Flow

### 1. QR Generated, No Payment Yet

Device sends `qr_request`.

Backend creates only:

```text
QRPayment.status = pending
```

Backend does not create a `DeviceTransaction`.

GUI impact:

- QR scans without payment will not appear in transaction logs.
- Use QR payment APIs/stats if the GUI needs to show QR attempts/scans.

### 2. Payment Confirmed

Payment webhook receives paid status.

Backend creates `DeviceTransaction`:

```text
payment_method = qr_code
is_success = false
vend_status = pending
refund_status = none
note = payment_paid_waiting_vend
reason = QR payment paid, waiting for vend
```

GUI impact:

- Show this as "Paid, waiting for vend", not as a completed sale.
- Do not count this transaction as delivered revenue until `is_success=true`.

### 3. Vend Success

Device sends vend result with `success=true`.

Backend updates `DeviceTransaction`:

```text
is_success = true
vend_status = success
refund_status = none
note = vend_success
reason = <device reason or "QR vend completed">
```

GUI impact:

- Show as completed sale.
- Count in sales revenue.

### 4. Vend Failed After Payment

Device sends vend result with `success=false`.

Backend updates `DeviceTransaction`:

```text
is_success = false
vend_status = failed
refund_status = required
note = vend_failed
reason = <machine failure reason>
```

GUI impact:

- Show in refund queue.
- Show `reason` to operator. This may contain the actual machine error.

### 5. Paid But No Vend Response

Backend command marks old paid transactions as timeout:

```bash
python manage.py mark_vend_timeouts --minutes 5
```

It updates matching transactions:

```text
vend_status = timeout
refund_status = required
reason = Vend timeout
note = vend_timeout_refund_required
```

GUI impact:

- Show in refund queue the same as vend failure.

## GUI APIs

Base path remains:

```text
/api/v1
```

All GUI endpoints below require JWT auth.

## Device Transaction List

```http
GET /api/v1/core/devices/{uuid}/transactions?pageIndex=1&pageSize=20
```

Changed response fields per item:

```json
{
  "id": 123,
  "tx_number": "TX-00245C99-C5DD",
  "device_uuid": "20260914001",
  "time": "2026-09-16T10:20:30+07:00",
  "transaction_date": "2026-09-16T10:20:30+07:00",
  "payment_method": "qr_code",
  "payment_source_id": "31525",
  "user_id": null,
  "user_info": {
    "provider_order_id": "SBC8D898E3AAC4",
    "provider_payment_id": "31525",
    "amount": "10000"
  },
  "item": "0",
  "price": "10000.00",
  "reason": "motor jam",
  "is_success": false,
  "is_sniff": true,
  "note": "vend_failed",
  "vend_status": "failed",
  "refund_status": "required"
}
```

GUI display recommendation:

| Condition | Label |
|---|---|
| `is_success=true` and `vend_status=success` | Completed |
| `vend_status=pending` | Paid, waiting for vend |
| `vend_status=failed` and `refund_status=required` | Refund required |
| `vend_status=timeout` and `refund_status=required` | Refund required, vend timeout |
| `refund_status=refunded` | Refunded |

## Refund Queue

List transactions that need refund.

```http
GET /api/v1/core/tenant/refunds?pageIndex=1&pageSize=20
```

Default filter:

```text
refund_status=required
```

Optional query filters:

| Query | Example | Notes |
|---|---|---|
| `tenant_id` | `1` | Required for platform admin, optional for tenant admin |
| `device_uuid` | `20260914001` | Filter one device |
| `refund_status` | `required` | `required`, `refunded`, `failed` |
| `date_from` | `2026-09-01` | Transaction date lower bound |
| `date_to` | `2026-09-30` | Transaction date upper bound |

Example:

```http
GET /api/v1/core/tenant/refunds?pageIndex=1&pageSize=20&refund_status=required
```

Response:

```json
{
  "items": [
    {
      "id": 123,
      "tx_number": "TX-00245C99-C5DD",
      "device_uuid": "20260914001",
      "time": "2026-09-16T10:20:30+07:00",
      "payment_method": "qr_code",
      "payment_source_id": "31525",
      "item": "0",
      "price": "10000.00",
      "reason": "motor jam",
      "note": "vend_failed",
      "is_success": false,
      "vend_status": "failed",
      "refund_status": "required"
    }
  ],
  "count": 1,
  "pageIndex": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

GUI columns recommended:

- Transaction ID: `tx_number`
- Device: `device_uuid`
- Amount: `price`
- Item: `item`
- Payment method: `payment_method`
- Failure reason: `reason`
- Vend status: `vend_status`
- Refund status: `refund_status`
- Time: `time`

## Mark Refund Completed

After operator refunds manually, mark transaction as refunded.

```http
POST /api/v1/core/tenant/refunds/{tx_number}/mark-refunded
```

Request:

```json
{
  "note": "Refunded by bank transfer"
}
```

For platform admin, include `tenant_id`:

```json
{
  "tenant_id": 1,
  "note": "Refunded by bank transfer"
}
```

Response:

```json
{
  "id": 123,
  "tx_number": "TX-00245C99-C5DD",
  "device_uuid": "20260914001",
  "time": "2026-09-16T10:20:30+07:00",
  "payment_method": "qr_code",
  "payment_source_id": "31525",
  "item": "0",
  "price": "10000.00",
  "reason": "motor jam",
  "note": "Refunded by bank transfer",
  "is_success": false,
  "vend_status": "failed",
  "refund_status": "refunded"
}
```

Errors:

| Case | Message |
|---|---|
| Transaction not found | `Transaction {tx_number} not found` |
| Already refunded or not required | `Transaction does not require refund` |

## QR Payment List

Existing endpoint:

```http
GET /api/v1/core/tenant/qr-payments?pageIndex=1&pageSize=20
```

Use this for QR attempt/payment status, not delivered sales.

Important statuses:

| `QRPayment.status` | GUI meaning |
|---|---|
| `pending` | QR created, not paid |
| `paid` | Payment received |
| `failed` | Payment failed |
| `cancelled` | Payment cancelled |
| `expired` | Payment expired |

Important: `paid` does not guarantee item delivered. Join/compare with transaction `vend_status` when showing fulfillment.

## Dashboard / Sales Report Notes

Sales reports continue to filter by:

```text
DeviceTransaction.is_success = true
```

That means:

- Unpaid QR scans are excluded because no `DeviceTransaction` exists.
- Paid but vend failed is excluded from sales because `is_success=false`.
- Paid but waiting for vend is excluded from sales because `is_success=false`.
- Only delivered items count as successful sales.

## Machine and Webhook APIs

These are backend/device integration APIs. GUI usually should not call them.

### QR Request From Device

```http
POST /api/v1/mqtt/device-message
```

Payload:

```json
{
  "topic": "devices/20260914001/request",
  "uuid": "20260914001",
  "kind": "request",
  "payload": {
    "action": "qr_request",
    "uuid": "20260914001",
    "device_id": "20260914001",
    "transaction_id": "TX-00245C99-C5DD",
    "item": 0,
    "price": 10000
  }
}
```

Behavior:

- Creates `QRPayment`.
- Does not create `DeviceTransaction`.

### Vend Result From Device

```http
POST /api/v1/mqtt/device-message
```

Payload:

```json
{
  "topic": "devices/20260914001/request",
  "uuid": "20260914001",
  "kind": "request",
  "payload": {
    "action": "vend",
    "uuid": "20260914001",
    "transaction_id": "TX-00245C99-C5DD",
    "success": false,
    "reason": "motor jam",
    "item": 0,
    "price": 10000,
    "payment_type": "qr",
    "rfidcard": ""
  }
}
```

Notes:

- Device can send `payment_type: "qr"`; backend normalizes it to `qr_code`.
- `reason` is saved to `DeviceTransaction.reason`.
- If payment was not confirmed, backend does not create a transaction log.

### Payment Webhooks

```http
POST /api/v1/webhook/qr-payment
POST /api/v1/webhook/seapay
```

Behavior:

- `paid` creates `DeviceTransaction`.
- `failed`, `cancelled`, `expired` update `QRPayment` only.

## GUI Migration Checklist

1. Add `vend_status` and `refund_status` columns/badges to transaction UI.
2. Treat `is_success=true` as delivered sale.
3. Do not use `QRPayment.status=paid` alone as delivered sale.
4. Add refund queue screen using `GET /core/tenant/refunds`.
5. Add action button "Mark refunded" using `POST /core/tenant/refunds/{tx_number}/mark-refunded`.
6. Show `reason` in refund queue and transaction detail.
7. Expect QR scans without payment to disappear from transaction logs.
