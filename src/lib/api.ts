const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Try to get token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getSession() {
    return this.request<{ user: any }>('/auth/session');
  }

  async logout() {
    const response = await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
    return response;
  }

  // Visits endpoints
  async getVisits(params?: {
    status?: string;
    hostId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    const query = queryParams.toString();
    return this.request<{ visits: any[]; total: number }>(`/visits${query ? `?${query}` : ''}`);
  }

  async getVisitStats(params?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value);
      });
    }

    const query = queryParams.toString();
    return this.request<any>(`/visits/stats${query ? `?${query}` : ''}`);
  }

  async getVisit(id: string) {
    return this.request<any>(`/visits/${id}`);
  }

  async createVisit(data: {
    visitorId: string;
    hostId: string;
    purpose: string;
    validUntil: string;
    notes?: string;
  }) {
    return this.request<any>('/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVisit(
    id: string,
    data: {
      status?: string;
      checkInTime?: string;
      checkOutTime?: string;
      notes?: string;
    }
  ) {
    return this.request<any>(`/visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Visitors endpoints
  async searchVisitor(params: { email?: string; phone?: string }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    return this.request<any>(`/visitors/search?${queryParams.toString()}`);
  }

  async getVisitor(id: string) {
    return this.request<any>(`/visitors/${id}`);
  }

  async createVisitor(data: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    photoUrl?: string;
  }) {
    return this.request<any>('/visitors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Hosts endpoints
  async searchHost(email: string) {
    return this.request<any>(`/hosts/search?email=${encodeURIComponent(email)}`);
  }

  async getHost(id: string) {
    return this.request<any>(`/hosts/${id}`);
  }

  // Upload endpoint
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers: HeadersInit = {};

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return { data };
    } catch (error) {
      console.error('Upload failed:', error);
      return { error: 'Upload failed' };
    }
  }
}

export const api = new ApiClient();
export default api;
