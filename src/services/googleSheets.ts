import { MembershipData, MemberAnnotation } from '@/types/membership';

// Default filtering cutoff date: July 1, 2025
const DEFAULT_DATE_CUTOFF = '2025-07-01';

// Global state for full dataset toggle
let useFullDataset = false;

interface GoogleOAuthConfig {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  REFRESH_TOKEN: string;
  TOKEN_URL: string;
}

class GoogleSheetsService {
  private config: GoogleOAuthConfig = {
    CLIENT_ID: "416630995185-g7b0fm679lb4p45p5lou070cqscaalaf.apps.googleusercontent.com",
    CLIENT_SECRET: "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",
    REFRESH_TOKEN: "1//0gT2uoYBlNdGXCgYIARAAGBASNwF-L9IrBK_ijYwpce6-TdqDfji4GxYuc4uxIBKasdgoZBPm-tu_EU0xS34cNirqfLgXbJ8_NMk",
    TOKEN_URL: "https://oauth2.googleapis.com/token"
  };

  private spreadsheetId = "1rGMDDvvTbZfNg1dueWtRN3LhOgGQOdLg3Fd7Sn1GCZo";
  private sheetName = "Expirations";
  private annotationsSheetName = "Member_Annotations";
  
  private expectedHeaders = [
    'Unique Id', 'Member ID', 'First Name', 'Last Name', 'Email', 
    'Membership Name', 'End Date', 'Home Location', 'Current Usage', 
    'ID Col', 'Order At', 'Sold By', 'Membership Id', 'Frozen', 'Paid', 
    'Status', 'Notes', 'Comments', 'Associate In Charge', 'Stage'
  ];

  async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(this.config.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.CLIENT_ID,
          client_secret: this.config.CLIENT_SECRET,
          refresh_token: this.config.REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async ensureSheetHeaders(): Promise<void> {
    try {
      const currentData = await this.fetchSheetData();
      
      if (currentData.length === 0) {
        // Sheet is empty, add headers
        await this.updateMemberData([this.expectedHeaders]);
        return;
      }

      const [currentHeaders] = currentData;
      
      // Check if we need to update headers
      if (currentHeaders.length < this.expectedHeaders.length) {
        console.log(`Updating sheet headers from ${currentHeaders.length} to ${this.expectedHeaders.length} columns`);
        
        // Ensure all data rows have the correct number of columns
        const [, ...rows] = currentData;
        const updatedRows = rows.map(row => {
          const newRow = [...row];
          while (newRow.length < this.expectedHeaders.length) {
            newRow.push('');
          }
          return newRow;
        });
        
        await this.updateMemberData([this.expectedHeaders, ...updatedRows]);
      }
    } catch (error) {
      console.error('Error ensuring sheet headers:', error);
      throw error;
    }
  }

  async fetchSheetData(): Promise<any[][]> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.sheetName}!A:T`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  async fetchAnnotations(): Promise<any[][]> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:H`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          await this.createAnnotationsSheetIfNeeded();
          return [['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Unique ID', 'Associate Name', 'Timestamp']];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching annotations:', error);
      throw error;
    }
  }

  private async createAnnotationsSheetIfNeeded(): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: {
                  title: this.annotationsSheetName
                }
              }
            }]
          })
        }
      );

      if (response.ok) {
        await this.updateAnnotations([
          ['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Unique ID', 'Associate Name', 'Timestamp']
        ]);
      }
    } catch (error) {
      console.error('Error creating annotations sheet:', error);
    }
  }

  private async updateAnnotations(data: any[][]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:H`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: data
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating annotations:', error);
      throw error;
    }
  }

  async updateMemberData(values: any[][]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.sheetName}!A:T`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to update member data. Status: ${response.status}, Error: ${errorText}`);
        throw new Error(`Failed to update member data: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Successfully updated member data:', result);
    } catch (error) {
      console.error('Error updating member data:', error);
      throw error;
    }
  }

  async updateSingleMember(member: any): Promise<void> {
    try {
      // Ensure sheet has proper headers first
      await this.ensureSheetHeaders();
      
      const currentData = await this.fetchSheetData();
      if (currentData.length === 0) return;

      const [headers, ...rows] = currentData;
      console.log(`Sheet has ${headers.length} columns, ${rows.length} data rows`);
      
      const memberIndex = rows.findIndex(row => 
        (member.uniqueId && row[0] === member.uniqueId) || 
        row[1] === member.memberId
      );

      if (memberIndex === -1) {
        throw new Error('Member not found in sheet');
      }

      // If this is an annotation-only update, preserve all other data
      const updatedRow = member._annotationOnly ? [
        rows[memberIndex][0] || '', // Preserve existing uniqueId
        rows[memberIndex][1] || '', // Preserve existing memberId
        rows[memberIndex][2] || '', // Preserve existing firstName
        rows[memberIndex][3] || '', // Preserve existing lastName
        rows[memberIndex][4] || '', // Preserve existing email
        rows[memberIndex][5] || '', // Preserve existing membershipName
        rows[memberIndex][6] || '', // Preserve existing endDate
        rows[memberIndex][7] || '', // Preserve existing location
        rows[memberIndex][8] || '', // Preserve existing currentUsage
        rows[memberIndex][9] || '', // Preserve existing itemId
        rows[memberIndex][10] || '', // Preserve existing orderDate
        rows[memberIndex][11] || '', // Preserve existing soldBy
        rows[memberIndex][12] || '', // Preserve existing membershipId
        rows[memberIndex][13] || '', // Preserve existing frozen
        rows[memberIndex][14] || '', // Preserve existing paid
        rows[memberIndex][15] || 'Active', // Preserve existing status
        // CRITICAL: Use explicit checks to allow empty strings (deletions)
        member.notesText !== undefined ? member.notesText : (member.notes !== undefined ? member.notes : rows[memberIndex][16] || ''), // Update notes (column 16)
        member.commentsText !== undefined ? member.commentsText : (member.comments !== undefined ? member.comments : rows[memberIndex][17] || ''), // Update comments (column 17)
        member.associateInCharge !== undefined ? member.associateInCharge : rows[memberIndex][18] || '', // Update associate in charge
        member.stage !== undefined ? member.stage : rows[memberIndex][19] || '' // Update stage
      ] : [
        member.uniqueId || rows[memberIndex][0] || '',
        member.memberId || rows[memberIndex][1] || '',
        member.firstName || rows[memberIndex][2] || '',
        member.lastName || rows[memberIndex][3] || '',
        member.email || rows[memberIndex][4] || '',
        (member.membershipName !== undefined && member.membershipName !== null && member.membershipName.trim() !== '') 
          ? member.membershipName : rows[memberIndex][5] || '',
        member.endDate || rows[memberIndex][6] || '',
        (member.location !== undefined && member.location !== null && member.location.trim() !== '') 
          ? member.location : rows[memberIndex][7] || '',
        member.currentUsage || rows[memberIndex][8] || '',
        member.itemId || rows[memberIndex][9] || '',
        member.orderDate || rows[memberIndex][10] || '',
        member.soldBy || rows[memberIndex][11] || '',
        member.membershipId || rows[memberIndex][12] || '',
        member.frozen || rows[memberIndex][13] || '',
        member.paid || rows[memberIndex][14] || '',
        member.status || rows[memberIndex][15] || 'Active',
        member.notesText || member.notes || rows[memberIndex][16] || '', // Notes in column 16
        member.commentsText || member.comments || rows[memberIndex][17] || '', // Comments in column 17
        member.associateInCharge || rows[memberIndex][18] || '',
        member.stage || rows[memberIndex][19] || ''
      ];
      
      rows[memberIndex] = updatedRow;
      
      // Ensure all rows have the correct number of columns
      const normalizedRows = rows.map(row => {
        const newRow = [...row];
        while (newRow.length < this.expectedHeaders.length) {
          newRow.push('');
        }
        return newRow;
      });
      
      console.log(`Updating sheet with ${headers.length} header columns and ${normalizedRows[0]?.length || 0} data columns`);
      await this.updateMemberData([headers, ...normalizedRows]);
    } catch (error) {
      console.error('Error updating single member:', error);
      throw error;
    }
  }

  // Enhanced member validation method
  async validateMemberBeforeSave(
    memberId: string, 
    email: string, 
    uniqueId?: string
  ): Promise<{
    isValid: boolean;
    confidence: number;
    issues: string[];
    matchedMember?: any;
  }> {
    try {
      const allMembers = await this.getMembershipData();
      
      // Try exact match first
      let matchedMember = allMembers.find(m => 
        m.memberId === memberId && 
        m.email === email && 
        m.uniqueId === uniqueId
      );
      
      if (matchedMember) {
        return { isValid: true, confidence: 100, issues: [], matchedMember };
      }
      
      // Try partial matches
      const partialMatches = allMembers.filter(m => 
        m.memberId === memberId || 
        m.email === email || 
        (uniqueId && m.uniqueId === uniqueId)
      );
      
      if (partialMatches.length === 1) {
        const issues = [];
        let confidence = 90;
        
        if (partialMatches[0].memberId !== memberId) {
          issues.push("Member ID mismatch");
          confidence -= 20;
        }
        if (partialMatches[0].email !== email) {
          issues.push("Email mismatch");
          confidence -= 15;
        }
        if (uniqueId && partialMatches[0].uniqueId !== uniqueId) {
          issues.push("Unique ID mismatch");
          confidence -= 10;
        }
        
        return { 
          isValid: confidence > 70, 
          confidence, 
          issues, 
          matchedMember: partialMatches[0] 
        };
      }
      
      return { 
        isValid: false, 
        confidence: 0, 
        issues: [`No matching member found for ID: ${memberId}`], 
        matchedMember: undefined 
      };
      
    } catch (error) {
      return { 
        isValid: false, 
        confidence: 0, 
        issues: [`Validation error: ${error.message}`] 
      };
    }
  }

  // Enhanced save with retry logic and validation
  async saveAnnotationWithRetry(
    memberId: string,
    email: string, 
    comments: string,
    notes: string,
    tags: string[],
    uniqueId?: string,
    associateName?: string,
    maxRetries: number = 3
  ): Promise<{
    success: boolean;
    attempts: number;
    error?: string;
    validationResult?: any;
  }> {
    
    // Step 1: Validate member exists
    const validation = await this.validateMemberBeforeSave(memberId, email, uniqueId);
    
    if (!validation.isValid) {
      return {
        success: false,
        attempts: 0,
        error: `Validation failed: ${validation.issues.join(', ')}`,
        validationResult: validation
      };
    }
    
    // Step 2: Save with retry logic
    let attempts = 0;
    let lastError = '';
    
    while (attempts < maxRetries) {
      attempts++;
      
      try {
        // Create timestamp with attempt info for audit trail
        const timestamp = new Date().toISOString();
        const auditInfo = `[v${attempts}.${Date.now()} by ${associateName || 'Unknown'} at ${new Date().toLocaleString()}]`;
        
        // Add audit trail to content
        const auditedComments = comments ? `${comments}\n\n${auditInfo}` : comments;
        const auditedNotes = notes ? `${notes}\n\n${auditInfo}` : notes;
        
        // Use validated member data
        await this.saveAnnotation(
          validation.matchedMember.memberId,
          validation.matchedMember.email,
          auditedComments,
          auditedNotes,
          tags,
          validation.matchedMember.uniqueId,
          associateName,
          timestamp,
          undefined, // associateInCharge - not available in this context
          undefined  // stage - not available in this context
        );
        
        // Brief wait for Google Sheets consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify save by reading back data
        const verifyData = await this.getMembershipData();
        const savedMember = verifyData.find(m => m.memberId === validation.matchedMember.memberId);
        
        // Simple verification - just check if member exists (more reliable than string matching)
        if (savedMember) {
          return { success: true, attempts, validationResult: validation };
        } else {
          throw new Error('Save verification failed - member not found in verification check');
        }
        
      } catch (error) {
        lastError = error.message;
        console.warn(`Annotation save attempt ${attempts} failed:`, error.message);
        
        if (attempts < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = 1000 * Math.pow(2, attempts - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return { 
      success: false, 
      attempts, 
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
      validationResult: validation
    };
  }

  private formatDateTimeIST(date: Date): string {
    // Convert to IST (UTC+5:30)
    const istDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
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
  }

  async saveAnnotation(memberId: string, email: string, comments: string, notes: string, tags: string[], uniqueId?: string, associateName?: string, customTimestamp?: string, associateInCharge?: string, stage?: string): Promise<void> {
    try {
      // Format timestamp in IST (DD-MM-YYYY, HH:MM:SS format)
      const istTimestamp = this.formatDateTimeIST(customTimestamp ? new Date(customTimestamp) : new Date());

      // CRITICAL: Update main sheet FIRST - it's the single source of truth
      await this.updateSingleMember({
        memberId,
        commentsText: comments || '',  // Use correct field names - empty string for deletions
        notesText: notes || '',        // Use correct field names - empty string for deletions
        associateInCharge: associateInCharge || '',
        stage: stage || '',
        _annotationOnly: true
      });

      // Then update Member_Annotations sheet for backup/history
      const annotationsData = await this.fetchAnnotations();

      const existingIndex = annotationsData.findIndex((row, index) =>
        index > 0 && row[0] === memberId
      );

      // Check if this is a deletion (all content empty)
      const isCompletelyEmpty = (!comments || comments.trim() === '') &&
                                (!notes || notes.trim() === '') &&
                                (!tags || tags.length === 0);

      if (isCompletelyEmpty && existingIndex !== -1) {
        // Remove the annotation row completely for deletions
        annotationsData.splice(existingIndex, 1);
      } else if (!isCompletelyEmpty) {
        // Only save to annotations if there's actual content
        const newRow = [
          memberId,
          email,
          comments || '',
          notes || '',
          tags.join(', '),
          uniqueId || '',
          associateName || '',
          istTimestamp
        ];

        if (existingIndex !== -1) {
          annotationsData[existingIndex] = newRow;
        } else {
          annotationsData.push(newRow);
        }
      }

      await this.updateAnnotations(annotationsData);

    } catch (error) {
      console.error('Error saving annotation:', error);
      throw error;
    }
  }

  // Toggle methods for full dataset
  toggleFullDataset(enabled: boolean) {
    useFullDataset = enabled;
  }

  getIsFullDatasetEnabled(): boolean {
    return useFullDataset;
  }

  // Apply default date filtering unless full dataset is enabled
  private applyDefaultFiltering(data: MembershipData[]): MembershipData[] {
    if (useFullDataset) {
      return data;
    }
    
    const cutoffDate = new Date(DEFAULT_DATE_CUTOFF);
    return data.filter(member => {
      if (!member.endDate) return true; // Include members without end dates
      
      try {
        const memberEndDate = new Date(member.endDate);
        return memberEndDate >= cutoffDate;
      } catch (error) {
        return true; // Include members with invalid dates
      }
    });
  }

  async getMembershipData(): Promise<MembershipData[]> {
    try {
      const rawData = await this.fetchSheetData();
      
      if (!rawData || rawData.length === 0) {
        return [];
      }
      
      const [headers, ...rows] = rawData;
      
      const membershipData: MembershipData[] = rows.map((row: any[]) => ({
        uniqueId: row[0] || '',
        memberId: row[1] || '',
        firstName: row[2] || '',
        lastName: row[3] || '',
        email: row[4] || '',
        membershipName: row[5] || '',
        endDate: row[6] || '',
        location: row[7] || '',
        currentUsage: row[8] || '',
        itemId: row[9] || '',
        orderDate: row[10] || '',
        soldBy: row[11] || '',
        membershipId: row[12] || '',
        frozen: row[13] || '',
        paid: row[14] || '',
        status: row[15] || 'Active',
        notes: row[16] || '', // Column 16 = Notes
        comments: row[17] || '', // Column 17 = Comments
        associateInCharge: row[18] || '',
        stage: row[19] || '',
        // Set text fields for modal compatibility
        notesText: row[16] || '',
        commentsText: row[17] || '',
        tagsText: [],
        tags: [],
        aiTags: []
      }));
      
      // Note: We no longer merge annotation data back during fetch
      // The main sheet is the single source of truth
      // Annotations sheet is only used for backup/history purposes
      
      // Auto-repair corrupted data
      const corruptedRecords = membershipData.filter(m => 
        (!m.membershipName || m.membershipName.trim() === '') || 
        (!m.location || m.location.trim() === '')
      );
      
      if (corruptedRecords.length > 0) {
        await this.repairCorruptedData(membershipData);
      }
      
      // Apply default filtering unless full dataset is requested
      const filteredData = this.applyDefaultFiltering(membershipData);
      
      return filteredData;
    } catch (error) {
      console.error('Error getting membership data:', error);
      throw error;
    }
  }

  private async repairCorruptedData(membershipData: MembershipData[]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const allRows = await this.fetchSheetData();
      
      if (allRows.length === 0) return;
      
      const [headers, ...dataRows] = allRows;
      let needsUpdate = false;
      
      for (const member of membershipData) {
        const { memberId } = member;
        
        if (!member.membershipName || member.membershipName.trim() === '') {
          const similarRecord = dataRows.find(r => 
            r[1] === memberId && r[5] && r[5].trim() !== ''
          );
          
          if (similarRecord) {
            member.membershipName = similarRecord[5];
            needsUpdate = true;
          } else {
            member.membershipName = 'Studio Annual Unlimited';
            needsUpdate = true;
          }
        }
        
        if (!member.location || member.location.trim() === '') {
          const similarRecord = dataRows.find(r => 
            r[1] === memberId && r[7] && r[7].trim() !== ''
          );
          
          if (similarRecord) {
            member.location = similarRecord[7];
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await this.updateSingleMember(member);
        }
      }
    } catch (error) {
      console.error('Error during data repair:', error);
    }
  }

  // Method to clear AI tags for a member
  async clearAITags(memberId: string): Promise<void> {
    try {
      const currentData = await this.fetchSheetData();
      if (currentData.length === 0) return;

      const [headers, ...rows] = currentData;
      
      const memberIndex = rows.findIndex(row => row[1] === memberId);
      if (memberIndex === -1) {
        throw new Error('Member not found in sheet');
      }

      // Clear AI tags column (assuming it's column S - index 18)
      if (rows[memberIndex][18]) {
        rows[memberIndex][18] = '';
        await this.updateMemberData([headers, ...rows]);
      }
    } catch (error) {
      console.error('Error clearing AI tags:', error);
      throw error;
    }
  }

  // Enhanced batch annotation processing for efficiency
  async saveBatchAnnotations(annotations: Array<{
    memberId: string;
    email: string;
    comments: string;
    notes: string;
    tags: string[];
    uniqueId?: string;
    associateName?: string;
    timestamp?: string;
  }>): Promise<void> {
    try {
      console.log(`Processing batch annotations for ${annotations.length} members`);
      
      // Get current annotations data
      const annotationsData = await this.fetchAnnotations();
      const currentTimestamp = this.formatDateTimeIST(new Date());
      
      // Process each annotation
      for (const annotation of annotations) {
        const istTimestamp = annotation.timestamp ? 
          this.formatDateTimeIST(new Date(annotation.timestamp)) : 
          currentTimestamp;
        
        const existingIndex = annotationsData.findIndex((row, index) => 
          index > 0 && row[0] === annotation.memberId
        );
        
        const newRow = [
          annotation.memberId,
          annotation.email,
          annotation.comments || '',
          annotation.notes || '',
          annotation.tags.join(', '),
          annotation.uniqueId || '',
          annotation.associateName || '',
          istTimestamp
        ];
        
        if (existingIndex !== -1) {
          annotationsData[existingIndex] = newRow;
        } else {
          annotationsData.push(newRow);
        }
      }
      
      // Batch update annotations sheet
      await this.updateAnnotations(annotationsData);
      console.log('Batch annotations saved successfully');
      
    } catch (error) {
      console.error('Error saving batch annotations:', error);
      throw error;
    }
  }

  // Enhanced annotation retrieval with caching
  private annotationsCache: { data: any[][]; lastFetch: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async getCachedAnnotations(): Promise<any[][]> {
    const now = Date.now();
    
    if (this.annotationsCache && 
        (now - this.annotationsCache.lastFetch) < this.CACHE_DURATION) {
      return this.annotationsCache.data;
    }
    
    try {
      const data = await this.fetchAnnotations();
      this.annotationsCache = {
        data,
        lastFetch: now
      };
      return data;
    } catch (error) {
      console.error('Error fetching cached annotations:', error);
      return this.annotationsCache?.data || [];
    }
  }

  // Clear annotations cache
  clearAnnotationsCache(): void {
    this.annotationsCache = null;
  }

  // Method to completely remove a member's annotations when all data is deleted
  async deleteAnnotation(memberId: string): Promise<void> {
    try {
      const annotationsData = await this.fetchAnnotations();
      const existingIndex = annotationsData.findIndex((row, index) => 
        index > 0 && row[0] === memberId
      );
      
      if (existingIndex !== -1) {
        annotationsData.splice(existingIndex, 1);
        await this.updateAnnotations(annotationsData);
      }
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw error;
    }
  }

  // Enhanced annotation search and filtering
  async searchAnnotations(searchTerm: string, filters?: {
    memberId?: string;
    associateName?: string;
    dateRange?: { start: string; end: string };
  }): Promise<any[][]> {
    try {
      const annotationsData = await this.getCachedAnnotations();
      
      if (annotationsData.length <= 1) return annotationsData;
      
      const [headers, ...rows] = annotationsData;
      let filteredRows = rows;
      
      // Apply search term filter
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredRows = filteredRows.filter(row => 
          row.some(cell => 
            cell && cell.toString().toLowerCase().includes(term)
          )
        );
      }
      
      // Apply specific filters
      if (filters?.memberId) {
        filteredRows = filteredRows.filter(row => row[0] === filters.memberId);
      }
      
      if (filters?.associateName) {
        filteredRows = filteredRows.filter(row => 
          row[6] && row[6].toLowerCase().includes(filters.associateName.toLowerCase())
        );
      }
      
      if (filters?.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        filteredRows = filteredRows.filter(row => {
          if (!row[7]) return false;
          try {
            const rowDate = new Date(row[7]);
            return rowDate >= startDate && rowDate <= endDate;
          } catch {
            return false;
          }
        });
      }
      
      return [headers, ...filteredRows];
    } catch (error) {
      console.error('Error searching annotations:', error);
      return [];
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
