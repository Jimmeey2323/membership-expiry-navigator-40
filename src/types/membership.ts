
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
  status: 'Active' | 'Churned' | 'Frozen'; // Updated to only 3 statuses
  // New fields for user annotations
  comments?: string;
  notes?: string;
  tags?: string[];
  // AI-generated tags
  aiTags?: string[];
  aiAnalysisDate?: string;
  aiConfidence?: number;
  aiReasoning?: string;
  // Legacy field for backward compatibility
  sessionsLeft?: number;
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
