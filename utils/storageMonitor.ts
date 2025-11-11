import { optimizedStorage } from './optimizedStorage';

/**
 * Storage Monitoring and Analytics Utility
 * 
 * Provides insights into storage usage and helps prevent
 * SecureStore size limit issues
 */

export interface StorageReport {
  timestamp: string;
  criticalDataSize: number;
  profileDataSize: number;
  totalSize: number;
  secureStoreUsage: number;
  asyncStorageUsage: number;
  recommendations: string[];
}

export class StorageMonitor {
  private static instance: StorageMonitor;
  private reports: StorageReport[] = [];
  private readonly MAX_SECURESTORE_SIZE = 2048;
  private readonly WARNING_THRESHOLD = 1500;

  static getInstance(): StorageMonitor {
    if (!StorageMonitor.instance) {
      StorageMonitor.instance = new StorageMonitor();
    }
    return StorageMonitor.instance;
  }

  /**
   * Generate a comprehensive storage report
   */
  async generateReport(): Promise<StorageReport> {
    const stats = await optimizedStorage.getStorageStats();
    const timestamp = new Date().toISOString();
    
    const recommendations: string[] = [];
    
    // Analyze critical data size
    if (stats.criticalSize > this.MAX_SECURESTORE_SIZE) {
      recommendations.push('Critical data exceeds SecureStore limit - consider data compression');
    } else if (stats.criticalSize > this.WARNING_THRESHOLD) {
      recommendations.push('Critical data approaching SecureStore limit - monitor closely');
    }
    
    // Analyze total size
    if (stats.totalSize > 5000) {
      recommendations.push('Total user data is large - consider implementing data pagination');
    }
    
    // Analyze profile data
    if (stats.profileSize > 2000) {
      recommendations.push('Profile data is large - consider storing only essential fields');
    }
    
    const report: StorageReport = {
      timestamp,
      criticalDataSize: stats.criticalSize,
      profileDataSize: stats.profileSize,
      totalSize: stats.totalSize,
      secureStoreUsage: (stats.criticalSize / this.MAX_SECURESTORE_SIZE) * 100,
      asyncStorageUsage: stats.profileSize,
      recommendations,
    };
    
    this.reports.push(report);
    
    // Keep only last 10 reports
    if (this.reports.length > 10) {
      this.reports = this.reports.slice(-10);
    }
    
    return report;
  }

  /**
   * Log storage metrics with recommendations
   */
  async logStorageMetrics(context: string = 'Storage Check'): Promise<void> {
    const report = await this.generateReport();
    
    console.log(`📊 ${context} - Storage Report:`, {
      'Critical Data': `${report.criticalDataSize} bytes (${report.secureStoreUsage.toFixed(1)}% of SecureStore limit)`,
      'Profile Data': `${report.profileDataSize} bytes`,
      'Total Size': `${report.totalSize} bytes`,
      'Recommendations': report.recommendations.length > 0 ? report.recommendations : ['Storage usage is optimal'],
    });
    
    if (report.recommendations.length > 0) {
      console.warn('⚠️ Storage Recommendations:', report.recommendations);
    }
  }

  /**
   * Check if storage is approaching limits
   */
  async isStorageHealthy(): Promise<boolean> {
    const stats = await optimizedStorage.getStorageStats();
    return stats.criticalSize <= this.WARNING_THRESHOLD;
  }

  /**
   * Get storage health status
   */
  async getHealthStatus(): Promise<'healthy' | 'warning' | 'critical'> {
    const stats = await optimizedStorage.getStorageStats();
    
    if (stats.criticalSize > this.MAX_SECURESTORE_SIZE) {
      return 'critical';
    } else if (stats.criticalSize > this.WARNING_THRESHOLD) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get historical reports
   */
  getReports(): StorageReport[] {
    return [...this.reports];
  }

  /**
   * Clear historical reports
   */
  clearReports(): void {
    this.reports = [];
  }
}

// Export singleton instance
export const storageMonitor = StorageMonitor.getInstance();

// Export utility functions
export const logStorageMetrics = (context?: string) => storageMonitor.logStorageMetrics(context);
export const isStorageHealthy = () => storageMonitor.isStorageHealthy();
export const getStorageHealthStatus = () => storageMonitor.getHealthStatus();
