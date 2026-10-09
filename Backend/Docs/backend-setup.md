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

Result: ✅ Server running successfully.
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

✅ Database connection successful.
3. GitHub Workflow
Purpose: Prevent direct changes to main and manage team integration safely.
Actions completed:
Created feature branches
Used Pull Requests
Protected main branch
Required at least 1 approval
Enabled review before merge
Resolved merge conflicts

Result: ✅ Team changes are integrated through reviewed Pull Requests.
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

Result: ✅ Supplier feature integrated successfully.
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

Result: ✅ Server started successfully after Product integration.
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

Result: ✅ MongoDB connected successfully.