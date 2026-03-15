# ☕ Cafe ERP — Full Stack Project

> Spring Boot 3.3 + React 18 + PostgreSQL + Redis

---

## 🚀 Quick Start (5 minutes)

### 1. Start the database (Docker required)
```bash
cd cafe-erp
docker-compose up -d
# Wait ~10 seconds for DB to be ready
docker-compose ps  # Both services should show "healthy"
```

### 2. Run the backend
```bash
cd backend
# If you have Maven installed:
mvn spring-boot:run
# (If mvn is not recognized, install Maven and add it to your PATH)

# Flyway migrations run automatically on startup
# Server starts on http://localhost:8080/api/v1
```

### 3. Run the frontend
```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

### 4. Login
- URL: http://localhost:5173
- Username: `owner`
- Password: `Admin@123`

---

## 📁 Project Structure

```
cafe-erp/
├── docker-compose.yml          ← PostgreSQL + Redis
├── backend/                    ← Spring Boot app
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/cafe/erp/
│       │   ├── CafeErpApplication.java
│       │   ├── shared/         ← Base entities, security, exceptions
│       │   ├── identity/       ← Users, roles, JWT auth
│       │   ├── menu/           ← Categories, products, recipes
│       │   ├── pos/            ← Orders, payments
│       │   ├── gaming/         ← PlayStation sessions
│       │   ├── inventory/      ← Stock, purchases, wastage
│       │   ├── shift/          ← Shift management
│       │   ├── floor/          ← Table management
│       │   ├── crm/            ← Customers, loyalty
│       │   └── promotion/      ← Promo codes, offers
│       └── resources/
│           ├── application.yml
│           └── db/migration/   ← Flyway SQL migrations
└── frontend/                   ← React app
    ├── src/
    │   ├── app/                ← Store, router, base API
    │   ├── features/           ← Feature modules (auth, pos, floor, ...)
    │   ├── components/         ← Shared UI components
    │   ├── services/           ← Axios client
    │   ├── utils/              ← Helpers
    │   └── types/              ← TypeScript types
    └── index.html
```

---

## 🔑 Default Users

| Username | Password   | Role       | Max Discount |
|----------|------------|------------|-------------|
| owner    | Admin@123  | OWNER      | Unlimited   |

Create more users via: POST /api/v1/users (requires MANAGER+ role)

---

## 🔌 Key API Endpoints

### Auth
```
POST /api/v1/auth/login          → Get JWT tokens
POST /api/v1/auth/refresh        → Refresh access token
POST /api/v1/auth/logout         → Revoke refresh token
```

### Menu
```
GET  /api/v1/menu/categories     → All categories
GET  /api/v1/menu/products       → Products (filter by ?categoryId=)
POST /api/v1/menu/products       → Create product [MANAGER+]
PATCH /api/v1/menu/products/{id}/price → Update price [MANAGER+]
```

### Orders (POS)
```
GET  /api/v1/orders/open         → All open orders
POST /api/v1/orders              → Create order
POST /api/v1/orders/{id}/lines   → Add item
DELETE /api/v1/orders/{id}/lines/{lineId} → Remove item [SUPERVISOR+]
POST /api/v1/orders/{id}/discount → Apply discount
POST /api/v1/orders/{id}/promo   → Apply promo code
POST /api/v1/orders/{id}/pay     → Process payment
POST /api/v1/orders/{id}/cancel  → Cancel [SUPERVISOR+]
```

---

## 🧱 What's Built

### Backend — Working Modules
- ✅ JWT authentication with refresh tokens (stored in Redis)
- ✅ Role-based access control (OWNER / MANAGER / SUPERVISOR / CASHIER / WAITER)
- ✅ Activity log (append-only audit trail)
- ✅ Menu management (categories, products, price history)
- ✅ Full order lifecycle (create → add items → discount → pay → close)
- ✅ Security controls (max discount by role, sequential order numbers)
- ✅ WebSocket endpoint for real-time updates
- ✅ Flyway DB migrations (V1: users, V2: menu, V3: orders)
- ✅ Global exception handling with structured JSON responses

### Frontend — Working Screens
- ✅ Login page with JWT storage
- ✅ App shell with role-filtered sidebar navigation
- ✅ POS screen: product grid + category filter + order panel
- ✅ Payment modal (cash change calculation, card/ewallet reference)
- ✅ RTK Query with tag-based cache invalidation
- ✅ Redux store (auth, pos, floor, shift, ui slices)

### Pending (Next Phases)
- 🔲 Gaming session timer (Phase 5)
- 🔲 Floor map visual grid (Phase 6)
- 🔲 Inventory management (Phase 6)
- 🔲 Shift management + blind close (Phase 6)
- 🔲 Customer loyalty (Phase 6)
- 🔲 Promo codes (Phase 6)
- 🔲 Reports dashboard (Phase 6)

---

## ⚙️ Configuration

Edit `backend/src/main/resources/application.yml`:

```yaml
app:
  jwt:
    secret: "change-this-in-production"   # Min 32 chars
    access-token-expiry-ms: 900000        # 15 min
    refresh-token-expiry-ms: 604800000    # 7 days

  cors:
    allowed-origins: "http://localhost:5173"

  loyalty:
    points-per-100: 10         # 10 points per 100 EGP
    points-validity-days: 180
```

---

## 🔐 Security Notes

1. **Change the JWT secret** before any production deployment
2. The `activity_logs` table has no DELETE — tamper-proof by design
3. Promo codes use optimistic locking — safe for concurrent usage
4. The gaming timer runs server-side — no client can pause it
5. Discount limits are enforced server-side, not just in the UI

---

## 🐳 Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f postgres

# Reset DB (destructive!)
docker-compose down -v && docker-compose up -d

# Connect to DB
docker exec -it cafe_postgres psql -U cafe_user -d cafe_erp
```
