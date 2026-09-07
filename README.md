# Shop Connect

A MERN stack local shop discovery and ordering platform with role-based authentication.

## Roles
- ADMIN
- SHOP_OWNER
- USER

## Tech stack
- Frontend: React + Vite + React Router + Axios
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt

## Project structure
- backend/
  - src/config
  - src/controllers
  - src/middleware
  - src/models
  - src/routes
  - src/utils
- frontend/
  - src/components
  - src/context
  - src/pages
  - src/services
  - src/utils

## Quick start
1. Start MongoDB locally on the default port 27017.
2. Create a backend/.env file based on backend/.env.example.
3. Install backend dependencies:
   npm install
4. Start backend:
   npm run dev
5. Install frontend dependencies:
   cd frontend && npm install
6. Start frontend:
   npm run dev

## Main routes
- /login
- /register
- /search
- /shop/:shopId
- /owner-login
- /owner-dashboard
- /admin-login
- /admin-dashboard

## Notes
- The admin dashboard is a placeholder because admin requirements were intentionally deferred.
- Access control is enforced by JWT and role middleware.
- Shop owners can only manage their own shop data.
