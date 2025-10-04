
export interface MembershipData {
  uniqueId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipName: string;
  endDate: string;
  location: string; // Now called "Home Location" in sheet
  currentUsage: string; // New field "Current Usage"
  itemId: string; // Now called "Id" in sheet
  orderDate: string; // Now called "Order At" in sheet
  soldBy: string;
  membershipId: string;
  frozen: string;
  paid: string;
  status: 'Active' | 'Churned' | 'Frozen' | 'Pending' | 'Suspended' | 'Trial'; // Updated to 6 status options
  // Enhanced annotation fields
  comments?: StructuredComment[];
  notes?: StructuredNote[];
  tags?: StructuredTag[];
  // Legacy string fields for backward compatibility
  commentsText?: string;
  notesText?: string;
  tagsText?: string[];
  // AI-generated tags
  aiTags?: string[];
  aiAnalysisDate?: string;
  aiConfidence?: number;
  aiReasoning?: string;
  aiSentiment?: string;
  aiChurnRisk?: string;
  // Legacy field for backward compatibility
  sessionsLeft?: number;
  // Force React re-render tracking
  lastUpdated?: number;
}

export interface StructuredComment {
  id: string;
  text: string;
  createdAt: string; // ISO timestamp
  createdBy: string; // Associate name
  editedAt?: string;
  editedBy?: string;
}

export interface StructuredNote {
  id: string;
  text: string;
  createdAt: string; // ISO timestamp
  createdBy: string; // Associate name
  editedAt?: string;
  editedBy?: string;
}

export interface StructuredTag {
  id: string;
  text: string;
  createdAt: string; // ISO timestamp
  createdBy: string; // Associate name
  color?: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  associate: string;
  type: 'comment';
}

export interface Note {
  id: string;
  text: string;
  timestamp: Date;
  associate: string;
  type: 'note';
}

export interface Tag {
  id: string;
  text: string;
  timestamp: Date;
  associate: string;
  color?: string;
}

export interface MemberAnnotation {
  memberId: string;
  email: string;
  comments: string;
  notes: string;
  tags: string;
  lastUpdated: string;
}

export interface FilterOptions {
  status: string[];
  locations: string[];
  membershipTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sessionsRange: {
    min: number;
    max: number;
  };
}

export interface FilterState {
  search: string;
  status: string;
  location: string;
  membershipType: string;
  expiryDateFrom: string;
  expiryDateTo: string;
  sessionsFrom: string;
  sessionsTo: string;
}

export type ViewMode = 'table' | 'kanban' | 'timeline' | 'pivot' | 'list' | 'grid' | 'calendar';

export interface ViewConfig {
  mode: ViewMode;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  columns?: string[];
  filters?: FilterState;
}

export interface LapsingMember extends MembershipData {
  daysUntilExpiry: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  lastContact?: string;
  followUpRequired?: boolean;
}
