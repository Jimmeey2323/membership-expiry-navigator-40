import { googleSheetsService } from '@/services/googleSheets';
import { MembershipData } from '@/types/membership';

/**
 * Enhanced Annotation Utilities for efficient sheet management
 */
export class AnnotationManager {
  private static instance: AnnotationManager;
  private pendingAnnotations: Map<string, any> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 2000; // 2 seconds

  static getInstance(): AnnotationManager {
    if (!AnnotationManager.instance) {
      AnnotationManager.instance = new AnnotationManager();
    }
    return AnnotationManager.instance;
  }

  /**
   * Queue annotation for batch processing
   */
  queueAnnotation(memberId: string, annotation: {
    email: string;
    comments: string;
    notes: string;
    tags: string[];
    uniqueId?: string;
    associateName?: string;
    timestamp?: string;
  }): void {
    this.pendingAnnotations.set(memberId, {
      memberId,
      ...annotation,
      timestamp: annotation.timestamp || new Date().toISOString()
    });

    // Reset batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(async () => {
      await this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Process queued annotations in batch
   */
  private async processBatch(): Promise<void> {
    if (this.pendingAnnotations.size === 0) return;

    try {
      const annotations = Array.from(this.pendingAnnotations.values());
      console.log(`Processing ${annotations.length} queued annotations...`);
      
      await googleSheetsService.saveBatchAnnotations(annotations);
      
      // Clear cache to ensure fresh data on next fetch
      googleSheetsService.clearAnnotationsCache();
      
      this.pendingAnnotations.clear();
      console.log('Batch annotations processed successfully');
      
    } catch (error) {
      console.error('Failed to process batch annotations:', error);
      // Retry after a delay
      setTimeout(() => this.processBatch(), 5000);
    }
  }

  /**
   * Force immediate processing of pending annotations
   */
  async flushPendingAnnotations(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    await this.processBatch();
  }

  /**
   * Get annotation statistics
   */
  async getAnnotationStats(): Promise<{
    totalAnnotations: number;
    recentAnnotations: number;
    topAssociates: Array<{ name: string; count: number }>;
  }> {
    try {
      const annotationsData = await googleSheetsService.getCachedAnnotations();
      
      if (annotationsData.length <= 1) {
        return { totalAnnotations: 0, recentAnnotations: 0, topAssociates: [] };
      }

      const [, ...rows] = annotationsData;
      const totalAnnotations = rows.length;
      
      // Count recent annotations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentAnnotations = rows.filter(row => {
        if (!row[7]) return false;
        try {
          const annotationDate = new Date(row[7]);
          return annotationDate >= sevenDaysAgo;
        } catch {
          return false;
        }
      }).length;

      // Top associates by annotation count
      const associateCounts: Record<string, number> = {};
      rows.forEach(row => {
        if (row[6] && row[6].trim()) {
          const associate = row[6].trim();
          associateCounts[associate] = (associateCounts[associate] || 0) + 1;
        }
      });

      const topAssociates = Object.entries(associateCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      return {
        totalAnnotations,
        recentAnnotations,
        topAssociates
      };
      
    } catch (error) {
      console.error('Error getting annotation stats:', error);
      return { totalAnnotations: 0, recentAnnotations: 0, topAssociates: [] };
    }
  }

  /**
   * Enhanced member search with annotation context
   */
  async searchMembersWithAnnotations(searchTerm: string): Promise<MembershipData[]> {
    try {
      // Get both member data and annotations
      const [memberData, annotationsData] = await Promise.all([
        googleSheetsService.getMembershipData(),
        googleSheetsService.searchAnnotations(searchTerm)
      ]);

      // Create a map of member IDs from annotation search results
      const annotationMemberIds = new Set();
      if (annotationsData.length > 1) {
        const [, ...rows] = annotationsData;
        rows.forEach(row => {
          if (row[0]) annotationMemberIds.add(row[0]);
        });
      }

      // Filter members based on name/email search OR annotation content match
      return memberData.filter(member => {
        const nameMatch = `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = member.email.toLowerCase().includes(searchTerm.toLowerCase());
        const membershipMatch = member.membershipName.toLowerCase().includes(searchTerm.toLowerCase());
        const annotationMatch = annotationMemberIds.has(member.memberId);

        return nameMatch || emailMatch || membershipMatch || annotationMatch;
      });

    } catch (error) {
      console.error('Error searching members with annotations:', error);
      return [];
    }
  }
}

export const annotationManager = AnnotationManager.getInstance();