# Inventory Management App

## Deployment Links

- Frontend Application: https://inventory-frontend-g0p9.onrender.com
- Backend Server: https://inventorymanagementapp-jxrh.onrender.com
- API Base URL: https://inventorymanagementapp-jxrh.onrender.com/api
- API Health Check: https://inventorymanagementapp-jxrh.onrender.com/api/health

---

## Backend Documentation

This README contains the consolidated backend documentation for the Inventory Management App.


---

## Backend Setup and Integration

Backend Setup & Integration Notes
1. Server Setup
Purpose: Set up the main Express server for the Inventory Management App.
Files created/configured:
Backend/app.js
Backend/server.js
Backend/Config/Database.js
Backend/.env.example
Backend/.gitignore

Server port:
5500

Test:
GET http://localhost:5500/api

Response:
{
  "success": true,
  "message": "Inventory Management API is running"
}

Result: âœ… Server running successfully.
2. MongoDB Atlas Connection
Purpose: Connect the backend application to MongoDB Atlas using Mongoose.
Configuration:
MONGO_URI stored in .env
Database connection handled in Config/Database.js

Issue Encountered
MongoDB initially failed to connect because Node.js was resolving DNS through:
127.0.0.1

Resolution
Node.js was updated and DNS was checked again.
1.1.1.1
1.0.0.1

Result:
MongoDB Connected
Server running on port 5500

âœ… Database connection successful.
3. GitHub Workflow
Purpose: Prevent direct changes to main and manage team integration safely.
Actions completed:
Created feature branches
Used Pull Requests
Protected main branch
Required at least 1 approval
Enabled review before merge
Resolved merge conflicts

Result: âœ… Team changes are integrated through reviewed Pull Requests.
4. Supplier Feature Integration
Branch:
feature/suppliers

Action: Reviewed, approved and merged Supplier Pull Request into main.
After the merge:
git checkout main
git pull origin main

Test: Get All Suppliers
Method: GET
Endpoint:
http://localhost:5500/api/suppliers

Response:
{
  "success": true,
  "message": "Suppliers retrieved successfully",
  "data": []
}

Result: âœ… Supplier feature integrated successfully.
5. Product Feature Integration
Branch:
feature/product-backend

Action: Reviewed and approved the Product Pull Request.
GitHub confirmed:
No conflicts with base branch

The feature was merged into main and pulled locally.
git pull origin main

The following Product components were integrated:
Product model
Product controller
Product routes
Product service
Product validator
Error handler
API documentation

Test
npm run dev

Result: âœ… Server started successfully after Product integration.
6. MongoDB Network Access Issue
Issue
During integration testing, MongoDB returned:
Could not connect to any servers in your MongoDB Atlas cluster

Check
Atlas Network Access was checked and the current IP address was added.
Status:
Active

DNS was also confirmed:
1.1.1.1
1.0.0.1

The server was restarted:
npm run dev

Result: âœ… MongoDB connected successfully.

---

## Products API Documentation

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


---

## Stock API Documentation

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


---

## Supplier API Documentation

# Supplier API Documentation

Method               Endpoint                              Purpose
POST               /api/suppliers                     Create supplier
GET               /api/suppliers                      Get all suppliers
GET              /api/suppliers/:id                   Get one supplier
PUT             /api/suppliers/:id                    Update supplier
DELETE         /api/suppliers/:id                     Delete supplier



## 1. Create Supplier

**Endpoint:** `POST /api/suppliers`  
**Purpose:** Creates a new supplier record.


### Test: Create supplier successfully

**Request body:**
```json
{
  "supplierName": "Test Supplier",
  "contactPerson": "Test Contact",
  "email": "test@example.com",
  "phone": "08012345678",
  "address": "Lagos, Nigeria"
}


Response: (201) created
{
    "success": true,
    "message": "Supplier created successfully",
   
}

//### Test: Missing required supplierName

**Request body:**
```json
{
  "contactPerson": "Test Contact",
  "email": "test@example.com",
  "phone": "08012345678",
  "address": "Lagos, Nigeria"
}

Response: (400) Bad request

{
  "success": false,
  "message": "Supplier validation failed: supplierName: Supplier name is required",
  "data": null
}


//### Test: Get all suppliers successfully

**Method:** GET  
**Endpoint:** `/api/suppliers`  
**Purpose:** Retrieves all supplier records.

**Request body:** None

**Response: 200 OK**

```json
{
  "success": true,
  "message": "Suppliers retrieved successfully",
  
}


//### Test: Get supplier by ID â€” Success

**Method:** GET  
**Endpoint:** `/api/suppliers/:id`  
**Purpose:** Retrieves one supplier using its ID.

**Request:**  
`GET http://localhost:5000/api/suppliers/6ab6771a355280e752058c7`

**Response status:** `200 OK`

**Response body:**
```json
{
  "success": true,
  "message": "Supplier retrieved successfully",
  
}

//### Test: Update supplier â€” Success

**Method:** PUT  
**Endpoint:** `/api/suppliers/:id`  
**Purpose:** Updates an existing supplier.

**Request body:**
```json
{
  "supplierName": "Papersworld",
  "contactPerson": "Dheeraj Singh Judge"
}

**Response status:** `200 OK`

{
  "success": true,
  "message": "Supplier updated successfully"
}

//###Test: Verify updated supplier â€” Success

**Method:** GET  
**Endpoint:** `/api/suppliers/:id`  
**Purpose:** Confirms the supplier changes were saved.

**Response status:** `200 OK`

**Verified fields:**
- supplierName: Papersworld
- contactPerson: Dheeraj Singh Judge

**Response message:** `Supplier retrieved successfully`

//### Test: Delete supplier â€” Success

**Method:** DELETE  
**Endpoint:** `/api/suppliers/:id`  
**Purpose:** Deletes a supplier by its ID.

**Request:**
`DELETE http://localhost:5000/api/suppliers/6ab6771a355280e752058c7`

**Response status:** `200 OK`

**Response body:**
```json
{
  "success": true,
  "message": "Supplier deleted successfully",
 
}

//### Test: Retrieve a deleted supplier

**Method:** `GET`

**Endpoint:** `/api/suppliers/:id`

**Purpose:** Verify that a supplier cannot be retrieved after it has been deleted.

**Request:**
`GET http://localhost:5000/api/suppliers/6ab6771a355280e752058c7`

**Response status:** `404 Not Found`

**Response body:**
```json
{
  "success": false,
  "message": "Supplier not found",
  "data": null
}


---

## User and Authentication Documentation

1. Overview

The **User Module** was developed as a complete authentication, authorization, profile, password-management, and user-administration feature for the Inventory Management System.

The module supports three user roles:

- **Admin**
- **Business Owner**
- **Store Keeper**

The objective was to provide a secure system where users can register and log in, manage their profiles and passwords, while administrators can manage other users and control their roles and account status.

---

## 2. Project Structure

The User Module was organized into separate folders based on responsibility:


src/
â”‚
â”œâ”€â”€ Controllers/
â”‚   â””â”€â”€ userController.js
â”‚
â”œâ”€â”€ Models/
â”‚   â””â”€â”€ User.js
â”‚
â”œâ”€â”€ Routes/
â”‚   â””â”€â”€ userRoutes.js
â”‚
â”œâ”€â”€ Middleware/
â”‚   â”œâ”€â”€ authMiddleware.js
â”‚   â”œâ”€â”€ roleMiddleware.js
â”‚   â””â”€â”€ validate.js
â”‚
â”œâ”€â”€ Validators/
â”‚   â””â”€â”€ userValidator.js
â”‚
â””â”€â”€ Utils/
    â”œâ”€â”€ generateToken.js
    â”œâ”€â”€ generateResetToken.js
    â””â”€â”€ sendEmail.js
â”œâ”€â”€ Scripts/
   â””â”€â”€ createAdmin.js


This structure separates the business logic, database model, routing, authentication, authorization, validation, and utility functions.

---

3. User Model

The `User.js` model defines the information stored for every user.

The main fields are:

name
email
password
role
isActive
resetPasswordToken
resetPasswordExpire
createdAt
updatedAt


The `role` field uses an enum containing:
admin
business_owner
store_keeper

New users registering through the public registration endpoint are automatically assigned:
store_keeper


This prevents a person from registering publicly and giving themselves an administrator role.

MongoDB automatically generates a unique `_id` for every user, whether the account was created through registration or by an administrator.


4. Authentication

The authentication system contains:
### Registration
POST /api/users/register


A user provides:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}


The password is hashed before being stored in MongoDB.

The system then generates a JWT containing the user's ID.


### Login

POST /api/users/login


The user provides their email and password.

The system:
1. Searches for the user.
2. Retrieves the hashed password.
3. Compares the supplied password with the hashed password.
4. Checks whether the account is active.
5. Generates a JWT.
6. Returns the authenticated user's information.

The response includes:
json
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "store_keeper"
  },
  "token": "JWT_TOKEN"
}


The token is subsequently used to access protected endpoints.



5. JWT Authentication

JWT was used to authenticate users after login.

The token contains the user's ID:

javascript
{
  id: userId;
}


The `authMiddleware.js` middleware checks requests for:

http
Authorization: Bearer TOKEN


It then:

1. Extracts the token.
2. Verifies the token using `JWT_SECRET`.
3. Finds the corresponding user.
4. Checks whether the user still exists.
5. Checks whether the account is active.
6. Places the user inside:

javascript
req.user;


This allows controllers to identify the currently authenticated user.

---

6. Role-Based Authorization

Authentication answers:

> "Who are you?"

Authorization answers:

> "Are you allowed to do this?"

The `roleMiddleware.js` file handles role authorization.

For example:

javascript
authorize("admin");


allows only administrators to access an endpoint.

Therefore, an ordinary Store Keeper cannot access administrator user-management operations simply by possessing a valid JWT.

The authorization system supports:
Admin
Business Owner
Store Keeper


with administrator-only operations currently protected using:
javascript
(protect, authorize("admin"));


---

7. User Profile

Authenticated users can access:

http
GET /api/users/me


This returns the currently authenticated user's information.

Users can also update their profile:

http
PATCH /api/users/profile


The profile endpoint allows changes to information such as:
name
email


The user cannot use this endpoint to change their own role.

This is important because otherwise a normal user could potentially submit:
json
{
  "role": "admin"
}


and elevate their privileges.

---

8. Password Management

Two different password operations were implemented.

### Change Password

For users who know their existing password:
PATCH /api/users/change-password


The user provides:
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}


The system verifies the current password before allowing the change.

---

### Forgot Password

For users who no longer remember their password:
POST /api/users/forgot-password


The user provides their email address.

A secure reset token is generated and stored as a **hashed token** in the database.

The original token is sent to the user's email through Nodemailer.

The reset link expires after **15 minutes**.

---

### Reset Password

The user follows the emailed link and submits the new password through:
POST /api/users/reset-password/:token


The server hashes the token received from the URL and compares it with the stored token.

If the token is valid and has not expired, the password is changed.

The reset token is then removed so that it cannot be reused.

---

9. Email Integration

Nodemailer was used to send password-reset emails.

The email configuration is stored in environment variables rather than directly inside the source code.

Typical configuration includes:
EMAIL_HOST
EMAIL_PORT
EMAIL_SECURE
EMAIL_USER
EMAIL_PASSWORD


The reset email contains a link similar to:
FRONTEND_URL/reset-password/TOKEN


This keeps the email service credentials out of the application source code.

---

10. Admin User Management

Administrators have additional functionality for managing users.

### Create User


POST /api/users


An administrator can create:
Admin
Business Owner
Store Keeper


For example:
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "business_owner"
}


This is different from public registration because the administrator can assign the appropriate role.

---

### View All Users


GET /api/users


Returns the users stored in the database.

---

### View Individual User

GET /api/users/:id


The administrator can retrieve a specific user using their MongoDB ID.

Example:
GET /api/users/68xxxxxxxxxxxxxxxxxxxxxx


---

### Update User

PATCH /api/users/:id


The administrator can update information such as:


name
email
role


---

### Activate User

PATCH /api/users/:id/activate


Changes:
isActive = true


---

### Deactivate User

PATCH /api/users/:id/deactivate


Changes:
isActive = false


The implementation also prevents an administrator from deactivating their own account.

---

11. Validation

`userValidator.js` was created using `express-validator`.

Validation was implemented for:

- Registration
- Login
- Profile updates
- Password changes
- Admin user creation
- Admin user updates
- Forgot password
- Reset password
- User IDs

For example, the user ID validator checks:
param("id").isMongoId();


Therefore, an invalid ID such as:
/api/users/hello


can be rejected before the controller attempts to query MongoDB.

The `validate.js` middleware collects validation errors and returns them to the client.

---

12. Security Measures

Several security practices were implemented.

### Password hashing

Passwords are never stored as plain text.

`bcryptjs` is used to hash passwords before they are saved.

### Password protection

The password field uses:
select: false;


so passwords are not automatically returned in normal queries.

### JWT authentication

Protected resources require a valid JWT.

### Role authorization

Administrative operations require the `admin` role.

### Account status

Inactive users cannot log in or access protected resources.

### Password-reset token hashing

The password-reset token sent through email is not stored directly in the database. A hashed version is stored instead.

### Token expiration

Reset tokens expire after 15 minutes.

### Email enumeration protection

The forgot-password endpoint deliberately returns the same response whether an email exists or not.

This prevents attackers from using the endpoint to discover registered email addresses.

---

13. Challenges Encountered

Several challenges were encountered during development.

### CommonJS vs ES Modules

The project initially used ES module syntax:
import User from "../Models/User.js";


The project was later converted to CommonJS:
const User = require("../Models/User.js");
and:
module.exports = {
  register,
  login,
  ...
};


This required keeping imports and exports consistent throughout the project.

---

### Password hashing middleware

The Mongoose password hashing hook initially used the `next` parameter.

The implementation was changed to an asynchronous middleware:
userSchema.pre("save", async function () {

})


This ensures the password is hashed before the document is saved.

---

### Authentication vs authorization

Another important distinction was understanding that having a valid JWT does not automatically mean a user can perform every operation.

The system therefore uses two separate middleware layers:
authMiddleware.js
        â†“
Authentication
        â†“
roleMiddleware.js
        â†“
Authorization


---

### Admin creation

Public registration does not allow users to select the `admin` role.

Instead, administrator accounts are created through controlled mechanisms, such as an initial admin creation process or an existing administrator creating another administrator.

This prevents privilege escalation through public registration.

---

### Password reset

Password reset required several components working together:
Forgot password request
        â†“
Generate token
        â†“
Hash token
        â†“
Save hashed token
        â†“
Send email
        â†“
User clicks link
        â†“
Reset password endpoint
        â†“
Hash supplied token
        â†“
Compare with database
        â†“
Check expiration
        â†“
Change password
        â†“
Invalidate token

This was one of the more complex parts of the User Module.

---

14. API Endpoints

The completed User Module provides the following endpoints:

| Method | Endpoint                           | Purpose                | Access               |

| POST   | `/api/users/register`              | Register user          | Public               |
| POST   | `/api/users/login`                 | Login                  | Public               |
| POST   | `/api/users/logout`                | Logout                 | Authenticated        |
| GET    | `/api/users/me`                    | Current user           | Authenticated        |
| POST   | `/api/users/forgot-password`       | Request password reset | Public               |
| POST   | `/api/users/reset-password/:token` | Reset password         | Public + valid token |
| PATCH  | `/api/users/profile`               | Update profile         | Authenticated        |
| PATCH  | `/api/users/change-password`       | Change password        | Authenticated        |
| POST   | `/api/users`                       | Create user            | Admin                |
| GET    | `/api/users`                       | Get all users          | Admin                |
| GET    | `/api/users/:id`                   | Get single user        | Admin                |
| PATCH  | `/api/users/:id`                   | Update user            | Admin                |
| PATCH  | `/api/users/:id/activate`          | Activate user          | Admin                |
| PATCH  | `/api/users/:id/deactivate`        | Deactivate user        | Admin                |

---

15. Testing

The User Module can be tested using Postman or another API testing application.

The testing process should cover:
Register
    â†“
Login
    â†“
Receive JWT
    â†“
Send JWT in Authorization header
    â†“
Access protected endpoint
    â†“
Test role restrictions
    â†“
Test profile update
    â†“
Test password change
    â†“
Test forgot password
    â†“
Test email reset link
    â†“
Test new password
    â†“
Admin creates users
    â†“
Admin changes roles
    â†“
Admin activates/deactivates users


Protected requests use:
Authorization: Bearer YOUR_JWT_TOKEN


---

16. Final Result

The completed User Module provides the foundation for the rest of the Inventory Management System.

It handles the complete user lifecycle:
Registration
     â†“
Authentication
     â†“
JWT Authorization
     â†“
Role Management
     â†“
Profile Management
     â†“
Password Management
     â†“
Password Recovery
     â†“
Admin User Management
     â†“
Account Activation/Deactivation


The module was designed so that the other members of the group can build their features around an established user identity and authorization system.

For example, other modules can simply use:
req.user._id;


to identify the current user and:
req.user.role;


to determine the user's role.

This makes the User Module the central authentication and authorization layer of the entire application.



