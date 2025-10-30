import { apiClient } from './client';
import {
  IOCType,
  SingleIOCRequest,
  BulkIOCRequest,
  IOCResult,
  BulkAnalysisResult,
  FileAnalysisResult,
  HealthCheckResult,
} from './types';

export class IOCService {
  /**
   * Analyze a single IOC
   */
  static async analyzeSingle(data: SingleIOCRequest): Promise<IOCResult> {
    const response = await apiClient.post('/api/ioc/analyze', data);
    return response.data;
  }

    
  /**
   * Analyze multiple IOCs in bulk
   */
  static async analyzeBulk(data: BulkIOCRequest): Promise<BulkAnalysisResult> {
    const response = await apiClient.post('/api/ioc/analyze/bulk', data);
    return response.data;
  }

  /**
   * Analyze a file upload
   */
  static async analyzeFile(
    file: File,
    description?: string
  ): Promise<FileAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post('/api/ioc/file/analyze', formData);
    return response.data;
  }

  /**
   * Upload and analyze a CSV/Excel file with bulk IOCs
   */
  static async analyzeBulkFromFile(file: File): Promise<BulkAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/ioc/file/bulk-upload', formData);
    return response.data;
  }

  /**
   * Auto-detect IOC type
   */
  static async detectType(value: string): Promise<{ type: IOCType }> {
    const response = await apiClient.get('/api/ioc/detect-type', {
      params: { value },
    });
    return response.data;
  }

    
  /**
   * Download sample CSV template
   */
  static async downloadSampleCSV(): Promise<Blob> {
    const response = await apiClient.get('/api/ioc/sample-csv', {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Health check for API and providers
   */
  static async healthCheck(): Promise<HealthCheckResult> {
    const response = await apiClient.get('/api/ioc/health');
    return response.data;
  }

  /**
   * Get analytics data from database
   */
  static async getAnalytics(days: number = 7): Promise<any> {
    const response = await apiClient.get('/api/ioc/analytics', {
      params: { days },
    });
    return response.data;
  }

  /**
   * Get recent analyses from database
   */
  static async getRecentAnalyses(limit: number = 10): Promise<any[]> {
    const response = await apiClient.get('/api/ioc/recent', {
      params: { limit },
    });
    return response.data;
  }
}

export default IOCService;