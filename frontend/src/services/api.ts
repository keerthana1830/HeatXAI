const BASE_URL = 'http://localhost:8000/api/v1';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errorJson = await response.json();
      if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((e: any) => e.msg).join(', ');
      } else {
        errorDetail = errorJson.detail || JSON.stringify(errorJson);
      }
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const authService = {
  async signup(email: string, password: string, fullName: string, role: string = 'user') {
    return apiFetch<any>('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
  },

  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiFetch<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    localStorage.setItem('token', response.access_token);
    return response;
  },

  async getMe() {
    return apiFetch<any>('/auth/me');
  },

  logout() {
    localStorage.removeItem('token');
  }
};

export const districtService = {
  async getDistricts() {
    return apiFetch<any[]>('/districts');
  },
  async getDistrict(id: string) {
    return apiFetch<any>(`/districts/${id}`);
  },
  async deleteDistrict(id: string) {
    return apiFetch<any>(`/districts/${id}`, { method: 'DELETE' });
  }
};

export const jobService = {
  async getJobs() {
    return apiFetch<any[]>('/jobs');
  },
  async triggerJob(jobType: string) {
    return apiFetch<any>('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_type: jobType, triggered_by: 'system' })
    });
  }
};

export const predictionService = {
  async getPredictions(districtId: string, modelType?: string) {
    const query = modelType ? `?model_type=${encodeURIComponent(modelType)}` : '';
    return apiFetch<any[]>(`/predictions/${districtId}${query}`);
  },
  async trainModel(modelType: string) {
    return apiFetch<any>('/predictions/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_type: modelType })
    });
  }
};

export const uploadService = {
  async uploadFile(file: File) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      let errorDetail = 'Upload failed';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || JSON.stringify(errorJson);
      } catch {
        errorDetail = response.statusText;
      }
      throw new Error(errorDetail);
    }
    return response.json();
  }
};

export const profileService = {
  async updateProfile(fullName: string) {
    return apiFetch<any>('/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName })
    });
  },
  async deleteAccount() {
    return apiFetch<any>('/auth/account', { method: 'DELETE' });
  }
};

export const projectService = {
  async getProjects() {
    return apiFetch<any[]>('/projects');
  },
  async createProject(data: { name: string; district: string; target_cooling: string; budget: string }) {
    return apiFetch<any>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },
  async deleteProject(id: string) {
    return apiFetch<any>(`/projects/${id}`, { method: 'DELETE' });
  }
};

export const suggestionService = {
  async getSuggestions(params?: {
    district?: string;
    category?: string;
    search?: string;
    sort?: 'votes' | 'newest' | 'oldest';
  }) {
    const qs = new URLSearchParams();
    if (params?.district) qs.set('district', params.district);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.sort) qs.set('sort', params.sort);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<any[]>(`/suggestions${query}`);
  },

  async createSuggestion(data: { title: string; description: string; district: string; category: string }) {
    return apiFetch<any>('/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async upvoteSuggestion(id: string) {
    return apiFetch<any>(`/suggestions/${id}/upvote`, { method: 'POST' });
  },

  async deleteSuggestion(id: string) {
    return apiFetch<any>(`/suggestions/${id}`, { method: 'DELETE' });
  },
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export interface ChatContext {
  district_name?: string;
  active_tab?: string;
  is_guest?: boolean;
}

export const chatService = {
  async sendMessage(messages: ChatMessage[], context?: ChatContext) {
    return apiFetch<{ response: string }>('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    });
  },
};

export const forecastService = {
  async getForecast(districtId: string, days: number = 7) {
    return apiFetch<any>(`/forecast/${districtId}?days=${days}`);
  },
  async getSummary(days: number = 7) {
    return apiFetch<any>(`/forecast/summary?days=${days}`);
  }
};


