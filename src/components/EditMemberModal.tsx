import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Edit, 
  User, 
  Mail, 
  MapPin, 
  Calendar as CalendarIcon,
  CreditCard,
  Activity,
  Tag,
  X,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { MembershipData } from "@/types/membership";
import { format, parseISO } from "date-fns";

interface EditMemberModalProps {
  member: MembershipData;
  onUpdateMember: (member: MembershipData) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const EditMemberModal = ({ 
  member, 
  onUpdateMember, 
  trigger, 
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: EditMemberModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    membershipName: '',
    startDate: new Date(),
    endDate: new Date(),
    sessionsLeft: '',
    paid: '',
    status: 'Active',
    comments: '',
    notes: '',
    tags: [] as string[],
    soldBy: '',
    frozen: 'No'
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const membershipTypes = [
    // Actual membership types from your Google Sheets
    'Studio Annual Unlimited',
    'Studio 1 Month Unlimited',
    'Studio 6 Month Unlimited',
    'Studio 3 Month Unlimited',
    'Studio 4 Class Package',
    'Studio 8 Class Package',
    'Studio 12 Class Package',
    // Generic types
    'Premium Monthly',
    'Premium Annual',
    'Basic Monthly',
    'Basic Annual',
    'Day Pass',
    'Student Monthly',
    'Senior Monthly',
    'Corporate',
    'Family Plan'
  ];

  const locations = [
    // Actual locations from your Google Sheets
    'Kwality House, Kemps Corner',
    'Supreme HQ, Bandra',
    'Kenkere House',
    // Generic locations
    'Downtown',
    'Westside',
    'Eastside',
    'North Branch',
    'South Branch',
    'Central',
    'Online'
  ];

  const statusOptions = ['Active', 'Frozen', 'Churned', 'Pending', 'Suspended', 'Trial'];

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      console.log('🔍 [DEBUG] EditMemberModal - Member data received:', {
        memberId: member.memberId,
        name: `${member.firstName} ${member.lastName}`,
        membershipName: member.membershipName,
        location: member.location,
        email: member.email
      });
      
      try {
        // Safe date parsing with multiple fallbacks
        const parseDate = (dateStr: string | undefined) => {
          if (!dateStr || dateStr === '') return new Date();
          
          // Clean the date string and try different formats
          const cleanDateStr = dateStr.trim();
          
          // Handle various date formats
          const formats = [
            cleanDateStr,
            cleanDateStr.replace(',', ''), // Remove comma if present
            cleanDateStr.split(',')[0], // Take only date part before comma
            cleanDateStr + 'T00:00:00Z',
            cleanDateStr + 'T00:00:00',
            cleanDateStr.split(' ')[0], // Take only date part before space
          ];
          
          for (const format of formats) {
            try {
              // Try parseISO first
              let parsed = parseISO(format);
              if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
                return parsed;
              }
              
              // Try Date constructor
              parsed = new Date(format);
              if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
                return parsed;
              }
            } catch (e) {
              // Continue to next format
            }
          }
          
          // Fallback to current date
          console.warn('Could not parse date:', dateStr, 'using current date');
          return new Date();
        };

        const formDataToSet = {
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          email: member.email || '',
          location: member.location || '',
          membershipName: member.membershipName || '',
          startDate: parseDate(member.orderDate),
          endDate: parseDate(member.endDate),
          sessionsLeft: member.sessionsLeft?.toString() || '',
          paid: member.paid || '',
          status: member.status || 'Active',
          comments: member.comments || '',
          notes: member.notes || '',
          tags: Array.isArray(member.tags) ? member.tags : [],
          soldBy: member.soldBy || '',
          frozen: member.frozen || 'No'
        };
        
        setFormData(formDataToSet);
      } catch (error) {
        console.error('Error initializing form data:', error, member);
        // Set safe defaults
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          location: '',
          membershipName: '',
          startDate: new Date(),
          endDate: new Date(),
          sessionsLeft: '',
          paid: '',
          status: 'Active',
          comments: '',
          notes: '',
          tags: [],
          soldBy: '',
          frozen: 'No'
        });
      }
    }
  }, [member]);

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
    
    try {
      // Validation
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error('Please fill in all required fields (First Name, Last Name, Email)');
        return;
      }

      const updatedMember: MembershipData = {
        ...member,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        location: formData.location,
        membershipName: formData.membershipName,
        orderDate: format(formData.startDate, 'yyyy-MM-dd'),
        endDate: format(formData.endDate, 'yyyy-MM-dd'),
        sessionsLeft: formData.sessionsLeft ? parseInt(formData.sessionsLeft) : member.sessionsLeft,
        paid: formData.paid,
        status: formData.status as any,
        comments: formData.comments,
        notes: formData.notes,
        tags: formData.tags,
        soldBy: formData.soldBy,
        frozen: formData.status === 'Frozen' ? 'Yes' : 'No'
      };

      onUpdateMember(updatedMember);
      toast.success('Member updated successfully!');
      setOpen(false);
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member. Please try again.');
    }
  };

  // Don't render if no member data
  if (!member) {
    console.warn('EditMemberModal: No member data provided');
    return null;
  }

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
            <Edit className="h-5 w-5" />
            Edit Member: {member?.firstName || 'Unknown'} {member?.lastName || 'Member'}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Update member information, membership details, and personal notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="backdrop-blur-sm bg-white/70 border-white/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className="backdrop-blur-sm bg-white/80"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className="backdrop-blur-sm bg-white/80"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="pl-10 backdrop-blur-sm bg-white/80"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberId">Member ID</Label>
                <Input
                  id="memberId"
                  value={member?.memberId || 'N/A'}
                  className="backdrop-blur-sm bg-gray-100"
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {/* Membership Details */}
          <Card className="backdrop-blur-sm bg-white/70 border-white/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Membership Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="membershipType">Membership Type</Label>
                <Select value={formData.membershipName} onValueChange={(value) => updateFormData('membershipName', value)}>
                  <SelectTrigger className="backdrop-blur-sm bg-white/80">
                    <SelectValue placeholder="Select membership type" />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Select value={formData.location} onValueChange={(value) => updateFormData('location', value)}>
                    <SelectTrigger className="pl-10 backdrop-blur-sm bg-white/80">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start backdrop-blur-sm bg-white/80">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => {
                        if (date) {
                          updateFormData('startDate', date);
                          setShowStartDatePicker(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start backdrop-blur-sm bg-white/80">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.endDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => {
                        if (date) {
                          updateFormData('endDate', date);
                          setShowEndDatePicker(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionsLeft">Sessions Remaining</Label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="sessionsLeft"
                    type="number"
                    value={formData.sessionsLeft}
                    onChange={(e) => updateFormData('sessionsLeft', e.target.value)}
                    className="pl-10 backdrop-blur-sm bg-white/80"
                    placeholder="Enter number or leave empty for unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paid">Amount Paid</Label>
                <Input
                  id="paid"
                  value={formData.paid}
                  onChange={(e) => updateFormData('paid', e.target.value)}
                  className="backdrop-blur-sm bg-white/80"
                  placeholder="$0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                  <SelectTrigger className="backdrop-blur-sm bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="soldBy">Sold By</Label>
                <Input
                  id="soldBy"
                  value={formData.soldBy}
                  onChange={(e) => updateFormData('soldBy', e.target.value)}
                  className="backdrop-blur-sm bg-white/80"
                  placeholder="Staff member name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="backdrop-blur-sm bg-white/70 border-white/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => updateFormData('comments', e.target.value)}
                    className="backdrop-blur-sm bg-white/80"
                    placeholder="Public comments..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    className="backdrop-blur-sm bg-white/80"
                    placeholder="Internal notes (staff only)..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};