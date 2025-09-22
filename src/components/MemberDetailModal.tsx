import React, { useState, useEffect } from 'react';import { useState, useRef, useEffect } from "react";import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';import { useState, useRef, useEffect } from "react";

import { formatDistanceToNow } from 'date-fns';

import { toast } from 'sonner';import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import {

  X, Plus, Save, User, Mail, Calendar, MapPin,import { Button } from "@/components/ui/button";import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

  Activity, CreditCard, MessageSquare, FileText,

  Tag, Clock, TrendingUp, AlertCircle, Star,import { Input } from "@/components/ui/input";

  Tags, UserCheck, Edit2

} from 'lucide-react';import { Textarea } from "@/components/ui/textarea";import { Button } from '@/components/ui/button';import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";



import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';import { Label } from "@/components/ui/label";

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';import { Badge } from "@/components/ui/badge";import { Badge } from '@/components/ui/badge';

import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';import { Button } from '@/components/ui/button';import { Button } from "@/components/ui/button";

import { Label } from '@/components/ui/label';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';import { Separator } from "@/components/ui/separator";

import { Separator } from '@/components/ui/separator';

import { AssociateSelector } from '@/components/ui/associate-selector';import { Avatar, AvatarFallback } from "@/components/ui/avatar";import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { MembershipData, Comment, Note, Tag as TagType } from '@/types/membership';

import { 

interface MemberDetailModalProps {

  member: MembershipData | null;  X, Plus, Save, User, Mail, Calendar, MapPin, import { Input } from '@/components/ui/input';import { Badge } from '@/components/ui/badge';import { Input } from "@/components/ui/input";

  isOpen: boolean;

  onClose: () => void;  Activity, CreditCard, MessageSquare, FileText, 

  onSave: (memberId: string, comments: string, notes: string, tags: string[]) => void;

}  Tag, Clock, TrendingUp, AlertCircle, Star,import { Textarea } from '@/components/ui/textarea';



export const MemberDetailModal = ({ member, isOpen, onClose, onSave }: MemberDetailModalProps) => {  Phone, Building, Users

  const [comments, setComments] = useState<Comment[]>([]);

  const [notes, setNotes] = useState<Note[]>([]);} from "lucide-react";import { AssociateSelector } from '@/components/ui/associate-selector';import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';import { Textarea } from "@/components/ui/textarea";

  const [tags, setTags] = useState<TagType[]>([]);

  const [newComment, setNewComment] = useState('');import { MembershipData } from "@/types/membership";

  const [newNote, setNewNote] = useState('');

  const [newTag, setNewTag] = useState('');import { googleSheetsService } from "@/services/googleSheets";import { MembershipData, Comment, Note, Tag } from '@/types/membership';

  const [selectedAssociate, setSelectedAssociate] = useState<string>('');

  const [editingItem, setEditingItem] = useState<{type: 'comment' | 'note' | 'tag', id: string} | null>(null);import { toast } from "sonner";

  const [editText, setEditText] = useState('');

  const [editAssociate, setEditAssociate] = useState('');import { import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';import { Label } from "@/components/ui/label";

  const [isSaving, setIsSaving] = useState(false);

interface MemberDetailModalProps {

  // Initialize data when member changes

  useEffect(() => {  member: MembershipData | null;  User, 

    if (member) {

      // Parse existing comments  isOpen: boolean;

      const existingComments = member.comments ? 

        member.comments.split('\n').map((text, index) => ({  onClose: () => void;  Mail, import { Input } from '@/components/ui/input';import { Badge } from "@/components/ui/badge";

          id: `comment-${index}`,

          text: text.trim(),  onSave: (memberId: string, comments: string, notes: string, tags: string[]) => void;

          timestamp: new Date(),

          associate: 'Unknown',}  MapPin, 

          type: 'comment' as const

        })).filter(c => c.text) : [];



      // Parse existing notes  interface Comment {  Calendar, import { Textarea } from '@/components/ui/textarea';import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

      const existingNotes = member.notes ?

        member.notes.split('\n').map((text, index) => ({  id: string;

          id: `note-${index}`,

          text: text.trim(),  text: string;  CreditCard, 

          timestamp: new Date(),

          associate: 'Unknown',   timestamp: Date;

          type: 'note' as const

        })).filter(n => n.text) : [];  type: 'comment' | 'note';  Activity,import { AssociateSelector } from '@/components/ui/associate-selector';import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



      // Parse existing tags}

      const existingTags = member.tags ?

        member.tags.map((text, index) => ({  Plus,

          id: `tag-${index}`,

          text: text.trim(),export const MemberDetailModal = ({ member, isOpen, onClose, onSave }: MemberDetailModalProps) => {

          timestamp: new Date(),

          associate: 'Unknown'  const [comments, setComments] = useState<Comment[]>(() => {  Edit2,import { MembershipData, Comment, Note, Tag } from '@/types/membership';import { Separator } from "@/components/ui/separator";

        })).filter(t => t.text) : [];

    if (member?.comments) {

      setComments(existingComments);

      setNotes(existingNotes);      return member.comments.split('\n---\n').map((text, index) => ({  Trash2,

      setTags(existingTags);

    }        id: (index + 1).toString(),

  }, [member]);

        text: text.trim(),  Save,import { import { Avatar, AvatarFallback } from "@/components/ui/avatar";

  const handleAddComment = () => {

    if (!newComment.trim() || !selectedAssociate) {        timestamp: new Date(),

      toast.error('Please enter a comment and select an associate');

      return;        type: 'comment' as const  X,

    }

      })).filter(c => c.text);

    const comment: Comment = {

      id: `comment-${Date.now()}`,    }  MessageSquare,  User, import { 

      text: newComment.trim(),

      timestamp: new Date(),    return [];

      associate: selectedAssociate,

      type: 'comment'  });  StickyNote,

    };

  

    setComments(prev => [...prev, comment]);

    setNewComment('');  const [notes, setNotes] = useState<Comment[]>(() => {  Tags,  Mail,   X, Plus, Save, User, Mail, Calendar, MapPin, 

    setSelectedAssociate('');

    toast.success('Comment added successfully');    if (member?.notes) {

  };

      return member.notes.split('\n---\n').map((text, index) => ({  Clock,

  const handleAddNote = () => {

    if (!newNote.trim() || !selectedAssociate) {        id: (index + 1).toString(),

      toast.error('Please enter a note and select an associate');

      return;        text: text.trim(),  UserCheck  MapPin,   Activity, CreditCard, MessageSquare, FileText, 

    }

        timestamp: new Date(),

    const note: Note = {

      id: `note-${Date.now()}`,        type: 'note' as const} from 'lucide-react';

      text: newNote.trim(),

      timestamp: new Date(),      })).filter(n => n.text);

      associate: selectedAssociate,

      type: 'note'    }import { formatDistanceToNow } from 'date-fns';  Calendar,   Tag, Clock, TrendingUp, AlertCircle, Star,

    };

    return [];

    setNotes(prev => [...prev, note]);

    setNewNote('');  });import { toast } from 'sonner';

    setSelectedAssociate('');

    toast.success('Note added successfully');  

  };

  const [tags, setTags] = useState<string[]>(member?.tags || []);  CreditCard,   Phone, Building, Users

  const handleAddTag = () => {

    if (!newTag.trim() || !selectedAssociate) {  const [newComment, setNewComment] = useState('');

      toast.error('Please enter a tag and select an associate');

      return;  const [newNote, setNewNote] = useState('');interface MemberDetailModalProps {

    }

  const [newTag, setNewTag] = useState('');

    const tag: TagType = {

      id: `tag-${Date.now()}`,  const [isSaving, setIsSaving] = useState(false);  isOpen: boolean;  Activity,} from "lucide-react";

      text: newTag.trim(),

      timestamp: new Date(),  const [activeTab, setActiveTab] = useState('overview');

      associate: selectedAssociate,

      color: '#3B82F6'  onClose: () => void;

    };

  // Update state when member changes

    setTags(prev => [...prev, tag]);

    setNewTag('');  useEffect(() => {  member: MembershipData | null;  Plus,import { MembershipData } from "@/types/membership";

    setSelectedAssociate('');

    toast.success('Tag added successfully');    if (member?.comments) {

  };

      const parsedComments = member.comments.split('\n---\n').map((text, index) => ({  onUpdateMember?: (member: MembershipData) => void;

  const handleEdit = (type: 'comment' | 'note' | 'tag', id: string) => {

    let item;        id: (index + 1).toString(),

    if (type === 'comment') {

      item = comments.find(c => c.id === id);        text: text.trim(),}  Edit2,import { googleSheetsService } from "@/services/googleSheets";

    } else if (type === 'note') {

      item = notes.find(n => n.id === id);        timestamp: new Date(),

    } else {

      item = tags.find(t => t.id === id);        type: 'comment' as const

    }

      })).filter(c => c.text);

    if (item) {

      setEditingItem({ type, id });      setComments(parsedComments);interface EditingState {  Trash2,import { toast } from "sonner";

      setEditText(item.text);

      setEditAssociate(item.associate);    } else {

    }

  };      setComments([]);  type: 'comment' | 'note' | 'tag' | null;



  const handleSaveEdit = () => {    }

    if (!editText.trim() || !editAssociate || !editingItem) {

      toast.error('Please fill all fields');  id?: string;  Save,

      return;

    }    if (member?.notes) {



    if (editingItem.type === 'comment') {      const parsedNotes = member.notes.split('\n---\n').map((text, index) => ({  isNew?: boolean;

      setComments(prev => prev.map(c => 

        c.id === editingItem.id         id: (index + 1).toString(),

          ? { ...c, text: editText.trim(), associate: editAssociate }

          : c        text: text.trim(),}  X,interface MemberDetailModalProps {

      ));

    } else if (editingItem.type === 'note') {        timestamp: new Date(),

      setNotes(prev => prev.map(n => 

        n.id === editingItem.id         type: 'note' as const

          ? { ...n, text: editText.trim(), associate: editAssociate }

          : n      })).filter(n => n.text);

      ));

    } else if (editingItem.type === 'tag') {      setNotes(parsedNotes);export const MemberDetailModal = ({ isOpen, onClose, member, onUpdateMember }: MemberDetailModalProps) => {  MessageSquare,  member: MembershipData | null;

      setTags(prev => prev.map(t => 

        t.id === editingItem.id     } else {

          ? { ...t, text: editText.trim(), associate: editAssociate }

          : t      setNotes([]);  const [comments, setComments] = useState<Comment[]>([]);

      ));

    }    }



    setEditingItem(null);  const [notes, setNotes] = useState<Note[]>([]);  StickyNote,  isOpen: boolean;

    setEditText('');

    setEditAssociate('');    setTags(member?.tags || []);

    toast.success('Item updated successfully');

  };  }, [member]);  const [tags, setTags] = useState<Tag[]>([]);



  const handleDelete = (type: 'comment' | 'note' | 'tag', id: string) => {

    if (type === 'comment') {

      setComments(prev => prev.filter(c => c.id !== id));  const getDaysUntilExpiry = (endDate: string) => {  const [editing, setEditing] = useState<EditingState>({ type: null });  Tags,  onClose: () => void;

    } else if (type === 'note') {

      setNotes(prev => prev.filter(n => n.id !== id));    const today = new Date();

    } else {

      setTags(prev => prev.filter(t => t.id !== id));    const expiry = new Date(endDate);  const [editText, setEditText] = useState('');

    }

    toast.success('Item deleted successfully');    const diffTime = expiry.getTime() - today.getTime();

  };

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));  const [editAssociate, setEditAssociate] = useState('');  Clock,  onSave: (memberId: string, comments: string, notes: string, tags: string[]) => void;

  const handleSaveAll = async () => {

    if (!member) return;    return diffDays;



    setIsSaving(true);  };  const [associateError, setAssociateError] = useState('');

    try {

      const commentsText = comments.map(c => c.text).join('\n');

      const notesText = notes.map(n => n.text).join('\n');

      const tagsArray = tags.map(t => t.text);  const getStatusColor = (status: string) => {  UserCheck,}



      onSave(member.memberId, commentsText, notesText, tagsArray);    switch (status) {

      toast.success('All changes saved successfully');

      onClose();      case 'Active':  // Update state when member changes

    } catch (error) {

      toast.error('Failed to save changes');        return 'bg-green-100 text-green-800 border-green-200';

    } finally {

      setIsSaving(false);      case 'Churned':  useEffect(() => {  AlertCircle

    }

  };        return 'bg-red-100 text-red-800 border-red-200';



  if (!member) return null;      case 'Frozen':    if (member?.comments) {



  return (        return 'bg-blue-100 text-blue-800 border-blue-200';

    <Dialog open={isOpen} onOpenChange={onClose}>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">      default:      const parsedComments = member.comments.split('\n---\n').map((text, index) => ({} from 'lucide-react';interface Comment {

        <DialogHeader>

          <DialogTitle className="flex items-center gap-3">        return 'bg-gray-100 text-gray-800 border-gray-200';

            <Avatar className="h-10 w-10">

              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">    }        id: (index + 1).toString(),

                {member.firstName.charAt(0)}{member.lastName.charAt(0)}

              </AvatarFallback>  };

            </Avatar>

            <div>        text: text.trim(),import { formatDistanceToNow } from 'date-fns';  id: string;

              <h2 className="text-xl font-semibold">

                {member.firstName} {member.lastName}  const getExpiryColor = (days: number) => {

              </h2>

              <p className="text-sm text-gray-500">{member.membershipName}</p>    if (days < 0) return 'text-red-600';        timestamp: new Date(),

            </div>

          </DialogTitle>    if (days <= 7) return 'text-orange-600';

        </DialogHeader>

    if (days <= 30) return 'text-yellow-600';        associate: 'Unknown',import { toast } from 'sonner';  text: string;

        <div className="space-y-6">

          {/* Member Info Cards */}    return 'text-green-600';

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Card>  };        type: 'comment' as const

              <CardHeader className="pb-3">

                <CardTitle className="text-sm font-medium flex items-center gap-2">

                  <Mail className="h-4 w-4" />

                  Contact Info  const handleAddComment = () => {      })).filter(c => c.text);  timestamp: Date;

                </CardTitle>

              </CardHeader>    if (newComment.trim()) {

              <CardContent className="space-y-2">

                <p className="text-sm"><strong>Email:</strong> {member.email}</p>      const comment: Comment = {      setComments(parsedComments);

                <p className="text-sm"><strong>Member ID:</strong> {member.memberId}</p>

                <p className="text-sm flex items-center gap-1">        id: Date.now().toString(),

                  <MapPin className="h-3 w-3" />

                  {member.location}        text: newComment,    } else {interface MemberDetailModalProps {  type: 'comment' | 'note';

                </p>

              </CardContent>        timestamp: new Date(),

            </Card>

        type: 'comment'      setComments([]);

            <Card>

              <CardHeader className="pb-3">      };

                <CardTitle className="text-sm font-medium flex items-center gap-2">

                  <Calendar className="h-4 w-4" />      setComments([comment, ...comments]);    }  isOpen: boolean;}

                  Membership Details

                </CardTitle>      setNewComment('');

              </CardHeader>

              <CardContent className="space-y-2">    }

                <p className="text-sm"><strong>End Date:</strong> {member.endDate}</p>

                <p className="text-sm"><strong>Order Date:</strong> {member.orderDate}</p>  };

                <p className="text-sm"><strong>Sold By:</strong> {member.soldBy}</p>

              </CardContent>    if (member?.notes) {  onClose: () => void;

            </Card>

  const handleAddNote = () => {

            <Card>

              <CardHeader className="pb-3">    if (newNote.trim()) {      const parsedNotes = member.notes.split('\n---\n').map((text, index) => ({

                <CardTitle className="text-sm font-medium flex items-center gap-2">

                  <Activity className="h-4 w-4" />      const note: Comment = {

                  Status & Usage

                </CardTitle>        id: Date.now().toString(),        id: (index + 1).toString(),  member: MembershipData | null;export const MemberDetailModal = ({ member, isOpen, onClose, onSave }: MemberDetailModalProps) => {

              </CardHeader>

              <CardContent className="space-y-2">        text: newNote,

                <div className="flex items-center gap-2">

                  <Badge variant={member.status === 'Active' ? 'default' : member.status === 'Frozen' ? 'secondary' : 'destructive'}>        timestamp: new Date(),        text: text.trim(),

                    {member.status}

                  </Badge>        type: 'note'

                </div>

                <p className="text-sm"><strong>Usage:</strong> {member.currentUsage || 'N/A'}</p>      };        timestamp: new Date(),  onUpdateMember?: (member: MembershipData) => void;  const [comments, setComments] = useState<Comment[]>(() => {

                <p className="text-sm"><strong>Frozen:</strong> {member.frozen}</p>

                <p className="text-sm"><strong>Paid:</strong> {member.paid}</p>      setNotes([note, ...notes]);

              </CardContent>

            </Card>      setNewNote('');        associate: 'Unknown',

          </div>

    }

          {/* Tabs for Comments, Notes, Tags */}

          <Tabs defaultValue="comments" className="w-full">  };        type: 'note' as const}    if (member?.comments) {

            <TabsList className="grid w-full grid-cols-3">

              <TabsTrigger value="comments" className="flex items-center gap-2">

                <MessageSquare className="h-4 w-4" />

                Comments ({comments.length})  const handleAddTag = () => {      })).filter(n => n.text);

              </TabsTrigger>

              <TabsTrigger value="notes" className="flex items-center gap-2">    if (newTag.trim() && !tags.includes(newTag.trim())) {

                <FileText className="h-4 w-4" />

                Notes ({notes.length})      setTags([...tags, newTag.trim()]);      setNotes(parsedNotes);      return member.comments.split('\n---\n').map((text, index) => ({

              </TabsTrigger>

              <TabsTrigger value="tags" className="flex items-center gap-2">      setNewTag('');

                <Tags className="h-4 w-4" />

                Tags ({tags.length})    }    } else {

              </TabsTrigger>

            </TabsList>  };



            <TabsContent value="comments" className="space-y-4">      setNotes([]);interface EditingState {        id: (index + 1).toString(),

              <Card>

                <CardHeader>  const handleDeleteComment = (id: string) => {

                  <CardTitle className="text-lg">Add New Comment</CardTitle>

                </CardHeader>    setComments(comments.filter(c => c.id !== id));    }

                <CardContent className="space-y-4">

                  <div className="space-y-2">  };

                    <Label htmlFor="comment">Comment</Label>

                    <Textarea  type: 'comment' | 'note' | 'tag' | null;        text: text.trim(),

                      id="comment"

                      value={newComment}  const handleDeleteNote = (id: string) => {

                      onChange={(e) => setNewComment(e.target.value)}

                      placeholder="Enter your comment..."    setNotes(notes.filter(n => n.id !== id));    setTags(member?.tags?.map((tag, index) => ({

                      className="min-h-[100px]"

                    />  };

                  </div>

                  <AssociateSelector      id: (index + 1).toString(),  id?: string;        timestamp: new Date(),

                    label="Associate"

                    value={selectedAssociate}  const handleDeleteTag = (tagToDelete: string) => {

                    onValueChange={setSelectedAssociate}

                    required    setTags(tags.filter(tag => tag !== tagToDelete));      text: tag,

                    placeholder="Select associate..."

                  />  };

                  <Button onClick={handleAddComment} className="w-full">

                    <Plus className="h-4 w-4 mr-2" />      timestamp: new Date(),  isNew?: boolean;        type: 'comment' as const

                    Add Comment

                  </Button>  const handleSave = async () => {

                </CardContent>

              </Card>    if (!member) return;      associate: 'Unknown',



              <div className="space-y-3">    

                {comments.map((comment) => (

                  <Card key={comment.id}>    setIsSaving(true);      color: getTagColor(tag)}      })).filter(c => c.text);

                    <CardContent className="pt-4">

                      {editingItem?.type === 'comment' && editingItem.id === comment.id ? (    try {

                        <div className="space-y-3">

                          <Textarea      const commentsString = comments.map(c => c.text).join('\n---\n');    })) || []);

                            value={editText}

                            onChange={(e) => setEditText(e.target.value)}      const notesString = notes.map(n => n.text).join('\n---\n');

                            className="min-h-[80px]"

                          />        }, [member]);    }

                          <AssociateSelector

                            value={editAssociate}      onSave(member.memberId, commentsString, notesString, tags);

                            onValueChange={setEditAssociate}

                            required      toast.success('Member details saved successfully');

                          />

                          <div className="flex gap-2">      onClose();

                            <Button size="sm" onClick={handleSaveEdit}>

                              <Save className="h-3 w-3 mr-1" />    } catch (error) {  const getTagColor = (tag: string) => {export const MemberDetailModal = ({ isOpen, onClose, member, onUpdateMember }: MemberDetailModalProps) => {    return [];

                              Save

                            </Button>      console.error('Error saving member details:', error);

                            <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>

                              <X className="h-3 w-3 mr-1" />      toast.error('Failed to save member details');    const colors = [

                              Cancel

                            </Button>    } finally {

                          </div>

                        </div>      setIsSaving(false);      'bg-blue-100 text-blue-800 border-blue-200',  const [comments, setComments] = useState<Comment[]>([]);  });

                      ) : (

                        <div>    }

                          <p className="text-sm mb-2">{comment.text}</p>

                          <div className="flex items-center justify-between text-xs text-gray-500">  };      'bg-green-100 text-green-800 border-green-200',

                            <div className="flex items-center gap-2">

                              <User className="h-3 w-3" />

                              <span>{comment.associate}</span>

                              <Clock className="h-3 w-3" />  if (!member) return null;      'bg-purple-100 text-purple-800 border-purple-200',  const [notes, setNotes] = useState<Note[]>([]);  

                              <span>{formatDistanceToNow(comment.timestamp, { addSuffix: true })}</span>

                            </div>

                            <div className="flex gap-1">

                              <Button size="sm" variant="ghost" onClick={() => handleEdit('comment', comment.id)}>  const daysUntilExpiry = getDaysUntilExpiry(member.endDate);      'bg-orange-100 text-orange-800 border-orange-200',

                                <Edit2 className="h-3 w-3" />

                              </Button>

                              <Button size="sm" variant="ghost" onClick={() => handleDelete('comment', comment.id)}>

                                <X className="h-3 w-3" />  return (      'bg-pink-100 text-pink-800 border-pink-200',  const [tags, setTags] = useState<Tag[]>([]);  const [notes, setNotes] = useState<Comment[]>(() => {

                              </Button>

                            </div>    <Dialog open={isOpen} onOpenChange={onClose}>

                          </div>

                        </div>      <DialogContent className="max-w-5xl h-[90vh] overflow-hidden">      'bg-indigo-100 text-indigo-800 border-indigo-200'

                      )}

                    </CardContent>        <DialogHeader className="border-b border-gray-200 pb-4">

                  </Card>

                ))}          <div className="flex items-center justify-between">    ];  const [editing, setEditing] = useState<EditingState>({ type: null });    if (member?.notes) {

              </div>

            </TabsContent>            <div className="flex items-center space-x-4">



            <TabsContent value="notes" className="space-y-4">              <Avatar className="h-16 w-16">    return colors[tag.length % colors.length];

              <Card>

                <CardHeader>                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold">

                  <CardTitle className="text-lg">Add New Note</CardTitle>

                </CardHeader>                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}  };  const [editText, setEditText] = useState('');      return member.notes.split('\n---\n').map((text, index) => ({

                <CardContent className="space-y-4">

                  <div className="space-y-2">                </AvatarFallback>

                    <Label htmlFor="note">Note</Label>

                    <Textarea              </Avatar>

                      id="note"

                      value={newNote}              <div>

                      onChange={(e) => setNewNote(e.target.value)}

                      placeholder="Enter your note..."                <DialogTitle className="text-2xl font-bold text-gray-900">  const startEditing = (type: 'comment' | 'note' | 'tag', id?: string, currentText?: string, currentAssociate?: string) => {  const [editAssociate, setEditAssociate] = useState('');        id: (index + 1).toString(),

                      className="min-h-[100px]"

                    />                  {member.firstName} {member.lastName}

                  </div>

                  <AssociateSelector                </DialogTitle>    setEditing({ type, id, isNew: !id });

                    label="Associate"

                    value={selectedAssociate}                <div className="flex items-center space-x-2 mt-1">

                    onValueChange={setSelectedAssociate}

                    required                  <Mail className="h-4 w-4 text-gray-500" />    setEditText(currentText || '');  const [associateError, setAssociateError] = useState('');        text: text.trim(),

                    placeholder="Select associate..."

                  />                  <span className="text-sm text-gray-600">{member.email}</span>

                  <Button onClick={handleAddNote} className="w-full">

                    <Plus className="h-4 w-4 mr-2" />                </div>    setEditAssociate(currentAssociate || '');

                    Add Note

                  </Button>              </div>

                </CardContent>

              </Card>            </div>    setAssociateError('');        timestamp: new Date(),



              <div className="space-y-3">            <div className="flex items-center space-x-3">

                {notes.map((note) => (

                  <Card key={note.id}>              <Badge className={`px-3 py-1 text-sm font-medium border ${getStatusColor(member.status)}`}>  };

                    <CardContent className="pt-4">

                      {editingItem?.type === 'note' && editingItem.id === note.id ? (                {member.status}

                        <div className="space-y-3">

                          <Textarea              </Badge>  // Update state when member changes        type: 'note' as const

                            value={editText}

                            onChange={(e) => setEditText(e.target.value)}              <Button

                            className="min-h-[80px]"

                          />                onClick={handleSave}  const cancelEditing = () => {

                          <AssociateSelector

                            value={editAssociate}                disabled={isSaving}

                            onValueChange={setEditAssociate}

                            required                className="bg-blue-600 hover:bg-blue-700"    setEditing({ type: null });  useEffect(() => {      })).filter(n => n.text);

                          />

                          <div className="flex gap-2">              >

                            <Button size="sm" onClick={handleSaveEdit}>

                              <Save className="h-3 w-3 mr-1" />                {isSaving ? 'Saving...' : 'Save Changes'}    setEditText('');

                              Save

                            </Button>              </Button>

                            <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>

                              <X className="h-3 w-3 mr-1" />            </div>    setEditAssociate('');    if (member?.comments) {    }

                              Cancel

                            </Button>          </div>

                          </div>

                        </div>        </DialogHeader>    setAssociateError('');

                      ) : (

                        <div>

                          <p className="text-sm mb-2">{note.text}</p>

                          <div className="flex items-center justify-between text-xs text-gray-500">        <div className="flex-1 overflow-auto">  };      const parsedComments = member.comments.split('\n---\n').map((text, index) => ({    return [];

                            <div className="flex items-center gap-2">

                              <User className="h-3 w-3" />          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

                              <span>{note.associate}</span>

                              <Clock className="h-3 w-3" />            <TabsList className="grid w-full grid-cols-4 mb-6">

                              <span>{formatDistanceToNow(note.timestamp, { addSuffix: true })}</span>

                            </div>              <TabsTrigger value="overview" className="flex items-center space-x-2">

                            <div className="flex gap-1">

                              <Button size="sm" variant="ghost" onClick={() => handleEdit('note', note.id)}>                <Activity className="h-4 w-4" />  const saveEdit = () => {        id: (index + 1).toString(),  });

                                <Edit2 className="h-3 w-3" />

                              </Button>                <span>Overview</span>

                              <Button size="sm" variant="ghost" onClick={() => handleDelete('note', note.id)}>

                                <X className="h-3 w-3" />              </TabsTrigger>    if (!editAssociate) {

                              </Button>

                            </div>              <TabsTrigger value="comments" className="flex items-center space-x-2">

                          </div>

                        </div>                <MessageSquare className="h-4 w-4" />      setAssociateError('Associate name is required');        text: text.trim(),  

                      )}

                    </CardContent>                <span>Comments ({comments.length})</span>

                  </Card>

                ))}              </TabsTrigger>      return;

              </div>

            </TabsContent>              <TabsTrigger value="notes" className="flex items-center space-x-2">



            <TabsContent value="tags" className="space-y-4">                <FileText className="h-4 w-4" />    }        timestamp: new Date(),  const [tags, setTags] = useState<string[]>(member?.tags || []);

              <Card>

                <CardHeader>                <span>Notes ({notes.length})</span>

                  <CardTitle className="text-lg">Add New Tag</CardTitle>

                </CardHeader>              </TabsTrigger>

                <CardContent className="space-y-4">

                  <div className="space-y-2">              <TabsTrigger value="tags" className="flex items-center space-x-2">

                    <Label htmlFor="tag">Tag</Label>

                    <Input                <Tag className="h-4 w-4" />    if (!editText.trim()) {        associate: 'Unknown', // Default for existing data  const [newComment, setNewComment] = useState('');

                      id="tag"

                      value={newTag}                <span>Tags ({tags.length})</span>

                      onChange={(e) => setNewTag(e.target.value)}

                      placeholder="Enter tag name..."              </TabsTrigger>      toast.error('Please enter some text');

                    />

                  </div>            </TabsList>

                  <AssociateSelector

                    label="Associate"      return;        type: 'comment' as const  const [newNote, setNewNote] = useState('');

                    value={selectedAssociate}

                    onValueChange={setSelectedAssociate}            <TabsContent value="overview" className="space-y-6">

                    required

                    placeholder="Select associate..."              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">    }

                  />

                  <Button onClick={handleAddTag} className="w-full">                <Card>

                    <Plus className="h-4 w-4 mr-2" />

                    Add Tag                  <CardHeader>      })).filter(c => c.text);  const [newTag, setNewTag] = useState('');

                  </Button>

                </CardContent>                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">

              </Card>

                      <User className="h-5 w-5 mr-2 text-blue-600" />    const timestamp = new Date();

              <div className="flex flex-wrap gap-3">

                {tags.map((tag) => (                      Member Information

                  <div key={tag.id} className="relative group">

                    {editingItem?.type === 'tag' && editingItem.id === tag.id ? (                    </CardTitle>    const newId = Date.now().toString();      setComments(parsedComments);  const [isSaving, setIsSaving] = useState(false);

                      <Card className="p-3 min-w-[200px]">

                        <div className="space-y-2">                  </CardHeader>

                          <Input

                            value={editText}                  <CardContent className="space-y-3">

                            onChange={(e) => setEditText(e.target.value)}

                            placeholder="Tag name"                    <div className="flex justify-between">

                          />

                          <AssociateSelector                      <span className="text-sm font-medium text-gray-600">Member ID:</span>    if (editing.type === 'comment') {    } else {  const [activeTab, setActiveTab] = useState('overview');

                            value={editAssociate}

                            onValueChange={setEditAssociate}                      <span className="text-sm text-gray-900">{member.memberId}</span>

                            required

                          />                    </div>      if (editing.isNew) {

                          <div className="flex gap-1">

                            <Button size="sm" onClick={handleSaveEdit}>                    <div className="flex justify-between">

                              <Save className="h-3 w-3" />

                            </Button>                      <span className="text-sm font-medium text-gray-600">Membership:</span>        const newComment: Comment = {      setComments([]);

                            <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>

                              <X className="h-3 w-3" />                      <span className="text-sm text-gray-900">{member.membershipName}</span>

                            </Button>

                          </div>                    </div>          id: newId,

                        </div>

                      </Card>                    <div className="flex justify-between">

                    ) : (

                      <div className="relative">                      <span className="text-sm font-medium text-gray-600">Location:</span>          text: editText,    }  // Update state when member changes

                        <Badge

                          variant="secondary"                      <span className="text-sm text-gray-900 flex items-center">

                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-200 transition-colors"

                          style={{ backgroundColor: tag.color + '20', color: tag.color }}                        <MapPin className="h-3 w-3 mr-1" />          timestamp,

                        >

                          <Tag className="h-3 w-3 mr-1" />                        {member.location}

                          {tag.text}

                        </Badge>                      </span>          associate: editAssociate,  useEffect(() => {

                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">

                          <Button                    </div>

                            size="sm"

                            variant="ghost"                    <div className="flex justify-between">          type: 'comment'

                            className="h-6 w-6 p-0 bg-white shadow-sm border"

                            onClick={() => handleEdit('tag', tag.id)}                      <span className="text-sm font-medium text-gray-600">Sold By:</span>

                          >

                            <Edit2 className="h-3 w-3" />                      <span className="text-sm text-gray-900">{member.soldBy}</span>        };    if (member?.notes) {    if (member?.comments) {

                          </Button>

                          <Button                    </div>

                            size="sm"

                            variant="ghost"                  </CardContent>        setComments(prev => [newComment, ...prev]);

                            className="h-6 w-6 p-0 bg-white shadow-sm border"

                            onClick={() => handleDelete('tag', tag.id)}                </Card>

                          >

                            <X className="h-3 w-3" />        toast.success('Comment added successfully');      const parsedNotes = member.notes.split('\n---\n').map((text, index) => ({      const parsedComments = member.comments.split('\n---\n').map((text, index) => ({

                          </Button>

                        </div>                <Card>

                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">

                          <User className="h-3 w-3" />                  <CardHeader>      } else {

                          {tag.associate}

                        </div>                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">

                      </div>

                    )}                      <Calendar className="h-5 w-5 mr-2 text-green-600" />        setComments(prev => prev.map(c =>         id: (index + 1).toString(),        id: (index + 1).toString(),

                  </div>

                ))}                      Membership Details

              </div>

            </TabsContent>                    </CardTitle>          c.id === editing.id 

          </Tabs>

                  </CardHeader>

          <Separator />

                  <CardContent className="space-y-3">            ? { ...c, text: editText, associate: editAssociate, timestamp }        text: text.trim(),        text: text.trim(),

          {/* Action Buttons */}

          <div className="flex justify-end gap-3">                    <div className="flex justify-between">

            <Button variant="outline" onClick={onClose}>

              Cancel                      <span className="text-sm font-medium text-gray-600">End Date:</span>            : c

            </Button>

            <Button onClick={handleSaveAll} disabled={isSaving}>                      <span className="text-sm text-gray-900">{new Date(member.endDate).toLocaleDateString()}</span>

              {isSaving ? (

                <>                    </div>        ));        timestamp: new Date(),        timestamp: new Date(),

                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />

                  Saving...                    <div className="flex justify-between">

                </>

              ) : (                      <span className="text-sm font-medium text-gray-600">Days Until Expiry:</span>        toast.success('Comment updated successfully');

                <>

                  <Save className="h-4 w-4 mr-2" />                      <span className={`text-sm font-semibold ${getExpiryColor(daysUntilExpiry)}`}>

                  Save All Changes

                </>                        {daysUntilExpiry < 0 ? `Expired ${Math.abs(daysUntilExpiry)} days ago` : `${daysUntilExpiry} days`}      }        associate: 'Unknown', // Default for existing data        type: 'comment' as const

              )}

            </Button>                      </span>

          </div>

        </div>                    </div>    } else if (editing.type === 'note') {

      </DialogContent>

    </Dialog>                    <div className="flex justify-between">

  );

};                      <span className="text-sm font-medium text-gray-600">Order Date:</span>      if (editing.isNew) {        type: 'note' as const      })).filter(c => c.text);

                      <span className="text-sm text-gray-900">{new Date(member.orderDate).toLocaleDateString()}</span>

                    </div>        const newNote: Note = {

                    <div className="flex justify-between">

                      <span className="text-sm font-medium text-gray-600">Current Usage:</span>          id: newId,      })).filter(n => n.text);      setComments(parsedComments);

                      <span className="text-sm text-gray-900">{member.currentUsage}</span>

                    </div>          text: editText,

                    <div className="flex justify-between">

                      <span className="text-sm font-medium text-gray-600">Payment Status:</span>          timestamp,      setNotes(parsedNotes);    } else {

                      <Badge className={member.paid === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>

                        <CreditCard className="h-3 w-3 mr-1" />          associate: editAssociate,

                        {member.paid === 'Yes' ? 'Paid' : 'Unpaid'}

                      </Badge>          type: 'note'    } else {      setComments([]);

                    </div>

                  </CardContent>        };

                </Card>

              </div>        setNotes(prev => [newNote, ...prev]);      setNotes([]);    }



              {/* Recent Comments Preview */}        toast.success('Note added successfully');

              <Card>

                <CardHeader>      } else {    }

                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">

                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />        setNotes(prev => prev.map(n => 

                    Recent Comments

                  </CardTitle>          n.id === editing.id     if (member?.notes) {

                </CardHeader>

                <CardContent>            ? { ...n, text: editText, associate: editAssociate, timestamp }

                  {comments.length > 0 ? (

                    <div className="space-y-3">            : n    setTags(member?.tags?.map((tag, index) => ({      const parsedNotes = member.notes.split('\n---\n').map((text, index) => ({

                      {comments.slice(0, 3).map((comment) => (

                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">        ));

                          <p className="text-sm text-gray-700">{comment.text}</p>

                          <span className="text-xs text-gray-500 flex items-center mt-2">        toast.success('Note updated successfully');      id: (index + 1).toString(),        id: (index + 1).toString(),

                            <Clock className="h-3 w-3 mr-1" />

                            {comment.timestamp.toLocaleDateString()}      }

                          </span>

                        </div>    } else if (editing.type === 'tag') {      text: tag,        text: text.trim(),

                      ))}

                      {comments.length > 3 && (      if (editing.isNew) {

                        <p className="text-sm text-gray-500 text-center">

                          +{comments.length - 3} more comments        const newTag: Tag = {      timestamp: new Date(),        timestamp: new Date(),

                        </p>

                      )}          id: newId,

                    </div>

                  ) : (          text: editText,      associate: 'Unknown', // Default for existing data        type: 'note' as const

                    <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>

                  )}          timestamp,

                </CardContent>

              </Card>          associate: editAssociate,      color: getTagColor(tag)      })).filter(n => n.text);



              {/* Recent Notes Preview */}          color: getTagColor(editText)

              <Card>

                <CardHeader>        };    })) || []);      setNotes(parsedNotes);

                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">

                    <FileText className="h-5 w-5 mr-2 text-green-600" />        setTags(prev => [newTag, ...prev]);

                    Recent Notes

                  </CardTitle>        toast.success('Tag added successfully');  }, [member]);    } else {

                </CardHeader>

                <CardContent>      } else {

                  {notes.length > 0 ? (

                    <div className="space-y-3">        setTags(prev => prev.map(t =>       setNotes([]);

                      {notes.slice(0, 3).map((note) => (

                        <div key={note.id} className="bg-gray-50 p-3 rounded-lg">          t.id === editing.id 

                          <p className="text-sm text-gray-700">{note.text}</p>

                          <span className="text-xs text-gray-500 flex items-center mt-2">            ? { ...t, text: editText, associate: editAssociate, timestamp, color: getTagColor(editText) }  const getTagColor = (tag: string) => {    }

                            <Clock className="h-3 w-3 mr-1" />

                            {note.timestamp.toLocaleDateString()}            : t

                          </span>

                        </div>        ));    const colors = [

                      ))}

                      {notes.length > 3 && (        toast.success('Tag updated successfully');

                        <p className="text-sm text-gray-500 text-center">

                          +{notes.length - 3} more notes      }      'bg-blue-100 text-blue-800 border-blue-200',    setTags(member?.tags || []);

                        </p>

                      )}    }

                    </div>

                  ) : (      'bg-green-100 text-green-800 border-green-200',  }, [member]);

                    <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>

                  )}    cancelEditing();

                </CardContent>

              </Card>  };      'bg-purple-100 text-purple-800 border-purple-200',

            </TabsContent>



            <TabsContent value="comments" className="space-y-4">

              <Card>  const deleteItem = (type: 'comment' | 'note' | 'tag', id: string) => {      'bg-orange-100 text-orange-800 border-orange-200',  const getDaysUntilExpiry = (endDate: string) => {

                <CardHeader>

                  <CardTitle className="flex items-center justify-between">    if (type === 'comment') {

                    <span>Add New Comment</span>

                  </CardTitle>      setComments(prev => prev.filter(c => c.id !== id));      'bg-pink-100 text-pink-800 border-pink-200',    const today = new Date();

                </CardHeader>

                <CardContent className="space-y-4">      toast.success('Comment deleted successfully');

                  <Textarea

                    value={newComment}    } else if (type === 'note') {      'bg-indigo-100 text-indigo-800 border-indigo-200'    const expiry = new Date(endDate);

                    onChange={(e) => setNewComment(e.target.value)}

                    placeholder="Enter your comment..."      setNotes(prev => prev.filter(n => n.id !== id));

                    rows={3}

                  />      toast.success('Note deleted successfully');    ];    const diffTime = expiry.getTime() - today.getTime();

                  <Button onClick={handleAddComment} className="w-full">

                    <Plus className="h-4 w-4 mr-2" />    } else if (type === 'tag') {

                    Add Comment

                  </Button>      setTags(prev => prev.filter(t => t.id !== id));    return colors[tag.length % colors.length];    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                </CardContent>

              </Card>      toast.success('Tag deleted successfully');



              <div className="space-y-3">    }  };  };

                {comments.map((comment) => (

                  <Card key={comment.id}>  };

                    <CardContent className="p-4">

                      <div className="flex justify-between items-start">

                        <div className="flex-1">

                          <p className="text-gray-700">{comment.text}</p>  if (!member) return null;

                          <span className="text-xs text-gray-500 flex items-center mt-2">

                            <Clock className="h-3 w-3 mr-1" />  const startEditing = (type: 'comment' | 'note' | 'tag', id?: string, currentText?: string, currentAssociate?: string) => {  const addComment = () => {

                            {comment.timestamp.toLocaleDateString()}

                          </span>  const getStatusColor = (status: string) => {

                        </div>

                        <Button    switch (status) {    setEditing({ type, id, isNew: !id });    if (!newComment.trim()) return;

                          variant="ghost"

                          size="sm"      case 'Active':

                          onClick={() => handleDeleteComment(comment.id)}

                          className="text-red-600 hover:text-red-700"        return 'bg-green-100 text-green-800 border-green-200';    setEditText(currentText || '');    const comment: Comment = {

                        >

                          <X className="h-4 w-4" />      case 'Churned':

                        </Button>

                      </div>        return 'bg-red-100 text-red-800 border-red-200';    setEditAssociate(currentAssociate || '');      id: Date.now().toString(),

                    </CardContent>

                  </Card>      case 'Frozen':

                ))}

              </div>        return 'bg-blue-100 text-blue-800 border-blue-200';    setAssociateError('');      text: newComment,

            </TabsContent>

      default:

            <TabsContent value="notes" className="space-y-4">

              <Card>        return 'bg-gray-100 text-gray-800 border-gray-200';  };      timestamp: new Date(),

                <CardHeader>

                  <CardTitle>Add New Note</CardTitle>    }

                </CardHeader>

                <CardContent className="space-y-4">  };      type: 'comment' as const

                  <Textarea

                    value={newNote}

                    onChange={(e) => setNewNote(e.target.value)}

                    placeholder="Enter your note..."  return (  const cancelEditing = () => {    };

                    rows={3}

                  />    <Dialog open={isOpen} onOpenChange={onClose}>

                  <Button onClick={handleAddNote} className="w-full">

                    <Plus className="h-4 w-4 mr-2" />      <DialogContent className="max-w-5xl h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-white to-gray-50">    setEditing({ type: null });    setComments(prev => [...prev, comment]);

                    Add Note

                  </Button>        <DialogHeader className="border-b border-gray-200 pb-6 bg-white rounded-t-lg">

                </CardContent>

              </Card>          <div className="flex items-center justify-between">    setEditText('');    setNewComment('');



              <div className="space-y-3">            <div className="flex items-center space-x-4">

                {notes.map((note) => (

                  <Card key={note.id}>              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-100">    setEditAssociate('');  };

                    <CardContent className="p-4">

                      <div className="flex justify-between items-start">                <User className="h-8 w-8 text-white" />

                        <div className="flex-1">

                          <p className="text-gray-700">{note.text}</p>              </div>    setAssociateError('');

                          <span className="text-xs text-gray-500 flex items-center mt-2">

                            <Clock className="h-3 w-3 mr-1" />              <div>

                            {note.timestamp.toLocaleDateString()}

                          </span>                <DialogTitle className="text-3xl font-bold text-gray-900 tracking-tight">  };  const addNote = () => {

                        </div>

                        <Button                  {member.firstName} {member.lastName}

                          variant="ghost"

                          size="sm"                </DialogTitle>    if (!newNote.trim()) return;

                          onClick={() => handleDeleteNote(note.id)}

                          className="text-red-600 hover:text-red-700"                <div className="flex items-center space-x-2 mt-2">

                        >

                          <X className="h-4 w-4" />                  <Mail className="h-4 w-4 text-gray-500" />  const saveEdit = () => {    const note: Comment = {

                        </Button>

                      </div>                  <span className="text-base text-gray-600">{member.email}</span>

                    </CardContent>

                  </Card>                </div>    if (!editAssociate) {      id: Date.now().toString(),

                ))}

              </div>              </div>

            </TabsContent>

            </div>      setAssociateError('Associate name is required');      text: newNote,

            <TabsContent value="tags" className="space-y-4">

              <Card>            <Badge className={`px-4 py-2 text-sm font-semibold border-2 ${getStatusColor(member.status)} shadow-sm`}>

                <CardHeader>

                  <CardTitle>Add New Tag</CardTitle>              {member.status}      return;      timestamp: new Date(),

                </CardHeader>

                <CardContent className="space-y-4">            </Badge>

                  <Input

                    value={newTag}          </div>    }      type: 'note' as const

                    onChange={(e) => setNewTag(e.target.value)}

                    placeholder="Enter tag name..."        </DialogHeader>

                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}

                  />    };

                  <Button onClick={handleAddTag} className="w-full">

                    <Plus className="h-4 w-4 mr-2" />        <div className="flex-1 overflow-hidden">

                    Add Tag

                  </Button>          <Tabs defaultValue="overview" className="h-full flex flex-col">    if (!editText.trim()) {    setNotes(prev => [...prev, note]);

                </CardContent>

              </Card>            <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-xl p-1.5 m-6 mb-0 shadow-inner">



              <div className="flex flex-wrap gap-2">              <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">      toast.error('Please enter some text');    setNewNote('');

                {tags.map((tag, index) => (

                  <Badge                <Activity className="h-4 w-4" />

                    key={index}

                    variant="secondary"                <span className="font-medium">Overview</span>      return;  };

                    className="flex items-center space-x-2 px-3 py-1"

                  >              </TabsTrigger>

                    <span>{tag}</span>

                    <Button              <TabsTrigger value="comments" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">    }

                      variant="ghost"

                      size="sm"                <MessageSquare className="h-4 w-4" />

                      onClick={() => handleDeleteTag(tag)}

                      className="h-4 w-4 p-0 text-gray-500 hover:text-red-600"                <span className="font-medium">Comments ({comments.length})</span>  const addTag = () => {

                    >

                      <X className="h-3 w-3" />              </TabsTrigger>

                    </Button>

                  </Badge>              <TabsTrigger value="notes" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">    const timestamp = new Date();    if (!newTag.trim() || tags.includes(newTag.trim())) return;

                ))}

              </div>                <StickyNote className="h-4 w-4" />

            </TabsContent>

          </Tabs>                <span className="font-medium">Notes ({notes.length})</span>    const newId = Date.now().toString();    setTags(prev => [...prev, newTag.trim()]);

        </div>

      </DialogContent>              </TabsTrigger>

    </Dialog>

  );              <TabsTrigger value="tags" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">    setNewTag('');

};
                <Tags className="h-4 w-4" />

                <span className="font-medium">Tags ({tags.length})</span>    if (editing.type === 'comment') {  };

              </TabsTrigger>

            </TabsList>      if (editing.isNew) {



            <div className="flex-1 overflow-auto p-6">        const newComment: Comment = {  const removeTag = (tagToRemove: string) => {

              <TabsContent value="overview" className="space-y-8 m-0">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">          id: newId,    setTags(prev => prev.filter(tag => tag !== tagToRemove));

                  {/* Member Information */}

                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">          text: editText,  };

                    <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">

                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">          timestamp,

                        <User className="h-6 w-6 mr-3 text-blue-600" />

                        Member Information          associate: editAssociate,  const removeComment = (id: string) => {

                      </CardTitle>

                    </CardHeader>          type: 'comment'    setComments(prev => prev.filter(c => c.id !== id));

                    <CardContent className="space-y-4 p-6">

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">        };  };

                        <span className="text-sm font-semibold text-gray-600">Member ID:</span>

                        <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{member.memberId}</span>        setComments(prev => [newComment, ...prev]);

                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">        toast.success('Comment added successfully');  const removeNote = (id: string) => {

                        <span className="text-sm font-semibold text-gray-600">Membership:</span>

                        <span className="text-sm text-gray-900 font-medium">{member.membershipName}</span>      } else {    setNotes(prev => prev.filter(n => n.id !== id));

                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">        setComments(prev => prev.map(c =>   };

                        <span className="text-sm font-semibold text-gray-600">Location:</span>

                        <span className="text-sm text-gray-900 flex items-center font-medium">          c.id === editing.id 

                          <MapPin className="h-4 w-4 mr-1 text-gray-500" />

                          {member.location}            ? { ...c, text: editText, associate: editAssociate, timestamp }  const handleSave = async () => {

                        </span>

                      </div>            : c    if (!member) return;

                      <div className="flex justify-between items-center py-2">

                        <span className="text-sm font-semibold text-gray-600">Sold By:</span>        ));    

                        <span className="text-sm text-gray-900 font-medium">{member.soldBy}</span>

                      </div>        toast.success('Comment updated successfully');    setIsSaving(true);

                    </CardContent>

                  </Card>      }    try {



                  {/* Membership Details */}    } else if (editing.type === 'note') {      const allComments = comments.map(c => c.text).join('\n---\n');

                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">

                    <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">      if (editing.isNew) {      const allNotes = notes.map(n => n.text).join('\n---\n');

                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">

                        <Calendar className="h-6 w-6 mr-3 text-green-600" />        const newNote: Note = {      

                        Membership Details

                      </CardTitle>          id: newId,      await googleSheetsService.saveAnnotation(

                    </CardHeader>

                    <CardContent className="space-y-4 p-6">          text: editText,        member.memberId,

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">

                        <span className="text-sm font-semibold text-gray-600">End Date:</span>          timestamp,        member.email,

                        <span className="text-sm text-gray-900 font-medium">{new Date(member.endDate).toLocaleDateString()}</span>

                      </div>          associate: editAssociate,        allComments,

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">

                        <span className="text-sm font-semibold text-gray-600">Order Date:</span>          type: 'note'        allNotes,

                        <span className="text-sm text-gray-900 font-medium">{new Date(member.orderDate).toLocaleDateString()}</span>

                      </div>        };        tags,

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">

                        <span className="text-sm font-semibold text-gray-600">Current Usage:</span>        setNotes(prev => [newNote, ...prev]);        member.uniqueId // Add unique ID for better persistence

                        <span className="text-sm text-gray-900 font-medium">{member.currentUsage}</span>

                      </div>        toast.success('Note added successfully');      );

                      <div className="flex justify-between items-center py-2">

                        <span className="text-sm font-semibold text-gray-600">Payment Status:</span>      } else {      

                        <Badge className={`${member.paid === 'Yes' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} border font-medium`}>

                          <CreditCard className="h-3 w-3 mr-1" />        setNotes(prev => prev.map(n =>       onSave(member.uniqueId || member.memberId, allComments, allNotes, tags);

                          {member.paid === 'Yes' ? 'Paid' : 'Unpaid'}

                        </Badge>          n.id === editing.id       toast.success("Member details saved successfully!");

                      </div>

                    </CardContent>            ? { ...n, text: editText, associate: editAssociate, timestamp }      onClose();

                  </Card>

                </div>            : n    } catch (error) {



                {/* Quick Overview Sections */}        ));      console.error('Error saving member details:', error);

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Recent Comments Preview */}        toast.success('Note updated successfully');      toast.error("Failed to save member details. Please try again.");

                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">

                    <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-t-lg">      }    } finally {

                      <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">

                        <div className="flex items-center">    } else if (editing.type === 'tag') {      setIsSaving(false);

                          <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />

                          Recent Comments      if (editing.isNew) {    }

                        </div>

                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">        const newTag: Tag = {  };

                          {comments.length}

                        </Badge>          id: newId,

                      </CardTitle>

                    </CardHeader>          text: editText,  if (!member) return null;

                    <CardContent className="p-4">

                      {comments.length > 0 ? (          timestamp,

                        <div className="space-y-3">

                          {comments.slice(0, 2).map((comment) => (          associate: editAssociate,  const daysUntilExpiry = getDaysUntilExpiry(member.endDate);

                            <div key={comment.id} className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">

                              <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">{comment.text}</p>          color: getTagColor(editText)  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

                              <div className="flex items-center justify-between">

                                <span className="text-xs text-gray-600 flex items-center font-medium">        };  const isChurned = member.status === 'Churned';

                                  <UserCheck className="h-3 w-3 mr-1" />

                                  {comment.associate}        setTags(prev => [newTag, ...prev]);

                                </span>

                                <span className="text-xs text-gray-500 flex items-center">        toast.success('Tag added successfully');  return (

                                  <Clock className="h-3 w-3 mr-1" />

                                  {formatDistanceToNow(comment.timestamp)} ago      } else {    <Dialog open={isOpen} onOpenChange={onClose}>

                                </span>

                              </div>        setTags(prev => prev.map(t =>       <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2">

                            </div>

                          ))}          t.id === editing.id         <div className="flex flex-col min-h-full">

                          {comments.length > 2 && (

                            <p className="text-xs text-gray-500 text-center pt-2 font-medium">            ? { ...t, text: editText, associate: editAssociate, timestamp, color: getTagColor(editText) }          {/* Premium Header */}

                              +{comments.length - 2} more comments

                            </p>            : t          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white p-8 pb-12">

                          )}

                        </div>        ));            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>

                      ) : (

                        <div className="text-center py-8">        toast.success('Tag updated successfully');            <div className="relative z-10">

                          <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />

                          <p className="text-sm text-gray-500">No comments yet</p>      }              <DialogHeader>

                        </div>

                      )}    }                <div className="flex items-center justify-between">

                    </CardContent>

                  </Card>                  <DialogTitle className="flex items-center gap-4 text-2xl font-bold">



                  {/* Recent Notes Preview */}    cancelEditing();                    <Avatar className="h-16 w-16 border-4 border-white/20 shadow-2xl">

                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">

                    <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">  };                      <AvatarFallback className="text-2xl font-bold text-blue-600 bg-white">

                      <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">

                        <div className="flex items-center">                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}

                          <StickyNote className="h-5 w-5 mr-2 text-green-500" />

                          Recent Notes  const deleteItem = (type: 'comment' | 'note' | 'tag', id: string) => {                      </AvatarFallback>

                        </div>

                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">    if (type === 'comment') {                    </Avatar>

                          {notes.length}

                        </Badge>      setComments(prev => prev.filter(c => c.id !== id));                    <div className="space-y-1">

                      </CardTitle>

                    </CardHeader>      toast.success('Comment deleted successfully');                      <h1 className="text-3xl font-bold tracking-tight">

                    <CardContent className="p-4">

                      {notes.length > 0 ? (    } else if (type === 'note') {                        {member.firstName} {member.lastName}

                        <div className="space-y-3">

                          {notes.slice(0, 2).map((note) => (      setNotes(prev => prev.filter(n => n.id !== id));                      </h1>

                            <div key={note.id} className="bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-lg border border-gray-200">

                              <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">{note.text}</p>      toast.success('Note deleted successfully');                      <p className="text-blue-100 text-lg font-medium">

                              <div className="flex items-center justify-between">

                                <span className="text-xs text-gray-600 flex items-center font-medium">    } else if (type === 'tag') {                        Member #{member.memberId}

                                  <UserCheck className="h-3 w-3 mr-1" />

                                  {note.associate}      setTags(prev => prev.filter(t => t.id !== id));                      </p>

                                </span>

                                <span className="text-xs text-gray-500 flex items-center">      toast.success('Tag deleted successfully');                    </div>

                                  <Clock className="h-3 w-3 mr-1" />

                                  {formatDistanceToNow(note.timestamp)} ago    }                  </DialogTitle>

                                </span>

                              </div>  };                  <Button

                            </div>

                          ))}                    variant="ghost" 

                          {notes.length > 2 && (

                            <p className="text-xs text-gray-500 text-center pt-2 font-medium">  if (!member) return null;                    size="icon"

                              +{notes.length - 2} more notes

                            </p>                    onClick={onClose}

                          )}

                        </div>  const getStatusColor = (status: string) => {                    className="text-white hover:bg-white/20 h-12 w-12"

                      ) : (

                        <div className="text-center py-8">    switch (status) {                  >

                          <StickyNote className="h-8 w-8 text-gray-300 mx-auto mb-2" />

                          <p className="text-sm text-gray-500">No notes yet</p>      case 'Active':                    <X className="h-6 w-6" />

                        </div>

                      )}        return 'bg-green-100 text-green-800 border-green-200';                  </Button>

                    </CardContent>

                  </Card>      case 'Churned':                </div>



                  {/* Tags Preview */}        return 'bg-red-100 text-red-800 border-red-200';              </DialogHeader>

                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">

                    <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">      case 'Frozen':              

                      <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">

                        <div className="flex items-center">        return 'bg-blue-100 text-blue-800 border-blue-200';              {/* Status Cards */}

                          <Tags className="h-5 w-5 mr-2 text-purple-500" />

                          Tags      default:              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">

                        </div>

                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">        return 'bg-gray-100 text-gray-800 border-gray-200';                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">

                          {tags.length}

                        </Badge>    }                  <CardContent className="p-4 text-center">

                      </CardTitle>

                    </CardHeader>  };                    <div className="flex items-center justify-center mb-2">

                    <CardContent className="p-4">

                      {tags.length > 0 ? (                      <Activity className="h-6 w-6" />

                        <div className="space-y-3">

                          <div className="flex flex-wrap gap-2">  return (                    </div>

                            {tags.slice(0, 6).map((tag) => (

                              <Badge key={tag.id} className={`text-xs font-medium border ${tag.color} shadow-sm`}>    <Dialog open={isOpen} onOpenChange={onClose}>                    <p className="text-2xl font-bold">{member.sessionsLeft || 0}</p>

                                {tag.text}

                              </Badge>      <DialogContent className="max-w-5xl h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-white to-gray-50">                    <p className="text-sm text-blue-100">Sessions Left</p>

                            ))}

                          </div>        <DialogHeader className="border-b border-gray-200 pb-6 bg-white rounded-t-lg">                  </CardContent>

                          {tags.length > 6 && (

                            <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-200 mt-2">          <div className="flex items-center justify-between">                </Card>

                              +{tags.length - 6} more tags

                            </Badge>            <div className="flex items-center space-x-4">                

                          )}

                          {tags.length > 0 && (              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-100">                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">

                            <div className="pt-2 border-t border-gray-200">

                              <span className="text-xs text-gray-500 flex items-center">                <User className="h-8 w-8 text-white" />                  <CardContent className="p-4 text-center">

                                <UserCheck className="h-3 w-3 mr-1" />

                                Last updated by {tags[0].associate}              </div>                    <div className="flex items-center justify-center mb-2">

                              </span>

                            </div>              <div>                      <Calendar className="h-6 w-6" />

                          )}

                        </div>                <DialogTitle className="text-3xl font-bold text-gray-900 tracking-tight">                    </div>

                      ) : (

                        <div className="text-center py-8">                  {member.firstName} {member.lastName}                    <p className="text-2xl font-bold">{daysUntilExpiry}</p>

                          <Tags className="h-8 w-8 text-gray-300 mx-auto mb-2" />

                          <p className="text-sm text-gray-500">No tags yet</p>                </DialogTitle>                    <p className="text-sm text-blue-100">Days Left</p>

                        </div>

                      )}                <div className="flex items-center space-x-2 mt-2">                  </CardContent>

                    </CardContent>

                  </Card>                  <Mail className="h-4 w-4 text-gray-500" />                </Card>

                </div>

              </TabsContent>                  <span className="text-base text-gray-600">{member.email}</span>                



              {/* Comments Tab */}                </div>                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">

              <TabsContent value="comments" className="space-y-6 m-0">

                <div className="flex justify-between items-center">              </div>                  <CardContent className="p-4 text-center">

                  <h3 className="text-2xl font-bold text-gray-900">Comments</h3>

                  <Button            </div>                    <div className="flex items-center justify-center mb-2">

                    onClick={() => startEditing('comment')}

                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"            <Badge className={`px-4 py-2 text-sm font-semibold border-2 ${getStatusColor(member.status)} shadow-sm`}>                      <Badge 

                    disabled={editing.type !== null}

                  >              {member.status}                        variant={member.status === 'Active' ? "default" : "destructive"}

                    <Plus className="h-4 w-4 mr-2" />

                    Add Comment            </Badge>                        className="h-8 px-4 text-sm font-bold"

                  </Button>

                </div>          </div>                      >



                {editing.type === 'comment' && (        </DialogHeader>                        {member.status}

                  <Card className="shadow-lg border-blue-200 bg-blue-50/50">

                    <CardContent className="p-6">                      </Badge>

                      <div className="space-y-4">

                        <AssociateSelector        <div className="flex-1 overflow-hidden">                    </div>

                          value={editAssociate}

                          onValueChange={setEditAssociate}          <Tabs defaultValue="overview" className="h-full flex flex-col">                    <p className="text-sm text-blue-100">Status</p>

                          label="Associate"

                          placeholder="Select associate"            <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-xl p-1.5 m-6 mb-0 shadow-inner">                  </CardContent>

                          required

                          error={associateError}              <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">                </Card>

                        />

                        <div>                <Activity className="h-4 w-4" />                

                          <label className="text-sm font-medium text-gray-700 mb-2 block">

                            Comment <span className="text-red-500">*</span>                <span className="font-medium">Overview</span>                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">

                          </label>

                          <Textarea              </TabsTrigger>                  <CardContent className="p-4 text-center">

                            value={editText}

                            onChange={(e) => setEditText(e.target.value)}              <TabsTrigger value="comments" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">                    <div className="flex items-center justify-center mb-2">

                            placeholder="Enter your comment..."

                            rows={4}                <MessageSquare className="h-4 w-4" />                      <MapPin className="h-6 w-6" />

                            className="w-full"

                          />                <span className="font-medium">Comments ({comments.length})</span>                    </div>

                        </div>

                        <div className="flex space-x-3">              </TabsTrigger>                    <p className="text-sm font-semibold truncate">{member.location}</p>

                          <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700">

                            <Save className="h-4 w-4 mr-2" />              <TabsTrigger value="notes" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">                    <p className="text-sm text-blue-100">Location</p>

                            Save

                          </Button>                <StickyNote className="h-4 w-4" />                  </CardContent>

                          <Button onClick={cancelEditing} variant="outline">

                            <X className="h-4 w-4 mr-2" />                <span className="font-medium">Notes ({notes.length})</span>                </Card>

                            Cancel

                          </Button>              </TabsTrigger>              </div>

                        </div>

                      </div>              <TabsTrigger value="tags" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">            </div>

                    </CardContent>

                  </Card>                <Tags className="h-4 w-4" />          </div>

                )}

                <span className="font-medium">Tags ({tags.length})</span>

                <div className="space-y-4">

                  {comments.map((comment) => (              </TabsTrigger>          {/* Content Area */}

                    <Card key={comment.id} className="shadow-md border-gray-200 hover:shadow-lg transition-shadow">

                      <CardContent className="p-6">            </TabsList>          <div className="flex-1 p-8">

                        <div className="flex justify-between items-start mb-4">

                          <div className="flex items-center space-x-3">            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">

                              <MessageSquare className="h-4 w-4 text-blue-600" />            <div className="flex-1 overflow-auto p-6">              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">

                            </div>

                            <div>              <TabsContent value="overview" className="space-y-8 m-0">                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">

                              <span className="text-sm font-semibold text-gray-900">{comment.associate}</span>

                              <p className="text-xs text-gray-500 flex items-center">                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">                  <User className="h-4 w-4 mr-2" />

                                <Clock className="h-3 w-3 mr-1" />

                                {formatDistanceToNow(comment.timestamp)} ago                  {/* Member Information */}                  Overview

                              </p>

                            </div>                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">                </TabsTrigger>

                          </div>

                          <div className="flex space-x-2">                    <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">                <TabsTrigger value="comments" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">

                            <Button

                              size="sm"                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">                  <MessageSquare className="h-4 w-4 mr-2" />

                              variant="ghost"

                              onClick={() => startEditing('comment', comment.id, comment.text, comment.associate)}                        <User className="h-6 w-6 mr-3 text-blue-600" />                  Comments ({comments.length})

                              disabled={editing.type !== null}

                              className="text-gray-500 hover:text-blue-600"                        Member Information                </TabsTrigger>

                            >

                              <Edit2 className="h-4 w-4" />                      </CardTitle>                <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">

                            </Button>

                            <Button                    </CardHeader>                  <FileText className="h-4 w-4 mr-2" />

                              size="sm"

                              variant="ghost"                    <CardContent className="space-y-4 p-6">                  Notes ({notes.length})

                              onClick={() => deleteItem('comment', comment.id)}

                              disabled={editing.type !== null}                      <div className="flex justify-between items-center py-2 border-b border-gray-100">                </TabsTrigger>

                              className="text-gray-500 hover:text-red-600"

                            >                        <span className="text-sm font-semibold text-gray-600">Member ID:</span>                <TabsTrigger value="tags" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">

                              <Trash2 className="h-4 w-4" />

                            </Button>                        <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{member.memberId}</span>                  <Tag className="h-4 w-4 mr-2" />

                          </div>

                        </div>                      </div>                  Tags ({tags.length})

                        <p className="text-gray-700 leading-relaxed">{comment.text}</p>

                      </CardContent>                      <div className="flex justify-between items-center py-2 border-b border-gray-100">                </TabsTrigger>

                    </Card>

                  ))}                        <span className="text-sm font-semibold text-gray-600">Membership:</span>              </TabsList>

                  {comments.length === 0 && (

                    <div className="text-center py-12">                        <span className="text-sm text-gray-900 font-medium">{member.membershipName}</span>

                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />

                      <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>                      </div>              <TabsContent value="overview" className="space-y-6">

                      <p className="text-gray-500">Add the first comment to start tracking member interactions.</p>

                    </div>                      <div className="flex justify-between items-center py-2 border-b border-gray-100">                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  )}

                </div>                        <span className="text-sm font-semibold text-gray-600">Location:</span>                  {/* Personal Information */}

              </TabsContent>

                        <span className="text-sm text-gray-900 flex items-center font-medium">                  <Card className="shadow-lg border-2">

              {/* Notes Tab */}

              <TabsContent value="notes" className="space-y-6 m-0">                          <MapPin className="h-4 w-4 mr-1 text-gray-500" />                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">

                <div className="flex justify-between items-center">

                  <h3 className="text-2xl font-bold text-gray-900">Notes</h3>                          {member.location}                      <CardTitle className="flex items-center gap-3">

                  <Button

                    onClick={() => startEditing('note')}                        </span>                        <div className="p-2 bg-blue-500 text-white rounded-lg">

                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"

                    disabled={editing.type !== null}                      </div>                          <User className="h-5 w-5" />

                  >

                    <Plus className="h-4 w-4 mr-2" />                      <div className="flex justify-between items-center py-2">                        </div>

                    Add Note

                  </Button>                        <span className="text-sm font-semibold text-gray-600">Sold By:</span>                        Personal Information

                </div>

                        <span className="text-sm text-gray-900 font-medium">{member.soldBy}</span>                      </CardTitle>

                {editing.type === 'note' && (

                  <Card className="shadow-lg border-green-200 bg-green-50/50">                      </div>                    </CardHeader>

                    <CardContent className="p-6">

                      <div className="space-y-4">                    </CardContent>                    <CardContent className="p-6 space-y-6">

                        <AssociateSelector

                          value={editAssociate}                  </Card>                      <div className="grid grid-cols-2 gap-6">

                          onValueChange={setEditAssociate}

                          label="Associate"                        <div>

                          placeholder="Select associate"

                          required                  {/* Membership Details */}                          <Label className="text-sm font-semibold text-slate-600">First Name</Label>

                          error={associateError}

                        />                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">                          <p className="text-lg font-medium text-slate-900 dark:text-white">{member.firstName}</p>

                        <div>

                          <label className="text-sm font-medium text-gray-700 mb-2 block">                    <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">                        </div>

                            Note <span className="text-red-500">*</span>

                          </label>                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">                        <div>

                          <Textarea

                            value={editText}                        <Calendar className="h-6 w-6 mr-3 text-green-600" />                          <Label className="text-sm font-semibold text-slate-600">Last Name</Label>

                            onChange={(e) => setEditText(e.target.value)}

                            placeholder="Enter your note..."                        Membership Details                          <p className="text-lg font-medium text-slate-900 dark:text-white">{member.lastName}</p>

                            rows={4}

                            className="w-full"                      </CardTitle>                        </div>

                          />

                        </div>                    </CardHeader>                      </div>

                        <div className="flex space-x-3">

                          <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700">                    <CardContent className="space-y-4 p-6">                      <Separator />

                            <Save className="h-4 w-4 mr-2" />

                            Save                      <div className="flex justify-between items-center py-2 border-b border-gray-100">                      <div className="flex items-center gap-3">

                          </Button>

                          <Button onClick={cancelEditing} variant="outline">                        <span className="text-sm font-semibold text-gray-600">End Date:</span>                        <Mail className="h-5 w-5 text-slate-500" />

                            <X className="h-4 w-4 mr-2" />

                            Cancel                        <span className="text-sm text-gray-900 font-medium">{new Date(member.endDate).toLocaleDateString()}</span>                        <div>

                          </Button>

                        </div>                      </div>                          <Label className="text-sm font-semibold text-slate-600">Email Address</Label>

                      </div>

                    </CardContent>                      <div className="flex justify-between items-center py-2 border-b border-gray-100">                          <p className="text-lg font-medium text-slate-900 dark:text-white">{member.email}</p>

                  </Card>

                )}                        <span className="text-sm font-semibold text-gray-600">Order Date:</span>                        </div>



                <div className="space-y-4">                        <span className="text-sm text-gray-900 font-medium">{new Date(member.orderDate).toLocaleDateString()}</span>                      </div>

                  {notes.map((note) => (

                    <Card key={note.id} className="shadow-md border-gray-200 hover:shadow-lg transition-shadow">                      </div>                      <div className="flex items-center gap-3">

                      <CardContent className="p-6">

                        <div className="flex justify-between items-start mb-4">                      <div className="flex justify-between items-center py-2 border-b border-gray-100">                        <Building className="h-5 w-5 text-slate-500" />

                          <div className="flex items-center space-x-3">

                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">                        <span className="text-sm font-semibold text-gray-600">Current Usage:</span>                        <div>

                              <StickyNote className="h-4 w-4 text-green-600" />

                            </div>                        <span className="text-sm text-gray-900 font-medium">{member.currentUsage}</span>                          <Label className="text-sm font-semibold text-slate-600">Location</Label>

                            <div>

                              <span className="text-sm font-semibold text-gray-900">{note.associate}</span>                      </div>                          <p className="text-lg font-medium text-slate-900 dark:text-white">{member.location}</p>

                              <p className="text-xs text-gray-500 flex items-center">

                                <Clock className="h-3 w-3 mr-1" />                      <div className="flex justify-between items-center py-2">                        </div>

                                {formatDistanceToNow(note.timestamp)} ago

                              </p>                        <span className="text-sm font-semibold text-gray-600">Payment Status:</span>                      </div>

                            </div>

                          </div>                        <Badge className={`${member.paid === 'Yes' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} border font-medium`}>                    </CardContent>

                          <div className="flex space-x-2">

                            <Button                          <CreditCard className="h-3 w-3 mr-1" />                  </Card>

                              size="sm"

                              variant="ghost"                          {member.paid === 'Yes' ? 'Paid' : 'Unpaid'}

                              onClick={() => startEditing('note', note.id, note.text, note.associate)}

                              disabled={editing.type !== null}                        </Badge>                  {/* Membership Details */}

                              className="text-gray-500 hover:text-green-600"

                            >                      </div>                  <Card className="shadow-lg border-2">

                              <Edit2 className="h-4 w-4" />

                            </Button>                    </CardContent>                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-800 dark:to-emerald-700">

                            <Button

                              size="sm"                  </Card>                      <CardTitle className="flex items-center gap-3">

                              variant="ghost"

                              onClick={() => deleteItem('note', note.id)}                </div>                        <div className="p-2 bg-emerald-500 text-white rounded-lg">

                              disabled={editing.type !== null}

                              className="text-gray-500 hover:text-red-600"                          <CreditCard className="h-5 w-5" />

                            >

                              <Trash2 className="h-4 w-4" />                {/* Quick Overview Sections */}                        </div>

                            </Button>

                          </div>                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">                        Membership Details

                        </div>

                        <p className="text-gray-700 leading-relaxed">{note.text}</p>                  {/* Recent Comments Preview */}                      </CardTitle>

                      </CardContent>

                    </Card>                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">                    </CardHeader>

                  ))}

                  {notes.length === 0 && (                    <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-t-lg">                    <CardContent className="p-6 space-y-6">

                    <div className="text-center py-12">

                      <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-4" />                      <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">                      <div>

                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>

                      <p className="text-gray-500">Add the first note to start documenting important information.</p>                        <div className="flex items-center">                        <Label className="text-sm font-semibold text-slate-600">Membership Type</Label>

                    </div>

                  )}                          <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />                        <p className="text-lg font-medium text-slate-900 dark:text-white">{member.membershipName}</p>

                </div>

              </TabsContent>                          Recent Comments                      </div>



              {/* Tags Tab */}                        </div>                      <Separator />

              <TabsContent value="tags" className="space-y-6 m-0">

                <div className="flex justify-between items-center">                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">                      <div className="grid grid-cols-2 gap-6">

                  <h3 className="text-2xl font-bold text-gray-900">Tags</h3>

                  <Button                          {comments.length}                        <div>

                    onClick={() => startEditing('tag')}

                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"                        </Badge>                          <Label className="text-sm font-semibold text-slate-600">Start Date</Label>

                    disabled={editing.type !== null}

                  >                      </CardTitle>                          <p className="text-lg font-medium text-slate-900 dark:text-white">

                    <Plus className="h-4 w-4 mr-2" />

                    Add Tag                    </CardHeader>                            {new Date(member.orderDate).toLocaleDateString()}

                  </Button>

                </div>                    <CardContent className="p-4">                          </p>



                {editing.type === 'tag' && (                      {comments.length > 0 ? (                        </div>

                  <Card className="shadow-lg border-purple-200 bg-purple-50/50">

                    <CardContent className="p-6">                        <div className="space-y-3">                        <div>

                      <div className="space-y-4">

                        <AssociateSelector                          {comments.slice(0, 2).map((comment) => (                          <Label className="text-sm font-semibold text-slate-600">End Date</Label>

                          value={editAssociate}

                          onValueChange={setEditAssociate}                            <div key={comment.id} className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">                          <div className="flex items-center gap-2">

                          label="Associate"

                          placeholder="Select associate"                              <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">{comment.text}</p>                            <p className="text-lg font-medium text-slate-900 dark:text-white">

                          required

                          error={associateError}                              <div className="flex items-center justify-between">                              {new Date(member.endDate).toLocaleDateString()}

                        />

                        <div>                                <span className="text-xs text-gray-600 flex items-center font-medium">                            </p>

                          <label className="text-sm font-medium text-gray-700 mb-2 block">

                            Tag <span className="text-red-500">*</span>                                  <UserCheck className="h-3 w-3 mr-1" />                            {isExpiringSoon && (

                          </label>

                          <Input                                  {comment.associate}                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">

                            value={editText}

                            onChange={(e) => setEditText(e.target.value)}                                </span>                                Expires Soon

                            placeholder="Enter tag name..."

                            className="w-full"                                <span className="text-xs text-gray-500 flex items-center">                              </Badge>

                          />

                        </div>                                  <Clock className="h-3 w-3 mr-1" />                            )}

                        <div className="flex space-x-3">

                          <Button onClick={saveEdit} className="bg-purple-600 hover:bg-purple-700">                                  {formatDistanceToNow(comment.timestamp)} ago                          </div>

                            <Save className="h-4 w-4 mr-2" />

                            Save                                </span>                        </div>

                          </Button>

                          <Button onClick={cancelEditing} variant="outline">                              </div>                      </div>

                            <X className="h-4 w-4 mr-2" />

                            Cancel                            </div>                      <div className="flex items-center gap-3">

                          </Button>

                        </div>                          ))}                        <Activity className="h-5 w-5 text-slate-500" />

                      </div>

                    </CardContent>                          {comments.length > 2 && (                        <div>

                  </Card>

                )}                            <p className="text-xs text-gray-500 text-center pt-2 font-medium">                          <Label className="text-sm font-semibold text-slate-600">Remaining Sessions</Label>



                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">                              +{comments.length - 2} more comments                          <p className="text-2xl font-bold text-blue-600">{member.sessionsLeft || 0}</p>

                  {tags.map((tag) => (

                    <Card key={tag.id} className="shadow-md border-gray-200 hover:shadow-lg transition-shadow">                            </p>                        </div>

                      <CardContent className="p-4">

                        <div className="flex justify-between items-start mb-3">                          )}                      </div>

                          <Badge className={`text-sm font-medium border ${tag.color} shadow-sm`}>

                            {tag.text}                        </div>                      {member.frozen && member.frozen.toLowerCase() === 'true' && (

                          </Badge>

                          <div className="flex space-x-1">                      ) : (                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">

                            <Button

                              size="sm"                        <div className="text-center py-8">                          <AlertCircle className="h-5 w-5 text-blue-600" />

                              variant="ghost"

                              onClick={() => startEditing('tag', tag.id, tag.text, tag.associate)}                          <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />                          <span className="text-blue-700 font-medium">Account is currently frozen</span>

                              disabled={editing.type !== null}

                              className="text-gray-500 hover:text-purple-600 h-6 w-6 p-0"                          <p className="text-sm text-gray-500">No comments yet</p>                        </div>

                            >

                              <Edit2 className="h-3 w-3" />                        </div>                      )}

                            </Button>

                            <Button                      )}                    </CardContent>

                              size="sm"

                              variant="ghost"                    </CardContent>                  </Card>

                              onClick={() => deleteItem('tag', tag.id)}

                              disabled={editing.type !== null}                  </Card>                </div>

                              className="text-gray-500 hover:text-red-600 h-6 w-6 p-0"

                            >

                              <Trash2 className="h-3 w-3" />

                            </Button>                  {/* Recent Notes Preview */}                {/* Notes Overview Section */}

                          </div>

                        </div>                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">                <div className="mt-8">

                        <div className="space-y-1">

                          <span className="text-xs text-gray-600 flex items-center">                    <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">                  <Card className="shadow-lg border-2">

                            <UserCheck className="h-3 w-3 mr-1" />

                            {tag.associate}                      <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">                    <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-700">

                          </span>

                          <span className="text-xs text-gray-500 flex items-center">                        <div className="flex items-center">                      <CardTitle className="flex items-center gap-3">

                            <Clock className="h-3 w-3 mr-1" />

                            {formatDistanceToNow(tag.timestamp)} ago                          <StickyNote className="h-5 w-5 mr-2 text-green-500" />                        <div className="p-2 bg-purple-500 text-white rounded-lg">

                          </span>

                        </div>                          Recent Notes                          <FileText className="h-5 w-5" />

                      </CardContent>

                    </Card>                        </div>                        </div>

                  ))}

                </div>                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">                        Notes ({notes.length})

                {tags.length === 0 && (

                  <div className="text-center py-12">                          {notes.length}                      </CardTitle>

                    <Tags className="h-12 w-12 text-gray-300 mx-auto mb-4" />

                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tags yet</h3>                        </Badge>                    </CardHeader>

                    <p className="text-gray-500">Add tags to categorize and organize member information.</p>

                  </div>                      </CardTitle>                    <CardContent className="p-6">

                )}

              </TabsContent>                    </CardHeader>                      {notes.length > 0 ? (

            </div>

          </Tabs>                    <CardContent className="p-4">                        <div className="space-y-4">

        </div>

      </DialogContent>                      {notes.length > 0 ? (                          {notes.slice(0, 3).map((note) => (

    </Dialog>

  );                        <div className="space-y-3">                            <div key={note.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">

};
                          {notes.slice(0, 2).map((note) => (                              <p className="text-slate-900 dark:text-white text-sm mb-2">{note.text}</p>

                            <div key={note.id} className="bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-lg border border-gray-200">                              <p className="text-xs text-slate-500">

                              <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">{note.text}</p>                                {note.timestamp.toLocaleString()}

                              <div className="flex items-center justify-between">                              </p>

                                <span className="text-xs text-gray-600 flex items-center font-medium">                            </div>

                                  <UserCheck className="h-3 w-3 mr-1" />                          ))}

                                  {note.associate}                          {notes.length > 3 && (

                                </span>                            <div className="text-center">

                                <span className="text-xs text-gray-500 flex items-center">                              <Button 

                                  <Clock className="h-3 w-3 mr-1" />                                variant="ghost" 

                                  {formatDistanceToNow(note.timestamp)} ago                                size="sm" 

                                </span>                                onClick={() => setActiveTab('notes')}

                              </div>                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"

                            </div>                              >

                          ))}                                View all {notes.length} notes

                          {notes.length > 2 && (                              </Button>

                            <p className="text-xs text-gray-500 text-center pt-2 font-medium">                            </div>

                              +{notes.length - 2} more notes                          )}

                            </p>                        </div>

                          )}                      ) : (

                        </div>                        <p className="text-slate-500 text-center py-4">No notes available</p>

                      ) : (                      )}

                        <div className="text-center py-8">                    </CardContent>

                          <StickyNote className="h-8 w-8 text-gray-300 mx-auto mb-2" />                  </Card>

                          <p className="text-sm text-gray-500">No notes yet</p>                </div>

                        </div>

                      )}                {/* Comments Overview Section */}

                    </CardContent>                <div className="mt-8">

                  </Card>                  <Card className="shadow-lg border-2">

                    <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-800 dark:to-orange-700">

                  {/* Tags Preview */}                      <CardTitle className="flex items-center gap-3">

                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">                        <div className="p-2 bg-orange-500 text-white rounded-lg">

                    <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">                          <MessageSquare className="h-5 w-5" />

                      <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">                        </div>

                        <div className="flex items-center">                        Comments ({comments.length})

                          <Tags className="h-5 w-5 mr-2 text-purple-500" />                      </CardTitle>

                          Tags                    </CardHeader>

                        </div>                    <CardContent className="p-6">

                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">                      {comments.length > 0 ? (

                          {tags.length}                        <div className="space-y-4">

                        </Badge>                          {comments.slice(0, 3).map((comment) => (

                      </CardTitle>                            <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">

                    </CardHeader>                              <p className="text-slate-900 dark:text-white text-sm mb-2">{comment.text}</p>

                    <CardContent className="p-4">                              <p className="text-xs text-slate-500">

                      {tags.length > 0 ? (                                {comment.timestamp.toLocaleString()}

                        <div className="space-y-3">                              </p>

                          <div className="flex flex-wrap gap-2">                            </div>

                            {tags.slice(0, 6).map((tag) => (                          ))}

                              <Badge key={tag.id} className={`text-xs font-medium border ${tag.color} shadow-sm`}>                          {comments.length > 3 && (

                                {tag.text}                            <div className="text-center">

                              </Badge>                              <Button 

                            ))}                                variant="ghost" 

                          </div>                                size="sm" 

                          {tags.length > 6 && (                                onClick={() => setActiveTab('comments')}

                            <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-200 mt-2">                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"

                              +{tags.length - 6} more tags                              >

                            </Badge>                                View all {comments.length} comments

                          )}                              </Button>

                          {tags.length > 0 && (                            </div>

                            <div className="pt-2 border-t border-gray-200">                          )}

                              <span className="text-xs text-gray-500 flex items-center">                        </div>

                                <UserCheck className="h-3 w-3 mr-1" />                      ) : (

                                Last updated by {tags[0].associate}                        <p className="text-slate-500 text-center py-4">No comments available</p>

                              </span>                      )}

                            </div>                    </CardContent>

                          )}                  </Card>

                        </div>                </div>

                      ) : (              </TabsContent>

                        <div className="text-center py-8">

                          <Tags className="h-8 w-8 text-gray-300 mx-auto mb-2" />              <TabsContent value="comments" className="space-y-6">

                          <p className="text-sm text-gray-500">No tags yet</p>                <Card className="shadow-lg">

                        </div>                  <CardHeader>

                      )}                    <CardTitle>Add New Comment</CardTitle>

                    </CardContent>                  </CardHeader>

                  </Card>                  <CardContent className="space-y-4">

                </div>                    <Textarea

              </TabsContent>                      placeholder="Add a comment about this member..."

                      value={newComment}

              {/* Comments Tab */}                      onChange={(e) => setNewComment(e.target.value)}

              <TabsContent value="comments" className="space-y-6 m-0">                      className="min-h-[100px]"

                <div className="flex justify-between items-center">                    />

                  <h3 className="text-2xl font-bold text-gray-900">Comments</h3>                    <Button onClick={addComment} disabled={!newComment.trim()}>

                  <Button                      <Plus className="h-4 w-4 mr-2" />

                    onClick={() => startEditing('comment')}                      Add Comment

                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"                    </Button>

                    disabled={editing.type !== null}                  </CardContent>

                  >                </Card>

                    <Plus className="h-4 w-4 mr-2" />

                    Add Comment                <div className="space-y-4">

                  </Button>                  {comments.map((comment) => (

                </div>                    <Card key={comment.id} className="shadow-md">

                      <CardContent className="p-6">

                {editing.type === 'comment' && (                        <div className="flex items-start justify-between">

                  <Card className="shadow-lg border-blue-200 bg-blue-50/50">                          <div className="flex-1 space-y-2">

                    <CardContent className="p-6">                            <p className="text-slate-900 dark:text-white">{comment.text}</p>

                      <div className="space-y-4">                            <p className="text-sm text-slate-500">

                        <AssociateSelector                              {comment.timestamp.toLocaleString()}

                          value={editAssociate}                            </p>

                          onValueChange={setEditAssociate}                          </div>

                          label="Associate"                          <Button

                          placeholder="Select associate"                            variant="ghost"

                          required                            size="sm"

                          error={associateError}                            onClick={() => removeComment(comment.id)}

                        />                            className="text-red-500 hover:text-red-700 hover:bg-red-50"

                        <div>                          >

                          <label className="text-sm font-medium text-gray-700 mb-2 block">                            <X className="h-4 w-4" />

                            Comment <span className="text-red-500">*</span>                          </Button>

                          </label>                        </div>

                          <Textarea                      </CardContent>

                            value={editText}                    </Card>

                            onChange={(e) => setEditText(e.target.value)}                  ))}

                            placeholder="Enter your comment..."                  {comments.length === 0 && (

                            rows={4}                    <div className="text-center py-12 text-slate-500">

                            className="w-full"                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />

                          />                      <p>No comments yet</p>

                        </div>                    </div>

                        <div className="flex space-x-3">                  )}

                          <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700">                </div>

                            <Save className="h-4 w-4 mr-2" />              </TabsContent>

                            Save

                          </Button>              <TabsContent value="notes" className="space-y-6">

                          <Button onClick={cancelEditing} variant="outline">                <Card className="shadow-lg">

                            <X className="h-4 w-4 mr-2" />                  <CardHeader>

                            Cancel                    <CardTitle>Add New Note</CardTitle>

                          </Button>                  </CardHeader>

                        </div>                  <CardContent className="space-y-4">

                      </div>                    <Textarea

                    </CardContent>                      placeholder="Add an internal note..."

                  </Card>                      value={newNote}

                )}                      onChange={(e) => setNewNote(e.target.value)}

                      className="min-h-[100px]"

                <div className="space-y-4">                    />

                  {comments.map((comment) => (                    <Button onClick={addNote} disabled={!newNote.trim()}>

                    <Card key={comment.id} className="shadow-md border-gray-200 hover:shadow-lg transition-shadow">                      <Plus className="h-4 w-4 mr-2" />

                      <CardContent className="p-6">                      Add Note

                        <div className="flex justify-between items-start mb-4">                    </Button>

                          <div className="flex items-center space-x-3">                  </CardContent>

                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">                </Card>

                              <MessageSquare className="h-4 w-4 text-blue-600" />

                            </div>                <div className="space-y-4">

                            <div>                  {notes.map((note) => (

                              <span className="text-sm font-semibold text-gray-900">{comment.associate}</span>                    <Card key={note.id} className="shadow-md">

                              <p className="text-xs text-gray-500 flex items-center">                      <CardContent className="p-6">

                                <Clock className="h-3 w-3 mr-1" />                        <div className="flex items-start justify-between">

                                {formatDistanceToNow(comment.timestamp)} ago                          <div className="flex-1 space-y-2">

                              </p>                            <p className="text-slate-900 dark:text-white">{note.text}</p>

                            </div>                            <p className="text-sm text-slate-500">

                          </div>                              {note.timestamp.toLocaleString()}

                          <div className="flex space-x-2">                            </p>

                            <Button                          </div>

                              size="sm"                          <Button

                              variant="ghost"                            variant="ghost"

                              onClick={() => startEditing('comment', comment.id, comment.text, comment.associate)}                            size="sm"

                              disabled={editing.type !== null}                            onClick={() => removeNote(note.id)}

                              className="text-gray-500 hover:text-blue-600"                            className="text-red-500 hover:text-red-700 hover:bg-red-50"

                            >                          >

                              <Edit2 className="h-4 w-4" />                            <X className="h-4 w-4" />

                            </Button>                          </Button>

                            <Button                        </div>

                              size="sm"                      </CardContent>

                              variant="ghost"                    </Card>

                              onClick={() => deleteItem('comment', comment.id)}                  ))}

                              disabled={editing.type !== null}                  {notes.length === 0 && (

                              className="text-gray-500 hover:text-red-600"                    <div className="text-center py-12 text-slate-500">

                            >                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />

                              <Trash2 className="h-4 w-4" />                      <p>No notes yet</p>

                            </Button>                    </div>

                          </div>                  )}

                        </div>                </div>

                        <p className="text-gray-700 leading-relaxed">{comment.text}</p>              </TabsContent>

                      </CardContent>

                    </Card>              <TabsContent value="tags" className="space-y-6">

                  ))}                <Card className="shadow-lg">

                  {comments.length === 0 && (                  <CardHeader>

                    <div className="text-center py-12">                    <CardTitle>Add New Tag</CardTitle>

                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />                  </CardHeader>

                      <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>                  <CardContent className="space-y-4">

                      <p className="text-gray-500">Add the first comment to start tracking member interactions.</p>                    <div className="flex gap-2">

                    </div>                      <Input

                  )}                        placeholder="Enter a new tag..."

                </div>                        value={newTag}

              </TabsContent>                        onChange={(e) => setNewTag(e.target.value)}

                        onKeyPress={(e) => e.key === 'Enter' && addTag()}

              {/* Notes Tab */}                        className="flex-1"

              <TabsContent value="notes" className="space-y-6 m-0">                      />

                <div className="flex justify-between items-center">                      <Button onClick={addTag} disabled={!newTag.trim()}>

                  <h3 className="text-2xl font-bold text-gray-900">Notes</h3>                        <Plus className="h-4 w-4 mr-2" />

                  <Button                        Add Tag

                    onClick={() => startEditing('note')}                      </Button>

                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"                    </div>

                    disabled={editing.type !== null}                  </CardContent>

                  >                </Card>

                    <Plus className="h-4 w-4 mr-2" />

                    Add Note                <Card className="shadow-lg">

                  </Button>                  <CardHeader>

                </div>                    <CardTitle>Current Tags</CardTitle>

                  </CardHeader>

                {editing.type === 'note' && (                  <CardContent>

                  <Card className="shadow-lg border-green-200 bg-green-50/50">                    {tags.length > 0 ? (

                    <CardContent className="p-6">                      <div className="flex flex-wrap gap-2">

                      <div className="space-y-4">                        {tags.map((tag, index) => (

                        <AssociateSelector                          <Badge 

                          value={editAssociate}                            key={index} 

                          onValueChange={setEditAssociate}                            variant="secondary" 

                          label="Associate"                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-800 border border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"

                          placeholder="Select associate"                          >

                          required                            <Star className="h-3 w-3" />

                          error={associateError}                            {tag}

                        />                            <button

                        <div>                              onClick={() => removeTag(tag)}

                          <label className="text-sm font-medium text-gray-700 mb-2 block">                              className="ml-2 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"

                            Note <span className="text-red-500">*</span>                            >

                          </label>                              <X className="h-3 w-3" />

                          <Textarea                            </button>

                            value={editText}                          </Badge>

                            onChange={(e) => setEditText(e.target.value)}                        ))}

                            placeholder="Enter your note..."                      </div>

                            rows={4}                    ) : (

                            className="w-full"                      <div className="text-center py-12 text-slate-500">

                          />                        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />

                        </div>                        <p>No tags yet</p>

                        <div className="flex space-x-3">                      </div>

                          <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700">                    )}

                            <Save className="h-4 w-4 mr-2" />                  </CardContent>

                            Save                </Card>

                          </Button>              </TabsContent>

                          <Button onClick={cancelEditing} variant="outline">            </Tabs>

                            <X className="h-4 w-4 mr-2" />          </div>

                            Cancel

                          </Button>          {/* Footer Actions */}

                        </div>          <div className="border-t bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 p-6">

                      </div>            <div className="flex justify-end gap-4">

                    </CardContent>              <Button variant="outline" onClick={onClose} disabled={isSaving} size="lg">

                  </Card>                Cancel

                )}              </Button>

              <Button 

                <div className="space-y-4">                onClick={handleSave} 

                  {notes.map((note) => (                disabled={isSaving} 

                    <Card key={note.id} className="shadow-md border-gray-200 hover:shadow-lg transition-shadow">                size="lg"

                      <CardContent className="p-6">                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"

                        <div className="flex justify-between items-start mb-4">              >

                          <div className="flex items-center space-x-3">                {isSaving ? (

                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">                  <>

                              <StickyNote className="h-4 w-4 text-green-600" />                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>

                            </div>                    Saving...

                            <div>                  </>

                              <span className="text-sm font-semibold text-gray-900">{note.associate}</span>                ) : (

                              <p className="text-xs text-gray-500 flex items-center">                  <>

                                <Clock className="h-3 w-3 mr-1" />                    <Save className="h-4 w-4 mr-2" />

                                {formatDistanceToNow(note.timestamp)} ago                    Save Changes

                              </p>                  </>

                            </div>                )}

                          </div>              </Button>

                          <div className="flex space-x-2">            </div>

                            <Button          </div>

                              size="sm"        </div>

                              variant="ghost"      </DialogContent>

                              onClick={() => startEditing('note', note.id, note.text, note.associate)}    </Dialog>

                              disabled={editing.type !== null}  );

                              className="text-gray-500 hover:text-green-600"};

                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem('note', note.id)}
                              disabled={editing.type !== null}
                              className="text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{note.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-12">
                      <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
                      <p className="text-gray-500">Add the first note to start documenting important information.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tags Tab */}
              <TabsContent value="tags" className="space-y-6 m-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Tags</h3>
                  <Button
                    onClick={() => startEditing('tag')}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                    disabled={editing.type !== null}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </div>

                {editing.type === 'tag' && (
                  <Card className="shadow-lg border-purple-200 bg-purple-50/50">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <AssociateSelector
                          value={editAssociate}
                          onValueChange={setEditAssociate}
                          label="Associate"
                          placeholder="Select associate"
                          required
                          error={associateError}
                        />
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Tag <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="Enter tag name..."
                            className="w-full"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <Button onClick={saveEdit} className="bg-purple-600 hover:bg-purple-700">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={cancelEditing} variant="outline">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tags.map((tag) => (
                    <Card key={tag.id} className="shadow-md border-gray-200 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <Badge className={`text-sm font-medium border ${tag.color} shadow-sm`}>
                            {tag.text}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing('tag', tag.id, tag.text, tag.associate)}
                              disabled={editing.type !== null}
                              className="text-gray-500 hover:text-purple-600 h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem('tag', tag.id)}
                              disabled={editing.type !== null}
                              className="text-gray-500 hover:text-red-600 h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-gray-600 flex items-center">
                            <UserCheck className="h-3 w-3 mr-1" />
                            {tag.associate}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(tag.timestamp)} ago
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {tags.length === 0 && (
                  <div className="text-center py-12">
                    <Tags className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tags yet</h3>
                    <p className="text-gray-500">Add tags to categorize and organize member information.</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};