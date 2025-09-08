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
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:F`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        // If sheet doesn't exist, create it
        await this.createAnnotationsSheet();
        return [['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated']];
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching annotations:', error);
      return [['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated']];
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
        ['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated']
      ]);
    } catch (error) {
      console.error('Error creating annotations sheet:', error);
    }
  }

  async updateAnnotations(values: any[][]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:F`;
      
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
        throw new Error('Failed to update annotations');
      }
    } catch (error) {
      console.error('Error updating annotations:', error);
      throw error;
    }
  }

  async saveAnnotation(memberId: string, email: string, comments: string, notes: string, tags: string[]): Promise<void> {
    try {
      const annotationsData = await this.fetchAnnotations();
      const existingIndex = annotationsData.findIndex(row => row[0] === memberId);
      const timestamp = new Date().toISOString();
      const tagsString = tags.join(', ');
      
      const newRow = [memberId, email, comments, notes, tagsString, timestamp];
      
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
      const [rawData, annotationsData] = await Promise.all([
        this.fetchSheetData(),
        this.fetchAnnotations()
      ]);
      
      if (rawData.length === 0) return [];

      // Skip header row and transform data
      const [headers, ...rows] = rawData;
      const [annotationHeaders, ...annotationRows] = annotationsData;
      
      // Create a map of annotations by member ID
      const annotationsMap = new Map();
      annotationRows.forEach(row => {
        if (row[0]) { // if member ID exists
          annotationsMap.set(row[0], {
            comments: row[2] || '',
            notes: row[3] || '',
            tags: row[4] ? row[4].split(', ').filter(tag => tag.trim()) : []
          });
        }
      });
      
      return rows.map(row => {
        const memberId = row[1] || '';
        const annotations = annotationsMap.get(memberId) || { comments: '', notes: '', tags: [] };
        
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
      // Return mock data for development
      return this.getMockData();
    }
  }

  private getMockData() {
    return [
      {
        uniqueId: "15338991-Studio Annual Unlimited-undefined-2026-09-03T12:45:00.000Z",
        memberId: "15338991",
        firstName: "Maithili",
        lastName: "Raut",
        email: "maithili.raut@gmail.com",
        membershipName: "Studio Annual Unlimited",
        endDate: "2026-09-03, 18:15:00",
        location: "Kwality House, Kemps Corner",
        currentUsage: "-",
        itemId: "-",
        orderDate: "2026-09-03 18:15:00",
        soldBy: "-",
        membershipId: "-",
        frozen: "FALSE",
        paid: "-",
        status: "Active" as const,
        sessionsLeft: 0,
        comments: "",
        notes: "",
        tags: []
      },
      {
        uniqueId: "23555332-Studio Annual Unlimited-undefined-2026-09-02T04:00:00.000Z",
        memberId: "23555332",
        firstName: "Shona",
        lastName: "Barua",
        email: "shonabarua27@gmail.com",
        membershipName: "Studio Annual Unlimited",
        endDate: "2026-09-02, 09:30:00",
        location: "Supreme HQ, Bandra",
        currentUsage: "-",
        itemId: "-",
        orderDate: "2026-09-02 09:30:00",
        soldBy: "-",
        membershipId: "-",
        frozen: "FALSE",
        paid: "-",
        status: "Active" as const,
        sessionsLeft: 0,
        comments: "",
        notes: "",
        tags: []
      },
      {
        uniqueId: "110567-Studio 4 Class Package-39727200-2025-04-12T13:27:43.839Z",
        memberId: "110567",
        firstName: "Swathi",
        lastName: "Mohan",
        email: "swathimohan05@gmail.com",
        membershipName: "Studio 4 Class Package",
        endDate: "25/04/2025 19:30:00",
        location: "Supreme HQ, Bandra",
        currentUsage: "3 classes",
        itemId: "39727200",
        orderDate: "2025-04-12 18:57:43",
        soldBy: "imran@physique57mumbai.com",
        membershipId: "25768",
        frozen: "-",
        paid: "6313",
        status: "Churned" as const,
        sessionsLeft: 0,
        comments: "",
        notes: "",
        tags: []
      }
    ];
  }
}

export const googleSheetsService = new GoogleSheetsService();
