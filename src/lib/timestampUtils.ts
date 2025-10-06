/**
 * Timestamp utilities for auto-populating date columns and annotations
 */

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const getCurrentDateIST = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().slice(0, 19).replace('T', ' ');
};

export const formatDateTimeForUI = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return timestamp;
  }
};

export const getDateOnlyIST = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().slice(0, 10); // YYYY-MM-DD format
};

/**
 * Creates an auto-timestamped annotation entry
 */
export const createTimestampedAnnotation = (
  text: string, 
  createdBy: string, 
  type: 'comment' | 'note'
): any => {
  const timestamp = getCurrentTimestamp();
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    createdAt: timestamp,
    createdBy,
    type,
    lastEditedAt: timestamp,
    lastEditedBy: createdBy
  };
};

/**
 * Formats timestamp in IST for display purposes
 */
export const formatTimestampIST = (timestamp: string | Date): string => {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};