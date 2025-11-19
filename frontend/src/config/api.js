// API Configuration
// This file centralizes the API base URL configuration
// In production, set VITE_API_BASE_URL in your environment variables

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
