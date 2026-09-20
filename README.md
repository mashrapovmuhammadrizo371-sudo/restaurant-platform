# Restaurant Platform

A multi-brand restaurant ordering platform (5 brands under one restaurant company) with a customer ordering app and a role-based staff/admin panel. Node.js/Express/MongoDB backend, React/Vite frontend, JWT auth, Socket.IO realtime updates.

## Stack

- **Backend:** Node.js, Express, MongoDB + Mongoose, JWT, Socket.IO, Multer (image uploads)
- **Frontend:** React 18, Vite, React Router, Axios, Socket.IO client

## Project structure

```
backend/   Express API (src/server.js is the entry point)
frontend/  React app (customer ordering app + staff/admin panel)
```

## 1. Requirements

- Node.js 18+
- A running MongoDB instance (local or Atlas)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, BOSS_LOGIN, BOSS_PASSWORD at minimum
npm run seed   # creates the Boss account (and 5 demo brands, first run only)
npm run dev    # starts the API on http://localhost:5000 with nodemon
```

### Backend environment variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | no | `development` or `production` |
| `PORT` | no | API port (default `5000`) |
| `MONGO_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | Long random secret used to sign JWTs |
| `JWT_EXPIRES_IN` | no | Token lifetime (default `7d`) |
| `CLIENT_URL` | no | Frontend origin, used for CORS and Socket.IO CORS (e.g. `http://localhost:5173`) |
| `UPLOAD_DIR` | no | Local folder for uploaded images (default `uploads`) |
| `MAX_UPLOAD_MB` | no | Max upload size in MB (default `5`) |
| `BOSS_LOGIN` | **yes, for seeding** | Login for the first Boss/Super Admin account |
| `BOSS_PASSWORD` | **yes, for seeding** | Password for the first Boss account |
| `BOSS_NAME` | no | Display name for the Boss account |

### Creating the Boss (Super Admin) account

The Boss account is created by the seed script, not through the API (there is intentionally no public "become admin" endpoint):

```bash
cd backend
npm run seed
```

This is idempotent — running it again after the Boss account already exists just skips creation. On a completely fresh database it also creates 5 demo brands (Burger House, Pizza Point, Tovuq Xit, Fast Corner, Shirin Cafe), each pre-loaded with the 6 standard categories (Burgerlar, Pitsalar, Tovuqlar, Fast food, Ichimliklar, Desertlar) so the admin panel and customer app aren't empty on first run. Edit or delete these from the admin panel like any other brand.

Log in at `/staff/login` with the `BOSS_LOGIN` / `BOSS_PASSWORD` you set in `.env`.

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # defaults work for local dev, no edits needed
npm run dev             # starts the app on http://localhost:5173
```

The dev server proxies `/api`, `/uploads` and `/socket.io` to the backend (`VITE_BACKEND_ORIGIN`, default `http://localhost:5000`), so the frontend and backend can be run independently with zero manual wiring.

### Frontend environment variables (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | no | Only needed if the frontend is served from a different origin than the backend in production. Leave empty for local dev. |
| `VITE_SOCKET_URL` | no | Same as above, for the Socket.IO client. |
| `VITE_BACKEND_ORIGIN` | no | Only used by the Vite dev server to know where to proxy `/api`, `/uploads`, `/socket.io` (default `http://localhost:5000`). |

## 4. Roles

| Role | Access |
|---|---|
| **Boss** | Everything, across all 5 brands: all admin panel sections, all staff management, all orders/revenue |
| **Admin** | Admin panel scoped to their assigned brand(s) and granted permissions |
| **Operator** | New order intake, accept/reject, courier assignment (`/operator`) |
| **Courier** | Own availability toggle, assigned delivery orders (`/courier`) |
| **Ofitsiant** (waiter) | Table status, create table orders, progress table orders (`/ofitsiant`) |
| **Cashier** | Confirm payment received on pending orders (`/cashier`) |
| **Customer** | Registers/logs in on the main app, browses brands, orders, tracks orders, earns loyalty points |

All staff roles log in from the single shared page at `/staff/login` and are redirected automatically based on role. Customers log in/register at `/login` and `/register`.

## 5. Order flow summary

1. Customer places an order (delivery or table) → status `new`, realtime-notified to that brand's Operators.
2. Operator accepts or rejects it. If accepted and it's a delivery order, Operator assigns an available Courier.
3. **Delivery:** Courier starts delivery → completes delivery (marks cash orders paid automatically, awards loyalty points).
4. **Table:** Ofitsiant (or the customer via table order) moves it through `preparing` → `ready` → `completed` (marks cash orders paid, frees the table, awards loyalty points).
5. **Cashier** can mark any pending non-cash/cash order as paid at any point.
6. Loyalty points (1 point per 1000 so'm, minimum 1 per completed order) power the public leaderboard at `/leaderboard`.

## 6. Deployment notes

- Run `backend` and `frontend build` (`npm run build` in `frontend`, outputs to `frontend/dist`) behind the same reverse proxy/domain so the frontend's relative `/api`, `/uploads` and `/socket.io` calls resolve without extra CORS configuration. If they must be on different origins, set `VITE_API_URL` / `VITE_SOCKET_URL` on the frontend and `CLIENT_URL` on the backend accordingly.
- Uploaded images are stored on local disk (`backend/uploads` by default) and served at `/uploads/<filename>`. On a multi-instance deployment, mount that folder on shared/persistent storage (or swap in an object storage service) — a local disk won't survive redeploys or scale across instances.
- Set a strong, unique `JWT_SECRET` and `BOSS_PASSWORD` in production — never commit real `.env` files (both `.gitignore` files already exclude `.env`).
- Socket.IO needs WebSocket support enabled on whatever's in front of it (reverse proxy / load balancer).
