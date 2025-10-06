
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssociateSelector } from "@/components/ui/associate-selector";
import { X, Plus, Save, Shield, RefreshCw, Users, UserCheck, Clock, MessageSquare } from "lucide-react";
import { MembershipData, MEMBER_STAGES } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { extractFirstName } from "@/lib/textUtils";
import { getCurrentTimestamp, formatTimestampIST, createTimestampedAnnotation } from "@/lib/timestampUtils";
import { toast } from "sonner";

interface MemberAnnotationsProps {
  member: MembershipData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, comments: string, notes: string, tags: string[], associate?: string, associateInCharge?: string, stage?: string) => void;
}

export const MemberAnnotations = ({ member, isOpen, onClose, onSave }: MemberAnnotationsProps) => {
  const [comments, setComments] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [associateName, setAssociateName] = useState('');
  const [associateInCharge, setAssociateInCharge] = useState('');
  const [stage, setStage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Reset form when member changes or dialog opens
  useEffect(() => {
    if (member && isOpen) {
      // Handle structured comments/notes or fallback to text versions
      const commentsText = Array.isArray(member.comments) 
        ? member.comments.map(c => c.text).join('\n') 
        : (member.commentsText || '');
      const notesText = Array.isArray(member.notes) 
        ? member.notes.map(n => n.text).join('\n') 
        : (member.notesText || '');
      const tagsArray = Array.isArray(member.tags) 
        ? member.tags.map(t => t.text || String(t)) 
        : (member.tagsText || []);
        
      setComments(commentsText);
      setNotes(notesText);
      setTags(tagsArray);
      setAssociateName('');
      setAssociateInCharge(member.associateInCharge || '');
      setStage(member.stage || '');
      setNewTag('');
      setValidationResult(null);
      setShowValidation(false);
    }
  }, [member, isOpen]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!member || !associateName.trim()) {
      toast.error("Please select an associate before saving");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create timestamped annotations
      const timestamp = getCurrentTimestamp();
      const timestampedComments = comments ? `[${formatTimestampIST(timestamp)}] ${associateName}: ${comments}` : '';
      const timestampedNotes = notes ? `[${formatTimestampIST(timestamp)}] ${associateName}: ${notes}` : '';
      
      await googleSheetsService.saveAnnotation(
        member.memberId,
        member.email,
        timestampedComments,
        timestampedNotes,
        tags,
        associateName,
        associateInCharge,
        stage
      );
      
      toast.success("Annotation saved with timestamp!");
      onSave(member.memberId, timestampedComments, timestampedNotes, tags, associateName, associateInCharge, stage);
    } catch (error) {
      console.error('Error saving annotation:', error);
      toast.error("Failed to save annotation. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const checkMemberValidation = async () => {
    if (!member) return;
    
    setIsValidating(true);
    try {
      const result = await googleSheetsService.validateMemberBeforeSave(
        member.memberId,
        member.email,
        member.uniqueId
      );
      
      setValidationResult(result);
      setShowValidation(true);
      
      if (result.isValid) {
        toast.success(`Member validation passed! ${result.confidence}% confidence`);
      } else {
        toast.warning(`Validation issues found: ${result.issues.join(', ')}`);
      }
    } catch (error) {
      toast.error('Failed to validate member data');
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Save className="h-5 w-5 text-primary" />
            </div>
            Add Notes & Tags for {member.firstName} {member.lastName}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Enhanced annotation system with data validation, retry logic, and audit trails for maximum reliability.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Member Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Member ID:</span> {member.memberId}
              </div>
              <div>
                <span className="font-medium">Email:</span> {member.email}
              </div>
              <div>
                <span className="font-medium">Membership:</span> {member.membershipName}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge variant={member.status === 'Active' ? "default" : "destructive"} className="ml-2">
                  {member.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Validation Section */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-700">Data Reliability Check</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkMemberValidation}
                disabled={!member || isValidating}
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Validate Member Data
                  </>
                )}
              </Button>
            </div>
            
            {showValidation && validationResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                    {validationResult.confidence}% Confidence
                  </Badge>
                  <span className="text-sm text-slate-600">
                    {validationResult.isValid ? 'Data validation passed' : 'Issues detected'}
                  </span>
                </div>
                
                {validationResult.issues.length > 0 && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
                    <strong>Issues found:</strong>
                    <ul className="mt-1 space-y-1">
                      {validationResult.issues.map((issue: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResult.matchedMember && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200">
                    <strong>Matched Member:</strong> {validationResult.matchedMember.firstName} {validationResult.matchedMember.lastName} 
                    <span className="text-green-500"> (ID: {validationResult.matchedMember.memberId})</span>
                  </div>
                )}
              </div>
            )}
            
            {!showValidation && (
              <p className="text-sm text-slate-500">
                Click "Validate Member Data" to check for accuracy and reliability issues before saving.
              </p>
            )}
          </div>

          {/* Stage Selection */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Member Interaction Stage
            </Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger>
                <SelectValue placeholder="Select appropriate stage based on recent interactions" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {MEMBER_STAGES.map((stageOption) => (
                  <SelectItem key={stageOption} value={stageOption}>
                    {stageOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Choose the stage that best reflects the member's current situation
            </div>
          </div>

          {/* Associates Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <AssociateSelector
                label="Associate"
                value={associateName}
                onValueChange={setAssociateName}
                placeholder="Select primary associate"
                required
              />
            </div>
            <div className="space-y-2">
              <AssociateSelector
                label="Associate In Charge"
                value={associateInCharge}
                onValueChange={setAssociateInCharge}
                placeholder="Select associate in charge"
              />
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </Label>
            <Textarea
              id="comments"
              placeholder="Add any comments about this member..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Will be auto-timestamped: [{formatTimestampIST(getCurrentTimestamp())}] {associateName || 'Associate'}: [Your comment]
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Internal Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add internal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Will be auto-timestamped: [{formatTimestampIST(getCurrentTimestamp())}] {associateName || 'Associate'}: [Your note]
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tags</Label>
            
            {/* Add new tag */}
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

            {/* Display tags */}
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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving with Enhanced Reliability...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save with Validation
                  {validationResult && (
                    <Badge variant={validationResult.isValid ? "default" : "secondary"} className="ml-2 text-xs">
                      {validationResult.confidence}%
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
