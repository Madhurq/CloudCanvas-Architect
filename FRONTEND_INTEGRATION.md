# Frontend-Backend Integration Guide

This guide explains how to connect your existing Frontend to the new Backend API.

## Environment Setup

### Frontend Configuration

Update your Frontend to know about the backend URL. Add to [Frontend/.env](../Frontend/.env):

```env
VITE_API_URL=http://localhost:5000
```

Or for production:
```env
VITE_API_URL=https://api.cloudcanvas.io
```

## Creating an API Client

Create a new file: [Frontend/src/services/apiClient.js](../Frontend/src/services/apiClient.js)

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email, password, firstName, lastName, organization) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName, organization }),
    });
  }

  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/api/auth/profile', { method: 'GET' });
  }

  async refreshToken(refreshToken) {
    return this.request('/api/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Architecture endpoints
  async createArchitecture(architecture) {
    return this.request('/api/architectures', {
      method: 'POST',
      body: JSON.stringify(architecture),
    });
  }

  async getArchitectures() {
    return this.request('/api/architectures', { method: 'GET' });
  }

  async getArchitecture(id) {
    return this.request(`/api/architectures/${id}`, { method: 'GET' });
  }

  async updateArchitecture(id, architecture) {
    return this.request(`/api/architectures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(architecture),
    });
  }

  async deleteArchitecture(id) {
    return this.request(`/api/architectures/${id}`, { method: 'DELETE' });
  }

  // Pricing endpoints
  async getPricing(region, service) {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (service) params.append('service', service);
    return this.request(`/api/pricing?${params}`, { method: 'GET' });
  }
}

export default new APIClient();
```

## Updating Zustand Store

Update [Frontend/src/store/useStore.js](../Frontend/src/store/useStore.js) to use the backend:

```javascript
import apiClient from '../services/apiClient.js';

// In your store actions:

saveArchitecture: async (nodes, edges) => {
  try {
    const currentState = get();
    const response = await apiClient.createArchitecture({
      name: currentState.selectedArchitecture?.name || 'New Architecture',
      description: currentState.selectedArchitecture?.description || '',
      nodes,
      edges,
      region: currentState.region,
      pricingModel: currentState.pricingModel,
    });
    
    set({ selectedArchitecture: response.data.architecture });
  } catch (error) {
    console.error('Failed to save architecture:', error);
  }
},

loadArchitectures: async () => {
  try {
    const response = await apiClient.getArchitectures();
    set({ architectures: response.data.architectures });
  } catch (error) {
    console.error('Failed to load architectures:', error);
  }
},

deleteArchitecture: async (architectureId) => {
  try {
    await apiClient.deleteArchitecture(architectureId);
    get().loadArchitectures();
  } catch (error) {
    console.error('Failed to delete architecture:', error);
  }
},
```

## Authentication Flow

### 1. User Registration

```javascript
// In your registration component
import apiClient from '../services/apiClient.js';

async function handleRegister(formData) {
  try {
    const response = await apiClient.register(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.organization
    );

    apiClient.setToken(response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    setError(error.message);
  }
}
```

### 2. User Login

```javascript
async function handleLogin(email, password) {
  try {
    const response = await apiClient.login(email, password);
    
    apiClient.setToken(response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    navigate('/dashboard');
  } catch (error) {
    setError('Invalid credentials');
  }
}
```

### 3. Token Refresh

```javascript
// Create an interceptor for automatic token refresh
async function apiCall(endpoint, options) {
  try {
    return await apiClient.request(endpoint, options);
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await apiClient.refreshToken(refreshToken);
      
      apiClient.setToken(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return await apiClient.request(endpoint, options);
    }
    throw error;
  }
}
```

## Updating App Component

Update [Frontend/src/App.jsx](../Frontend/src/App.jsx) to load architectures from backend:

```javascript
useEffect(() => {
  const loadData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
        await store.loadArchitectures();
        const profile = await apiClient.getProfile();
        // Update store with user info
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };
  
  loadData();
}, []);
```

## Updating Cost Calculator

Integrate with backend pricing data:

```javascript
// In costCalculator.js or similar

async function calculateCost(nodes, region, pricingModel) {
  try {
    // Fetch latest pricing from backend
    const pricingResponse = await apiClient.getPricing(region);
    const pricingData = pricingResponse.data.pricing;

    // Your existing calculation logic using real pricing data
    let totalCost = 0;
    
    for (const node of nodes) {
      const service = getServiceDefinition(node.data.serviceId);
      if (!service) continue;

      const serviceRegionPricing = pricingData.find(
        p => p.serviceId === node.data.serviceId && p.region === region
      );

      // Calculate based on actual pricing
      const nodeCost = calculateNodeCost(
        node.data.config,
        serviceRegionPricing,
        pricingModel
      );

      totalCost += nodeCost;
    }

    return totalCost;
  } catch (error) {
    console.error('Failed to calculate cost:', error);
    return 0;
  }
}
```

## Error Handling

Add global error handler in App.jsx:

```javascript
useEffect(() => {
  const handleApiError = (error) => {
    if (error.message === 'Invalid or expired token') {
      // Redirect to login
      localStorage.removeItem('accessToken');
      navigate('/login');
    } else if (error.status === 403) {
      // Show unauthorized error
      alert('You do not have permission to perform this action');
    } else {
      // Show generic error
      alert('An error occurred: ' + error.message);
    }
  };

  window.addEventListener('apiError', handleApiError);
  return () => window.removeEventListener('apiError', handleApiError);
}, []);
```

## Vite Configuration

Update [Frontend/vite.config.js](../Frontend/vite.config.js) for development proxy:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

This allows you to use `/api` paths directly without the full URL in development.

## Testing the Integration

1. Start backend: `npm run dev` (in Backend folder)
2. Start frontend: `npm run dev` (in Frontend folder)
3. Register a new user in the UI
4. Create an architecture and verify it saves to backend
5. Refresh the page - architecture should load from backend
6. Check browser DevTools Network tab to see API calls

## Next Steps

- [ ] Update all components to use apiClient
- [ ] Implement loading states for API calls
- [ ] Add error boundaries for API errors
- [ ] Test all CRUD operations end-to-end
- [ ] Update tests to mock API calls
- [ ] Deploy to production with real API URL

---

For more details, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
