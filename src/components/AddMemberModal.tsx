import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Plus, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar as CalendarIcon,
  CreditCard,
  Activity,
  Tag,
  X
} from "lucide-react";
import { toast } from "sonner";
import { MembershipData } from "@/types/membership";
import { format } from "date-fns";

interface AddMemberModalProps {
  onAddMember: (member: Partial<MembershipData>) => void;
  trigger?: React.ReactNode;
}

export const AddMemberModal = ({ onAddMember, trigger }: AddMemberModalProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
    emergencyContact: '',
    dateOfBirth: new Date(),
    address: ''
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  const membershipTypes = [
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
    'Downtown',
    'Westside',
    'Eastside',
    'North Branch',
    'South Branch',
    'Central',
    'Online'
  ];

  const statusOptions = ['Active', 'Frozen', 'Cancelled', 'Pending'];

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
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    // Generate unique member ID
    const memberId = `MEM${Date.now().toString().slice(-6)}`;

    const newMember: Partial<MembershipData> = {
      memberId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      location: formData.location,
      membershipName: formData.membershipName,
      orderDate: format(formData.startDate, 'yyyy-MM-dd'),
      endDate: format(formData.endDate, 'yyyy-MM-dd'),
      sessionsLeft: formData.sessionsLeft ? parseInt(formData.sessionsLeft) : 0,
      paid: formData.paid,
      status: formData.status as any,
      comments: formData.comments,
      notes: formData.notes,
      tags: formData.tags,
      uniqueId: `${memberId}-${Date.now()}`,
      itemId: memberId,
      membershipId: memberId,
      soldBy: 'Admin',
      frozen: formData.status === 'Frozen' ? 'Yes' : 'No',
      currentUsage: '0'
    };

    onAddMember(newMember);
    toast.success('Member added successfully!');
    setOpen(false);
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
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
      emergencyContact: '',
      dateOfBirth: new Date(),
      address: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/95">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Member
          </DialogTitle>
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
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="pl-10 backdrop-blur-sm bg-white/80"
                  />
                </div>
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
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};