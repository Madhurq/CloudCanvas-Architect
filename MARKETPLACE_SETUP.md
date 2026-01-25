# Marketplace Feature Setup Guide

## Overview
The marketplace feature allows users to publish, browse, and purchase ready-made AWS architecture designs. Users can sell their architectures (like "Zoom architecture") to other users who can then import and use them in their own projects.

## Features Implemented

### Backend (Complete ✅)

#### 1. Database Schema
Three new tables added to `Backend/src/database/migrate.js`:

- **marketplace_listings**: Stores published architectures
  - Fields: title, description, category, price, region, estimated_monthly_cost, architecture_data (JSONB), tags, downloads, rating, review_count
  - Relationships: belongs to user (seller)

- **marketplace_purchases**: Tracks user purchases
  - Prevents duplicate purchases via UNIQUE constraint (user_id, listing_id)
  - Tracks purchase history for analytics

- **marketplace_reviews**: User reviews and ratings
  - Ratings from 1-5 stars
  - Requires purchase before allowing review
  - Automatically updates listing rating and review_count

#### 2. REST API Endpoints
All endpoints in `Backend/src/routes/marketplaceRoutes.js`:

**Public Endpoints:**
- `GET /api/marketplace` - Browse all listings (supports filtering by category, search, sorting)
- `GET /api/marketplace/:id` - View single listing details

**Protected Endpoints (require authentication):**
- `POST /api/marketplace/publish` - Publish architecture to marketplace
- `PUT /api/marketplace/:id` - Update listing (owner only)
- `DELETE /api/marketplace/:id` - Delete listing (owner only)
- `POST /api/marketplace/:id/purchase` - Purchase/download architecture
- `POST /api/marketplace/:id/review` - Add review (requires purchase)
- `GET /api/marketplace/my/listings` - Get user's published listings

#### 3. Controller Logic
`Backend/src/controllers/marketplaceController.js` includes:
- Ownership verification for all mutations
- Purchase tracking and duplicate prevention
- Rating aggregation system
- Audit logging for all transactions
- Search and filter capabilities
- Error handling and validation

### Frontend (Complete ✅)

#### 1. Components Created

**MarketplaceModal.jsx**
- Browse marketplace listings
- Filter by category (Web App, Serverless, Microservices, AI/ML, etc.)
- Search by keywords
- Sort by downloads, rating, or price
- View listing details (description, author, cost, reviews)
- Purchase/download architectures
- Imports purchased architecture directly to canvas

**PublishToMarketplace.jsx**
- Form to publish current architecture
- Fields: title, description, category, price, tags
- Shows architecture summary (services count, connections, region, cost)
- Validation and error handling
- Success feedback

**Marketplace.css**
- Modern card-based grid layout
- Responsive design (mobile-friendly)
- Hover effects and animations
- Filter controls styling
- Modal layouts
- Form styling

#### 2. Integration with App.jsx
- Added 🛒 Marketplace button in header
- Added 📤 Publish button in header
- State management for modals (showMarketplace, showPublish)
- Modals open/close on button clicks

#### 3. Store Updates
`Frontend/src/store/useStore.js`:
- Added `getTotalMonthlyCost()` method for calculating architecture cost
- Integrated with existing `calculateTotalCost` utility
- Used by PublishToMarketplace for cost estimation

## Setup Instructions

### 1. Install Dependencies (if not already done)

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Database Migration

Run the migration to create marketplace tables:

```bash
cd Backend
npm run migrate
```

Or with Docker:
```bash
docker-compose exec backend npm run migrate
```

### 3. Environment Variables

Ensure your `.env` file in Backend has:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/cloudcanvas
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

### 4. Start the Application

**Option 1: Docker (Recommended)**
```bash
docker-compose up --build
```

**Option 2: Manual Start**
```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

### 5. Testing the Feature

#### Test Publishing:
1. Login to the application
2. Create an architecture on the canvas (add some AWS services and connections)
3. Click "📤 Publish" button in header
4. Fill in the form:
   - Title: "Zoom Video Conferencing Architecture"
   - Description: "Scalable video conferencing system with auto-scaling"
   - Category: "Web Application"
   - Price: 0 (for free) or any amount
   - Tags: "scalable, high-availability, video"
5. Click "Publish to Marketplace"
6. Verify success message

#### Test Browsing/Purchasing:
1. Click "🛒 Marketplace" button in header
2. Browse available listings
3. Use filters:
   - Search for keywords
   - Filter by category
   - Sort by downloads/rating/price
4. Click on a listing card to view details
5. Click "Purchase" or "Get for Free"
6. Verify the architecture is imported to your canvas
7. Check that download count increased

#### Test My Listings:
Use the API endpoint directly:
```bash
GET http://localhost:5000/api/marketplace/my/listings
Authorization: Bearer <your_access_token>
```

#### Test Reviews (after purchasing):
```bash
POST http://localhost:5000/api/marketplace/:listing_id/review
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent architecture, works perfectly!"
}
```

## API Examples

### Publish Architecture
```bash
POST /api/marketplace/publish
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Zoom Video Conferencing Architecture",
  "description": "Production-ready video conferencing system",
  "category": "web-app",
  "price": 29.99,
  "tags": ["video", "scalable", "webrtc"],
  "architecture_data": {
    "nodes": [...],
    "edges": [...],
    "region": "us-east-1",
    "estimated_monthly_cost": 450.00
  }
}
```

### Browse Marketplace
```bash
GET /api/marketplace?category=web-app&search=zoom&sortBy=downloads
```

### Purchase Architecture
```bash
POST /api/marketplace/:listing_id/purchase
Authorization: Bearer <token>
```

## Database Schema Details

### marketplace_listings
```sql
CREATE TABLE marketplace_listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    region VARCHAR(50) NOT NULL,
    estimated_monthly_cost DECIMAL(10, 2),
    architecture_data JSONB NOT NULL,
    tags TEXT[],
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### marketplace_purchases
```sql
CREATE TABLE marketplace_purchases (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(buyer_id, listing_id)
);
```

### marketplace_reviews
```sql
CREATE TABLE marketplace_reviews (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, listing_id)
);
```

## Troubleshooting

### Issue: "Cannot find package 'pg'"
**Solution:** Install backend dependencies:
```bash
cd Backend
npm install
```

### Issue: "Failed to fetch marketplace listings"
**Solution:** 
1. Check that backend is running on port 5000
2. Verify CORS is configured correctly
3. Check database connection
4. Check browser console for detailed error

### Issue: "Publishing failed"
**Solution:**
1. Ensure you're logged in (check accessToken in localStorage)
2. Verify you have at least one node on canvas
3. Check browser console and backend logs for errors
4. Verify database tables exist (run migration)

### Issue: Price not showing correctly
**Solution:** Ensure price is a number, not a string. The form input type is "number".

## Next Steps / Future Enhancements

1. **Payment Integration**: Integrate Stripe/PayPal for paid listings
2. **Preview Images**: Add thumbnail generation for architectures
3. **Categories Management**: Admin panel for managing categories
4. **Reporting System**: Allow users to report inappropriate listings
5. **Seller Dashboard**: Enhanced analytics for sellers (revenue, downloads over time)
6. **Featured Listings**: Promote popular architectures on homepage
7. **Architecture Versioning**: Allow sellers to update architectures
8. **Bulk Operations**: Import multiple architectures at once
9. **Favorites/Bookmarks**: Let users save listings for later
10. **Social Features**: Follow sellers, get notifications for new listings

## Files Modified/Created

### Backend
- ✅ `Backend/src/database/migrate.js` - Added 3 new tables
- ✅ `Backend/src/controllers/marketplaceController.js` - NEW FILE (8 endpoints)
- ✅ `Backend/src/routes/marketplaceRoutes.js` - NEW FILE (REST routes)
- ✅ `Backend/src/server.js` - Added marketplace routes

### Frontend
- ✅ `Frontend/src/components/MarketplaceModal.jsx` - NEW FILE (browse/purchase)
- ✅ `Frontend/src/components/PublishToMarketplace.jsx` - NEW FILE (publish form)
- ✅ `Frontend/src/styles/Marketplace.css` - NEW FILE (styling)
- ✅ `Frontend/src/App.jsx` - Added marketplace buttons and modals
- ✅ `Frontend/src/store/useStore.js` - Added getTotalMonthlyCost method

## Support

If you encounter any issues:
1. Check this guide's troubleshooting section
2. Review backend logs for error messages
3. Check browser console for frontend errors
4. Verify all dependencies are installed
5. Ensure database migration completed successfully

---

**Status**: ✅ Backend Complete | ✅ Frontend Complete | ⏳ Testing Required

**Ready for Testing**: Yes - All code is implemented and integrated
