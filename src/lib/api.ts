import { 
  AuthResponse, 
  LoginCredentials, 
  Worker, 
  Inquiry, 
  Nationality, 
  Skill, 
  Language,
  DashboardStats
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get current token from localStorage for each request
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        // Handle authentication errors
        if (response.status === 401) {
          // Clear invalid token
          this.clearToken();
          errorMessage = 'Authentication failed. Please log in again.';
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Use default error message if JSON parsing fails
          }
        }
        
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response.text() as unknown as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error or server unavailable');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async verifyToken(): Promise<{ valid: boolean; user?: any }> {
    try {
      const response = await this.request<{ user: any }>('/api/auth/verify');
      return { valid: true, user: response.user };
    } catch (error) {
      this.clearToken();
      return { valid: false };
    }
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const [workersResponse, inquiriesResponse] = await Promise.all([
      this.request<{ stats: any }>('/api/workers/admin/stats'),
      this.request<{ stats: DashboardStats['inquiries'] }>('/api/inquiries/stats'),
    ]);

    // Transform worker stats to match expected format
    const workerStats = workersResponse.stats;
    const transformedWorkerStats = {
      total: workerStats.total || 0,
      available: workerStats.byStatus?.available || 0,
      hired: workerStats.byStatus?.hired || 0,
      inactive: workerStats.byStatus?.inactive || 0,
      pending: workerStats.byApprovalStatus?.pending || 0,
      approved: workerStats.byApprovalStatus?.approved || 0,
      rejected: workerStats.byApprovalStatus?.rejected || 0,
      featured: workerStats.featured || 0,
    };

    return {
      workers: transformedWorkerStats,
      inquiries: inquiriesResponse.stats,
    };
  }

  // Workers
  async getWorkers(params?: {
    page?: number;
    limit?: number;
    status?: string[];
    approvalStatus?: string[];
    search?: string;
  }): Promise<{
    workers: Worker[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) params.status.forEach(s => searchParams.append('status', s));
    if (params?.approvalStatus) params.approvalStatus.forEach(s => searchParams.append('approvalStatus', s));
    if (params?.search) searchParams.set('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<any>(`/api/workers/admin/all${queryString ? `?${queryString}` : ''}`);
  }

  async getWorker(id: string): Promise<{ worker: Worker }> {
    return this.request<{ worker: Worker }>(`/api/workers/admin/${id}`);
  }

  async createWorker(data: Partial<Worker>): Promise<{ worker: Worker }> {
    return this.request<{ worker: Worker }>('/api/workers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorker(id: string, data: Partial<Worker>): Promise<{ worker: Worker }> {
    return this.request<{ worker: Worker }>(`/api/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorker(id: string): Promise<void> {
    await this.request(`/api/workers/${id}`, { method: 'DELETE' });
  }

  // Inquiries
  async getInquiries(params?: {
    page?: number;
    limit?: number;
    status?: string[];
    assignedTo?: string;
    search?: string;
  }): Promise<{
    inquiries: Inquiry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) params.status.forEach(s => searchParams.append('status', s));
    if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo);
    if (params?.search) searchParams.set('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request<any>(`/api/inquiries${queryString ? `?${queryString}` : ''}`);
  }

  async getInquiry(id: string): Promise<{ inquiry: Inquiry }> {
    return this.request<{ inquiry: Inquiry }>(`/api/inquiries/${id}`);
  }

  async assignInquiry(id: string, assignedTo: string): Promise<{ inquiry: Inquiry }> {
    return this.request<{ inquiry: Inquiry }>(`/api/inquiries/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo }),
    });
  }

  async respondToInquiry(id: string, responseMessage: string): Promise<{ inquiry: Inquiry }> {
    return this.request<{ inquiry: Inquiry }>(`/api/inquiries/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ responseMessage }),
    });
  }

  async closeInquiry(id: string, adminNotes?: string): Promise<{ inquiry: Inquiry }> {
    return this.request<{ inquiry: Inquiry }>(`/api/inquiries/${id}/close`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes }),
    });
  }

  async markInquiryAsSpam(id: string): Promise<{ inquiry: Inquiry }> {
    return this.request<{ inquiry: Inquiry }>(`/api/inquiries/${id}/spam`, {
      method: 'PATCH',
    });
  }

  // Reference Data
  async getReferenceData(): Promise<{
    nationalities: Nationality[];
    skills: Skill[];
    languages: Language[];
  }> {
    return this.request<any>('/api/reference');
  }

  // Nationalities CRUD
  async getNationalities(activeOnly = false): Promise<{ nationalities: Nationality[] }> {
    const params = activeOnly ? '?active=true' : '';
    return this.request<{ nationalities: Nationality[] }>(`/api/reference/nationalities${params}`);
  }

  async createNationality(data: { name: string; displayOrder?: number }): Promise<{ nationality: Nationality }> {
    return this.request<{ nationality: Nationality }>('/api/reference/nationalities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNationality(id: string, data: Partial<{ name: string; displayOrder: number; active: boolean }>): Promise<{ nationality: Nationality }> {
    return this.request<{ nationality: Nationality }>(`/api/reference/nationalities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNationality(id: string): Promise<void> {
    await this.request(`/api/reference/nationalities/${id}`, { method: 'DELETE' });
  }

  // Skills CRUD
  async getSkills(activeOnly = false): Promise<{ skills: Skill[] }> {
    const params = activeOnly ? '?active=true' : '';
    return this.request<{ skills: Skill[] }>(`/api/reference/skills${params}`);
  }

  async createSkill(data: { name: string; category: string; displayOrder?: number }): Promise<{ skill: Skill }> {
    return this.request<{ skill: Skill }>('/api/reference/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSkill(id: string, data: Partial<{ name: string; category: string; displayOrder: number; active: boolean }>): Promise<{ skill: Skill }> {
    return this.request<{ skill: Skill }>(`/api/reference/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSkill(id: string): Promise<void> {
    await this.request(`/api/reference/skills/${id}`, { method: 'DELETE' });
  }

  // Languages CRUD
  async getLanguages(activeOnly = false): Promise<{ languages: Language[] }> {
    const params = activeOnly ? '?active=true' : '';
    return this.request<{ languages: Language[] }>(`/api/reference/languages${params}`);
  }

  async createLanguage(data: { name: string; displayOrder?: number }): Promise<{ language: Language }> {
    return this.request<{ language: Language }>('/api/reference/languages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLanguage(id: string, data: Partial<{ name: string; displayOrder: number; active: boolean }>): Promise<{ language: Language }> {
    return this.request<{ language: Language }>(`/api/reference/languages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLanguage(id: string): Promise<void> {
    await this.request(`/api/reference/languages/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);