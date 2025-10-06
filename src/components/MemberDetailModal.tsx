import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, Plus, Save, User, Mail, Calendar, MapPin, 
  Activity, CreditCard, MessageSquare, FileText, 
  Tag, Clock, TrendingUp, AlertCircle, Star,
  Phone, Building, Users, Edit2, Check, UserCircle, Brain, UserCheck
} from "lucide-react";
import { MembershipData, MEMBER_STAGES } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { toast } from "sonner";
import { cleanText, toSentenceCase } from "@/lib/textUtils";

// Utility function to safely extract text from structured comments/notes
const extractStructuredText = (legacyText: string | undefined, structuredArray: any[] | undefined): string => {
  try {
    if (legacyText && typeof legacyText === 'string') return legacyText;
    if (Array.isArray(structuredArray)) {
      return structuredArray.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return item.text || String(item);
        }
        return String(item);
      }).join('\n');
    }
    return '';
  } catch (error) {
    console.error('Error extracting structured text:', error);
    return '';
  }
};

interface MemberDetailModalProps {
  member: MembershipData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, comments: string, notes: string, tags: string[], associate?: string, associateInCharge?: string, stage?: string) => void;
}

interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  type: 'comment' | 'note';
  createdBy?: string; // Name of the person who created this
  lastEditedBy?: string; // Name of the person who last edited this
  lastEditedAt?: Date; // When it was last edited
}

interface TagEntry {
  tag: string;
  createdBy: string;
  timestamp: Date;
}

const STAFF_NAMES = [
  "Admin Admin",
  "Akshay Rane", 
  "Api Serou",
  "Imran Shaikh",
  "Manisha Rathod",
  "Nadiya Shaikh", 
  "Pavanthika",
  "Prathap Kp",
  "Priyanka Abnave",
  "Santhosh Kumar",
  "Sheetal Kataria",
  "Shipra Bhika", 
  "Tahira Sayyed",
  "Vahishta Fitter",
  "Zaheer Agarbattiwala",
  "Zahur Shaikh"
].filter(name => name && name.trim() !== ''); // Filter out any empty values

// Safe SelectItem wrapper to prevent empty value errors
const SafeSelectItem = ({ value, children, ...props }: { value: string; children: React.ReactNode; [key: string]: any }) => {
  if (!value || value.trim() === '') {
    console.warn('Attempted to create SelectItem with empty value:', value);
    return null;
  }
  return <SelectItem value={value} {...props}>{children}</SelectItem>;
};

export const MemberDetailModal = ({ member, isOpen, onClose, onSave }: MemberDetailModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [notes, setNotes] = useState<Comment[]>([]);
  const [tags, setTags] = useState<TagEntry[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedName, setSelectedName] = useState(STAFF_NAMES[0]); // Default to first name
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStage, setCurrentStage] = useState(member?.stage || '');

  // Helper functions for AI analysis styling
  const getSentimentBadgeClass = (sentiment: string): string => {
    const colorMap: Record<string, string> = {
      'positive': 'bg-green-100 text-green-700 border-green-200',
      'neutral': 'bg-gray-100 text-gray-700 border-gray-200',
      'negative': 'bg-red-100 text-red-700 border-red-200',
      'mixed': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colorMap[sentiment] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getSentimentEmoji = (sentiment: string): string => {
    const emojiMap: Record<string, string> = {
      'positive': '😊',
      'neutral': '😐',
      'negative': '😞',
      'mixed': '🤔'
    };
    return emojiMap[sentiment] || '😐';
  };

  const getChurnRiskBadgeClass = (churnRisk: string): string => {
    const colorMap: Record<string, string> = {
      'low': 'bg-green-100 text-green-700 border-green-200',
      'medium': 'bg-orange-100 text-orange-700 border-orange-200',
      'high': 'bg-red-100 text-red-700 border-red-200'
    };
    return colorMap[churnRisk] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getChurnRiskEmoji = (churnRisk: string): string => {
    const emojiMap: Record<string, string> = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🔴'
    };
    return emojiMap[churnRisk] || '⚪';
  };

  // Parse comments function
  const parseComments = (commentsString: string): Comment[] => {
    if (!commentsString) return [];
    
    return commentsString.split('\n---\n').map((text, index) => {
      const lines = text.trim().split('\n');
      let actualText = '';
      let createdBy = 'Unknown';
      let lastEditedBy = '';
      let timestamp = new Date();
      let lastEditedAt: Date | undefined;

      for (const line of lines) {
        if (line.startsWith('[Created by:')) {
          const match = line.match(/\[Created by: (.+?) at (.+?)\]/);
          if (match) {
            createdBy = match[1];
            const dateString = match[2];
            const parsedDate = new Date(dateString);
            timestamp = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
          }
        } else if (line.startsWith('[Last edited by:')) {
          const match = line.match(/\[Last edited by: (.+?) at (.+?)\]/);
          if (match) {
            lastEditedBy = match[1];
            const dateString = match[2];
            const parsedDate = new Date(dateString);
            lastEditedAt = !isNaN(parsedDate.getTime()) ? parsedDate : undefined;
          }
        } else if (!line.startsWith('[')) {
          actualText += (actualText ? '\n' : '') + line;
        }
      }

      return {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        text: actualText,
        timestamp,
        type: 'comment' as const,
        createdBy,
        lastEditedBy: lastEditedBy || undefined,
        lastEditedAt
      };
    }).filter(c => c.text);
  };

  // Parse notes function
  const parseNotes = (notesString: string): Comment[] => {
    if (!notesString) return [];
    
    return notesString.split('\n---\n').map((text, index) => {
      const lines = text.trim().split('\n');
      let actualText = '';
      let createdBy = 'Unknown';
      let lastEditedBy = '';
      let timestamp = new Date();
      let lastEditedAt: Date | undefined;

      for (const line of lines) {
        if (line.startsWith('[Created by:')) {
          const match = line.match(/\[Created by: (.+?) at (.+?)\]/);
          if (match) {
            createdBy = match[1];
            const dateString = match[2];
            const parsedDate = new Date(dateString);
            timestamp = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
          }
        } else if (line.startsWith('[Last edited by:')) {
          const match = line.match(/\[Last edited by: (.+?) at (.+?)\]/);
          if (match) {
            lastEditedBy = match[1];
            const dateString = match[2];
            const parsedDate = new Date(dateString);
            lastEditedAt = !isNaN(parsedDate.getTime()) ? parsedDate : undefined;
          }
        } else if (!line.startsWith('[')) {
          actualText += (actualText ? '\n' : '') + line;
        }
      }

      return {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        text: actualText,
        timestamp,
        type: 'note' as const,
        createdBy,
        lastEditedBy: lastEditedBy || undefined,
        lastEditedAt
      };
    }).filter(n => n.text);
  };

  // Update state when member changes
  useEffect(() => {
    try {
      if (member) {
        // Initialize stage from member data
        setCurrentStage(member.stage || '');
        
        // Handle both legacy string format and new structured format
        const commentsText = extractStructuredText(member.commentsText, member.comments);
        const notesText = extractStructuredText(member.notesText, member.notes);
        
        const parsedComments = parseComments(commentsText);
        const parsedNotes = parseNotes(notesText);
        
        // Parse tags into TagEntry format - handle both string and structured tags
        const parsedTags: TagEntry[] = (member.tagsText || member.tags || []).map(tag => {
          let tagTimestamp = new Date();
          if (typeof tag === 'object' && (tag as any)?.createdAt) {
            const parsedTagDate = new Date((tag as any).createdAt);
            tagTimestamp = !isNaN(parsedTagDate.getTime()) ? parsedTagDate : new Date();
          }
          return {
            tag: typeof tag === 'string' ? tag : (tag as any)?.text || String(tag),
            createdBy: typeof tag === 'object' ? (tag as any)?.createdBy || 'Unknown' : 'Unknown',
            timestamp: tagTimestamp
          };
        });
        
        setComments(parsedComments);
        setNotes(parsedNotes);
        setTags(parsedTags);
      } else {
        setComments([]);
        setNotes([]);
        setTags([]);
      }
    } catch (error) {
      console.error('Error parsing member data:', error);
      // Set safe default values
      setComments([]);
      setNotes([]);
      setTags([]);
      setCurrentStage('');
    }
  }, [member, member?.lastUpdated]);

  // Helper function to format comments/notes with metadata for consistent saving
  const formatCommentWithMetadata = (comment: Comment): string => {
    if (!comment || !comment.text) return '';
    
    const cleanedText = toSentenceCase(cleanText(comment.text));
    const createdBy = comment.createdBy || 'System';
    const timestamp = comment.timestamp || new Date();
    let formatted = cleanedText;
    
    // Add metadata for parsing
    if (createdBy !== 'Unknown') {
      formatted += `\n[Created by: ${createdBy} at ${timestamp.toISOString()}]`;
    }
    if (comment.lastEditedBy && comment.lastEditedAt) {
      formatted += `\n[Last edited by: ${comment.lastEditedBy} at ${comment.lastEditedAt.toISOString()}]`;
    }
    
    return formatted;
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedName) return;
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date(),
      type: 'comment' as const,
      createdBy: selectedName
    };
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment('');
    
    // Immediately update the member object
    if (member) {
      const updatedCommentsText = updatedComments.map(c => toSentenceCase(cleanText(c.text))).join('\n---\n');
      member.commentsText = updatedCommentsText;
      member.comments = undefined;
    }
    
    // Keep the selected name for convenience when adding multiple entries
    // Auto-save after adding comment
    setTimeout(() => handleAutoSave(), 100);
  };

  const addNote = async () => {
    if (!newNote.trim() || !selectedName) return;
    const note: Comment = {
      id: Date.now().toString(),
      text: newNote,
      timestamp: new Date(),
      type: 'note' as const,
      createdBy: selectedName
    };
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    setNewNote('');
    
    // Immediately update the member object
    if (member) {
      const updatedNotesText = updatedNotes.map(n => toSentenceCase(cleanText(n.text))).join('\n---\n');
      member.notesText = updatedNotesText;
      member.notes = undefined;
    }
    
    // Keep the selected name for convenience when adding multiple entries
    // Auto-save after adding note
    setTimeout(() => handleAutoSave(), 100);
  };

  const startEditingComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
    setSelectedName(comment.lastEditedBy || comment.createdBy || STAFF_NAMES[0]); // Set to last editor or creator
  };

  const startEditingNote = (note: Comment) => {
    setEditingNote(note.id);
    setEditText(note.text);
    setSelectedName(note.lastEditedBy || note.createdBy || STAFF_NAMES[0]); // Set to last editor or creator
  };

  const saveEditComment = async (commentId: string) => {
    if (!editText.trim() || !selectedName) return;
    
    const updatedComments = comments.map(comment => 
      comment.id === commentId 
        ? {
            ...comment,
            text: editText.trim(),
            lastEditedBy: selectedName,
            lastEditedAt: new Date()
          }
        : comment
    );
    setComments(updatedComments);
    setEditingComment(null);
    setEditText('');
    
    // Immediately update the member object
    if (member) {
      const updatedCommentsText = updatedComments.map(c => toSentenceCase(cleanText(c.text))).join('\n---\n');
      member.commentsText = updatedCommentsText;
      member.comments = undefined;
    }
    
    // Auto-save after editing comment
    setTimeout(() => handleAutoSave(), 100);
  };

  const saveEditNote = async (noteId: string) => {
    if (!editText.trim() || !selectedName) return;
    
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? {
            ...note,
            text: editText.trim(),
            lastEditedBy: selectedName,
            lastEditedAt: new Date()
          }
        : note
    );
    setNotes(updatedNotes);
    setEditingNote(null);
    setEditText('');
    
    // Immediately update the member object
    if (member) {
      const updatedNotesText = updatedNotes.map(n => toSentenceCase(cleanText(n.text))).join('\n---\n');
      member.notesText = updatedNotesText;
      member.notes = undefined;
    }
    
    // Auto-save after editing note
    setTimeout(() => handleAutoSave(), 100);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditingNote(null);
    setEditText('');
    setSelectedName(STAFF_NAMES[0]); // Reset to default name
  };

  const addTag = async () => {
    if (!newTag.trim() || !selectedName) return;
    // Check if tag already exists
    if (tags.some(tagEntry => tagEntry.tag === newTag.trim())) return;
    
    const newTagEntry: TagEntry = {
      tag: newTag.trim(),
      createdBy: selectedName,
      timestamp: new Date()
    };
    const updatedTags = [...tags, newTagEntry];
    setTags(updatedTags);
    setNewTag('');
    
    // Immediately update the member object
    if (member) {
      const updatedTagsText = updatedTags.map(t => t.tag);
      member.tagsText = updatedTagsText;
      member.tags = undefined;
    }
    
    // Auto-save after adding tag
    setTimeout(() => handleAutoSave(), 100);
  };

  const removeTag = async (tagToRemove: TagEntry) => {
    const updatedTags = tags.filter(tagEntry => tagEntry.tag !== tagToRemove.tag);
    setTags(updatedTags);
    
    // Immediately update the member object to prevent stale data on reload
    if (member) {
      const updatedTagsText = updatedTags.map(t => t.tag);
      member.tagsText = updatedTagsText;
      // Clear structured tags to avoid conflicts
      member.tags = undefined;
    }
    
    // Auto-save after removing tag
    setTimeout(() => handleAutoSave(), 100); // Small delay to ensure state updates
  };

  const removeComment = async (id: string) => {
    const updatedComments = comments.filter(c => c.id !== id);
    setComments(updatedComments);
    
    // Immediately update the member object to prevent stale data on reload
    if (member) {
      const updatedCommentsText = updatedComments.map(c => formatCommentWithMetadata(c)).join('\n---\n');
      member.commentsText = updatedCommentsText;
      // Clear structured comments to avoid conflicts
      member.comments = undefined;
    }
    
    // Auto-save after removing comment
    setTimeout(() => handleAutoSave(), 100); // Small delay to ensure state updates
  };

  const removeNote = async (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    
    // Immediately update the member object to prevent stale data on reload
    if (member) {
      const updatedNotesText = updatedNotes.map(n => formatCommentWithMetadata(n)).join('\n---\n');
      member.notesText = updatedNotesText;
      // Clear structured notes to avoid conflicts
      member.notes = undefined;
    }
    
    // Auto-save after removing note
    setTimeout(() => handleAutoSave(), 100); // Small delay to ensure state updates
  };

  const handleSave = async () => {
    if (!member) return;
    
    setIsSaving(true);
    try {
      // Include associate metadata in saved format for proper parsing
      const allComments = comments.map(c => {
        const cleanedText = toSentenceCase(cleanText(c.text));
        const createdBy = c.createdBy || 'System';
        const timestamp = c.timestamp || new Date();
        let formattedComment = cleanedText;
        
        // Add metadata for parsing
        if (createdBy !== 'Unknown') {
          formattedComment += `\n[Created by: ${createdBy} at ${timestamp.toISOString()}]`;
        }
        if (c.lastEditedBy && c.lastEditedAt) {
          formattedComment += `\n[Last edited by: ${c.lastEditedBy} at ${c.lastEditedAt.toISOString()}]`;
        }
        
        return formattedComment;
      }).join('\n---\n');
      
      const allNotes = notes.map(n => {
        const cleanedText = toSentenceCase(cleanText(n.text));
        const createdBy = n.createdBy || 'System';
        const timestamp = n.timestamp || new Date();
        let formattedNote = cleanedText;
        
        // Add metadata for parsing
        if (createdBy !== 'Unknown') {
          formattedNote += `\n[Created by: ${createdBy} at ${timestamp.toISOString()}]`;
        }
        if (n.lastEditedBy && n.lastEditedAt) {
          formattedNote += `\n[Last edited by: ${n.lastEditedBy} at ${n.lastEditedAt.toISOString()}]`;
        }
        
        return formattedNote;
      }).join('\n---\n');
      
      // Get the most recent associate for the annotation - empty when no content
      const latestAssociate = comments.length > 0 ? comments[comments.length - 1].createdBy : 
                              notes.length > 0 ? notes[notes.length - 1].createdBy : 
                              '';

      // Convert TagEntry back to string array for saving
      const tagsForSaving = tags.map(tagEntry => tagEntry.tag);
      
      await googleSheetsService.saveAnnotation(
        member.memberId,
        member.email,
        allComments,
        allNotes,
        tagsForSaving,
        latestAssociate,
        member.associateInCharge,
        currentStage // Use the current stage state
      );
      
      onSave(member.memberId, allComments, allNotes, tagsForSaving, latestAssociate, member.associateInCharge, currentStage);
      toast.success("Member details saved successfully!");
      onClose();
    } catch (error) {
      console.error('Error saving member details:', error);
      toast.error("Failed to save member details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save function for immediate updates when items are deleted/edited
  const handleAutoSave = async () => {
    if (!member) return;
    
    try {
      // Include associate metadata in saved format for proper parsing
      const allComments = comments.map(c => {
        const cleanedText = toSentenceCase(cleanText(c.text));
        const createdBy = c.createdBy || 'System';
        const timestamp = c.timestamp || new Date();
        let formattedComment = cleanedText;
        
        // Add metadata for parsing
        if (createdBy !== 'Unknown') {
          formattedComment += `\n[Created by: ${createdBy} at ${timestamp.toISOString()}]`;
        }
        if (c.lastEditedBy && c.lastEditedAt) {
          formattedComment += `\n[Last edited by: ${c.lastEditedBy} at ${c.lastEditedAt.toISOString()}]`;
        }
        
        return formattedComment;
      }).join('\n---\n');
      
      const allNotes = notes.map(n => {
        const cleanedText = toSentenceCase(cleanText(n.text));
        const createdBy = n.createdBy || 'System';
        const timestamp = n.timestamp || new Date();
        let formattedNote = cleanedText;
        
        // Add metadata for parsing
        if (createdBy !== 'Unknown') {
          formattedNote += `\n[Created by: ${createdBy} at ${timestamp.toISOString()}]`;
        }
        if (n.lastEditedBy && n.lastEditedAt) {
          formattedNote += `\n[Last edited by: ${n.lastEditedBy} at ${n.lastEditedAt.toISOString()}]`;
        }
        
        return formattedNote;
      }).join('\n---\n');
      
      // Get the most recent associate for the annotation - empty when no content
      const latestAssociate = comments.length > 0 ? comments[comments.length - 1].createdBy : 
                              notes.length > 0 ? notes[notes.length - 1].createdBy : 
                              '';

      // Convert TagEntry back to string array for saving
      const tagsForSaving = tags.map(tagEntry => tagEntry.tag);
      
      // Save to Google Sheets immediately
      await googleSheetsService.saveAnnotation(
        member.memberId,
        member.email,
        allComments,
        allNotes,
        tagsForSaving,
        latestAssociate,
        member.associateInCharge,
        currentStage
      );
      
      // Update local state immediately
      onSave(member.memberId, allComments, allNotes, tagsForSaving, latestAssociate, member.associateInCharge, currentStage);
      
      // Show subtle success feedback
      toast.success("Changes saved automatically!", { duration: 2000 });
    } catch (error) {
      console.error('Error auto-saving changes:', error);
      toast.error("Failed to auto-save changes. Please try saving manually.");
    }
  };

  if (!member) return null;

  const daysUntilExpiry = getDaysUntilExpiry(member.endDate);
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isChurned = member.status === 'Churned';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2">
        <div className="flex flex-col min-h-full">
          {/* Premium Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white p-8 pb-12">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-4 text-2xl font-bold">
                    <Avatar className="h-16 w-16 border-4 border-white/20 shadow-2xl">
                      <AvatarFallback className="text-2xl font-bold text-blue-600 bg-white">
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h1 className="text-3xl font-bold tracking-tight">
                        {member.firstName} {member.lastName}
                      </h1>
                      <p className="text-blue-100 text-lg font-medium">
                        Member #{member.memberId}
                      </p>
                    </div>
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 text-base mt-2 max-w-lg">
                    View comprehensive member details, membership history, and analytics.
                  </DialogDescription>
                  <Button
                    variant="ghost" 
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/20 h-12 w-12"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </DialogHeader>
              
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="h-6 w-6" />
                    </div>
                    <p className="text-2xl font-bold">{member.sessionsLeft || 0}</p>
                    <p className="text-sm text-blue-100">Sessions Left</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <p className="text-2xl font-bold">{daysUntilExpiry}</p>
                    <p className="text-sm text-blue-100">Days Left</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Badge 
                        variant={member.status === 'Active' ? "default" : "destructive"}
                        className="h-8 px-4 text-sm font-bold"
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-100">Status</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold truncate">{member.location}</p>
                    <p className="text-sm text-blue-100">Location</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">
                  <User className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="comments" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes ({notes.length})
                </TabsTrigger>
                <TabsTrigger value="tags" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">
                  <Tag className="h-4 w-4 mr-2" />
                  Tags ({tags.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <Card className="shadow-lg border-2">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-lg">
                          <User className="h-5 w-5" />
                        </div>
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-semibold text-slate-600">First Name</Label>
                          <p className="text-lg font-medium text-slate-900 dark:text-white">{member.firstName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-slate-600">Last Name</Label>
                          <p className="text-lg font-medium text-slate-900 dark:text-white">{member.lastName}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-slate-500" />
                        <div>
                          <Label className="text-sm font-semibold text-slate-600">Email Address</Label>
                          <p className="text-lg font-medium text-slate-900 dark:text-white">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-slate-500" />
                        <div>
                          <Label className="text-sm font-semibold text-slate-600">Location</Label>
                          <p className="text-lg font-medium text-slate-900 dark:text-white">{member.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Membership Details */}
                  <Card className="shadow-lg border-2">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-800 dark:to-emerald-700">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 text-white rounded-lg">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        Membership Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <Label className="text-sm font-semibold text-slate-600">Membership Type</Label>
                        <p className="text-lg font-medium text-slate-900 dark:text-white">{member.membershipName}</p>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-semibold text-slate-600">Start Date</Label>
                          <p className="text-lg font-medium text-slate-900 dark:text-white">
                            {new Date(member.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-slate-600">End Date</Label>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-medium text-slate-900 dark:text-white">
                              {new Date(member.endDate).toLocaleDateString()}
                            </p>
                            {isExpiringSoon && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Expires Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-slate-500" />
                        <div>
                          <Label className="text-sm font-semibold text-slate-600">Remaining Sessions</Label>
                          <p className="text-2xl font-bold text-blue-600">{member.sessionsLeft || 0}</p>
                        </div>
                      </div>
                      {member.frozen && member.frozen.toLowerCase() === 'true' && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-700 font-medium">Account is currently frozen</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Notes Overview Section */}
                {notes.length > 0 && (
                  <div className="mt-8">
                    <Card className="shadow-lg border-2">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-700">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500 text-white rounded-lg">
                            <FileText className="h-5 w-5" />
                          </div>
                          Recent Notes ({notes.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {notes.slice(0, 3).map((note) => (
                            <div key={note.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                              <p className="text-slate-900 dark:text-white text-sm mb-2">{note.text}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <UserCircle className="h-3 w-3" />
                                <span>{note.createdBy || 'Unknown'}</span>
                                <span>•</span>
                                <span>{note.timestamp && !isNaN(note.timestamp.getTime()) ? note.timestamp.toLocaleString() : 'Unknown date'}</span>
                                {note.lastEditedBy && (
                                  <>
                                    <span>•</span>
                                    <span>Edited by {note.lastEditedBy}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          {notes.length > 3 && (
                            <div className="text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setActiveTab('notes')}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                View all {notes.length} notes
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Comments Overview Section */}
                {comments.length > 0 && (
                  <div className="mt-8">
                    <Card className="shadow-lg border-2">
                      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-800 dark:to-orange-700">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500 text-white rounded-lg">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          Recent Comments ({comments.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {comments.slice(0, 3).map((comment) => (
                            <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                              <p className="text-slate-900 dark:text-white text-sm mb-2">{comment.text}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <UserCircle className="h-3 w-3" />
                                <span>{comment.createdBy || 'Unknown'}</span>
                                <span>•</span>
                                <span>{comment.timestamp && !isNaN(comment.timestamp.getTime()) ? comment.timestamp.toLocaleString() : 'Unknown date'}</span>
                                {comment.lastEditedBy && (
                                  <>
                                    <span>•</span>
                                    <span>Edited by {comment.lastEditedBy}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          {comments.length > 3 && (
                            <div className="text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setActiveTab('comments')}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                View all {comments.length} comments
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Raw Data Section - Fallback if no parsed annotations */}
                {(notes.length === 0 && comments.length === 0 && tags.length === 0) && 
                 (member.notes || member.comments || (member.tags && member.tags.length > 0)) && (
                  <div className="mt-8">
                    <Card className="shadow-lg border-2">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-gray-500 text-white rounded-lg">
                            <FileText className="h-5 w-5" />
                          </div>
                          Raw Annotation Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {member.notes && (
                          <div>
                            <Label className="text-sm font-semibold text-slate-600">Notes:</Label>
                            <div className="p-3 bg-gray-50 rounded border mt-2">
                              <pre className="text-sm whitespace-pre-wrap">{extractStructuredText(member.notesText, member.notes)}</pre>
                            </div>
                          </div>
                        )}
                        {member.comments && (
                          <div>
                            <Label className="text-sm font-semibold text-slate-600">Comments:</Label>
                            <div className="p-3 bg-gray-50 rounded border mt-2">
                              <pre className="text-sm whitespace-pre-wrap">{extractStructuredText(member.commentsText, member.comments)}</pre>
                            </div>
                          </div>
                        )}
                        {member.tags && member.tags.length > 0 && (
                          <div>
                            <Label className="text-sm font-semibold text-slate-600">Tags:</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {member.tags.map((tag, index) => (
                                <Badge key={index} variant="outline">{typeof tag === 'string' ? tag : (tag as any)?.text || String(tag)}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* AI Tags Display */}
                {member.aiTags && member.aiTags.length > 0 && (
                  <div className="mt-8">
                    <Card className="shadow-lg border-2">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg">
                              <Brain className="h-5 w-5" />
                            </div>
                            AI Analysis Results
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              {member.aiConfidence}% confidence
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await googleSheetsService.clearAITags(member.memberId);
                                // Clear AI data locally
                                const updatedMember = {
                                  ...member,
                                  aiTags: [],
                                  aiConfidence: undefined,
                                  aiReasoning: undefined,
                                  aiSentiment: undefined,
                                  aiChurnRisk: undefined,
                                  aiAnalysisDate: undefined
                                };
                                onSave(member.memberId, extractStructuredText(member.commentsText, member.comments), extractStructuredText(member.notesText, member.notes), (member.tagsText || member.tags || []).map(t => typeof t === 'string' ? t : (t as any)?.text || String(t)), 'System', member.associateInCharge, member.stage);
                                toast.success('AI tags cleared successfully');
                                onClose();
                              } catch (error) {
                                console.error('Error clearing AI tags:', error);
                                toast.error('Failed to clear AI tags');
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear AI Tags
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <Label className="text-sm font-semibold text-slate-600">AI-Generated Tags:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {member.aiTags.map((tag, index) => (
                              <Badge key={index} className="bg-purple-100 text-purple-800 border-purple-200">
                                🤖 {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Sentiment and Churn Risk */}
                        <div className="grid grid-cols-2 gap-4">
                          {member.aiSentiment && (
                            <div>
                              <Label className="text-sm font-semibold text-slate-600">Sentiment Analysis:</Label>
                              <div className="mt-2">
                                <Badge className={getSentimentBadgeClass(member.aiSentiment)}>
                                  {getSentimentEmoji(member.aiSentiment)} {member.aiSentiment}
                                </Badge>
                              </div>
                            </div>
                          )}
                          {member.aiChurnRisk && (
                            <div>
                              <Label className="text-sm font-semibold text-slate-600">Churn Risk Level:</Label>
                              <div className="mt-2">
                                <Badge className={getChurnRiskBadgeClass(member.aiChurnRisk)}>
                                  {getChurnRiskEmoji(member.aiChurnRisk)} {member.aiChurnRisk} risk
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {member.aiReasoning && (
                          <div>
                            <Label className="text-sm font-semibold text-slate-600">AI Reasoning:</Label>
                            <div className="p-3 bg-purple-50 rounded border border-purple-200 mt-2">
                              <p className="text-sm text-slate-700">{member.aiReasoning}</p>
                            </div>
                          </div>
                        )}
                        {member.aiAnalysisDate && (
                          <div>
                            <Label className="text-sm font-semibold text-slate-600">Analysis Date:</Label>
                            <p className="text-sm text-slate-600 mt-1">
                              {new Date(member.aiAnalysisDate).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comments" className="space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Add New Comment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="staff-select">Created by</Label>
                      <Select value={selectedName} onValueChange={setSelectedName}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {STAFF_NAMES.map((name) => (
                            <SafeSelectItem key={name} value={name}>
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                {name}
                              </div>
                            </SafeSelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="member-stage">Member Interaction Stage</Label>
                      <Select value={currentStage || 'NONE'} onValueChange={(value) => {
                        const actualValue = value === 'NONE' ? '' : value;
                        setCurrentStage(actualValue);
                        if (member) {
                          member.stage = actualValue; // Also update the member object
                        }
                        // Auto-save after stage change
                        setTimeout(() => handleAutoSave(), 100);
                      }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select stage based on recent interactions..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SafeSelectItem value="NONE">
                            <div className="flex items-center gap-2 text-gray-500">
                              <X className="h-4 w-4" />
                              No Stage
                            </div>
                          </SafeSelectItem>
                          {MEMBER_STAGES.filter(stage => stage && stage.trim() !== '').map((stage) => (
                            <SafeSelectItem key={stage} value={stage}>
                              {stage}
                            </SafeSelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs mt-1 flex items-center gap-1">
                        {currentStage ? (
                          <div className="text-green-600 flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Current stage: {currentStage}
                          </div>
                        ) : (
                          <div className="text-gray-500 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            No stage selected
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Textarea
                      placeholder="Add a comment about this member..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button onClick={addComment} disabled={!newComment.trim() || !selectedName}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            {editingComment === comment.id ? (
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="edit-comment-name">Edited by</Label>
                                  <Select value={selectedName} onValueChange={setSelectedName}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STAFF_NAMES.map((name) => (
                                        <SafeSelectItem key={name} value={name}>
                                          <div className="flex items-center gap-2">
                                            <UserCircle className="h-4 w-4" />
                                            {name}
                                          </div>
                                        </SafeSelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEditComment(comment.id)}
                                    disabled={!editText.trim() || !selectedName}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-slate-900 dark:text-white">{comment.text}</p>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <UserCircle className="h-4 w-4" />
                                    <span>Created by: {comment.createdBy || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{comment.timestamp && !isNaN(comment.timestamp.getTime()) ? comment.timestamp.toLocaleString() : 'Unknown date'}</span>
                                  </div>
                                  {comment.lastEditedBy && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                      <Edit2 className="h-3 w-3" />
                                      <span>Last edited by: {comment.lastEditedBy}</span>
                                      <span>•</span>
                                      <span>{comment.lastEditedAt && !isNaN(comment.lastEditedAt.getTime()) ? comment.lastEditedAt.toLocaleString() : 'Unknown date'}</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {editingComment !== comment.id && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingComment(comment)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeComment(comment.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No comments yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Add New Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="staff-select-notes">Created by</Label>
                      <Select value={selectedName} onValueChange={setSelectedName}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {STAFF_NAMES.map((name) => (
                            <SafeSelectItem key={name} value={name}>
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                {name}
                              </div>
                            </SafeSelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Add an internal note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button onClick={addNote} disabled={!newNote.trim() || !selectedName}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {notes.map((note) => (
                    <Card key={note.id} className="shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            {editingNote === note.id ? (
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="edit-note-name">Edited by</Label>
                                  <Select value={selectedName} onValueChange={setSelectedName}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STAFF_NAMES.map((name) => (
                                        <SafeSelectItem key={name} value={name}>
                                          <div className="flex items-center gap-2">
                                            <UserCircle className="h-4 w-4" />
                                            {name}
                                          </div>
                                        </SafeSelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEditNote(note.id)}
                                    disabled={!editText.trim() || !selectedName}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-slate-900 dark:text-white">{note.text}</p>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <UserCircle className="h-4 w-4" />
                                    <span>Created by: {note.createdBy || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{note.timestamp && !isNaN(note.timestamp.getTime()) ? note.timestamp.toLocaleString() : 'Unknown date'}</span>
                                  </div>
                                  {note.lastEditedBy && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                      <Edit2 className="h-3 w-3" />
                                      <span>Last edited by: {note.lastEditedBy}</span>
                                      <span>•</span>
                                      <span>{note.lastEditedAt && !isNaN(note.lastEditedAt.getTime()) ? note.lastEditedAt.toLocaleString() : 'Unknown date'}</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {editingNote !== note.id && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingNote(note)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeNote(note.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No notes yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tags" className="space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Add New Tag
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="tag-staff-select">Created by</Label>
                      <Select value={selectedName} onValueChange={setSelectedName}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {STAFF_NAMES.map((name) => (
                            <SafeSelectItem key={name} value={name}>
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                {name}
                              </div>
                            </SafeSelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter a new tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTag();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={addTag} disabled={!newTag.trim() || !selectedName}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tag
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Current Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tags.length > 0 ? (
                      <div className="space-y-3">
                        {tags.map((tagEntry, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant="secondary" 
                                className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-300"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                {tagEntry.tag}
                              </Badge>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <UserCircle className="h-3 w-3" />
                                <span>Added by: {tagEntry.createdBy}</span>
                                <span>•</span>
                                <span>{tagEntry.timestamp && !isNaN(tagEntry.timestamp.getTime()) ? tagEntry.timestamp.toLocaleString() : 'Unknown date'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeTag(tagEntry)}
                              className="ml-2 hover:bg-destructive/20 rounded-full p-1 transition-colors text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tags yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 p-6">
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={onClose} disabled={isSaving} size="lg">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
