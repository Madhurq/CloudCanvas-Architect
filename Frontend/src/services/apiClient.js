const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const withJson = (headers = {}) => ({ 'Content-Type': 'application/json', ...headers });

class APIClient {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken') || null;
    this.refreshToken = localStorage.getItem('refreshToken') || null;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken || null;
    this.refreshToken = refreshToken || null;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  clearTokens() {
    this.setTokens(null, null);
  }

  getHeaders(extraHeaders = {}) {
    const headers = withJson(extraHeaders);
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  async request(endpoint, options = {}, attemptRefresh = true) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(options.headers),
    });

    if (response.status === 401 && attemptRefresh && this.refreshToken) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        return this.request(endpoint, options, false);
      }
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      payload = { error: 'Invalid JSON response' };
    }

    if (!response.ok) {
      const message = payload?.error || payload?.message || 'API request failed';
      throw new Error(message);
    }

    return payload;
  }

  async refreshSession() {
    if (!this.refreshToken) return false;
    try {
      const result = await this.request(
        '/api/auth/refresh-token',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        },
        false
      );

      if (result?.data?.accessToken) {
        this.setTokens(result.data.accessToken, result.data.refreshToken || this.refreshToken);
        return true;
      }
    } catch (error) {
      this.clearTokens();
    }
    return false;
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

  async logout() {
    this.clearTokens();
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
    const query = params.toString();
    const suffix = query ? `?${query}` : '';
    return this.request(`/api/pricing${suffix}`, { method: 'GET' });
  }
}

export default new APIClient();
