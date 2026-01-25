import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import '../styles/Marketplace.css';

const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

const MarketplaceModal = ({ isOpen, onClose }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [filter, setFilter] = useState({ category: '', search: '', sortBy: 'created_at' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { importArchitecture, accessToken } = useStore();

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.search) params.append('search', filter.search);
      params.append('sortBy', filter.sortBy);
      
      const response = await fetch(`${API_BASE}/api/marketplace?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setListings(data.data.listings || []);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace listings:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isOpen) {
      fetchListings();
    }
  }, [isOpen, fetchListings]);

  const handleViewDetails = async (listingId) => {
    try {
      const response = await fetch(`${API_BASE}/api/marketplace/${listingId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedListing(data.data.listing);
        // Fetch reviews for this listing
        await fetchReviews(listingId);
      }
    } catch (error) {
      console.error('Failed to fetch listing details:', error);
    }
  };

  const fetchReviews = async (listingId) => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`${API_BASE}/api/marketplace/${listingId}/reviews`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Reviews data:', data.data.reviews); // Debug log
        setReviews(data.data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handlePurchase = async (listingId) => {
    if (!accessToken) {
      alert('Please login to purchase architectures');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/marketplace/${listingId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success && data.data?.architecture) {
        try {
          importArchitecture(data.data.architecture);
          alert('Architecture imported successfully!');
          setSelectedListing(null);
          onClose();
        } catch (importError) {
          console.error('Import error:', importError);
          alert(`Failed to import architecture: ${importError.message}`);
        }
      } else {
        alert(data.error || 'Purchase failed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const handleSubmitReview = async (listingId) => {
    if (!accessToken) {
      alert('Please login to submit a review');
      return;
    }

    if (!reviewData.rating) {
      alert('Please select a rating');
      return;
    }

    try {
      setReviewLoading(true);
      const response = await fetch(`${API_BASE}/api/marketplace/${listingId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: parseInt(reviewData.rating),
          comment: reviewData.comment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Review submitted successfully!');
        setReviewData({ rating: 5, comment: '' });
        setShowReviewForm(false);
        // Refresh listing details and reviews
        await handleViewDetails(listingId);
      } else {
        alert(data.error || 'Failed to submit review. Make sure you purchased this architecture first.');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content marketplace-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🛒 Architecture Marketplace</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body marketplace-body">
          {/* Filters */}
          <div className="marketplace-filters">
            <input
              type="text"
              placeholder="Search architectures..."
              className="marketplace-search"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
            
            <select
              className="marketplace-filter-select"
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="web-app">Web Application</option>
              <option value="serverless">Serverless</option>
              <option value="microservices">Microservices</option>
              <option value="data-analytics">Data & Analytics</option>
              <option value="ai-ml">AI/ML</option>
              <option value="gaming">Gaming</option>
              <option value="iot">IoT</option>
              <option value="other">Other</option>
            </select>

            <select
              className="marketplace-filter-select"
              value={filter.sortBy}
              onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
            >
              <option value="created_at">Newest</option>
              <option value="downloads">Most Downloaded</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Price</option>
            </select>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="marketplace-loading">Loading...</div>
          ) : selectedListing ? (
            <div className="listing-details">
              <button className="back-btn" onClick={() => setSelectedListing(null)}>← Back to listings</button>
              
              <div className="listing-detail-header">
                <h3>{selectedListing.title}</h3>
                <div className="listing-meta">
                  <span>⭐ {selectedListing.rating && Number(selectedListing.rating) > 0 ? Number(selectedListing.rating).toFixed(1) : 'N/A'} ({selectedListing.review_count || 0} reviews)</span>
                  <span>📥 {selectedListing.downloads} downloads</span>
                  <span className="listing-price">${selectedListing.price === 0 ? 'FREE' : selectedListing.price}</span>
                </div>
              </div>

              <div className="listing-detail-body">
                <p><strong>Description:</strong> {selectedListing.description}</p>
                <p><strong>Category:</strong> {selectedListing.category}</p>
                <p><strong>Region:</strong> {selectedListing.region}</p>
                <p><strong>Est. Monthly Cost:</strong> ${selectedListing.estimated_monthly_cost}</p>
                <p><strong>Author:</strong> {selectedListing.first_name} {selectedListing.last_name}</p>
                
                {selectedListing.tags && selectedListing.tags.length > 0 && (
                  <div className="listing-tags">
                    {selectedListing.tags.map((tag, i) => (
                      <span key={i} className="tag-badge">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="listing-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePurchase(selectedListing.id)}
                >
                  {selectedListing.price === 0 ? 'Get for Free' : `Purchase for $${selectedListing.price}`}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  style={{ marginLeft: '10px' }}
                >
                  {showReviewForm ? '✕ Hide Review' : '✍️ Write a Review'}
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="review-form-container">
                  <h4>📝 Leave a Review</h4>
                  <p className="review-note">Share your feedback about this architecture</p>
                  
                  <div className="form-group">
                    <label htmlFor="rating-select">Rating *</label>
                    <select
                      id="rating-select"
                      className="rating-select"
                      value={reviewData.rating}
                      onChange={(e) => setReviewData({ ...reviewData, rating: e.target.value })}
                    >
                      <option value="">-- Select Rating --</option>
                      <option value="1">⭐ 1 - Poor</option>
                      <option value="2">⭐⭐ 2 - Fair</option>
                      <option value="3">⭐⭐⭐ 3 - Good</option>
                      <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                      <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="comment-textarea">Comment (Optional)</label>
                    <textarea
                      id="comment-textarea"
                      className="comment-textarea"
                      placeholder="Share your experience... What did you like? Any suggestions?"
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                      rows="4"
                      maxLength="500"
                    />
                    <small className="char-count">
                      {reviewData.comment.length}/500 characters
                    </small>
                  </div>

                  <div className="review-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSubmitReview(selectedListing.id)}
                      disabled={reviewLoading || !reviewData.rating}
                    >
                      {reviewLoading ? '⏳ Submitting...' : '✓ Submit Review'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewData({ rating: 5, comment: '' });
                      }}
                      disabled={reviewLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="reviews-section">
                <h4 className="reviews-title">📋 User Reviews ({selectedListing.review_count || 0})</h4>
                
                {reviewsLoading ? (
                  <div className="reviews-loading">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="no-reviews">
                    <p>No reviews yet. Be the first to share your feedback!</p>
                  </div>
                ) : (
                  <div className="reviews-list">
                    {reviews.map((review) => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <div className="review-rating">
                            <span className="stars">
                              {'⭐'.repeat(review.rating)}
                            </span>
                            <span className="rating-value">{review.rating}/5</span>
                          </div>
                          <div className="review-meta">
                            <span className="reviewer-name">
                              {(() => {
                                const fullName = review.user_name?.trim();
                                if (fullName && fullName.length > 0) return fullName;
                                if (review.first_name && review.last_name) return `${review.first_name} ${review.last_name}`;
                                if (review.email) return review.email.split('@')[0];
                                return 'Anonymous User';
                              })()}
                            </span>
                            <span className="review-date">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="review-comment">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="marketplace-grid">
              {listings.length === 0 ? (
                <div className="no-listings">No architectures found</div>
              ) : (
                listings.map((listing) => (
                  <div key={listing.id} className="marketplace-card" onClick={() => handleViewDetails(listing.id)}>
                    <div className="card-header">
                      <h4>{listing.title}</h4>
                      <span className="card-price">${listing.price === 0 ? 'FREE' : listing.price}</span>
                    </div>
                    <p className="card-description">{(listing.description || '').slice(0, 100)}...</p>
                    <div className="card-meta">
                      <span>⭐ {listing.rating && Number(listing.rating) > 0 ? Number(listing.rating).toFixed(1) : 'N/A'} ({listing.review_count || 0})</span>
                      <span>📥 {listing.downloads}</span>
                      <span className="card-category">{listing.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceModal;
