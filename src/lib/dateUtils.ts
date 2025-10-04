/**
 * Utility functions for formatting dates and times in IST (Indian Standard Time)
 */

export const formatDateIST = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to IST (UTC+5:30)
  const istDate = new Date(dateObj.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  return istDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatTimeIST = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to IST (UTC+5:30)
  const istDate = new Date(dateObj.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  return istDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const formatDateTimeIST = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to IST (UTC+5:30)
  const istDate = new Date(dateObj.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  const dateStr = istDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const timeStr = istDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  return `${dateStr}, ${timeStr}`;
};

export const getCurrentMonthDateRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: startOfMonth.toISOString().split('T')[0],
    end: endOfMonth.toISOString().split('T')[0]
  };
};

export const isCurrentMonth = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

/**
 * Parse annotation text to extract structured data with timestamps and associates
 */
export interface ParsedAnnotation {
  text: string;
  createdBy?: string;
  createdAt?: string;
  editedBy?: string;
  editedAt?: string;
}

export const parseAnnotationText = (text: string): ParsedAnnotation[] => {
  if (!text) return [];
  
  // Split by common delimiters that might separate different entries
  const entries = text.split(/\n---\n|\n===\n|\n\*\*\*\n/).filter(entry => entry.trim());
  
  return entries.map(entry => {
    const lines = entry.trim().split('\n');
    let mainText = '';
    let createdBy = '';
    let createdAt = '';
    let editedBy = '';
    let editedAt = '';
    
    for (const line of lines) {
      // Look for metadata patterns
      const createdMatch = line.match(/\[Created by:\s*(.+?)\s*at\s*(.+?)\]/i);
      const editedMatch = line.match(/\[Last edited by:\s*(.+?)\s*at\s*(.+?)\]/i);
      const authorMatch = line.match(/^(.+?)\s*•\s*(.+?)$/); // Pattern like "Test Created by: Akshay Rane • 10/3/2025, 8:22:41 AM"
      
      if (createdMatch) {
        createdBy = createdMatch[1].trim();
        createdAt = createdMatch[2].trim();
      } else if (editedMatch) {
        editedBy = editedMatch[1].trim();
        editedAt = editedMatch[2].trim();
      } else if (authorMatch) {
        const authorPart = authorMatch[1].trim();
        const datePart = authorMatch[2].trim();
        
        // Extract actual author name (remove "Created by:" prefix if present)
        const createdByMatch = authorPart.match(/Created by:\s*(.+)/i);
        if (createdByMatch) {
          createdBy = createdByMatch[1].trim();
        } else {
          createdBy = authorPart;
        }
        createdAt = datePart;
      } else if (!line.match(/^\[/) && line.trim()) {
        // This is actual content, not metadata
        mainText += (mainText ? '\n' : '') + line.trim();
      }
    }
    
    return {
      text: mainText || entry.trim(),
      createdBy: createdBy || undefined,
      createdAt: createdAt || undefined,
      editedBy: editedBy || undefined,
      editedAt: editedAt || undefined
    };
  });
};