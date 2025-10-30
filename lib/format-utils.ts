import { IOCVerdict, IOCCategory, IOCType } from './api/types';

/**
 * Format verdict with appropriate styling
 */
export function formatVerdict(verdict: IOCVerdict): {
  label: string;
  variant: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  color: string;
} {
  switch (verdict) {
    case IOCVerdict.CLEAN:
      return { label: 'Clean', variant: 'clean', color: 'text-green-600' };
    case IOCVerdict.SUSPICIOUS:
      return { label: 'Suspicious', variant: 'suspicious', color: 'text-yellow-600' };
    case IOCVerdict.MALICIOUS:
      return { label: 'Malicious', variant: 'malicious', color: 'text-red-600' };
    case IOCVerdict.UNKNOWN:
    default:
      return { label: 'Unknown', variant: 'unknown', color: 'text-gray-600' };
  }
}

/**
 * Format category with appropriate styling
 */
export function formatCategory(category: IOCCategory): {
  label: string;
  icon: string;
  color: string;
} {
  switch (category) {
    case IOCCategory.MALWARE:
      return { label: 'Malware', icon: '🦠', color: 'text-red-600' };
    case IOCCategory.PHISHING:
      return { label: 'Phishing', icon: '🎣', color: 'text-orange-600' };
    case IOCCategory.RANSOMWARE:
      return { label: 'Ransomware', icon: '🔒', color: 'text-red-800' };
    case IOCCategory.BOTNET:
      return { label: 'Botnet', icon: '🤖', color: 'text-purple-600' };
    case IOCCategory.C2:
      return { label: 'C2 Server', icon: '📡', color: 'text-blue-600' };
    case IOCCategory.SPAM:
      return { label: 'Spam', icon: '📧', color: 'text-yellow-600' };
    case IOCCategory.UNKNOWN:
    default:
      return { label: 'Unknown', icon: '❓', color: 'text-gray-600' };
  }
}

/**
 * Format IOC type
 */
export function formatIOCType(type: IOCType): {
  label: string;
  icon: string;
} {
  switch (type) {
    case IOCType.HASH:
      return { label: 'File Hash', icon: '#️⃣' };
    case IOCType.URL:
      return { label: 'URL', icon: '🔗' };
    case IOCType.IP:
      return { label: 'IP Address', icon: '🌐' };
    case IOCType.DOMAIN:
      return { label: 'Domain', icon: '🏠' };
    case IOCType.FILE:
      return { label: 'File', icon: '📄' };
    default:
      return { label: 'Unknown', icon: '❓' };
  }
}

/**
 * Format confidence score
 */
export function formatConfidence(confidence: number): {
  label: string;
  color: string;
  width: string;
} {
  let color: string;
  let label: string;

  if (confidence >= 80) {
    color = 'bg-green-500';
    label = 'High';
  } else if (confidence >= 60) {
    color = 'bg-yellow-500';
    label = 'Medium';
  } else if (confidence >= 30) {
    color = 'bg-orange-500';
    label = 'Low';
  } else {
    color = 'bg-gray-400';
    label = 'Very Low';
  }

  return {
    label: `${label} (${confidence}%)`,
    color,
    width: `${confidence}%`,
  };
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Never';

  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return 'Never';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  }
}

/**
 * Validate IOC value based on type
 */
export function validateIOC(value: string, type: IOCType): {
  isValid: boolean;
  error?: string;
} {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return { isValid: false, error: 'IOC value is required' };
  }

  switch (type) {
    case IOCType.HASH:
      // Check for MD5 (32), SHA1 (40), SHA256 (64)
      const hexPattern = /^[a-fA-F0-9]+$/;
      if (!hexPattern.test(cleanValue)) {
        return { isValid: false, error: 'Hash must contain only hexadecimal characters' };
      }
      if (![32, 40, 64].includes(cleanValue.length)) {
        return { isValid: false, error: 'Hash must be 32 (MD5), 40 (SHA1), or 64 (SHA256) characters' };
      }
      break;

    case IOCType.URL:
      try {
        new URL(cleanValue);
      } catch {
        return { isValid: false, error: 'Invalid URL format' };
      }
      break;

    case IOCType.IP:
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(cleanValue)) {
        return { isValid: false, error: 'Invalid IP address format' };
      }
      const parts = cleanValue.split('.');
      if (parts.some(part => parseInt(part) > 255)) {
        return { isValid: false, error: 'IP address octets must be between 0-255' };
      }
      break;

    case IOCType.DOMAIN:
      const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainPattern.test(cleanValue)) {
        return { isValid: false, error: 'Invalid domain format' };
      }
      if (cleanValue.length > 253) {
        return { isValid: false, error: 'Domain name is too long' };
      }
      break;

    default:
      break;
  }

  return { isValid: true };
}