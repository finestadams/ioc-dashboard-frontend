// IOC Types and Interfaces
export enum IOCType {
  HASH = 'hash',
  URL = 'url',
  IP = 'ip',
  DOMAIN = 'domain',
  FILE = 'file'
}

export enum IOCVerdict {
  CLEAN = 'clean',
  SUSPICIOUS = 'suspicious',
  MALICIOUS = 'malicious',
  UNKNOWN = 'unknown'
}

export enum IOCCategory {
  PHISHING = 'phishing',
  MALWARE = 'malware',
  BOTNET = 'botnet',
  SPAM = 'spam',
  C2 = 'c2',
  RANSOMWARE = 'ransomware',
  UNKNOWN = 'unknown'
}

export interface SingleIOCRequest {
  value: string;
  type: IOCType;
  description?: string;
}

export interface BulkIOCRequest {
  iocs: SingleIOCRequest[];
}

export interface IOCResult {
  id: string;
  value: string;
  type: IOCType;
  verdict: IOCVerdict;
  category: IOCCategory;
  confidence: number;
  detectionCount: number;
  totalEngines: number;
  lastSeen?: string;
  sources: string[];
  metadata: Record<string, any>;
  createdAt: string;
}

export interface BulkAnalysisResult {
  totalProcessed: number;
  results: IOCResult[];
  errors: Array<{
    value: string;
    error: string;
  }>;
  summary: {
    clean: number;
    suspicious: number;
    malicious: number;
    unknown: number;
  };
}

export interface FileAnalysisResult {
  filename: string;
  fileSize: number;
  mimeType: string;
  hashes: {
    md5: string;
    sha1: string;
    sha256: string;
  };
  verdict: IOCVerdict;
  category: IOCCategory;
  detectionCount: number;
  totalEngines: number;
  metadata: Record<string, any>;
}

export interface HealthCheckResult {
  status: string;
  timestamp: string;
  providers: Array<{
    name: string;
    status: string;
  }>;
}