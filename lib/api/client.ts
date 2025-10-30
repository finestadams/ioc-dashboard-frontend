import axios, { InternalAxiosRequestConfig } from 'axios';

// Extend the config interface to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 60000, // 60 seconds for bulk operations
});

// Request interceptor for comprehensive logging
apiClient.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    const timestamp = new Date().toISOString();
    const url = (config.baseURL || '') + (config.url || '');
    
    console.group(` [${timestamp}] Frontend API Request`);
    console.log(`Method: ${config.method?.toUpperCase()}`);
    console.log(`URL: ${url}`);
    console.log(`Headers:`, config.headers);
    
    if (config.params) {
      console.log(`Query Params:`, config.params);
    }
    
    // Respect browser/axios handling for FormData: do not force Content-Type so
    // the multipart boundary can be set automatically.
    const contentTypeHeader = config.headers
      ? config.headers['Content-Type'] || config.headers['content-type'] || config.headers['contentType']
      : undefined;

    if (config.data && contentTypeHeader && !String(contentTypeHeader).includes('multipart/form-data')) {
      console.log(`Request Body:`, config.data);
    } else if (config.data instanceof FormData) {
      console.log(`Request Body: FormData with ${config.data.entries ? [...config.data.entries()].length : 'unknown'} entries`);
    }
    
    console.groupEnd();
    return config;
  },
  (error) => {
    console.error('🔴 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for comprehensive logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toISOString();
    const config = response.config as ExtendedAxiosRequestConfig;
    const duration = config.metadata?.startTime 
      ? Date.now() - config.metadata.startTime 
      : 'unknown';
    
    console.group(`✅ [${timestamp}] Frontend API Response`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`URL: ${response.config.baseURL}${response.config.url}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Response Headers:`, response.headers);
    
    // Log response data (truncate if too large)
    if (response.data) {
      const dataStr = JSON.stringify(response.data);
      if (dataStr.length > 1000) {
        console.log(`Response Body (truncated):`, dataStr.substring(0, 1000) + '... [truncated]');
      } else {
        console.log(`Response Body:`, response.data);
      }
    }
    
    console.groupEnd();
    return response;
  },
  (error) => {
    const timestamp = new Date().toISOString();
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    console.group(` [${timestamp}] Frontend API Error`);
    console.log(`Status: ${error.response?.status || 'Network Error'}`);
    console.log(`URL: ${error.config?.baseURL}${error.config?.url}`);
    console.log(`Message: ${message}`);
    
    if (error.response?.data) {
      console.log(`Error Response:`, error.response.data);
    }
    
    console.groupEnd();
    
    // Transform error for better handling
    const transformedError = {
      message,
      status: error.response?.status,
      data: error.response?.data,
    };
    
    return Promise.reject(transformedError);
  }
);

// Add request timing
apiClient.interceptors.request.use((config: ExtendedAxiosRequestConfig) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

export default apiClient;