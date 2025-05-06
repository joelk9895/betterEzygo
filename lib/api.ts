// API endpoints and authentication utilities

const API_BASE_URL = 'https://production.api.ezygo.app/api/v1/Xcr45_salt';

// Storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const USERNAME_KEY = 'ezygo_username';
const PASSWORD_KEY = 'ezygo_password';

// Flag to prevent multiple refresh attempts at once
let isRefreshing = false;

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token?: string;
  message?: string;
  success?: boolean;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  academic_year: string;
  start_year: string;
  end_year: string;
}

export interface AttendanceData {
  present: number;
  absent: number;
  totel: number;
  persantage: number;
  course?: {
    name: string;
    code: string;
  };
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  profile_picture?: string;
};

/**
 * Login to the Ezygo platform and store credentials for token refresh
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Origin': 'https://edu.ezygo.app',
        'Referer': 'https://edu.ezygo.app/'
      },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });
    
    const data = await res.json();
    
    // If login is successful, store credentials for future token refresh
    if (data.access_token) {
      if (typeof window !== 'undefined') {
        // Store the access token
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        
        // Store credentials for token refresh (securely)
        // Note: In a production app, consider using more secure storage methods
        localStorage.setItem(USERNAME_KEY, credentials.username);
        localStorage.setItem(PASSWORD_KEY, credentials.password);
      }
    }
    
    return data;
  } catch (_error: unknown) {
    return { success: false, message: `Network error ${_error}` };
  }
}

/**
 * Refresh the access token using stored credentials
 */
async function refreshToken(): Promise<boolean> {
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing) return false;
  
  isRefreshing = true;
  
  try {
    // Get stored credentials
    const username = localStorage.getItem(USERNAME_KEY);
    const password = localStorage.getItem(PASSWORD_KEY);
    
    if (!username || !password) {
      isRefreshing = false;
      return false;
    }
    
    // Attempt to login again
    const response = await login({ username, password });
    
    isRefreshing = false;
    return !!response.access_token;
  } catch (_error: unknown) {
    isRefreshing = false;
    console.error('Token refresh failed:', _error);
    return false;
  }
}

/**
 * Make an authenticated API request with token refresh capability
 */
async function authenticatedRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    // Get the current token
    const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    if (!token) throw new Error('No access token found');
    
    // Set up the request with authentication
    const requestOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */*',
      },
    };
    
    // Make the request
    let response = await fetch(url, requestOptions);
    
    // If unauthorized (401), try to refresh the token and retry
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      
      // Try to refresh the token
      const refreshed = await refreshToken();
      
      // If refresh was successful, retry the original request
      if (refreshed) {
        // Get the new token
        const newToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        
        // Update the authorization header
        requestOptions.headers = {
          ...requestOptions.headers,
          Authorization: `Bearer ${newToken}`,
        };
        
        // Retry the request
        response = await fetch(url, requestOptions);
      }
    }
    
    // If still not ok, throw an error
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Parse and return the data
    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('API request failed:', error);
    throw new Error(error instanceof Error ? error.message : 'API request failed');
  }
}

/**
 * Get the list of courses for the authenticated user
 */
export async function getCourses(): Promise<Course[]> {
  try {
    const data = await authenticatedRequest<Course[]>(`${API_BASE_URL}/institutionuser/courses/withusers`);
    return data || [];
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Error fetching courses');
  }
}

/**
 * Get attendance data for a specific course
 */
export async function getCourseAttendance(courseId: number): Promise<AttendanceData> {
  try {
    const data = await authenticatedRequest<AttendanceData>(
      `${API_BASE_URL}/attendancereports/institutionuser/courses/${courseId}/summery`
    );
    return data;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Error fetching attendance');
  }
}

/**
 * Get user profile data
 */
export const getMyProfile = async (): Promise<UserProfile> => {
  const endpoint = `${API_BASE_URL}/myprofile`;
  
  try {
    const response = await authenticatedRequest(endpoint);
    return response as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return !!token;
};

/**
 * Logout user and clear all stored credentials
 */
export const logout = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(PASSWORD_KEY);
};

/**
 * Set default semester setting
 */
export const setDefaultSemester = async (semesterId: string = "0"): Promise<unknown> => {
  try {
    const data = await authenticatedRequest(
      `${API_BASE_URL}/user/setting/default_semester`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ default_semester: semesterId }),
      }
    );
    return data;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Error setting default semester');
  }
};

/**
 * Set default academic year setting
 */
export const setDefaultAcademicYear = async (academicYearId: string = "0"): Promise<unknown> => {
  try {
    const data = await authenticatedRequest(
      `${API_BASE_URL}/user/setting/default_academic_year`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ default_academic_year: academicYearId }),
      }
    );
    return data;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Error setting default academic year');
  }
};
