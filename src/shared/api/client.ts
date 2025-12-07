import axios, { type AxiosInstance } from 'axios';

// Create base API client instance
const createApiClient = (baseURL: string): AxiosInstance => {
    const instance = axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
        // Use cookies for authentication (Better Auth uses httpOnly cookies)
        withCredentials: true,
    });

    // Response interceptor for error handling
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            // Handle common errors globally
            if (error.response?.status === 401) {
                // Handle unauthorized - redirect to login
                console.error('Unauthorized - redirecting to login');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

// API client instances
export const eComApi = createApiClient('http://localhost:5000/api/local');
export const cmsApi = createApiClient('http://localhost:5000/api/cms');

// API endpoints
export const ENDPOINTS = {
    PRODUCTS: {
        GET_ALL: '/products',
        GET_HIGHLIGHTED: '/products/highlighted',
    },
} as const;
