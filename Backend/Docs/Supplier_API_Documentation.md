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


//### Test: Get supplier by ID — Success

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

//### Test: Update supplier — Success

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

//###Test: Verify updated supplier — Success

**Method:** GET  
**Endpoint:** `/api/suppliers/:id`  
**Purpose:** Confirms the supplier changes were saved.

**Response status:** `200 OK`

**Verified fields:**
- supplierName: Papersworld
- contactPerson: Dheeraj Singh Judge

**Response message:** `Supplier retrieved successfully`

//### Test: Delete supplier — Success

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
