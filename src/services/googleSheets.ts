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

  async fetchSheetData(): Promise<any[][]> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.sheetName}!A:P`;
      
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
    console.log('📋 [DEBUG] fetchAnnotations called');
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:H`; // Extended to include Associate Name column
      
      console.log('📋 [DEBUG] Fetching annotations from:', {
        sheetName: this.annotationsSheetName,
        range
      });
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.log('⚠️ [DEBUG] Annotations sheet not found, creating it...');
        // If sheet doesn't exist, create it
        await this.createAnnotationsSheet();
        return [['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated', 'Unique ID', 'Associate Name']];
      }

      const data = await response.json();
      const values = data.values || [];
      
      console.log('📋 [DEBUG] Annotations fetched:', {
        totalRows: values.length,
        hasHeaders: values.length > 0,
        headers: values[0] || 'No headers',
        dataRows: values.length - 1
      });
      
      return values;
    } catch (error) {
      console.error('Error fetching annotations:', error);
      return [['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated', 'Unique ID', 'Associate Name']];
    }
  }

  async createAnnotationsSheet(): Promise<void> {
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

      if (!response.ok) {
        throw new Error('Failed to create annotations sheet');
      }

      // Add headers
      await this.updateAnnotations([
        ['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated', 'Unique ID', 'Associate Name']
      ]);
    } catch (error) {
      console.error('Error creating annotations sheet:', error);
    }
  }

  async updateAnnotations(values: any[][]): Promise<void> {
    console.log('💾 [DEBUG] updateAnnotations called:', {
      totalRows: values.length,
      hasHeaders: values.length > 0,
      sampleRow: values.length > 1 ? values[1] : 'No data rows'
    });
    
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:H`; // Extended to include Associate Name column
      
      console.log('📡 [DEBUG] Sending annotation update request:', {
        range,
        sheetName: this.annotationsSheetName,
        dataRowCount: values.length - 1 // Excluding header
      });
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`,
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
        console.error('❌ [DEBUG] Annotation update failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to update annotations: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ [DEBUG] Annotations updated successfully');
    } catch (error) {
      console.error('Error updating annotations:', error);
      throw error;
    }
  }

  async updateMemberData(values: any[][]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.sheetName}!A:P`; // Main sheet range
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`,
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
        throw new Error('Failed to update member data');
      }
    } catch (error) {
      console.error('Error updating member data:', error);
      throw error;
    }
  }

  async updateSingleMember(member: any): Promise<void> {
    try {
      // First fetch all current data
      const currentData = await this.fetchSheetData();
      if (currentData.length === 0) return;

      const [headers, ...rows] = currentData;
      
      // Find the row to update based on unique ID or member ID
      const memberIndex = rows.findIndex(row => 
        (member.uniqueId && row[0] === member.uniqueId) || 
        row[1] === member.memberId
      );

      if (memberIndex === -1) {
        throw new Error('Member not found in sheet');
      }

      // Convert member object to row format matching the current sheet structure:
      // Unique Id, Member ID, First Name, Last Name, Email, Membership Name, End Date, Home Location, Current Usage, Id, Order At, Sold By, Membership Id, Frozen, Paid, Status
      
      // CRITICAL FIX: Only update fields that are explicitly provided and not empty
      // Preserve existing data for any undefined, null, or empty string values
      const updatedRow = [
        member.uniqueId || rows[memberIndex][0] || '', // Unique Id - preserve existing
        member.memberId || rows[memberIndex][1] || '', // Member ID
        member.firstName || rows[memberIndex][2] || '', // First Name
        member.lastName || rows[memberIndex][3] || '', // Last Name
        member.email || rows[memberIndex][4] || '', // Email
        // CRITICAL: Only update membership name if it's explicitly provided and not empty
        (member.membershipName !== undefined && member.membershipName !== null && member.membershipName.trim() !== '') 
          ? member.membershipName : rows[memberIndex][5] || '',
        member.endDate || rows[memberIndex][6] || '', // End Date
        // CRITICAL: Only update location if it's explicitly provided and not empty
        (member.location !== undefined && member.location !== null && member.location.trim() !== '') 
          ? member.location : rows[memberIndex][7] || '',
        member.currentUsage || rows[memberIndex][8] || '', // Current Usage - preserve existing
        member.itemId || rows[memberIndex][9] || '', // Id - preserve existing
        member.orderDate || rows[memberIndex][10] || '', // Order At - preserve existing
        member.soldBy || rows[memberIndex][11] || '', // Sold By - preserve existing
        member.membershipId || rows[memberIndex][12] || '', // Membership Id - preserve existing
        member.frozen || rows[memberIndex][13] || '', // Frozen - preserve existing
        member.paid || rows[memberIndex][14] || '', // Paid - preserve existing
        member.status || rows[memberIndex][15] || 'Active' // Status - preserve existing or default
      ];
      
      console.log('📝 [DEBUG] updateSingleMember - Data preservation check:', {
        memberId: member.memberId,
        original: {
          membershipName: rows[memberIndex][5],
          location: rows[memberIndex][7]
        },
        incoming: {
          membershipName: member.membershipName,
          location: member.location
        },
        final: {
          membershipName: updatedRow[5],
          location: updatedRow[7]
        }
      });

      // Update the specific row
      rows[memberIndex] = updatedRow;
      
      // Update the entire sheet with modified data
      await this.updateMemberData([headers, ...rows]);
    } catch (error) {
      console.error('Error updating single member:', error);
      throw error;
    }
  }

  async saveAnnotation(memberId: string, email: string, comments: string, notes: string, tags: string[], uniqueId?: string, associateName?: string, customTimestamp?: string): Promise<void> {
    console.log('📝 [DEBUG] saveAnnotation called:', {
      memberId,
      email,
      uniqueId,
      commentsLength: comments?.length || 0,
      notesLength: notes?.length || 0,
      tagsCount: tags?.length || 0
    });
    
    try {
      const annotationsData = await this.fetchAnnotations();
      console.log('📊 [DEBUG] Current annotations data:', {
        totalRows: annotationsData.length,
        headers: annotationsData[0] || 'No headers'
      });
      
      // Try to find by uniqueId first, then by memberId for backward compatibility
      const existingIndex = annotationsData.findIndex(row => 
        (uniqueId && row[6] === uniqueId) || row[0] === memberId
      );
      
      console.log('🔍 [DEBUG] Looking for existing annotation:', {
        searchingForMemberId: memberId,
        searchingForUniqueId: uniqueId,
        existingIndex,
        found: existingIndex >= 0
      });
      
      const timestamp = customTimestamp || new Date().toISOString();
      const tagsString = tags.join(', ');
      
      // Ensure empty values are stored as empty strings, not undefined or null
      const cleanComments = comments || '';
      const cleanNotes = notes || '';
      const cleanTagsString = tagsString || '';
      
      const newRow = [memberId, email, cleanComments, cleanNotes, cleanTagsString, timestamp, uniqueId || '', associateName || ''];
      
      console.log('📝 [DEBUG] Prepared annotation row:', {
        memberId,
        email,
        comments: `"${cleanComments}"`,
        notes: `"${cleanNotes}"`,
        tags: `"${cleanTagsString}"`,
        commentsEmpty: cleanComments === '',
        notesEmpty: cleanNotes === '',
        tagsEmpty: cleanTagsString === ''
      });
      
      if (existingIndex >= 0) {
        // Update existing row
        annotationsData[existingIndex] = newRow;
      } else {
        // Add new row
        annotationsData.push(newRow);
      }
      
      await this.updateAnnotations(annotationsData);
    } catch (error) {
      console.error('Error saving annotation:', error);
      throw error;
    }
  }

  async getMembershipData() {
    try {
      console.log('🔄 [DEBUG] Starting getMembershipData...');
      const [rawData, annotationsData] = await Promise.all([
        this.fetchSheetData(),
        this.fetchAnnotations()
      ]);
      
      if (rawData.length === 0) {
        console.log('⚠️ [DEBUG] No raw data found');
        return [];
      }

      // Skip header row and transform data
      const [headers, ...rows] = rawData;
      const [annotationHeaders, ...annotationRows] = annotationsData;
      
      console.log('📊 [DEBUG] Data loaded:', {
        totalRows: rows.length,
        annotationRows: annotationRows.length,
        sampleRow: rows[0] ? {
          memberId: rows[0][1],
          name: `${rows[0][2]} ${rows[0][3]}`,
          membershipName: rows[0][5] || '[EMPTY]',
          location: rows[0][7] || '[EMPTY]'
        } : 'No data'
      });
      
      // Create a map of annotations by both member ID and unique ID for better matching
      const annotationsMap = new Map();
      annotationRows.forEach(row => {
        if (row[0]) { // if member ID exists
          const annotation = {
            comments: row[2] || '',
            notes: row[3] || '',
            tags: row[4] ? row[4].split(', ').filter(tag => tag.trim()) : []
          };
          
          console.log('📝 [DEBUG] Processing annotation:', {
            memberId: row[0],
            uniqueId: row[6],
            hasComments: !!annotation.comments,
            hasNotes: !!annotation.notes,
            tagCount: annotation.tags.length,
            commentsPreview: annotation.comments.substring(0, 50)
          });
          
          // Map by member ID (for backward compatibility)
          annotationsMap.set(row[0], annotation);
          
          // Also map by unique ID if available (for better precision)
          if (row[6]) {
            annotationsMap.set(row[6], annotation);
          }
        }
      });
      
      return rows.map(row => {
        const memberId = row[1] || '';
        const uniqueId = row[0] || '';
        
        // Try to get annotation by unique ID first, then by member ID
        const annotations = annotationsMap.get(uniqueId) || annotationsMap.get(memberId) || { comments: '', notes: '', tags: [] };
        
        // Debug annotation matching for first few members
        if (rows.indexOf(row) < 3) {
          console.log(`👤 [DEBUG] Member annotation lookup:`, {
            memberId,
            uniqueId,
            name: `${row[2]} ${row[3]}`,
            foundAnnotation: !!annotationsMap.get(uniqueId) || !!annotationsMap.get(memberId),
            annotationSource: annotationsMap.get(uniqueId) ? 'uniqueId' : annotationsMap.get(memberId) ? 'memberId' : 'none',
            hasComments: !!annotations.comments,
            hasNotes: !!annotations.notes,
            tagCount: annotations.tags.length
          });
        }
        
        // Map to new data structure:
        // Unique Id, Member ID, First Name, Last Name, Email, Membership Name, End Date, Home Location, Current Usage, Id, Order At, Sold By, Membership Id, Frozen, Paid, Status
        return {
          uniqueId: row[0] || '',
          memberId: memberId,
          firstName: row[2] || '',
          lastName: row[3] || '',
          email: row[4] || '',
          membershipName: row[5] || '',
          endDate: row[6] || '',
          location: row[7] || '', // Home Location
          currentUsage: row[8] || '', // Current Usage (new field)
          itemId: row[9] || '', // Id
          orderDate: row[10] || '', // Order At
          soldBy: row[11] || '',
          membershipId: row[12] || '',
          frozen: row[13] || '',
          paid: row[14] || '',
          status: (row[15] as 'Active' | 'Churned' | 'Frozen') || 'Active',
          sessionsLeft: 0, // Legacy field - set to 0 since it's no longer in sheet
          comments: annotations.comments,
          notes: annotations.notes,
          tags: annotations.tags
        };
      });
    } catch (error) {
      console.error('Error processing membership data:', error);
      // Don't return mock data - throw the error so it can be handled properly
      throw error;
    }
  }

  async repairCorruptedData(): Promise<void> {
    try {
      console.log('Starting data repair process...');
      const accessToken = await this.getAccessToken();
      const range = `${this.sheetName}!A:P`;
      
      // Get current sheet data
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      const rows = data.values || [];
      
      if (rows.length === 0) return;

      const headers = rows[0];
      const dataRows = rows.slice(1);
      let repairedCount = 0;
      
      // Look for rows with missing membership names or locations
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const membershipName = row[5]; // Column F - Membership Name
        const location = row[7]; // Column H - Home Location
        const memberId = row[1]; // Column B - Member ID
        
        let needsRepair = false;
        const updatedRow = [...row];
        
        // If membership name is empty or missing, try to infer from similar records
        if (!membershipName || membershipName.trim() === '') {
          // Try to find a similar record for the same member
          const similarRecord = dataRows.find(otherRow => 
            otherRow[1] === memberId && otherRow[5] && otherRow[5].trim() !== ''
          );
          
          if (similarRecord && similarRecord[5]) {
            updatedRow[5] = similarRecord[5];
            needsRepair = true;
            console.log(`Repairing membership name for ${memberId}: ${similarRecord[5]}`);
          } else {
            // Default to a common membership type if we can't find similar
            updatedRow[5] = 'Studio Annual Unlimited';
            needsRepair = true;
            console.log(`Setting default membership name for ${memberId}: Studio Annual Unlimited`);
          }
        }
        
        // If location is empty or missing, try to infer from similar records
        if (!location || location.trim() === '') {
          // Try to find a similar record for the same member
          const similarRecord = dataRows.find(otherRow => 
            otherRow[1] === memberId && otherRow[7] && otherRow[7].trim() !== ''
          );
          
          if (similarRecord && similarRecord[7]) {
            updatedRow[7] = similarRecord[7];
            needsRepair = true;
            console.log(`Repairing location for ${memberId}: ${similarRecord[7]}`);
          } else {
            // Default to a common location if we can't find similar
            updatedRow[7] = 'Kenkere House';
            needsRepair = true;
            console.log(`Setting default location for ${memberId}: Kenkere House`);
          }
        }
        
        // Update the row if repairs were made
        if (needsRepair) {
          const rowRange = `${this.sheetName}!A${i + 2}:P${i + 2}`;
          
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${rowRange}?valueInputOption=RAW`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                values: [updatedRow],
              }),
            }
          );
          
          repairedCount++;
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Data repair completed. Repaired ${repairedCount} records.`);
      
    } catch (error) {
      console.error('Error during data repair:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
