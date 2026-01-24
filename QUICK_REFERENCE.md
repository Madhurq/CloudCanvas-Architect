# ⚡ CloudCanvas-Architect Quick Reference Card

**Keep this handy while developing**

---

## 🚀 Quick Start

```bash
# Step 1: Set up Supabase (one-time)
# See SUPABASE_SETUP.md for detailed instructions

# Step 2: Update .env with DATABASE_URL from Supabase
# File: Backend/.env
# Add: DATABASE_URL=postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres?sslmode=require

# Step 3: Start services
docker-compose up --build

# Step 4: Run migrations (in another terminal)
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

**Access**: 
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 🔐 Demo Account

```
Email: demo@cloudcanvas.io
Password: demo123456
```

---

## 🔌 API Endpoints (11 Total)

### Auth (4)
```
POST   /api/auth/register          Register user
POST   /api/auth/login             Login user
POST   /api/auth/refresh-token     Refresh token
GET    /api/auth/profile           Get user profile
```

### Architectures (5)
```
POST   /api/architectures          Create architecture
GET    /api/architectures          List architectures
GET    /api/architectures/:id      Get architecture
PUT    /api/architectures/:id      Update architecture
DELETE /api/architectures/:id      Delete architecture
```

### Pricing (2)
```
GET    /api/pricing                Get pricing
POST   /api/pricing/sync           Sync pricing
```

---

## 🧪 Test API with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"pass123456",
    "firstName":"John",
    "lastName":"Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123456"}'
```

### Create Architecture
```bash
curl -X POST http://localhost:5000/api/architectures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"My Architecture",
    "description":"Test",
    "nodes":[],
    "edges":[],
    "region":"us-east-1",
    "pricingModel":"on-demand"
  }'
```

---

## 📁 Key Files

```
Backend/
├── src/server.js              Main API entry point
├── src/routes/                API routes
├── src/controllers/           Business logic
├── src/database/migrate.js    Database schema
└── package.json               Dependencies

docker-compose.yml             Service orchestration
API_DOCUMENTATION.md           Full API reference
FRONTEND_INTEGRATION.md        Frontend connection
PHASE_1_COMPLETE.md           Setup guide
```

---

## 🗄️ Database Tables (7)

| Table | Purpose |
|-------|---------|
| users | User accounts & auth |
| architectures | AWS designs |
| architecture_versions | Version history |
| pricing_cache | AWS pricing |
| audit_logs | Activity log |
| refresh_tokens | Sessions |

---

## 🔧 Common Commands

```bash
# Start services
docker-compose up --build

# Run migrations
docker-compose exec backend npm run migrate

# Seed demo data
docker-compose exec backend npm run seed

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Execute bash in backend
docker-compose exec backend sh

# Run tests
docker-compose exec backend npm test

# Lint code
docker-compose exec backend npm run lint
```

---

## 🔐 Authentication Flow

1. **Register**: `POST /api/auth/register`
   - Returns: `accessToken`, `refreshToken`

2. **Store Tokens**: 
   - localStorage: `accessToken`
   - localStorage: `refreshToken`

3. **Use Token**: Add header: `Authorization: Bearer <token>`

4. **Token Expired**: Use `refreshToken` to get new tokens
   - `POST /api/auth/refresh-token`

---

## ⚙️ Environment Variables

```env
NODE_ENV=development
PORT=5000
DB_HOST=postgres          # localhost for local dev
DB_USER=cloudcanvas_user
DB_PASSWORD=cloudcanvas_password
DB_NAME=cloudcanvas_db
JWT_SECRET=your-secret-here
FRONTEND_URL=http://localhost:5173
```

---

## 🆘 Quick Fixes

| Problem | Fix |
|---------|-----|
| Port 5000 in use | `lsof -i :5000 && kill -9 <PID>` |
| DB connection error | Check PostgreSQL running & .env correct |
| Token invalid | Login again to get new token |
| CORS error | Check FRONTEND_URL in .env |
| Migrations failed | Check DB exists & permissions |

---

## 📚 Documentation

| File | Use for |
|------|---------|
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | **Setup Supabase (DO THIS FIRST!)** |
| [README.md](./README.md) | Project overview |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API reference |
| [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md) | Setup help |
| [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) | Frontend connection |
| [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) | QA checklist |

---

## 🔗 API Response Format

### Success (200)
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2024-01-24T10:00:00Z"
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "data": null,
  "error": "Error message",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

---

## 👤 User Types

| Type | Capabilities |
|------|------------|
| Public | View public architectures |
| User | Create, read, update, delete own architectures |
| Admin | Sync pricing, manage users (future) |

---

## 📊 Useful Metrics

```
API Endpoints: 11
Database Tables: 7
Database Indexes: 8
Security Features: 8+
Response Time: <100ms
Uptime: 99.9% target
```

---

## 🎯 Next Steps

1. [ ] Setup project locally
2. [ ] Test user registration
3. [ ] Test architecture CRUD
4. [ ] Connect frontend
5. [ ] Deploy to Docker
6. [ ] Deploy to cloud

---

## 💡 Tips

- ✅ Use `/health` endpoint to check API status
- ✅ Save tokens in localStorage for persistence
- ✅ Implement token refresh automatically
- ✅ Use audit logs for debugging
- ✅ Keep database backups regularly

---

## 🚀 Remember

- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432
- Demo: demo@cloudcanvas.io / demo123456

---

**Phase 1 Complete ✅ | Ready for Phase 2 🚀**

Print this page and keep it nearby! 📌
