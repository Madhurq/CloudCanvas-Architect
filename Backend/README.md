# CloudCanvas-Architect Backend

Enterprise-grade Node.js backend for AWS architecture design and cost calculation tool.

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose (optional)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database**
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

Server will be available at `http://localhost:5000`

## Database Schema

### Users
- Authentication and profile management
- Tracks user roles and organization

### Architectures
- User-designed AWS architecture blueprints
- Stores node/edge data and configurations
- Supports templates and sharing

### Architecture Versions
- Version control for architecture changes
- Track change history and rollback capability

### Pricing Cache
- AWS service pricing by region
- Cached pricing data with TTL

### Audit Logs
- Compliance and security tracking
- Track all user actions and changes

### Refresh Tokens
- JWT refresh token management
- Token revocation support

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get user profile

### Architectures
- `POST /api/architectures` - Create architecture
- `GET /api/architectures` - List user architectures
- `GET /api/architectures/:id` - Get architecture details
- `PUT /api/architectures/:id` - Update architecture
- `DELETE /api/architectures/:id` - Delete architecture

### Pricing
- `GET /api/pricing` - Get pricing data
- `POST /api/pricing/sync` - Sync AWS pricing (admin)

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed initial data
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Environment Variables

See `.env.example` for all available configuration options.

## Security

- Password hashing with bcryptjs
- JWT token-based authentication
- CORS and Helmet security headers
- Input validation and sanitization
- Audit logging for compliance

## Architecture

```
Backend/
├── src/
│   ├── config/          # Configuration files
│   ├── database/        # Migrations and seeds
│   ├── routes/          # API route definitions
│   ├── controllers/     # Business logic
│   ├── middleware/      # Express middleware
│   ├── utils/           # Helper functions
│   └── server.js        # Express app entry point
├── package.json
├── Dockerfile
└── .env.example
```

## Development Workflow

1. Create database schema changes in migrations
2. Update controllers for business logic
3. Add routes for new endpoints
4. Test with curl or Postman
5. Commit and push to main branch

## Next Steps

- [ ] Integrate AWS Pricing API
- [ ] Add TypeScript support
- [ ] Implement caching layer (Redis)
- [ ] Add API documentation (Swagger)
- [ ] Setup CI/CD pipeline
- [ ] Add comprehensive test coverage
