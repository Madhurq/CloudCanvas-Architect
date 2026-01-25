# Marketplace Reviews Feature - Complete Usage Guide

## 📌 Overview

The marketplace now includes a **complete review system** where users can rate and review architectures they've purchased. Reviews help maintain quality and trust in the marketplace.

---

## 🗄️ Database Table Structure

### `marketplace_reviews` Table
```sql
CREATE TABLE marketplace_reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(listing_id, user_id)
);
```

**Key Points:**
- ⭐ **rating**: 1-5 stars only
- 💬 **comment**: Optional review text
- 🔒 **UNIQUE constraint**: Each user can only review a listing once (but can update)
- 🗑️ Cascading delete: Reviews deleted when listing is deleted

---

## 🔌 API Endpoints

### Add/Update a Review
```
POST /api/marketplace/:id/review
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "rating": 5,
  "comment": "Excellent architecture! Easy to deploy and very scalable."
}

Response:
{
  "success": true,
  "data": {
    "message": "Review added successfully"
  }
}
```

**Requirements:**
- ✅ Must be authenticated (Bearer token required)
- ✅ Must have purchased the listing first
- ✅ Rating must be 1-5
- ✅ Comment is optional

### Review Validation
Before submitting a review, the system checks:
1. User is logged in ✓
2. User has purchased this listing ✓
3. Rating is between 1-5 ✓

---

## 🎯 How It Works - Step by Step

### Step 1: Browse Marketplace
1. Click **🛒 Marketplace** button in header
2. Search/filter for an architecture
3. Click on an architecture card to view details

### Step 2: View Rating & Reviews Count
In the listing details, you'll see:
```
⭐ 4.5 (12 reviews)    <-- Average rating from all reviews
📥 234 downloads       <-- Total downloads
```

### Step 3: Purchase Architecture
1. Click **"Purchase for $XX"** or **"Get for Free"** button
2. Architecture imported to canvas
3. Success message confirms purchase

### Step 4: Submit a Review
After purchasing:
```javascript
// Frontend API Call
const response = await fetch(
  `${API_BASE}/api/marketplace/${listingId}/review`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rating: 5,        // 1-5 stars
      comment: 'Great!' // Optional
    })
  }
);
```

### Step 5: View Updated Ratings
- Listing rating automatically recalculates
- Review count updates
- Your review reflects in the database

---

## 💻 Frontend Implementation

### Current Status
The review **database infrastructure is fully implemented** on the backend:
- ✅ Database table created
- ✅ `addReview` controller function written
- ✅ API endpoint registered (`POST /api/marketplace/:id/review`)
- ✅ Purchase verification (must buy before review)
- ✅ Automatic rating recalculation

### What Needs Frontend Implementation
To add a review submission UI, add this to [MarketplaceModal.jsx](Frontend/src/components/MarketplaceModal.jsx):

```jsx
// Add these state variables at the top of the component
const [showReviewForm, setShowReviewForm] = useState(false);
const [userReview, setUserReview] = useState({ rating: 5, comment: '' });

// Add this function to handle review submission
const handleSubmitReview = async (listingId) => {
  if (!accessToken) {
    alert('Please login to submit a review');
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/marketplace/${listingId}/review`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userReview),
      }
    );

    const data = await response.json();
    
    if (data.success) {
      alert('Review submitted successfully!');
      setShowReviewForm(false);
      setUserReview({ rating: 5, comment: '' });
      // Optionally refresh listing details
      await handleViewDetails(listingId);
    } else {
      alert(data.error || 'Failed to submit review');
    }
  } catch (error) {
    console.error('Review submission error:', error);
    alert('Failed to submit review');
  }
};

// Add this UI in the listing details section (after purchase button)
{showReviewForm && (
  <div className="review-form">
    <h4>Leave a Review</h4>
    <div className="rating-selector">
      <label>Rating:</label>
      <select
        value={userReview.rating}
        onChange={(e) => 
          setUserReview({ ...userReview, rating: parseInt(e.target.value) })
        }
      >
        <option value={1}>⭐ 1 - Poor</option>
        <option value={2}>⭐⭐ 2 - Fair</option>
        <option value={3}>⭐⭐⭐ 3 - Good</option>
        <option value={4}>⭐⭐⭐⭐ 4 - Very Good</option>
        <option value={5}>⭐⭐⭐⭐⭐ 5 - Excellent</option>
      </select>
    </div>
    <textarea
      placeholder="Share your experience (optional)"
      value={userReview.comment}
      onChange={(e) => 
        setUserReview({ ...userReview, comment: e.target.value })
      }
      rows="4"
    />
    <button onClick={() => handleSubmitReview(selectedListing.id)}>
      Submit Review
    </button>
    <button onClick={() => setShowReviewForm(false)}>
      Cancel
    </button>
  </div>
)}

// Add button to show review form (in listing-actions section)
{hasPurchased && (
  <button 
    className="btn btn-secondary"
    onClick={() => setShowReviewForm(!showReviewForm)}
  >
    {showReviewForm ? 'Hide Review Form' : '✍️ Write a Review'}
  </button>
)}
```

---

## 📊 Review System Features

### Automatic Rating Calculation
```sql
-- Backend automatically calculates:
SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
FROM marketplace_reviews
WHERE listing_id = $1
```

### Backend Update Logic
When a review is submitted:
1. Insert/update review in `marketplace_reviews` table
2. Calculate average rating
3. Update `marketplace_listings` table with new `rating` and `review_count`
4. Frontend displays updated rating immediately

### One Review Per User Per Listing
- Users can only submit ONE review per listing
- Submitting again **updates** the existing review (ON CONFLICT clause)
- Review can be edited by submitting again with new rating/comment

---

## 🔒 Security & Validation

### Backend Checks
```javascript
// 1. User must be authenticated
if (!req.user.userId) → Reject

// 2. User must have purchased the listing
SELECT FROM marketplace_purchases 
WHERE listing_id = $1 AND buyer_id = $2
If empty → Reject with 403 Forbidden

// 3. Rating must be 1-5
CHECK (rating BETWEEN 1 AND 5) → Database constraint

// 4. One review per user
UNIQUE(listing_id, user_id) → Prevents duplicates
```

---

## 📈 How Ratings Impact Marketplace

### Displayed Locations
1. **Marketplace Grid** - Shows star rating on each card
   ```
   ⭐ 4.5 (Shows on card)
   ```

2. **Listing Details** - Shows rating with review count
   ```
   ⭐ 4.5 (12 reviews)
   ```

3. **Sorting Option** - Users can sort by "Highest Rated"
   ```
   Sort By: [Highest Rated ▼]
   ```

### Rating Visibility
- Reviews are tied to listings (not anonymized)
- Rating is calculated from all reviews
- Users see total number of reviews
- Comments are stored but need frontend to display

---

## 📝 Example Workflow

### User Journey
```
1. Alice browses marketplace
   ↓
2. Finds "E-Commerce Platform" architecture ($49.99)
   Shows: ⭐ 4.2 (18 reviews)
   ↓
3. Clicks "View Details"
   ↓
4. Reads description and clicks "Purchase for $49.99"
   ↓
5. Architecture imported to canvas
   Success message: "Architecture imported successfully!"
   ↓
6. Alice tests the architecture on her canvas
   ↓
7. Alice clicks "✍️ Write a Review"
   ↓
8. Selects 5-star rating
   Writes: "Perfect! Saved me hours of design time."
   ↓
9. Clicks "Submit Review"
   Success: "Review submitted successfully!"
   ↓
10. Listing now shows:
    ⭐ 4.25 (19 reviews) ← Updated!
```

---

## 🛠️ API Testing

### Using cURL
```bash
# Test adding a review
curl -X POST http://localhost:5000/api/marketplace/1/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent architecture!"
  }'
```

### Using Postman
1. **Method:** POST
2. **URL:** `http://localhost:5000/api/marketplace/1/review`
3. **Headers:** 
   - `Authorization: Bearer YOUR_TOKEN`
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "rating": 4,
     "comment": "Very good, easy to deploy"
   }
   ```

---

## ❓ FAQ

### Q: Can I review without purchasing?
**A:** No. You must purchase first. The backend checks `marketplace_purchases` table before allowing review.

### Q: Can I update my review?
**A:** Yes! Submit another review and it will update your existing review (due to UNIQUE constraint and ON CONFLICT).

### Q: Can I delete my review?
**A:** Currently not implemented. You would need to submit a DELETE endpoint or set rating to NULL via UPDATE.

### Q: Does comment text have a length limit?
**A:** Comment uses TEXT type (unlimited), but frontend should enforce reasonable limits (e.g., 500 chars).

### Q: Are reviews visible to anonymous users?
**A:** Yes, reviews/ratings are public once submitted. Only the ability to submit/edit is restricted to authenticated users.

### Q: What if I give a 1-star review, will seller know it's me?
**A:** Reviews are tied to user_id in the database, so sellers can see who reviewed. Consider adding privacy options if needed.

---

## 🚀 Next Steps

1. **Implement Frontend Review Form** - Add review submission UI to `MarketplaceModal.jsx`
2. **Display Reviews List** - Show individual reviews with user names in listing details
3. **Add Review Moderation** - Option to report inappropriate reviews
4. **Seller Response** - Allow sellers to respond to reviews
5. **Review Analytics** - Dashboard showing review trends for sellers

---

## 📚 Related Files

- **Backend Controller:** [Backend/src/controllers/marketplaceController.js](Backend/src/controllers/marketplaceController.js#L329)
- **Database Schema:** [Backend/src/database/migrate.js](Backend/src/database/migrate.js#L106)
- **API Routes:** [Backend/src/routes/marketplaceRoutes.js](Backend/src/routes/marketplaceRoutes.js)
- **Frontend Component:** [Frontend/src/components/MarketplaceModal.jsx](Frontend/src/components/MarketplaceModal.jsx)
- **Styles:** [Frontend/src/styles/Marketplace.css](Frontend/src/styles/Marketplace.css)
