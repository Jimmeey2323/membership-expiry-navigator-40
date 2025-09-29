import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Calendar as CalendarIcon,
  Phone,
  Mail,
  User,
  Clock,
  Target,
  Check,
  Plus,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export interface FollowUpEntry {
  id: string;
  memberId: string;
  type: 'call' | 'email' | 'in-person' | 'text' | 'note' | 'task';
  subject: string;
  description: string;
  date: string;
  staffMember: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'cancelled';
  nextFollowUp?: string;
  outcome?: string;
  tags?: string[];
  relatedGoal?: string;
}

interface FollowUpModalProps {
  memberId: string;
  memberName: string;
  onAddFollowUp: (followUp: FollowUpEntry) => void;
  existingFollowUps?: FollowUpEntry[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const FollowUpModal = ({ 
  memberId, 
  memberName, 
  onAddFollowUp,
  existingFollowUps = [],
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: FollowUpModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'history'>('add');
  const [formData, setFormData] = useState({
    type: 'call' as const,
    subject: '',
    description: '',
    date: new Date(),
    staffMember: '',
    priority: 'medium' as const,
    status: 'pending' as const,
    nextFollowUp: '',
    relatedGoal: '',
    tags: [] as string[]
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextFollowUpPicker, setShowNextFollowUpPicker] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const followUpTypes = [
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'in-person', label: 'In-Person', icon: User },
    { value: 'text', label: 'Text Message', icon: MessageSquare },
    { value: 'note', label: 'Note', icon: BookOpen },
    { value: 'task', label: 'Task', icon: Target }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      updateFormData('tags', [...formData.tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.description) {
      toast.error('Please fill in subject and description');
      return;
    }

    const newFollowUp: FollowUpEntry = {
      id: Date.now().toString(),
      memberId,
      type: formData.type,
      subject: formData.subject,
      description: formData.description,
      date: format(formData.date, 'yyyy-MM-dd HH:mm'),
      staffMember: formData.staffMember || 'Current User',
      priority: formData.priority,
      status: formData.status,
      nextFollowUp: formData.nextFollowUp,
      relatedGoal: formData.relatedGoal,
      tags: formData.tags
    };

    onAddFollowUp(newFollowUp);
    toast.success('Follow-up added successfully!');
    
    // Reset form
    setFormData({
      type: 'call',
      subject: '',
      description: '',
      date: new Date(),
      staffMember: '',
      priority: 'medium',
      status: 'pending',
      nextFollowUp: '',
      relatedGoal: '',
      tags: []
    });
    setCurrentTag('');
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = followUpTypes.find(t => t.value === type);
    if (!typeConfig) return MessageSquare;
    return typeConfig.icon;
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = priorityOptions.find(p => p.value === priority);
    return priorityConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Follow-up Management: {memberName}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Schedule follow-ups and track member communication history.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'add' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Add Follow-up
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'history' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            History ({existingFollowUps.length})
          </button>
        </div>

        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Follow-up Details */}
            <Card className="backdrop-blur-sm bg-white/70 border-white/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Follow-up Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: any) => updateFormData('type', value)}>
                      <SelectTrigger className="backdrop-blur-sm bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {followUpTypes.map(type => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: any) => updateFormData('priority', value)}>
                      <SelectTrigger className="backdrop-blur-sm bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <Badge className={priority.color}>
                              {priority.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => updateFormData('subject', e.target.value)}
                    className="backdrop-blur-sm bg-white/80"
                    placeholder="Brief description of the follow-up"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="backdrop-blur-sm bg-white/80 min-h-[100px]"
                    placeholder="Detailed description of the follow-up activity..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start backdrop-blur-sm bg-white/80">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.date, 'PPP p')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => {
                            if (date) {
                              updateFormData('date', date);
                              setShowDatePicker(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staffMember">Staff Member</Label>
                    <Input
                      id="staffMember"
                      value={formData.staffMember}
                      onChange={(e) => updateFormData('staffMember', e.target.value)}
                      className="backdrop-blur-sm bg-white/80"
                      placeholder="Your name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="backdrop-blur-sm bg-white/70 border-white/30">
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="relatedGoal">Related Goal</Label>
                  <Input
                    id="relatedGoal"
                    value={formData.relatedGoal}
                    onChange={(e) => updateFormData('relatedGoal', e.target.value)}
                    className="backdrop-blur-sm bg-white/80"
                    placeholder="e.g., Membership renewal, Usage increase, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextFollowUp">Next Follow-up Date (Optional)</Label>
                  <Input
                    id="nextFollowUp"
                    type="date"
                    value={formData.nextFollowUp}
                    onChange={(e) => updateFormData('nextFollowUp', e.target.value)}
                    className="backdrop-blur-sm bg-white/80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="backdrop-blur-sm bg-white/80"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeTag(tag)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Follow-up
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {existingFollowUps.length === 0 ? (
              <Card className="backdrop-blur-sm bg-white/70 border-white/30">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No follow-ups yet</h3>
                  <p className="text-gray-500">Start tracking member interactions by adding your first follow-up.</p>
                  <Button 
                    onClick={() => setActiveTab('add')} 
                    className="mt-4"
                    variant="outline"
                  >
                    Add First Follow-up
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {existingFollowUps
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(followUp => {
                    const Icon = getTypeIcon(followUp.type);
                    return (
                      <Card key={followUp.id} className="backdrop-blur-sm bg-white/70 border-white/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1">
                                <Icon className="h-5 w-5 text-slate-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-slate-900">{followUp.subject}</h4>
                                  <Badge className={getPriorityColor(followUp.priority)}>
                                    {followUp.priority}
                                  </Badge>
                                  <Badge className={getStatusColor(followUp.status)}>
                                    {followUp.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{followUp.description}</p>
                                <div className="text-xs text-slate-500 flex items-center gap-4">
                                  <span>{format(new Date(followUp.date), 'PPP p')}</span>
                                  <span>by {followUp.staffMember}</span>
                                  {followUp.relatedGoal && (
                                    <span>Goal: {followUp.relatedGoal}</span>
                                  )}
                                </div>
                                {followUp.tags && followUp.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {followUp.tags.map(tag => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};