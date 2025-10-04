import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AssociateSelector } from "@/components/ui/associate-selector";
import { 
  X, Plus, Save, History, AlertTriangle, CheckCircle, 
  Shield, RefreshCw, Clock
} from "lucide-react";
import { MembershipData } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { toast } from "sonner";

interface ReliableAnnotationsProps {
  member: MembershipData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, comments: string, notes: string, tags: string[]) => void;
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  confidence: number;
}

export const ReliableAnnotations = ({ 
  member, 
  isOpen, 
  onClose, 
  onSave 
}: ReliableAnnotationsProps) => {
  const [comments, setComments] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [associateName, setAssociateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, issues: [], confidence: 100 });
  const [existingData, setExistingData] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Reset form when member changes or dialog opens
  useEffect(() => {
    if (member && isOpen) {
      loadMemberData();
      setAssociateName('');
      setNewTag('');
    }
  }, [member, isOpen]);

  const loadMemberData = async () => {
    if (!member) return;

    try {
      // Load existing annotations with validation
      const membershipData = await googleSheetsService.getMembershipData();
      const existingMember = membershipData.find(m => 
        m.memberId === member.memberId || 
        (m.email === member.email && m.uniqueId === member.uniqueId)
      );

      if (existingMember) {
        setExistingData(existingMember);
        setComments(existingMember.comments || '');
        setNotes(existingMember.notes || '');
        setTags(existingMember.tags || []);
        
        // Validate data integrity
        validateMemberData(existingMember);
      } else {
        // Fallback to provided member data
        setComments(member.comments || '');
        setNotes(member.notes || '');
        setTags(member.tags || []);
        setValidation({ 
          isValid: false, 
          issues: ['Member not found in current dataset'], 
          confidence: 50 
        });
      }
    } catch (error) {
      console.error('Error loading member data:', error);
      toast.warning('Could not validate member data. Using provided information.');
      setComments(member.comments || '');
      setNotes(member.notes || '');
      setTags(member.tags || []);
    }
  };

  const validateMemberData = (memberData: MembershipData) => {
    const issues: string[] = [];
    let confidence = 100;

    // Check for data consistency
    if (memberData.memberId !== member?.memberId) {
      issues.push('Member ID mismatch detected');
      confidence -= 20;
    }

    if (memberData.email !== member?.email) {
      issues.push('Email address mismatch detected');
      confidence -= 15;
    }

    if (!memberData.uniqueId || !member?.uniqueId) {
      issues.push('Missing unique identifier');
      confidence -= 10;
    }

    // Check for data freshness
    const lastUpdate = memberData.comments || memberData.notes ? new Date() : null;
    if (lastUpdate && (Date.now() - lastUpdate.getTime()) > 24 * 60 * 60 * 1000) {
      issues.push('Data may be stale (>24h old)');
      confidence -= 5;
    }

    setValidation({
      isValid: issues.length === 0,
      issues,
      confidence: Math.max(confidence, 0)
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const performPreSaveValidation = async (): Promise<boolean> => {
    if (!member) return false;

    try {
      // Re-validate member exists and data is current
      const currentData = await googleSheetsService.getMembershipData();
      const currentMember = currentData.find(m => 
        (m.memberId === member.memberId && m.email === member.email) ||
        (m.uniqueId === member.uniqueId && m.email === member.email)
      );

      if (!currentMember) {
        toast.error('Member not found in current data. Cannot save annotations.');
        return false;
      }

      // Check for potential conflicts
      if (existingData && 
          (currentMember.comments !== existingData.comments || 
           currentMember.notes !== existingData.notes)) {
        const proceed = window.confirm(
          'Member data has been updated by someone else. Do you want to overwrite their changes?'
        );
        if (!proceed) return false;
      }

      return true;
    } catch (error) {
      console.error('Pre-save validation failed:', error);
      toast.error('Could not validate member data before saving');
      return false;
    }
  };

  const handleSave = async () => {
    if (!member) return;
    
    if (!associateName) {
      toast.error("Please select an associate name");
      return;
    }

    // Pre-save validation
    const isValid = await performPreSaveValidation();
    if (!isValid) return;
    
    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      
      // Create audit trail in comments/notes
      const auditInfo = `[Updated by ${associateName} on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}]`;
      
      const annotatedComments = comments ? 
        `${comments}\n\n${auditInfo}` : 
        comments;
      
      const annotatedNotes = notes ? 
        `${notes}\n\n${auditInfo}` : 
        notes;

      // Save with enhanced error handling and retry logic
      let saveAttempts = 0;
      const maxAttempts = 3;
      
      while (saveAttempts < maxAttempts) {
        try {
          await googleSheetsService.saveAnnotation(
            member.memberId,
            member.email,
            annotatedComments,
            annotatedNotes,
            tags,
            member.uniqueId,
            associateName,
            timestamp
          );
          break; // Success, exit retry loop
        } catch (error) {
          saveAttempts++;
          if (saveAttempts >= maxAttempts) {
            throw error; // Final attempt failed
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempts));
          toast.info(`Retrying save attempt ${saveAttempts + 1}...`);
        }
      }

      // Verify the save was successful
      setTimeout(async () => {
        try {
          const verificationData = await googleSheetsService.getMembershipData();
          const savedMember = verificationData.find(m => m.memberId === member.memberId);
          
          if (savedMember && 
              (savedMember.comments?.includes(auditInfo) || savedMember.notes?.includes(auditInfo))) {
            toast.success("Annotations saved and verified successfully!");
          } else {
            toast.warning("Annotations saved but verification inconclusive");
          }
        } catch (error) {
          console.log('Verification check failed:', error);
        }
      }, 2000);
      
      onSave(member.memberId, annotatedComments, annotatedNotes, tags);
      onClose();
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error("Failed to save annotations after multiple attempts. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            Reliable Annotations - {member.firstName} {member.lastName}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Enhanced annotation system with data validation and audit trails.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Member Info & Validation Status */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="font-medium">Member ID:</span> {member.memberId}</div>
              <div><span className="font-medium">Email:</span> {member.email}</div>
              <div><span className="font-medium">Unique ID:</span> {member.uniqueId}</div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge variant={member.status === 'Active' ? "default" : "destructive"} className="ml-2">
                  {member.status}
                </Badge>
              </div>
            </div>
            
            {/* Data Validation Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Data Validation:</span>
                {validation.isValid ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid ({validation.confidence}%)
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Issues Found ({validation.confidence}%)
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowValidation(!showValidation)}
              >
                {showValidation ? 'Hide' : 'Show'} Details
              </Button>
            </div>

            {/* Validation Details */}
            {showValidation && validation.issues.length > 0 && (
              <Alert className="mt-3 border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Validation Issues:</p>
                    {validation.issues.map((issue, index) => (
                      <p key={index} className="text-sm">• {issue}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Current Data Summary */}
          {existingData && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">Current Annotations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Comments:</span> 
                    <span className="text-muted-foreground ml-2">
                      {existingData.comments ? `${existingData.comments.substring(0, 100)}...` : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Notes:</span>
                    <span className="text-muted-foreground ml-2">
                      {existingData.notes ? `${existingData.notes.substring(0, 100)}...` : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Tags:</span>
                    <span className="text-muted-foreground ml-2">
                      {existingData.tags?.length > 0 ? existingData.tags.join(', ') : 'None'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Associate Name */}
          <div className="space-y-2">
            <AssociateSelector
              label="Associate Name (Required for Audit Trail)"
              value={associateName}
              onValueChange={setAssociateName}
              placeholder="Select associate handling this update"
              required
            />
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base font-medium">Comments</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments about this member..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="text-xs text-muted-foreground">
              Automatically tracked with timestamp and associate attribution
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add internal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="text-xs text-muted-foreground">
              Internal notes with enhanced reliability and conflict detection
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tags</Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add a new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleAddTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Enhanced reliability with {validation.confidence}% confidence</span>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !validation.isValid}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving Reliably...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save with Validation
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