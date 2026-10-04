# Products API

Base URL: `http://localhost:5500/api/products`

All responses look like `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`.

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST   | `/`            | Create a product |
| GET    | `/`            | List products (supports `page`, `limit`, `search`, `category`, `lowStock=true`, `sort`) |
| GET    | `/low-stock`   | Products at or below their reorder level |
| GET    | `/:id`         | Get one product |
| PUT    | `/:id`         | Update a product (send only the fields to change) |
| DELETE | `/:id`         | Delete a product |
| PATCH  | `/:id/stock`   | Add or remove stock: `{ "change": 5 }` or `{ "change": -3 }` |

## Create product (POST /)
```json
{
  "name": "Wireless Mouse",
  "sku": "WM-001",
  "category": "Electronics",
  "price": 8500,
  "quantity": 40,
  "reorderLevel": 10
}
```
Required: `name`, `sku`, `price`. SKU must be unique (stored in uppercase).

## Examples
- `GET /api/products?search=mouse&page=1&limit=5`
- `GET /api/products?category=Electronics&sort=-price`
- `GET /api/products?lowStock=true`

## Status codes
201 created, 200 ok, 400 validation/invalid id/insufficient stock, 404 not found, 409 duplicate SKU.
