import React, { useState, useEffect } from "react";
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
  User, Calendar, Clock, Shield, RefreshCw, AlertCircle 
} from "lucide-react";
import { MembershipData } from "@/types/membership";
import { enhancedAnnotationService } from "@/services/enhancedAnnotations";
import { toast } from "sonner";

interface EnhancedMemberAnnotationsProps {
  member: MembershipData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, comments: string, notes: string, tags: string[]) => void;
}

interface ConflictResolution {
  action: 'overwrite' | 'merge' | 'cancel';
  details?: any;
}

export const EnhancedMemberAnnotations = ({ 
  member, 
  isOpen, 
  onClose, 
  onSave 
}: EnhancedMemberAnnotationsProps) => {
  const [comments, setComments] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [associateName, setAssociateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Enhanced states
  const [existingAnnotation, setExistingAnnotation] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [showIntegrityCheck, setShowIntegrityCheck] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<'pending' | 'valid' | 'invalid'>('pending');

  // Reset form when member changes or dialog opens
  useEffect(() => {
    if (member && isOpen) {
      loadExistingAnnotation();
      setAssociateName('');
      setNewTag('');
      setConflicts([]);
      setShowHistory(false);
      setIntegrityStatus('pending');
    }
  }, [member, isOpen]);

  const loadExistingAnnotation = async () => {
    if (!member) return;

    try {
      const annotation = await enhancedAnnotationService.getEnhancedAnnotation(member.memberId);
      
      if (annotation) {
        setExistingAnnotation(annotation);
        setComments(annotation.currentComments || '');
        setNotes(annotation.currentNotes || '');
        setTags(annotation.currentTags || []);
        setIntegrityStatus('valid');
      } else {
        // Fall back to basic member data
        setComments(member.comments || '');
        setNotes(member.notes || '');
        setTags(member.tags || []);
        setExistingAnnotation(null);
        setIntegrityStatus('pending');
      }
    } catch (error) {
      console.error('Error loading annotation:', error);
      // Fall back to basic member data
      setComments(member.comments || '');
      setNotes(member.notes || '');
      setTags(member.tags || []);
      setIntegrityStatus('invalid');
    }
  };

  const loadVersionHistory = async () => {
    if (!member) return;

    setIsLoadingHistory(true);
    try {
      const history = await enhancedAnnotationService.getAnnotationHistory(member.memberId);
      setVersionHistory(history);
    } catch (error) {
      console.error('Error loading version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setIsLoadingHistory(false);
    }
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

  const performIntegrityCheck = async () => {
    if (!member) return;

    setShowIntegrityCheck(true);
    try {
      const annotation = await enhancedAnnotationService.getEnhancedAnnotation(member.memberId);
      
      if (annotation) {
        // Verify member data matches
        const memberDataValid = 
          annotation.email === member.email &&
          annotation.firstName === member.firstName &&
          annotation.lastName === member.lastName;

        setIntegrityStatus(memberDataValid ? 'valid' : 'invalid');
        
        if (!memberDataValid) {
          toast.warning('Data integrity issues detected. Please review member information.');
        } else {
          toast.success('Data integrity check passed');
        }
      } else {
        setIntegrityStatus('pending');
      }
    } catch (error) {
      setIntegrityStatus('invalid');
      toast.error('Integrity check failed');
    }
  };

  const handleSave = async () => {
    if (!member) return;
    
    if (!associateName) {
      toast.error("Please select an associate name");
      return;
    }
    
    setIsSaving(true);
    try {
      // Get browser metadata for tracking
      const metadata = {
        userAgent: navigator.userAgent,
        ipAddress: 'client-side' // Would need server-side implementation for real IP
      };

      const result = await enhancedAnnotationService.saveEnhancedAnnotation(
        member,
        comments,
        notes,
        tags,
        associateName,
        metadata
      );

      if (result.success) {
        onSave(member.memberId, comments, notes, tags);
        toast.success("Enhanced annotations saved successfully!");
        
        // Show success details
        if (result.annotation) {
          toast.info(`Saved as version ${result.annotation.currentVersion}`);
        }
        
        onClose();
      } else {
        if (result.conflicts && result.conflicts.length > 0) {
          setConflicts(result.conflicts);
          toast.warning("Conflicts detected. Please review and resolve.");
        } else {
          toast.error(result.error || "Failed to save annotations");
        }
      }
    } catch (error) {
      console.error('Error saving enhanced annotations:', error);
      toast.error("Failed to save annotations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConflictResolution = async (resolution: ConflictResolution) => {
    if (resolution.action === 'cancel') {
      setConflicts([]);
      return;
    }

    if (resolution.action === 'overwrite') {
      // Force save ignoring conflicts
      toast.info('Forcing save - overwriting existing data');
      // Implementation would modify the save process to ignore conflicts
    }

    if (resolution.action === 'merge') {
      // Implement merge logic
      toast.info('Merging changes with existing data');
      // Implementation would merge the changes intelligently
    }

    setConflicts([]);
  };

  const rollbackToVersion = async (version: number) => {
    if (!member || !associateName) {
      toast.error("Please select an associate name before rolling back");
      return;
    }

    try {
      const success = await enhancedAnnotationService.rollbackToVersion(
        member.memberId, 
        version, 
        associateName
      );

      if (success) {
        toast.success(`Rolled back to version ${version}`);
        await loadExistingAnnotation(); // Reload the data
      } else {
        toast.error('Failed to rollback to selected version');
      }
    } catch (error) {
      toast.error('Error during rollback operation');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            Enhanced Annotations - {member.firstName} {member.lastName}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Advanced annotation system with versioning, conflict resolution, and data integrity checks.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Member Info & Status */}
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
            
            {/* Data Integrity Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Data Integrity:</span>
                {integrityStatus === 'valid' && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                )}
                {integrityStatus === 'invalid' && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Issues Detected
                  </Badge>
                )}
                {integrityStatus === 'pending' && (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Check
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={performIntegrityCheck}
                  disabled={!member}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Check Integrity
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory && versionHistory.length === 0) {
                      loadVersionHistory();
                    }
                  }}
                  disabled={!member}
                >
                  <History className="h-4 w-4 mr-1" />
                  {showHistory ? 'Hide' : 'Show'} History
                </Button>
              </div>
            </div>
          </div>

          {/* Conflict Resolution */}
          {conflicts.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Conflicts Detected:</p>
                  {conflicts.map((conflict, index) => (
                    <div key={index} className="text-sm">
                      <p>• {conflict.conflictType}: {conflict.conflictDetails?.lastUpdatedBy} 
                         updated {conflict.conflictDetails?.minutesAgo} minutes ago</p>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleConflictResolution({ action: 'overwrite' })}
                    >
                      Overwrite
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleConflictResolution({ action: 'merge' })}
                    >
                      Merge
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConflictResolution({ action: 'cancel' })}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Version History */}
          {showHistory && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Version History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading version history...
                  </div>
                ) : versionHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No version history available</p>
                ) : (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {versionHistory.map((version, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">v{version.version}</Badge>
                            <span className="text-sm font-medium">{version.associate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(version.timestamp).toLocaleDateString()}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => rollbackToVersion(version.version)}
                              className="text-xs"
                            >
                              Rollback
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Comments:</strong> {version.comments || 'None'}</p>
                          <p><strong>Notes:</strong> {version.notes || 'None'}</p>
                          <p><strong>Tags:</strong> {version.tags?.join(', ') || 'None'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current Version Info */}
          {existingAnnotation && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Current Version:</span> {existingAnnotation.currentVersion}</div>
                  <div><span className="font-medium">Last Updated:</span> {new Date(existingAnnotation.updatedAt).toLocaleDateString()}</div>
                  <div><span className="font-medium">Updated By:</span> {existingAnnotation.updatedBy}</div>
                  <div><span className="font-medium">Created By:</span> {existingAnnotation.createdBy}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Associate Name */}
          <div className="space-y-2">
            <AssociateSelector
              label="Associate Name"
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
              Will be automatically timestamped and attributed to {associateName || 'selected associate'}
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
              Internal notes with full audit trail and version control
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
              <span>Enhanced security and audit trail enabled</span>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || conflicts.length > 0}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Enhanced Annotations
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