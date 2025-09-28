import { MembershipData } from "@/types/membership";

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
      const range = `${this.sheetName}!A:R`;
      
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
      const range = `${this.sheetName}!A:R`;
      
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
      const currentData = await this.fetchSheetData();
      if (currentData.length === 0) return;

      const [headers, ...rows] = currentData;
      
      const memberIndex = rows.findIndex(row => 
        (member.uniqueId && row[0] === member.uniqueId) || 
        row[1] === member.memberId
      );

      if (memberIndex === -1) {
        throw new Error('Member not found in sheet');
      }

      const updatedRow = [
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
        member.comments || rows[memberIndex][16] || '',
        member.notes || rows[memberIndex][17] || ''
      ];
      
      rows[memberIndex] = updatedRow;
      await this.updateMemberData([headers, ...rows]);
    } catch (error) {
      console.error('Error updating single member:', error);
      throw error;
    }
  }

  async saveAnnotation(memberId: string, email: string, comments: string, notes: string, tags: string[], uniqueId?: string, associateName?: string, customTimestamp?: string): Promise<void> {
    try {
      const annotationsData = await this.fetchAnnotations();
      
      const existingIndex = annotationsData.findIndex((row, index) => 
        index > 0 && row[0] === memberId
      );
      
      const timestamp = customTimestamp || new Date().toISOString();
      const newRow = [
        memberId,
        email,
        comments || '',
        notes || '',
        tags.join(', '),
        uniqueId || '',
        associateName || '',
        timestamp
      ];
      
      if (existingIndex !== -1) {
        annotationsData[existingIndex] = newRow;
      } else {
        annotationsData.push(newRow);
      }
      
      await this.updateAnnotations(annotationsData);
    } catch (error) {
      console.error('Error saving annotation:', error);
      throw error;
    }
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
        comments: row[16] || '',
        notes: row[17] || '',
        tags: [],
        aiTags: []
      }));
      
      // Fetch and merge annotation data
      try {
        const annotationsData = await this.fetchAnnotations();
        const [annotationHeaders, ...annotationRows] = annotationsData;
        
        for (const annotationRow of annotationRows) {
          const [memberId, email, comments, notes, tags] = annotationRow;
          
          const member = membershipData.find(m => m.memberId === memberId);
          
          if (member) {
            if (comments && comments.trim()) {
              member.comments = comments;
            }
            
            if (notes && notes.trim()) {
              member.notes = notes;
            }
            
            if (tags && tags.trim()) {
              member.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
          }
        }
      } catch (error) {
        // Annotation fetch failed - continue without annotations
      }
      
      // Auto-repair corrupted data
      const corruptedRecords = membershipData.filter(m => 
        (!m.membershipName || m.membershipName.trim() === '') || 
        (!m.location || m.location.trim() === '')
      );
      
      if (corruptedRecords.length > 0) {
        await this.repairCorruptedData(membershipData);
      }
      
      return membershipData;
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
}

export const googleSheetsService = new GoogleSheetsService();
