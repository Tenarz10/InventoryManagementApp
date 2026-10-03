INVENTORY MANAGEMENT APP: DASHBOARD-BACKEND
The dashboard backend is for our Inventory Management MVP. It gives the frontend a quick overview of the inventory: totals, products that need restocking, products that are sold out, and the latest stock activity.

Built by: Damilare Lucky-Audu | Branch: dashboard

Built with: Node.js, Express and MongoDB(Mongoose)

Files: 
Controllers/dashboardController.js - The logic of eaxh end point
Route/dashboardRoute.js - The routes 

The route is mounted in app.js at /api/dashboard.

Endpoints 
All endpoints are GET requests.
/api/dashboard/summary - toal products, suppliers and stock movements
/api/dashboard/low-stock - Products where the quantity is less than or equal to the reorder Level 
/api/dashboard/out-of-stock - Products where quantity is 0
/api/dashboard/recent-movements - the 10 most recent stock movements 

If something fails the server runs 500 with success set to "false"