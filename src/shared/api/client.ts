import axios, { type AxiosInstance } from 'axios';

// Create base API client instance
const createApiClient = (baseURL: string): AxiosInstance => {
    const instance = axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor for auth tokens
    instance.interceptors.request.use(
        (config) => {
            // Add auth token if available
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            // Handle common errors globally
            if (error.response?.status === 401) {
                // Handle unauthorized
                console.error('Unauthorized - redirecting to login');
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
