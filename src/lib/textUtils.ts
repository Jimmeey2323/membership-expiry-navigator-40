/**
 * Utility functions for cleaning and formatting text content
 */

/**
 * Clean text by removing special characters and normalizing whitespace
 */
export const cleanText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove special characters except basic punctuation
    .replace(/[^\w\s.,!?;:()\-'"]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
};

/**
 * Convert text to sentence case (first letter uppercase, rest lowercase)
 */
export const toSentenceCase = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  const cleaned = cleanText(text);
  if (!cleaned) return '';
  
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
};

/**
 * Extract first name from email address or full name
 */
export const extractFirstName = (nameOrEmail: string): string => {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') return '';
  
  // If it contains @, it's an email - extract part before @
  if (nameOrEmail.includes('@')) {
    const emailPrefix = nameOrEmail.split('@')[0];
    // Handle common email patterns like firstname.lastname or firstname_lastname
    const namePart = emailPrefix.replace(/[._-]/g, ' ').trim();
    const parts = namePart.split(' ');
    return toSentenceCase(parts[0]);
  }
  
  // If it's already a name, extract first part
  const nameParts = nameOrEmail.trim().split(' ');
  return toSentenceCase(nameParts[0]);
};

/**
 * Split text into sentences and return as array
 */
export const splitIntoSentences = (text: string): string[] => {
  if (!text || typeof text !== 'string') return [];
  
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  
  // Split on sentence endings, filter empty, and trim
  return cleaned
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
    .map(sentence => toSentenceCase(sentence));
};

/**
 * Format text as a bulleted list for display
 */
export const formatAsBulletedList = (text: string): string[] => {
  if (!text || typeof text !== 'string') return [];
  
  // Check if already contains bullet points or list items
  const lines = text.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);
  
  // If it's already a list format, clean and return
  if (lines.some(line => line.match(/^[-•*]\s/))) {
    return lines
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .map(line => toSentenceCase(line));
  }
  
  // Split into sentences if it's paragraph text
  return splitIntoSentences(text);
};

/**
 * Truncate text with ellipsis if it exceeds maxLength
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text || typeof text !== 'string') return '';
  
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) return cleaned;
  
  return cleaned.substring(0, maxLength).trim() + '...';
};

/**
 * Process text for display in table cells
 */
export const processTextForDisplay = (text: string): {
  formatted: string[];
  truncated: string;
  original: string;
} => {
  const original = text || '';
  const formatted = formatAsBulletedList(original);
  const truncated = truncateText(formatted.join('. '), 100);
  
  return {
    formatted,
    truncated,
    original: cleanText(original)
  };
};