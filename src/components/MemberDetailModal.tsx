import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Phone, Building, Users, Edit2, Check, UserCircle
} from "lucide-react";
import { MembershipData } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { toast } from "sonner";

interface MemberDetailModalProps {
  member: MembershipData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, comments: string, notes: string, tags: string[]) => void;
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
];

export const MemberDetailModal = ({ member, isOpen, onClose, onSave }: MemberDetailModalProps) => {
  // Debug logging to understand the data flow
  console.log('=== MemberDetailModal Debug ===');
  console.log('Modal isOpen:', isOpen);
  console.log('Member data received:', member);
  if (member) {
    console.log('Member comments raw:', member.comments);
    console.log('Member notes raw:', member.notes);
    console.log('Member tags raw:', member.tags);
  }
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [notes, setNotes] = useState<Comment[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedName, setSelectedName] = useState(STAFF_NAMES[0]); // Default to first name
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Parse comments function
  const parseComments = (commentsString: string): Comment[] => {
    if (!commentsString) return [];
    
    console.log('Parsing comments string:', commentsString);
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
            timestamp = new Date(match[2]);
          }
        } else if (line.startsWith('[Last edited by:')) {
          const match = line.match(/\[Last edited by: (.+?) at (.+?)\]/);
          if (match) {
            lastEditedBy = match[1];
            lastEditedAt = new Date(match[2]);
          }
        } else if (!line.startsWith('[')) {
          actualText += (actualText ? '\n' : '') + line;
        }
      }

      const comment = {
        id: (index + 1).toString(),
        text: actualText,
        timestamp,
        type: 'comment' as const,
        createdBy,
        lastEditedBy: lastEditedBy || undefined,
        lastEditedAt
      };
      console.log('Processed comment:', comment);
      return comment;
    }).filter(c => c.text);
  };

  // Parse notes function
  const parseNotes = (notesString: string): Comment[] => {
    if (!notesString) return [];
    
    console.log('Parsing notes string:', notesString);
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
            timestamp = new Date(match[2]);
          }
        } else if (line.startsWith('[Last edited by:')) {
          const match = line.match(/\[Last edited by: (.+?) at (.+?)\]/);
          if (match) {
            lastEditedBy = match[1];
            lastEditedAt = new Date(match[2]);
          }
        } else if (!line.startsWith('[')) {
          actualText += (actualText ? '\n' : '') + line;
        }
      }

      const note = {
        id: (index + 1).toString(),
        text: actualText,
        timestamp,
        type: 'note' as const,
        createdBy,
        lastEditedBy: lastEditedBy || undefined,
        lastEditedAt
      };
      console.log('Processed note:', note);
      return note;
    }).filter(n => n.text);
  };

  // Update state when member changes
  useEffect(() => {
    console.log('useEffect triggered - member changed:', member);
    if (member) {
      const parsedComments = parseComments(member.comments || '');
      const parsedNotes = parseNotes(member.notes || '');
      
      console.log('Setting comments:', parsedComments);
      console.log('Setting notes:', parsedNotes);
      console.log('Setting tags:', member.tags || []);
      
      setComments(parsedComments);
      setNotes(parsedNotes);
      setTags(member.tags || []);
    } else {
      console.log('No member - clearing all data');
      setComments([]);
      setNotes([]);
      setTags([]);
    }
  }, [member]);

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const addComment = () => {
    if (!newComment.trim() || !selectedName) return;
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date(),
      type: 'comment' as const,
      createdBy: selectedName
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const addNote = () => {
    if (!newNote.trim() || !selectedName) return;
    const note: Comment = {
      id: Date.now().toString(),
      text: newNote,
      timestamp: new Date(),
      type: 'note' as const,
      createdBy: selectedName
    };
    setNotes(prev => [...prev, note]);
    setNewNote('');
  };

  const startEditingComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const startEditingNote = (note: Comment) => {
    setEditingNote(note.id);
    setEditText(note.text);
  };

  const saveEditComment = (commentId: string) => {
    if (!editText.trim() || !selectedName) return;
    
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? {
            ...comment,
            text: editText.trim(),
            lastEditedBy: selectedName,
            lastEditedAt: new Date()
          }
        : comment
    ));
    setEditingComment(null);
    setEditText('');
  };

  const saveEditNote = (noteId: string) => {
    if (!editText.trim() || !selectedName) return;
    
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? {
            ...note,
            text: editText.trim(),
            lastEditedBy: selectedName,
            lastEditedAt: new Date()
          }
        : note
    ));
    setEditingNote(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditingNote(null);
    setEditText('');
  };

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags(prev => [...prev, newTag.trim()]);
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const removeComment = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const removeNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleSave = async () => {
    if (!member) return;
    
    setIsSaving(true);
    try {
      // Enhanced format to include creator and editor information
      const allComments = comments.map(c => {
        let formatted = c.text;
        if (c.createdBy) {
          formatted += `\n[Created by: ${c.createdBy} at ${c.timestamp.toLocaleString()}]`;
        }
        if (c.lastEditedBy && c.lastEditedAt) {
          formatted += `\n[Last edited by: ${c.lastEditedBy} at ${c.lastEditedAt.toLocaleString()}]`;
        }
        return formatted;
      }).join('\n---\n');
      
      const allNotes = notes.map(n => {
        let formatted = n.text;
        if (n.createdBy) {
          formatted += `\n[Created by: ${n.createdBy} at ${n.timestamp.toLocaleString()}]`;
        }
        if (n.lastEditedBy && n.lastEditedAt) {
          formatted += `\n[Last edited by: ${n.lastEditedBy} at ${n.lastEditedAt.toLocaleString()}]`;
        }
        return formatted;
      }).join('\n---\n');
      
      await googleSheetsService.saveAnnotation(
        member.memberId,
        member.email,
        allComments,
        allNotes,
        tags,
        member.uniqueId // Add unique ID for better persistence
      );
      
      onSave(member.uniqueId || member.memberId, allComments, allNotes, tags);
      toast.success("Member details saved successfully!");
      onClose();
    } catch (error) {
      console.error('Error saving member details:', error);
      toast.error("Failed to save member details. Please try again.");
    } finally {
      setIsSaving(false);
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
                                <span>{note.timestamp.toLocaleString()}</span>
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
                                <span>{comment.timestamp.toLocaleString()}</span>
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
                            <SelectItem key={name} value={name}>
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                {name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEditComment(comment.id)}
                                    disabled={!editText.trim()}
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
                                    <span>{comment.timestamp.toLocaleString()}</span>
                                  </div>
                                  {comment.lastEditedBy && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                      <Edit2 className="h-3 w-3" />
                                      <span>Last edited by: {comment.lastEditedBy}</span>
                                      <span>•</span>
                                      <span>{comment.lastEditedAt?.toLocaleString()}</span>
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
                            <SelectItem key={name} value={name}>
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                {name}
                              </div>
                            </SelectItem>
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
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEditNote(note.id)}
                                    disabled={!editText.trim()}
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
                                    <span>{note.timestamp.toLocaleString()}</span>
                                  </div>
                                  {note.lastEditedBy && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                      <Edit2 className="h-3 w-3" />
                                      <span>Last edited by: {note.lastEditedBy}</span>
                                      <span>•</span>
                                      <span>{note.lastEditedAt?.toLocaleString()}</span>
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
                    <CardTitle>Add New Tag</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter a new tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1"
                      />
                      <Button onClick={addTag} disabled={!newTag.trim()}>
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
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-800 border border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
                          >
                            <Star className="h-3 w-3" />
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-2 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
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
