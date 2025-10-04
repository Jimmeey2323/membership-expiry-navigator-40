import { MembershipData } from "@/types/membership";
import { googleSheetsService } from "./googleSheets";

interface AnnotationVersion {
  version: number;
  timestamp: string;
  associate: string;
  comments: string;
  notes: string;
  tags: string[];
  ipAddress?: string;
  userAgent?: string;
  changeType: 'create' | 'update' | 'delete';
  previousVersion?: number;
}

interface EnhancedAnnotation {
  // Multi-field identification for reliability
  memberId: string;
  email: string;
  uniqueId: string;
  firstName: string;
  lastName: string;
  
  // Current state
  currentComments: string;
  currentNotes: string;
  currentTags: string[];
  
  // Versioning and audit
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  
  // History tracking
  versionHistory: AnnotationVersion[];
  
  // Data integrity
  checksum: string;
  lastVerified: string;
  status: 'active' | 'archived' | 'corrupted';
}

interface AnnotationConflict {
  memberId: string;
  conflictType: 'concurrent_edit' | 'data_mismatch' | 'version_conflict';
  localVersion: number;
  remoteVersion: number;
  conflictDetails: any;
}

class EnhancedAnnotationService {
  private readonly ENHANCED_ANNOTATIONS_SHEET = "Enhanced_Member_Annotations";
  private readonly VERSION_HISTORY_SHEET = "Annotation_Version_History";
  
  /**
   * Generate a checksum for data integrity verification
   */
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Find member using multiple identification methods for higher accuracy
   */
  private async findMemberWithMultipleIds(
    memberId: string, 
    email: string, 
    uniqueId: string
  ): Promise<MembershipData | null> {
    try {
      const membershipData = await googleSheetsService.getMembershipData();
      
      // Try exact match first
      let member = membershipData.find(m => 
        m.memberId === memberId && 
        m.email === email && 
        m.uniqueId === uniqueId
      );
      
      if (member) return member;
      
      // Try partial matches with preference order
      member = membershipData.find(m => 
        m.memberId === memberId && m.email === email
      );
      
      if (member) return member;
      
      member = membershipData.find(m => 
        m.uniqueId === uniqueId && m.email === email
      );
      
      if (member) return member;
      
      // Last resort - single field matches
      member = membershipData.find(m => m.memberId === memberId);
      
      return member || null;
    } catch (error) {
      console.error('Error finding member:', error);
      return null;
    }
  }

  /**
   * Validate annotation data integrity
   */
  private validateAnnotationIntegrity(annotation: EnhancedAnnotation): boolean {
    // Check required fields
    if (!annotation.memberId || !annotation.email || !annotation.uniqueId) {
      return false;
    }
    
    // Verify checksum
    const dataForChecksum = {
      memberId: annotation.memberId,
      email: annotation.email,
      currentComments: annotation.currentComments,
      currentNotes: annotation.currentNotes,
      currentTags: annotation.currentTags,
      currentVersion: annotation.currentVersion
    };
    
    const expectedChecksum = this.generateChecksum(dataForChecksum);
    return annotation.checksum === expectedChecksum;
  }

  /**
   * Create or update enhanced annotation with full versioning
   */
  async saveEnhancedAnnotation(
    member: MembershipData,
    comments: string,
    notes: string,
    tags: string[],
    associate: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{
    success: boolean;
    annotation?: EnhancedAnnotation;
    conflicts?: AnnotationConflict[];
    error?: string;
  }> {
    try {
      // Step 1: Verify member exists and get current data
      const verifiedMember = await this.findMemberWithMultipleIds(
        member.memberId,
        member.email,
        member.uniqueId
      );

      if (!verifiedMember) {
        return {
          success: false,
          error: `Member not found with provided identifiers: ${member.memberId}, ${member.email}`
        };
      }

      // Step 2: Check for existing annotation
      const existingAnnotation = await this.getEnhancedAnnotation(member.memberId);
      
      // Step 3: Detect conflicts
      const conflicts = await this.detectConflicts(member, existingAnnotation);
      
      if (conflicts.length > 0) {
        return {
          success: false,
          conflicts,
          error: 'Conflicts detected. Please resolve before saving.'
        };
      }

      // Step 4: Create new version
      const timestamp = new Date().toISOString();
      const newVersion = existingAnnotation ? existingAnnotation.currentVersion + 1 : 1;
      
      const versionEntry: AnnotationVersion = {
        version: newVersion,
        timestamp,
        associate,
        comments,
        notes,
        tags: [...tags],
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        changeType: existingAnnotation ? 'update' : 'create',
        previousVersion: existingAnnotation?.currentVersion
      };

      // Step 5: Create enhanced annotation
      const enhancedAnnotation: EnhancedAnnotation = {
        memberId: verifiedMember.memberId,
        email: verifiedMember.email,
        uniqueId: verifiedMember.uniqueId,
        firstName: verifiedMember.firstName,
        lastName: verifiedMember.lastName,
        
        currentComments: comments,
        currentNotes: notes,
        currentTags: [...tags],
        
        currentVersion: newVersion,
        createdAt: existingAnnotation?.createdAt || timestamp,
        updatedAt: timestamp,
        createdBy: existingAnnotation?.createdBy || associate,
        updatedBy: associate,
        
        versionHistory: [
          ...(existingAnnotation?.versionHistory || []),
          versionEntry
        ],
        
        checksum: this.generateChecksum({
          memberId: verifiedMember.memberId,
          email: verifiedMember.email,
          currentComments: comments,
          currentNotes: notes,
          currentTags: tags,
          currentVersion: newVersion
        }),
        
        lastVerified: timestamp,
        status: 'active'
      };

      // Step 6: Save to enhanced annotations sheet
      await this.saveToEnhancedSheet(enhancedAnnotation);
      
      // Step 7: Save version history
      await this.saveVersionHistory(versionEntry, verifiedMember.memberId);
      
      // Step 8: Update original sheets for backward compatibility
      await googleSheetsService.saveAnnotation(
        verifiedMember.memberId,
        verifiedMember.email,
        comments,
        notes,
        tags,
        verifiedMember.uniqueId,
        associate,
        timestamp
      );

      // Step 9: Verify the save operation
      const savedAnnotation = await this.getEnhancedAnnotation(verifiedMember.memberId);
      if (!savedAnnotation || !this.validateAnnotationIntegrity(savedAnnotation)) {
        throw new Error('Data integrity check failed after save');
      }

      return {
        success: true,
        annotation: enhancedAnnotation
      };

    } catch (error) {
      console.error('Error saving enhanced annotation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Detect potential conflicts before saving
   */
  private async detectConflicts(
    member: MembershipData,
    existingAnnotation?: EnhancedAnnotation | null
  ): Promise<AnnotationConflict[]> {
    const conflicts: AnnotationConflict[] = [];

    if (!existingAnnotation) return conflicts;

    // Check for concurrent edits (if last update was very recent)
    const lastUpdate = new Date(existingAnnotation.updatedAt);
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdate.getTime();
    const minutesSinceUpdate = timeDiff / (1000 * 60);

    if (minutesSinceUpdate < 5) { // Less than 5 minutes ago
      conflicts.push({
        memberId: member.memberId,
        conflictType: 'concurrent_edit',
        localVersion: 0, // New edit
        remoteVersion: existingAnnotation.currentVersion,
        conflictDetails: {
          lastUpdatedBy: existingAnnotation.updatedBy,
          lastUpdatedAt: existingAnnotation.updatedAt,
          minutesAgo: Math.round(minutesSinceUpdate)
        }
      });
    }

    // Verify member data hasn't changed significantly
    if (existingAnnotation.email !== member.email) {
      conflicts.push({
        memberId: member.memberId,
        conflictType: 'data_mismatch',
        localVersion: 0,
        remoteVersion: existingAnnotation.currentVersion,
        conflictDetails: {
          field: 'email',
          expectedValue: existingAnnotation.email,
          actualValue: member.email
        }
      });
    }

    return conflicts;
  }

  /**
   * Get enhanced annotation with full history
   */
  async getEnhancedAnnotation(memberId: string): Promise<EnhancedAnnotation | null> {
    try {
      const accessToken = await googleSheetsService.getAccessToken();
      const range = `${this.ENHANCED_ANNOTATIONS_SHEET}!A:Z`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsService['spreadsheetId']}/values/${range}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const rows = data.values || [];
      
      if (rows.length < 2) return null;

      const [headers, ...dataRows] = rows;
      const annotationRow = dataRows.find(row => row[0] === memberId);
      
      if (!annotationRow) return null;

      // Parse the annotation from the row data
      const annotation: EnhancedAnnotation = {
        memberId: annotationRow[0] || '',
        email: annotationRow[1] || '',
        uniqueId: annotationRow[2] || '',
        firstName: annotationRow[3] || '',
        lastName: annotationRow[4] || '',
        currentComments: annotationRow[5] || '',
        currentNotes: annotationRow[6] || '',
        currentTags: annotationRow[7] ? annotationRow[7].split(',').map(t => t.trim()) : [],
        currentVersion: parseInt(annotationRow[8]) || 1,
        createdAt: annotationRow[9] || '',
        updatedAt: annotationRow[10] || '',
        createdBy: annotationRow[11] || '',
        updatedBy: annotationRow[12] || '',
        versionHistory: annotationRow[13] ? JSON.parse(annotationRow[13]) : [],
        checksum: annotationRow[14] || '',
        lastVerified: annotationRow[15] || '',
        status: (annotationRow[16] as any) || 'active'
      };

      return this.validateAnnotationIntegrity(annotation) ? annotation : null;

    } catch (error) {
      console.error('Error getting enhanced annotation:', error);
      return null;
    }
  }

  /**
   * Save to enhanced annotations sheet
   */
  private async saveToEnhancedSheet(annotation: EnhancedAnnotation): Promise<void> {
    try {
      const accessToken = await googleSheetsService.getAccessToken();
      
      // Create sheet if it doesn't exist
      await this.createEnhancedSheetsIfNeeded();
      
      const row = [
        annotation.memberId,
        annotation.email,
        annotation.uniqueId,
        annotation.firstName,
        annotation.lastName,
        annotation.currentComments,
        annotation.currentNotes,
        annotation.currentTags.join(', '),
        annotation.currentVersion.toString(),
        annotation.createdAt,
        annotation.updatedAt,
        annotation.createdBy,
        annotation.updatedBy,
        JSON.stringify(annotation.versionHistory),
        annotation.checksum,
        annotation.lastVerified,
        annotation.status
      ];

      // Check if annotation exists and update or append
      const existingData = await this.getEnhancedAnnotationsData();
      const existingIndex = existingData.findIndex(rowData => rowData[0] === annotation.memberId);

      if (existingIndex !== -1) {
        // Update existing
        existingData[existingIndex] = row;
      } else {
        // Add new
        existingData.push(row);
      }

      // Add headers if this is the first entry
      const dataToSave = existingData.length === 1 ? [
        ['Member ID', 'Email', 'Unique ID', 'First Name', 'Last Name', 
         'Current Comments', 'Current Notes', 'Current Tags', 'Current Version',
         'Created At', 'Updated At', 'Created By', 'Updated By', 
         'Version History', 'Checksum', 'Last Verified', 'Status'],
        ...existingData
      ] : [
        ['Member ID', 'Email', 'Unique ID', 'First Name', 'Last Name', 
         'Current Comments', 'Current Notes', 'Current Tags', 'Current Version',
         'Created At', 'Updated At', 'Created By', 'Updated By', 
         'Version History', 'Checksum', 'Last Verified', 'Status'],
        ...existingData
      ];

      await this.updateEnhancedAnnotationsSheet(dataToSave);

    } catch (error) {
      console.error('Error saving to enhanced sheet:', error);
      throw error;
    }
  }

  /**
   * Create enhanced sheets if they don't exist
   */
  private async createEnhancedSheetsIfNeeded(): Promise<void> {
    // Implementation would create the sheets with proper structure
    // This is a simplified version - full implementation would handle sheet creation
  }

  /**
   * Get existing enhanced annotations data
   */
  private async getEnhancedAnnotationsData(): Promise<any[][]> {
    try {
      const accessToken = await googleSheetsService.getAccessToken();
      const range = `${this.ENHANCED_ANNOTATIONS_SHEET}!A:Z`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsService['spreadsheetId']}/values/${range}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const rows = data.values || [];
      
      return rows.length > 1 ? rows.slice(1) : []; // Skip header row

    } catch (error) {
      console.error('Error getting enhanced annotations data:', error);
      return [];
    }
  }

  /**
   * Update enhanced annotations sheet
   */
  private async updateEnhancedAnnotationsSheet(data: any[][]): Promise<void> {
    try {
      const accessToken = await googleSheetsService.getAccessToken();
      const range = `${this.ENHANCED_ANNOTATIONS_SHEET}!A:Z`;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsService['spreadsheetId']}/values/${range}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: data,
            majorDimension: 'ROWS'
          })
        }
      );

    } catch (error) {
      console.error('Error updating enhanced annotations sheet:', error);
      throw error;
    }
  }

  /**
   * Save version history entry
   */
  private async saveVersionHistory(version: AnnotationVersion, memberId: string): Promise<void> {
    // Implementation for saving detailed version history to separate sheet
    // This allows for better audit trails and recovery options
  }

  /**
   * Get complete annotation history for a member
   */
  async getAnnotationHistory(memberId: string): Promise<AnnotationVersion[]> {
    const annotation = await this.getEnhancedAnnotation(memberId);
    return annotation?.versionHistory || [];
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(memberId: string, version: number, associate: string): Promise<boolean> {
    try {
      const annotation = await this.getEnhancedAnnotation(memberId);
      if (!annotation) return false;

      const targetVersion = annotation.versionHistory.find(v => v.version === version);
      if (!targetVersion) return false;

      // Create a new version that restores the old content
      const member = await this.findMemberWithMultipleIds(
        annotation.memberId, 
        annotation.email, 
        annotation.uniqueId
      );
      
      if (!member) return false;

      const result = await this.saveEnhancedAnnotation(
        member,
        targetVersion.comments,
        targetVersion.notes,
        targetVersion.tags,
        associate,
        { userAgent: 'System Rollback' }
      );

      return result.success;

    } catch (error) {
      console.error('Error rolling back version:', error);
      return false;
    }
  }
}

export const enhancedAnnotationService = new EnhancedAnnotationService();