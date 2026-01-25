# 🎯 Reviews System - Visual Architecture & Flow Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDCANVAS MARKETPLACE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FRONTEND (React)                    BACKEND (Node.js)      │
│  ┌──────────────────┐                ┌──────────────────┐  │
│  │ MarketplaceModal │                │ Route Handler    │  │
│  ├──────────────────┤                ├──────────────────┤  │
│  │ • Browse listings│      ←→        │ GET /api/        │  │
│  │ • View details   │      ←→        │ marketplace/:id  │  │
│  │ • Read reviews   │      ←→        │                  │  │
│  │ • Write reviews  │      ←→        │ POST /api/       │  │
│  │                  │      ←→        │ marketplace/:id/ │  │
│  │ STATES:          │                │ review           │  │
│  │ • reviews []     │      ←→        │                  │  │
│  │ • reviewData {}  │      ←→        │ GET /api/        │  │
│  │ • loading states │                │ marketplace/:id/ │  │
│  └──────────────────┘                │ reviews          │  │
│           │                          │                  │  │
│           └──────────────────────────┴──────────────────┘  │
│                          NETWORK                           │
│                   (HTTPS JSON Requests)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────────┐
        │        POSTGRESQL DATABASE              │
        ├─────────────────────────────────────────┤
        │                                         │
        │  marketplace_listings                   │
        │  ├─ id, title, price, rating            │
        │  ├─ review_count, downloads             │
        │  └─ user_id, architecture_id            │
        │                                         │
        │  marketplace_reviews   ← FOCUS HERE    │
        │  ├─ id, listing_id, user_id             │
        │  ├─ rating (1-5), comment               │
        │  ├─ created_at                          │
        │  └─ UNIQUE(listing_id, user_id)         │
        │                                         │
        │  users                                  │
        │  ├─ id, first_name, last_name           │
        │  └─ email                               │
        │                                         │
        │  marketplace_purchases                  │
        │  ├─ buyer_id, listing_id                │
        │  └─ purchase verification               │
        │                                         │
        └─────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
READING REVIEWS (Public - No Auth Needed)
═════════════════════════════════════════════════════════════

1. User Clicks Architecture
   │
   ├─→ Frontend: handleViewDetails(listingId)
   │   └─→ Fetch listing details
   │       └─→ Backend: GET /api/marketplace/:id
   │           └─→ Database: SELECT listing WITH ratings
   │               └─→ Response: { listing, rating, review_count }
   │
   └─→ Frontend: fetchReviews(listingId)  ← AUTO-CALLED
       └─→ Fetch all reviews
           └─→ Backend: GET /api/marketplace/:id/reviews
               └─→ Database:
                   │
                   SELECT mr.id, mr.rating, mr.comment,
                          mr.created_at,
                          u.first_name, u.last_name
                   FROM marketplace_reviews mr
                   JOIN users u ON mr.user_id = u.id
                   WHERE mr.listing_id = :id
                   ORDER BY created_at DESC
               │
               └─→ Format: { reviews: [ {...}, {...} ] }
                   │
                   └─→ Frontend: setReviews(data.reviews)
                       │
                       └─→ Display in UI
                           └─→ User sees all reviews! 👀


WRITING REVIEWS (Protected - Auth Required)
═════════════════════════════════════════════════════════════

1. User Clicks "Write Review" After Purchase
   │
   ├─→ Form Opens
   │   ├─ Rating dropdown (1-5 stars)
   │   └─ Comment textarea (optional)
   │
   └─→ User Submits
       │
       ├─→ Frontend: handleSubmitReview(listingId)
       │   │
       │   ├─ Validates: rating selected?
       │   │
       │   └─→ POST /api/marketplace/:id/review
       │       Headers: Authorization Bearer {token}
       │       Body: { rating, comment }
       │
       └─→ Backend: addReview()
           │
           ├─ Verify auth: Is user logged in?
           │
           ├─ Check purchase: Did user buy this?
           │   └─→ SELECT FROM marketplace_purchases
           │       WHERE listing_id = :id AND buyer_id = user_id
           │
           ├─ Validate rating: Is it 1-5?
           │
           ├─ Insert/Update review:
           │   │
           │   INSERT INTO marketplace_reviews
           │   (listing_id, user_id, rating, comment)
           │   VALUES (:id, :user_id, :rating, :comment)
           │   ON CONFLICT (listing_id, user_id)
           │   DO UPDATE SET rating=:rating, comment=:comment
           │
           ├─ Recalculate rating:
           │   │
           │   SELECT AVG(rating), COUNT(*)
           │   FROM marketplace_reviews
           │   WHERE listing_id = :id
           │
           ├─ Update listing:
           │   │
           │   UPDATE marketplace_listings
           │   SET rating = :avg, review_count = :count
           │   WHERE id = :id
           │
           └─→ Response: { success: true }
               │
               └─→ Frontend:
                   ├─ Show: "✅ Review submitted!"
                   ├─ Close form
                   ├─ Reset form data
                   └─→ handleViewDetails() ← Refresh everything!
                       └─→ fetchReviews() ← Reload reviews!
                           └─→ User sees updated rating & new review! ✨
```

---

## 🔄 Complete Request/Response Cycle

### **Get Reviews Request**
```
HTTP/1.1 GET /api/marketplace/15/reviews

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "listing_id": 15,
        "rating": 5,
        "comment": "Excellent architecture!",
        "created_at": "2026-01-20T10:30:00Z",
        "user_name": "John Smith"
      },
      {
        "id": 2,
        "listing_id": 15,
        "rating": 4,
        "comment": "Good but needs docs",
        "created_at": "2026-01-18T14:20:00Z",
        "user_name": "Maria Garcia"
      }
    ]
  }
}
```

### **Add Review Request**
```
HTTP/1.1 POST /api/marketplace/15/review
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "rating": 5,
  "comment": "Outstanding work!"
}

RESPONSE 200 OK:
{
  "success": true,
  "data": {
    "message": "Review added successfully"
  }
}
```

---

## 🎯 Component Hierarchy

```
App
│
├─ MarketplaceModal (Main Component)
│  │
│  ├─ state: listings
│  ├─ state: selectedListing
│  ├─ state: reviews ← NEW!
│  ├─ state: reviewsLoading ← NEW!
│  ├─ state: showReviewForm
│  ├─ state: reviewData
│  ├─ state: reviewLoading
│  │
│  ├─ function: fetchListings()
│  ├─ function: handleViewDetails()
│  ├─ function: fetchReviews() ← NEW!
│  ├─ function: handlePurchase()
│  ├─ function: handleSubmitReview()
│  │
│  └─ render:
│     │
│     ├─ Filters Section
│     │  ├─ Search input
│     │  ├─ Category select
│     │  └─ Sort select
│     │
│     ├─ Listings Grid (OR Details View)
│     │  │
│     │  └─ When selectedListing:
│     │     │
│     │     ├─ Listing Header
│     │     │  ├─ Title
│     │     │  ├─ Rating & Review Count
│     │     │  └─ Price
│     │     │
│     │     ├─ Listing Details
│     │     │  ├─ Description
│     │     │  ├─ Category
│     │     │  ├─ Region
│     │     │  ├─ Cost
│     │     │  ├─ Author
│     │     │  └─ Tags
│     │     │
│     │     ├─ Action Buttons
│     │     │  ├─ Purchase Button
│     │     │  └─ Write Review Button
│     │     │
│     │     ├─ Review Form (if showReviewForm)
│     │     │  ├─ Rating Dropdown
│     │     │  ├─ Comment Textarea
│     │     │  └─ Buttons
│     │     │
│     │     └─ Reviews Section ← NEW!
│     │        ├─ Section Title
│     │        ├─ Loading State (if reviewsLoading)
│     │        ├─ Empty State (if no reviews)
│     │        └─ Reviews List
│     │           └─ Review Items (map reviews)
│     │              ├─ Rating
│     │              ├─ Reviewer Name
│     │              ├─ Date
│     │              └─ Comment
│     │
│     └─ Listings Grid (when not viewing)
│        └─ Review Cards
│           ├─ Title & Price
│           ├─ Description
│           └─ Meta (rating, downloads, category)
```

---

## 📈 State Management Flow

```
Initial State:
reviews = []
reviewsLoading = false

User clicks architecture:
│
├─→ handleViewDetails(listingId)
│   └─→ fetchListingDetails()
│   │   └─→ setSelectedListing(data)
│   │
│   └─→ fetchReviews(listingId)
│       ├─→ setReviewsLoading(true)
│       │
│       └─→ API call
│           └─→ Response
│               └─→ setReviews(data.reviews)
│               └─→ setReviewsLoading(false)
│
User sees reviews in UI!

User submits review:
│
├─→ handleSubmitReview()
│   ├─→ setReviewLoading(true)
│   │
│   ├─→ API call
│   │   └─→ Success
│   │       └─→ Show alert
│   │       └─→ setReviewData({...reset})
│   │       └─→ setShowReviewForm(false)
│   │
│   └─→ handleViewDetails() ← REFRESH!
│       └─→ fetchReviews() ← RELOAD!
│           └─→ setReviews(updatedData)
│
User sees new review in list!
```

---

## 🔐 Security Flow

```
READING REVIEWS:
┌─────────────┐
│ GET Request │  (No auth needed)
├─────────────┤
│ Public API  │  (Anyone can call)
├─────────────┤
│ Database    │  (Returns public data)
│ (name, rating, comment, date)
│             │  (Does NOT return email, ID)
└─────────────┘

WRITING REVIEWS:
┌─────────────┐
│ POST Request│  (Auth token required)
├─────────────┤
│ Verify JWT  │  (Check if valid token)
│ Get user_id │  (Extract from token)
├─────────────┤
│ Check DB    │  (Verify purchase)
│ marketplace_│  (buyer_id = user_id)
│ purchases   │
├─────────────┤
│ Validate    │  (Rating 1-5?)
│ Data        │  (Max 500 chars?)
├─────────────┤
│ Save review │  (Insert to database)
│ Update      │  (Recalculate rating)
│ Listing     │  (Update review_count)
└─────────────┘
```

---

## 🎬 Animation & State Transitions

```
REVIEWS SECTION LIFECYCLE:

Hidden
  │
  └─→ User clicks listing
      └─→ setSelectedListing(listing)
          └─→ Reviews section renders
              ├─→ setReviewsLoading(true)
              │   └─→ Show: "Loading reviews..."
              │
              └─→ API request
                  │
                  ├─→ Response success
                  │   └─→ setReviews(data)
                  │   └─→ setReviewsLoading(false)
                  │       └─→ Show: Reviews list! ✨
                  │
                  └─→ No reviews
                      └─→ setReviews([])
                      └─→ setReviewsLoading(false)
                          └─→ Show: "No reviews yet"


REVIEW FORM LIFECYCLE:

Hidden
  │
  └─→ User clicks "Write a Review"
      └─→ setShowReviewForm(true)
          └─→ Form appears (smooth fade)
              └─→ User fills form
                  └─→ User clicks Submit
                      └─→ setReviewLoading(true)
                      │   └─→ Button: "⏳ Submitting..."
                      │
                      └─→ API request
                          │
                          ├─→ Success
                          │   └─→ Alert: "✅ Submitted!"
                          │   └─→ setReviewData({...reset})
                          │   └─→ setShowReviewForm(false)
                          │   └─→ handleViewDetails() ← Refresh
                          │
                          └─→ Error
                              └─→ Alert: Error message
                              └─→ Form stays open
                              └─→ User can retry
```

---

## 📊 Database Relationships

```
users
├─ id (PK)
├─ first_name
├─ last_name
└─ email
  │
  ├─← marketplace_listings.user_id (seller)
  └─← marketplace_reviews.user_id (reviewer)


marketplace_listings
├─ id (PK)
├─ user_id (FK) ──→ users
├─ architecture_id (FK) ──→ architectures
├─ title
├─ price
├─ rating (calculated from reviews)
└─ review_count (calculated from reviews)
  │
  └─← marketplace_reviews.listing_id


marketplace_reviews
├─ id (PK)
├─ listing_id (FK) ──→ marketplace_listings
├─ user_id (FK) ──→ users
├─ rating (1-5)
├─ comment
├─ created_at
└─ UNIQUE(listing_id, user_id)


marketplace_purchases
├─ id (PK)
├─ listing_id (FK) ──→ marketplace_listings
├─ buyer_id (FK) ──→ users
├─ purchase_date
└─ UNIQUE(listing_id, buyer_id)
    └─ (Used to verify purchase before allowing review)
```

---

## 🎯 Complete Request Timeline

```
T=0s   User clicks architecture card
T=0s   Browser: GET /api/marketplace/:id
T=0.1s Server: Query database, return listing details
T=0.2s Browser: GET /api/marketplace/:id/reviews (simultaneous)
T=0.2s Display: Title, price, description
T=0.3s Server: Query reviews with user names
T=0.4s Server: Return array of reviews
T=0.5s Browser: Display reviews in UI
T=0.5s User reads all reviews ✨

T=2m   User reads reviews
T=2m   User decides and clicks Purchase
T=2m   Browser: POST /api/marketplace/:id/purchase
T=2.2s Server: Verify token, create purchase record
T=2.3s Server: Return architecture data
T=2.4s Browser: Import architecture, show success
T=2.5s Display: Close modal, show architecture

T=2h   User uses architecture, decides to review
T=2h   User clicks "Write a Review"
T=2h   Display: Review form opens
T=2.1m User selects rating and types comment
T=3m   User clicks Submit
T=3m   Browser: POST /api/marketplace/:id/review
T=3.2s Server: Verify auth, check purchase
T=3.3s Server: Save review, recalculate rating
T=3.4s Browser: Show "✅ Submitted!"
T=3.5s Browser: GET /api/marketplace/:id/reviews (refresh)
T=3.7s Server: Return updated reviews list
T=3.8s Browser: Update reviews display
T=3.8s User's review appears in list! ✨

T=3.9s Next user opens same listing
T=4s   Browser: GET /api/marketplace/:id/reviews
T=4.2s Displays: All reviews INCLUDING new one!
T=4.2s Next user sees previous user's feedback! 🔄
```

---

## ✨ Features Summary

```
╔════════════════════════════════════════════════════════════╗
║         COMPLETE REVIEWS SYSTEM ARCHITECTURE              ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Read Reviews (Public)          Write Reviews (Protected) ║
║  ├─ No auth required            ├─ Auth required         ║
║  ├─ See all reviews             ├─ Must have purchased   ║
║  ├─ Show names & dates          ├─ Rate 1-5 stars       ║
║  ├─ Display comments            ├─ Optional comment     ║
║  └─ Auto-update on new reviews  ├─ Update existing      ║
║                                 └─ Auto-refresh ratings ║
║                                                            ║
║  Database Storage               API Endpoints            ║
║  ├─ marketplace_reviews table   ├─ GET /reviews (public)║
║  ├─ Store rating, comment       ├─ POST /review (auth)  ║
║  ├─ Join with users for names   └─ Auto rating calc     ║
║  ├─ UNIQUE constraint (1 per user)                      ║
║  └─ Indexed by listing_id & date                        ║
║                                                            ║
║  Frontend UI                    Backend Processing       ║
║  ├─ Reviews list component      ├─ Query optimization   ║
║  ├─ Loading states              ├─ User verification    ║
║  ├─ Empty state                 ├─ Purchase validation  ║
║  ├─ Scrollable section          ├─ Rating calculation   ║
║  ├─ Real-time updates           └─ Response formatting  ║
║  └─ Responsive design                                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

**Complete reviews system fully implemented and documented! 🎉**
