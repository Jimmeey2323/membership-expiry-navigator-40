import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DateRange {
  start: string;
  end: string;
}

export interface GlobalFilters {
  search: string;
  status: string[];
  location: string[];
  membershipType: string[];
  dateRange: DateRange;
  sessionsRange: {
    min: number;
    max: number;
  };
  hasAnnotations: boolean;
  expiryRange: string;
  customFilters: string[];
  highValue: boolean;
  lowSessions: boolean;
}

interface FilterContextType {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  updateFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  clearAllFilters: () => void;
  getFilteredData: <T extends Record<string, any>>(data: T[]) => T[];
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
}

const defaultFilters: GlobalFilters = {
  search: '',
  status: [],
  location: [],
  membershipType: [],
  dateRange: { start: '', end: '' },
  sessionsRange: { min: 0, max: 100 },
  hasAnnotations: false,
  expiryRange: 'all',
  customFilters: [],
  highValue: false,
  lowSessions: false,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);

  const updateFilter = <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.search !== '' ||
      filters.status.length > 0 ||
      filters.location.length > 0 ||
      filters.membershipType.length > 0 ||
      filters.dateRange.start !== '' ||
      filters.dateRange.end !== '' ||
      filters.sessionsRange.min > 0 ||
      filters.sessionsRange.max < 100 ||
      filters.hasAnnotations ||
      filters.expiryRange !== 'all' ||
      filters.customFilters.length > 0 ||
      filters.highValue ||
      filters.lowSessions
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    count += filters.status.length;
    count += filters.location.length;
    count += filters.membershipType.length;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.sessionsRange.min > 0 || filters.sessionsRange.max < 100) count++;
    if (filters.hasAnnotations) count++;
    if (filters.expiryRange !== 'all') count++;
    count += filters.customFilters.length;
    if (filters.highValue) count++;
    if (filters.lowSessions) count++;
    return count;
  };

  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const getFilteredData = <T extends Record<string, any>>(data: T[]): T[] => {
    return data.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableFields = [
          item.firstName,
          item.lastName,
          item.email,
          item.memberId,
          item.membershipName,
          item.location
        ].filter(Boolean);
        
        const matchesSearch = searchableFields.some(field => 
          String(field).toLowerCase().includes(searchLower)
        );
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(item.status)) {
        return false;
      }

      // Location filter
      if (filters.location.length > 0 && !filters.location.includes(item.location)) {
        return false;
      }

      // Membership type filter
      if (filters.membershipType.length > 0 && !filters.membershipType.includes(item.membershipName)) {
        return false;
      }

      // Date range filter (on end date)
      if (filters.dateRange.start || filters.dateRange.end) {
        const itemDate = parseDate(item.endDate);
        if (!itemDate) return false;

        if (filters.dateRange.start) {
          const startDate = parseDate(filters.dateRange.start);
          if (startDate && itemDate < startDate) return false;
        }

        if (filters.dateRange.end) {
          const endDate = parseDate(filters.dateRange.end);
          if (endDate && itemDate > endDate) return false;
        }
      }

      // Sessions range filter
      if (item.sessionsLeft !== undefined) {
        const sessions = Number(item.sessionsLeft) || 0;
        if (sessions < filters.sessionsRange.min || sessions > filters.sessionsRange.max) {
          return false;
        }
      }

      // Expiry range filter
      if (filters.expiryRange !== 'all' && item.endDate) {
        const endDate = parseDate(item.endDate);
        if (endDate) {
          const now = new Date();
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          switch (filters.expiryRange) {
            case 'expired':
              if (daysUntilExpiry >= 0) return false;
              break;
            case 'expiring-week':
              if (daysUntilExpiry < 0 || daysUntilExpiry > 7) return false;
              break;
            case 'expiring-month':
              if (daysUntilExpiry < 0 || daysUntilExpiry > 30) return false;
              break;
            case 'future':
              if (daysUntilExpiry <= 30) return false;
              break;
          }
        }
      }

      // Has annotations filter
      if (filters.hasAnnotations) {
        const hasComments = item.comments && item.comments.trim();
        const hasNotes = item.notes && item.notes.trim();
        const hasTags = item.tags && item.tags.length > 0;
        
        if (!hasComments && !hasNotes && !hasTags) {
          return false;
        }
      }

      // High value filter
      if (filters.highValue) {
        const paid = parseFloat(item.paid) || 0;
        if (paid <= 5000) return false;
      }

      // Low sessions filter
      if (filters.lowSessions) {
        const sessions = Number(item.sessionsLeft) || 0;
        if (sessions > 3) return false;
      }

      // Custom filters
      if (filters.customFilters.length > 0) {
        for (const customFilter of filters.customFilters) {
          switch (customFilter) {
            case 'premium':
              // Define your premium logic here
              const isPremium = parseFloat(item.paid) > 10000;
              if (!isPremium) return false;
              break;
            case 'high-value':
              const isHighValue = parseFloat(item.paid) > 5000;
              if (!isHighValue) return false;
              break;
            case 'low-sessions':
              const hasLowSessions = (Number(item.sessionsLeft) || 0) <= 3;
              if (!hasLowSessions) return false;
              break;
            case 'expiring-week':
              if (item.endDate) {
                const endDate = parseDate(item.endDate);
                if (endDate) {
                  const now = new Date();
                  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  if (!(endDate >= now && endDate <= nextWeek && item.status === 'Active')) {
                    return false;
                  }
                }
              }
              break;
            case 'expiring-month':
              if (item.endDate) {
                const endDate = parseDate(item.endDate);
                if (endDate) {
                  const now = new Date();
                  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                  if (!(endDate >= now && endDate <= nextMonth && item.status === 'Active')) {
                    return false;
                  }
                }
              }
              break;
          }
        }
      }

      return true;
    });
  };

  const value: FilterContextType = {
    filters,
    setFilters,
    updateFilter,
    clearAllFilters,
    getFilteredData,
    hasActiveFilters,
    getActiveFilterCount,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};