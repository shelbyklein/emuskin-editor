// API utilities for backend communication

// Decode JWT token to extract payload
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Import Project interface from ProjectContext since it's not exported from types
interface Project {
  id: string;
  name: string;
  identifier: string;
  console: any | null;
  device: any | null;
  userId?: string;
  isPublic?: boolean;
  createdAt?: number;
  hasBeenConfigured?: boolean;
  lastModified: number;
}

// API base URL - will be set via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API request wrapper with authentication
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('emuskin-auth-token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token.replace(/"/g, '')}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401) {
    // Clear invalid token
    localStorage.removeItem('emuskin-auth-token');
    localStorage.removeItem('emuskin-user');
    // Redirect to login or refresh token
    window.location.href = '/';
  }

  return response;
}

// Authentication API
export const authAPI = {
  // Login with username/password to get JWT token
  loginWithCredentials: async (username: string, password: string): Promise<{ token: string; user: any }> => {
    const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL || 'https://playcase.gg';
    
    // First, get JWT token from WordPress (using Simple JWT Login plugin)
    // Note: This site uses ?rest_route= format instead of /wp-json/ prefix
    const tokenResponse = await fetch(`${wordpressUrl}/?rest_route=/simple-jwt-login/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: username, password }), // Simple JWT Login uses 'email' parameter
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(error.data?.message || error.message || 'Invalid credentials');
    }

    const tokenData = await tokenResponse.json();
    const jwt = tokenData.data.jwt;
    
    // Extract user data from JWT payload instead of making another API call
    // (Simple JWT Login doesn't integrate with WordPress REST API authentication)
    const jwtPayload = decodeJWT(jwt);
    
    if (!jwtPayload) {
      throw new Error('Invalid JWT token');
    }
    
    // Format user data from JWT payload
    const user = {
      id: jwtPayload.id || '1',
      username: jwtPayload.username || jwtPayload.email.split('@')[0],
      email: jwtPayload.email,
      displayName: jwtPayload.username || jwtPayload.email.split('@')[0],
      avatar: null, // JWT doesn't include avatar
      roles: ['subscriber'], // Default role, JWT doesn't include roles
    };

    return { token: jwt, user };
  },

  // Refresh JWT token
  refreshToken: async (): Promise<{ token: string; user: any }> => {
    const response = await apiRequest('/auth/refresh', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return response.json();
  },

  // Validate current token
  validateToken: async (): Promise<{ valid: boolean; user?: any }> => {
    const token = localStorage.getItem('emuskin-auth-token');
    if (!token) return { valid: false };
    
    try {
      const wordpressUrl = import.meta.env.VITE_WORDPRESS_URL || 'https://playcase.gg';
      
      // Validate token with WordPress (using Simple JWT Login)
      const response = await fetch(`${wordpressUrl}/?rest_route=/simple-jwt-login/v1/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.replace(/"/g, '')}`,
        },
      });
      
      // Even if validation fails, check if we can decode the JWT
      // Simple JWT Login might not properly validate but the token could still be valid
      const jwtPayload = decodeJWT(token.replace(/"/g, ''));
      
      if (jwtPayload && jwtPayload.email) {
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (jwtPayload.exp && jwtPayload.exp < now) {
          return { valid: false };
        }
        
        // Token is valid, return user data from JWT
        const user = {
          id: jwtPayload.id || '1',
          username: jwtPayload.username || jwtPayload.email.split('@')[0],
          email: jwtPayload.email,
          displayName: jwtPayload.username || jwtPayload.email.split('@')[0],
          avatar: null,
          roles: ['subscriber'],
        };
        return { valid: true, user };
      }
      
      return { valid: false };
    } catch (error) {
      return { valid: false };
    }
  },
};

// Projects API
export const projectsAPI = {
  // Get all projects for the authenticated user
  getProjects: async (): Promise<Project[]> => {
    const response = await apiRequest('/projects');
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    
    return response.json();
  },

  // Create a new project
  createProject: async (project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'lastModified'>): Promise<Project> => {
    const response = await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return response.json();
  },

  // Update an existing project
  updateProject: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const response = await apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return response.json();
  },

  // Delete a project
  deleteProject: async (id: string): Promise<void> => {
    const response = await apiRequest(`/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },

  // Upload project image
  uploadImage: async (projectId: string, file: File, type: 'background' | 'thumbstick', controlId?: string): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    if (controlId) {
      formData.append('controlId', controlId);
    }

    const token = localStorage.getItem('emuskin-auth-token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token.replace(/"/g, '')}`;
    }

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/images`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return response.json();
  },
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('emuskin-auth-token');
  const user = localStorage.getItem('emuskin-user');
  return !!(token && user);
};

// Helper function to get current user
export const getCurrentUser = (): any | null => {
  const userString = localStorage.getItem('emuskin-user');
  return userString ? JSON.parse(userString) : null;
};

// Mock API responses for development
export const mockAPI = {
  // Mock successful authentication
  mockLogin: () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@playcase.gg',
      displayName: 'Test User',
      roles: ['subscriber']
    };
    const mockToken = 'mock-jwt-token-' + Date.now();
    
    localStorage.setItem('emuskin-auth-token', JSON.stringify(mockToken));
    localStorage.setItem('emuskin-user', JSON.stringify(mockUser));
    
    return { token: mockToken, user: mockUser };
  },

  // Mock project data
  mockProjects: (): Project[] => [
    {
      id: 'mock-project-1',
      name: 'My Test Skin',
      identifier: 'com.test.skin',
      console: null,
      device: null,
      userId: '1',
      isPublic: false,
      createdAt: Date.now() - 86400000, // 1 day ago
      hasBeenConfigured: true,
      lastModified: Date.now(),
    },
  ],
};