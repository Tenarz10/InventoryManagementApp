# Stock API

Base path: `/api/stock`

Each product has exactly one stock record, looked up by the product's id (`:productId`).
Every change to a quantity is written to the stock movement history.

## Authentication

`GET` endpoints are public. Every endpoint that changes stock (`POST`, `PATCH`, `DELETE`) requires
`Authorization: Bearer <token>` (see [auth-api.md](auth-api.md)); the logged-in user is recorded as
`performedBy` on the movements it creates, and movement history returns that user's name, email and role.

## Stock status

| Status         | Rule                                   |
| -------------- | -------------------------------------- |
| `out_of_stock` | quantity is 0                          |
| `low_stock`    | quantity is at or below `reorderLevel` |
| `overstocked`  | quantity is above `maxLevel` (if set)  |
| `in_stock`     | anything else                          |

## Endpoints

| Method | Path                            | Description                                   |
| ------ | ------------------------------- | --------------------------------------------- |
| GET    | `/api/stock`                    | List stock records                            |
| POST   | `/api/stock`                    | Create a stock record for a product           |
| GET    | `/api/stock/summary`            | Totals: products, units, low and out of stock |
| GET    | `/api/stock/low-stock`          | Products at or below their reorder level      |
| GET    | `/api/stock/movements`          | Movement history for all products             |
| GET    | `/api/stock/:productId`         | Stock record for one product                  |
| PATCH  | `/api/stock/:productId`         | Update reorder level, max level or location   |
| DELETE | `/api/stock/:productId`         | Delete a stock record (history is kept)       |
| POST   | `/api/stock/:productId/in`      | Add units (deliveries, returns)               |
| POST   | `/api/stock/:productId/out`     | Remove units (sales, usage)                   |
| POST   | `/api/stock/:productId/adjust`  | Set the exact quantity (stock take)           |
| GET    | `/api/stock/:productId/movements` | Movement history for one product            |

### Query parameters

- `GET /api/stock`: `status`, `location`, `page`, `limit` (max 100)
- `GET /api/stock/movements` and `/:productId/movements`: `type` (`initial`, `in`, `out`, `adjustment`), `from`, `to` (dates), `product` (all-products route only), `page`, `limit`

## Request bodies

**Create stock** `POST /api/stock`

```json
{
  "product": "665f1c2e9b1e8a0012345678",
  "quantity": 50,
  "reorderLevel": 10,
  "maxLevel": 200,
  "location": "Warehouse A - Shelf 3"
}
```

Only `product` is required. `reorderLevel` defaults to 10. A starting quantity above 0 is logged as an `initial` movement.

**Update settings** `PATCH /api/stock/:productId`

```json
{ "reorderLevel": 15, "location": "Warehouse B" }
```

Quantity cannot be changed here; use stock in, stock out or adjust.

**Stock in / stock out** `POST /api/stock/:productId/in` or `/out`

```json
{
  "quantity": 20,
  "reason": "Supplier delivery",
  "reference": "PO-1042",
  "note": "Two boxes slightly damaged"
}
```

`quantity` must be a whole number of at least 1. Stock out fails with `400` if there are not enough units.

**Adjust** `POST /api/stock/:productId/adjust`

```json
{ "quantity": 47, "reason": "Monthly stock count" }
```

`quantity` is the new total. `reason` is required.

## Responses

Success:

```json
{
  "success": true,
  "message": "Added 20 unit(s) to stock",
  "data": {
    "stock": { "product": "...", "quantity": 70, "status": "in_stock" },
    "movement": { "type": "in", "quantity": 20, "previousQuantity": 50, "newQuantity": 70 }
  }
}
```

List endpoints also return `count` and `pagination` (`page`, `limit`, `total`, `totalPages`).

Errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["quantity must be a whole number of at least 1"]
}
```

| Status | When                                        |
| ------ | ------------------------------------------- |
| 400    | Invalid input or insufficient stock         |
| 401    | Missing, invalid or expired token           |
| 404    | No stock record for that product            |
| 409    | A stock record already exists for a product |
