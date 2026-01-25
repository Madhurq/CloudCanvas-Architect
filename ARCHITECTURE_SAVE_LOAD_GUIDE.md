# Architecture Save/Load Feature - Implementation Guide

## Overview

A complete save/load system has been implemented that allows users to:
- ✅ Save current architecture designs with custom names and descriptions
- ✅ View all previously saved architectures
- ✅ Load any saved architecture instantly
- ✅ Delete unwanted saved architectures

---

## Feature Components

### 1. Save Architecture Feature

**File**: [SaveArchitectureModal.jsx](../../Frontend/src/components/SaveArchitectureModal.jsx)

**Functionality**:
- Modal dialog for saving current design
- Requires architecture name (255 char limit)
- Optional description (1000 char limit)
- Displays current region, pricing model, service count, and connections
- Character counters for all text fields
- Loading states during save

**Save Dialog Includes**:
- Architecture name input (required)
- Description textarea (optional)
- Info box showing:
  - AWS Region
  - Pricing Model
  - Number of services
  - Number of connections
- Save/Cancel buttons

**Backend Integration**:
- POST `/api/architectures` endpoint
- Stores: name, description, nodes, edges, region, pricing_model
- Automatic timestamp (created_at, updated_at)
- User association (user_id)

---

### 2. Load/View Architecture Feature

**File**: [SavedArchitecturesModal.jsx](../../Frontend/src/components/SavedArchitecturesModal.jsx)

**Functionality**:
- Modal dialog showing all saved architectures
- Auto-loads list when modal opens
- Each architecture shows:
  - Name and last updated date
  - Description (if available)
  - Region, pricing model, connection count, service count
  - Load and Delete buttons

**Load Button**:
- Instantly loads architecture nodes and edges into canvas
- Updates region and pricing model
- Clears any current design (user is warned beforehand)

**Delete Button**:
- Confirmation dialog prevents accidental deletion
- Removes architecture from database
- Updates list immediately

**Backend Integration**:
- GET `/api/architectures` - fetch all user's saved architectures
- POST `/api/architectures/:id/load` - load architecture (optional, handled on frontend)
- DELETE `/api/architectures/:id` - delete architecture

---

### 3. UI Integration

**File**: [App.jsx](../../Frontend/src/App.jsx)

**New Buttons in Header**:
- **Save Button** (💾): Opens SaveArchitectureModal
- **Load Button** (📂): Opens SavedArchitecturesModal

**Button Placement**: Secondary action group (between Publish and Import buttons)

**State Management**:
```jsx
const [showSaveModal, setShowSaveModal] = useState(false);
const [showLoadModal, setShowLoadModal] = useState(false);
```

---

### 4. Styling

**File**: [SaveArchitecture.css](../../Frontend/src/styles/SaveArchitecture.css)

**Features**:
- Modern modal design with gradient header
- Smooth animations and transitions
- Responsive grid layout for architecture info
- Scrollable lists for saved architectures
- Dark and light theme support
- Mobile-friendly (stacked buttons on small screens)

**Key Classes**:
- `.modal-overlay` - Overlay background
- `.modal-content` - Modal container
- `.save-arch-form` - Form layout
- `.arch-list` - Architecture list container
- `.arch-item` - Individual architecture card

---

## Usage Flow

### Saving an Architecture

1. **Design** your architecture on canvas
2. Click **Save** button in header
3. Enter architecture name (required)
4. Optionally add description
5. Click **💾 Save Architecture** button
6. See confirmation: "✅ Architecture saved successfully!"
7. Modal closes automatically

### Loading a Saved Architecture

1. Click **Load** button in header
2. Browse saved architectures list
3. See for each architecture:
   - Name and last modified date
   - Description
   - Technical details (region, services, connections)
4. Click **📥 Load** on desired architecture
5. See confirmation: "✅ Architecture loaded successfully!"
6. Canvas immediately loads the saved design
7. Region and pricing model are updated automatically

### Deleting a Saved Architecture

1. Open Load modal (click **Load** button)
2. Find architecture to delete
3. Click **🗑️ Delete** button
4. Confirm deletion in popup dialog
5. See confirmation: "✅ Architecture deleted successfully!"
6. Architecture removed from list

---

## Database Schema

The existing `architectures` table stores all data:

```sql
CREATE TABLE architectures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  nodes TEXT NOT NULL,           -- JSON array of nodes
  edges TEXT NOT NULL,           -- JSON array of edges
  region VARCHAR(100) NOT NULL,  -- AWS region
  pricing_model VARCHAR(100) NOT NULL,
  estimated_monthly_cost NUMERIC(12,2),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `name`: Display name for architecture
- `description`: User-provided description
- `nodes`: JSON serialized React Flow nodes
- `edges`: JSON serialized React Flow edges
- `region`: AWS region (us-east-1, eu-west-1, etc.)
- `pricing_model`: on-demand, reserved-1yr, reserved-3yr, spot
- `updated_at`: Automatically updated on save/load

---

## API Endpoints

### Create/Save Architecture
```
POST /api/architectures
Headers: Authorization: Bearer <token>
Body: {
  name: string (required, max 255 chars),
  description: string (optional, max 1000 chars),
  nodes: array (required),
  edges: array (required),
  region: string (required),
  pricingModel: string (required)
}
Response: { success: true, data: { architecture: {...} } }
```

### Get All User's Architectures
```
GET /api/architectures
Headers: Authorization: Bearer <token>
Response: { success: true, data: { architectures: [...] } }
```

### Get Single Architecture
```
GET /api/architectures/:id
Headers: Authorization: Bearer <token>
Response: { success: true, data: { architecture: {...} } }
```

### Update Architecture
```
PUT /api/architectures/:id
Headers: Authorization: Bearer <token>
Body: { name, description, nodes, edges, region, pricingModel }
Response: { success: true }
```

### Delete Architecture
```
DELETE /api/architectures/:id
Headers: Authorization: Bearer <token>
Response: { success: true }
```

---

## Testing Checklist

### Save Functionality
- [ ] Open canvas with services
- [ ] Click Save button
- [ ] Modal opens with form
- [ ] Architecture details shown (region, services, etc.)
- [ ] Can enter name (max 255 chars enforced)
- [ ] Can enter description (max 1000 chars enforced)
- [ ] Submit saves to database
- [ ] Confirmation message appears
- [ ] Modal closes after save
- [ ] Same architecture appears in Load modal

### Load Functionality
- [ ] Click Load button
- [ ] Modal shows list of saved architectures
- [ ] All saved architectures listed with dates
- [ ] Descriptions visible if provided
- [ ] Technical details displayed (region, services, connections)
- [ ] Click Load button
- [ ] Canvas clears and loads saved architecture
- [ ] Nodes and edges appear correctly
- [ ] Region is updated
- [ ] Pricing model is updated
- [ ] Confirmation message appears

### Delete Functionality
- [ ] Open Load modal
- [ ] Click Delete on architecture
- [ ] Confirmation dialog appears
- [ ] Cancel prevents deletion
- [ ] Confirm removes architecture
- [ ] List updates immediately
- [ ] Architecture no longer appears in list
- [ ] Database entry is deleted

### Error Handling
- [ ] Save without name shows error
- [ ] Network error shows appropriate message
- [ ] Delete confirmation can be cancelled
- [ ] Loading states show while fetching
- [ ] Empty state shown when no architectures saved

### UI/UX
- [ ] Buttons have proper icons and labels
- [ ] Modal opens/closes smoothly
- [ ] Form fields are properly labeled
- [ ] Character counters work correctly
- [ ] Buttons disabled during loading
- [ ] Dark and light themes both work
- [ ] Mobile responsive (buttons stack on small screens)
- [ ] Scrollable lists for many architectures

---

## Keyboard Shortcuts

Currently, no dedicated keyboard shortcuts are implemented for save/load, but you can add:

```javascript
// Add to App.jsx handleKeyDown:

// Ctrl+S - Save architecture
if ((event.ctrlKey || event.metaKey) && event.key === 's') {
  event.preventDefault();
  setShowSaveModal(true);
}

// Ctrl+L - Load architecture
if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
  event.preventDefault();
  setShowLoadModal(true);
}
```

---

## Troubleshooting

### Save Not Working
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Confirm user is authenticated (accessToken valid)
4. Check network tab for failed requests

### Load Not Populating Canvas
1. Verify nodes/edges are stored correctly in DB
2. Check JSON parsing in SavedArchitecturesModal
3. Ensure setNodes/setEdges are properly updating store
4. Open browser DevTools to inspect loaded data

### Styles Not Applied
1. Confirm SaveArchitecture.css is imported
2. Check CSS file path is correct
3. Verify theme variables are defined
4. Clear browser cache (Ctrl+Shift+Delete)

### Delete Not Working
1. Check user has permission (owns architecture)
2. Verify DELETE endpoint is working
3. Confirm database cascade delete is set up
4. Check browser console for errors

---

## Future Enhancements

Potential improvements to consider:
1. **Architecture Versions**: Keep history of changes
2. **Sharing**: Share saved architectures with team members
3. **Tags/Categories**: Organize architectures by tags
4. **Search**: Search saved architectures by name/description
5. **Favorites**: Star architectures for quick access
6. **Collaborative Editing**: Multiple users editing same architecture
7. **Auto-save**: Periodic automatic saves
8. **Export**: Download saved architecture as JSON/PDF
9. **Templates**: Mark architectures as reusable templates
10. **Comparison**: Compare two architecture versions

---

## Code Files Modified/Created

### Created
- [Frontend/src/components/SaveArchitectureModal.jsx](../../Frontend/src/components/SaveArchitectureModal.jsx)
- [Frontend/src/components/SavedArchitecturesModal.jsx](../../Frontend/src/components/SavedArchitecturesModal.jsx)
- [Frontend/src/styles/SaveArchitecture.css](../../Frontend/src/styles/SaveArchitecture.css)

### Modified
- [Frontend/src/App.jsx](../../Frontend/src/App.jsx) - Added imports, state, buttons, and modal components

### Existing
- [Backend/src/controllers/architectureController.js](../../Backend/src/controllers/architectureController.js) - Already has all required endpoints
- [Backend/src/routes/architectureRoutes.js](../../Backend/src/routes/architectureRoutes.js) - Already has all required routes
- [Frontend/src/store/useStore.js](../../Frontend/src/store/useStore.js) - Already has setRegion/setPricingModel

---

## Next Steps

1. **Start Backend**: `cd Backend && npm start`
2. **Start Frontend**: `cd Frontend && npm run dev`
3. **Hard Refresh Browser**: Ctrl+Shift+R
4. **Test Save**: Click Save button and save an architecture
5. **Test Load**: Click Load button and load the saved architecture
6. **Test Delete**: Delete a saved architecture
7. **Verify Database**: Check `architectures` table for saved data

---

## Summary

The save/load system is **fully implemented and ready to use**. Users can now:
- ✅ Save architectures with names and descriptions
- ✅ View all their saved designs
- ✅ Load any architecture instantly
- ✅ Delete unwanted saves
- ✅ All data persists in the database
- ✅ Beautiful, responsive UI with proper styling
- ✅ Error handling and user feedback

*Last Updated: January 25, 2026*
