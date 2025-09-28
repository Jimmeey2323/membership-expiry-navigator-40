import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedDataTable } from "@/components/EnhancedDataTable";
import { PremiumCharts } from "@/components/PremiumCharts";
import { AIAnalytics } from "@/components/AIAnalytics";
import { GlobalFilterPanel } from "@/components/GlobalFilterPanel";
import { AddMemberModal } from "@/components/AddMemberModal";
import { EditMemberModal } from "@/components/EditMemberModal";
import { FollowUpModal, FollowUpEntry } from "@/components/FollowUpModal";
import { AIAnalysisModal } from "@/components/AIAnalysisModal";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { googleSheetsService } from "@/services/googleSheets";
import { MembershipData } from "@/types/membership";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Activity,
  Calendar,
  AlertTriangle,
  Crown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Download,
  Upload,
  Plus,
  BarChart3,
  FileText,
  MessageSquare,
  Edit
} from "lucide-react";
import { toast } from "sonner";

const DashboardContent = () => {
  const { getFilteredData } = useFilters();
  const [localMembershipData, setLocalMembershipData] = useState<MembershipData[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpEntry[]>([]);
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const { data: membershipData, refetch, isLoading, error } = useQuery({
    queryKey: ["membershipData"],
    queryFn: () => googleSheetsService.getMembershipData(),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (membershipData) {
      console.log('🔍 [DEBUG] Raw membership data received:', {
        totalRecords: membershipData.length,
        firstFewRecords: membershipData.slice(0, 3).map((m: any) => ({
          memberId: m.memberId,
          firstName: m.firstName,
          lastName: m.lastName,
          membershipName: m.membershipName,
          location: m.location,
          email: m.email
        }))
      });
      
      // Check for corrupted records
      const corruptedRecords = (membershipData as MembershipData[]).filter((m: MembershipData) => 
        !m.membershipName || m.membershipName.trim() === '' || 
        !m.location || m.location.trim() === ''
      );
      
      // Check for members with annotations
      const membersWithAnnotations = (membershipData as MembershipData[]).filter((m: MembershipData) => 
        (m.comments && m.comments.trim() !== '') || 
        (m.notes && m.notes.trim() !== '') || 
        (m.tags && m.tags.length > 0)
      );
      
      if (membersWithAnnotations.length > 0) {
        console.log('📝 [DEBUG] Members with annotations found:', {
          count: membersWithAnnotations.length,
          examples: membersWithAnnotations.slice(0, 3).map(m => ({
            memberId: m.memberId,
            name: `${m.firstName} ${m.lastName}`,
            hasComments: !!m.comments && m.comments.trim() !== '',
            hasNotes: !!m.notes && m.notes.trim() !== '',
            hasTags: !!m.tags && m.tags.length > 0,
            commentsPreview: m.comments ? `"${m.comments.substring(0, 30)}..."` : 'none',
            notesPreview: m.notes ? `"${m.notes.substring(0, 30)}..."` : 'none',
            tagCount: m.tags ? m.tags.length : 0
          }))
        });
      }
      
      if (corruptedRecords.length > 0) {
        console.warn('⚠️ [DEBUG] Found corrupted records:', {
          count: corruptedRecords.length,
          records: corruptedRecords.map(m => ({
            memberId: m.memberId,
            name: `${m.firstName} ${m.lastName}`,
            membershipName: m.membershipName || '[EMPTY]',
            location: m.location || '[EMPTY]',
            email: m.email
          }))
        });
      }
      
      setLocalMembershipData(membershipData as MembershipData[]);
    }
  }, [membershipData]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Unable to fetch membership data. Please check your connection and try again.</p>
            <Button onClick={() => refetch()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

    const handleAnnotationUpdate = (memberId: string, comments: string, notes: string, tags: string[]) => {
    console.log('📝 [DEBUG] Starting annotation update:', {
      memberId,
      comments: comments.substring(0, 50) + (comments.length > 50 ? '...' : ''),
      notes: notes.substring(0, 50) + (notes.length > 50 ? '...' : ''),
      tags
    });
    
    // Don't update local data immediately - let refetch handle it after save
    // This prevents conflicts between local state and server state
    
    // Save ONLY annotations to the Member_Annotations sheet
    const member = localMembershipData.find(member => member.memberId === memberId);
    if (member) {
      console.log('👤 [DEBUG] Found member for annotation update:', {
        memberId: member.memberId,
        name: `${member.firstName} ${member.lastName}`,
        membershipName: member.membershipName || '[EMPTY]',
        location: member.location || '[EMPTY]',
        email: member.email,
        uniqueId: member.uniqueId
      });
      
      console.log('💾 [DEBUG] Calling saveAnnotation with:', {
        memberId: member.memberId,
        email: member.email,
        uniqueId: member.uniqueId,
        soldBy: member.soldBy || '[EMPTY]'
      });
      
      googleSheetsService.saveAnnotation(
        member.memberId,
        member.email,
        comments,
        notes,
        tags,
        member.uniqueId,
        member.soldBy || '', // associate name
        new Date().toISOString()
      )
        .then(() => {
          console.log('✅ [DEBUG] Member annotations saved successfully to Member_Annotations sheet');
          // Immediately refetch data to show updated annotations
          return refetch();
        })
        .then(() => {
          console.log('🔄 [DEBUG] Data refreshed after annotation save');
          toast.success('Notes and comments saved successfully!');
        })
        .catch(error => {
          console.error('Failed to save annotations to Google Sheets:', error);
          toast.error('Failed to save annotations to Google Sheets.');
        });
    }
  };

  const handleAddMember = (newMember: MembershipData) => {
    setLocalMembershipData(prev => [...prev, newMember]);
    toast.success('Member added successfully!');
  };

  const handleUpdateMember = (updatedMember: MembershipData) => {
    console.log('🔄 [DEBUG] Starting member update:', {
      memberId: updatedMember.memberId,
      name: `${updatedMember.firstName} ${updatedMember.lastName}`,
      membershipName: updatedMember.membershipName || '[EMPTY]',
      location: updatedMember.location || '[EMPTY]',
      email: updatedMember.email
    });
    
    // Update local data immediately
    setLocalMembershipData(prev =>
      prev.map(member =>
        member.memberId === updatedMember.memberId ? updatedMember : member
      )
    );
    
    console.log('💾 [DEBUG] Calling updateSingleMember with:', {
      memberId: updatedMember.memberId,
      membershipName: updatedMember.membershipName,
      location: updatedMember.location,
      hasAllRequiredFields: !!(updatedMember.membershipName && updatedMember.location)
    });
    
    // Save to Google Sheets to ensure persistence
    googleSheetsService.updateSingleMember(updatedMember)
      .then(() => {
        // Refetch data after successful update to ensure consistency
        refetch();
        toast.success('Member updated successfully!');
      })
      .catch(error => {
        console.error('Failed to save to Google Sheets:', error);
        toast.error('Failed to save to Google Sheets. Changes saved locally.');
      });
    
    setShowEditModal(false);
    setSelectedMember(null);
  };

  const handleAddFollowUp = (followUp: FollowUpEntry) => {
    setFollowUps(prev => [...prev, followUp]);
    setShowFollowUpModal(false);
  };

  // Use the global filter context to get filtered data
  const filteredData = getFilteredData(localMembershipData);
  const totalMembers = localMembershipData.length;
  const activeMembers = getFilteredData(localMembershipData.filter(member => member.status === 'Active'));
  const churnedMembers = getFilteredData(localMembershipData.filter(member => member.status === 'Churned'));
  const expiringMembers = getFilteredData(localMembershipData.filter(member => {
    if (!member.endDate) return false;
    const endDate = new Date(member.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && member.status === 'Active';
  }));
  const withAnnotations = getFilteredData(localMembershipData.filter(member => 
    (member.comments && member.comments.trim()) || 
    (member.notes && member.notes.trim()) || 
    (member.tags && member.tags.length > 0)
  ));

  const quickActions = [
    { 
      name: 'Add Member', 
      icon: Plus, 
      action: () => {}, // Will be handled by modal trigger
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    { 
      name: 'Edit Member', 
      icon: Edit, 
      action: () => {
        if (filteredData.length > 0) {
          setSelectedMember(filteredData[0]);
          setShowEditModal(true);
        } else {
          toast.info('No members available to edit');
        }
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    { 
      name: 'Follow-up', 
      icon: MessageSquare, 
      action: () => {
        if (filteredData.length > 0) {
          setSelectedMember(filteredData[0]);
          setShowFollowUpModal(true);
        } else {
          toast.info('No members available for follow-up');
        }
      },
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    { 
      name: 'Export Data', 
      icon: Download, 
      action: () => toast.info('Export feature coming soon!'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 p-6 space-y-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-100/20 to-transparent animate-pulse"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10">
        {/* Global Filter Panel - Enhanced */}
        <div className="mb-6">
          <GlobalFilterPanel data={localMembershipData} />
        </div>

        {/* Refined Dashboard Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/5 via-purple-900/5 to-indigo-900/5 rounded-xl blur-lg opacity-60 animate-pulse"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/30">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur-sm opacity-25 animate-pulse"></div>
                <div className="relative p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent tracking-tight">
                  Membership Dashboard
                </h1>
                <p className="text-slate-600 font-medium text-sm mt-0.5">Advanced analytics & member management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AIAnalysisModal
                data={localMembershipData}
                onUpdateMember={handleUpdateMember}
              />
              <Button 
                onClick={async () => {
                  try {
                    await refetch();
                    toast.success('Data refreshed successfully!');
                  } catch (error) {
                    console.error('Failed to refresh data:', error);
                    toast.error('Failed to refresh data. Please try again.');
                  }
                }}
                disabled={isLoading}
                variant="outline"
                className="backdrop-blur-sm bg-white/90 border-indigo-200/60 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    toast.info('Starting data repair process...');
                    await googleSheetsService.repairCorruptedData();
                    await refetch(); // Refresh data after repair
                    toast.success('Data repair completed! Corrupted records have been fixed.');
                  } catch (error) {
                    console.error('Failed to repair data:', error);
                    toast.error('Failed to repair data. Please try again.');
                  }
                }}
                disabled={isLoading}
                variant="outline"
                className="backdrop-blur-sm bg-orange-50/90 border-orange-200/60 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 shadow-sm"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Repair Data
              </Button>
            </div>
          </div>
        </div>

        {/* Organized Dashboard Grid Layout */}
        <div className="space-y-6">
          {/* Metrics Grid - Clean 4-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden backdrop-blur-xl bg-white/95 border-white/30 shadow-lg hover:shadow-xl transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <CardHeader className="pb-2 pt-4 px-4 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Members</CardTitle>
                  <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md shadow-sm">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1 relative">
                <div className="text-2xl font-bold text-slate-900 mb-1">{totalMembers.toLocaleString()}</div>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
                  <span className="text-xs font-medium text-emerald-600">+12% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden backdrop-blur-xl bg-white/95 border-white/30 shadow-lg hover:shadow-xl transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <CardHeader className="pb-2 pt-4 px-4 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Active Members</CardTitle>
                  <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-md shadow-sm">
                    <UserCheck className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1 relative">
                <div className="text-2xl font-bold text-slate-900 mb-1">{activeMembers.length.toLocaleString()}</div>
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
                  <span className="text-xs font-medium text-emerald-600">+5% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden backdrop-blur-xl bg-white/95 border-white/30 shadow-lg hover:shadow-xl transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <CardHeader className="pb-2 pt-4 px-4 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Expiring Soon</CardTitle>
                  <div className="p-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-md shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1 relative">
                <div className="text-2xl font-bold text-slate-900 mb-1">{expiringMembers.length.toLocaleString()}</div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 text-orange-600 mr-1" />
                  <span className="text-xs font-medium text-orange-600">Next 30 days</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden backdrop-blur-xl bg-white/95 border-white/30 shadow-lg hover:shadow-xl transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <CardHeader className="pb-2 pt-4 px-4 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Churned</CardTitle>
                  <div className="p-1.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-md shadow-sm">
                    <UserX className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1 relative">
                <div className="text-2xl font-bold text-slate-900 mb-1">{churnedMembers.length.toLocaleString()}</div>
                <div className="flex items-center">
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-xs font-medium text-red-600">-3% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid - Optimized layout */}
          <Card className="relative overflow-hidden backdrop-blur-xl bg-white/95 border-white/30 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/3 via-purple-500/3 to-indigo-500/3"></div>
            <CardHeader className="pb-3 pt-4 px-6 relative">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md shadow-sm">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
                  <CardDescription className="text-slate-600 text-sm">
                    Efficient member management tools
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 relative">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  
                  // Special handling for Add Member button
                  if (action.name === 'Add Member') {
                    return (
                      <AddMemberModal
                        key={action.name}
                        onAddMember={handleAddMember}
                        trigger={
                          <Button
                            variant="outline"
                            className="h-20 flex flex-col items-center gap-2.5 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm bg-white/90 border-indigo-200/50 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-transparent hover:shadow-md group"
                          >
                            <div className="p-2 bg-gradient-to-r from-indigo-100 to-purple-100 group-hover:from-white/20 group-hover:to-white/20 rounded-lg transition-all duration-200">
                              <Icon className="h-4 w-4 text-indigo-600 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-xs font-semibold group-hover:text-white transition-colors text-center">{action.name}</span>
                          </Button>
                        }
                      />
                    );
                  }
                  
                  return (
                    <Button
                      key={action.name}
                      onClick={action.action}
                      variant="outline"
                      className="h-20 flex flex-col items-center gap-2.5 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm bg-white/90 border-indigo-200/50 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:border-transparent hover:shadow-md group"
                    >
                      <div className="p-2 bg-gradient-to-r from-indigo-100 to-purple-100 group-hover:from-white/20 group-hover:to-white/20 rounded-lg transition-all duration-200">
                        <Icon className="h-4 w-4 text-indigo-600 group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-xs font-semibold group-hover:text-white transition-colors text-center">{action.name}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ultra-Modern Content Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-purple-900/10 rounded-xl blur-lg opacity-50"></div>
              <TabsList className="relative grid w-full sm:w-auto grid-cols-3 backdrop-blur-xl bg-white/90 border-white/20 shadow-lg">
                <TabsTrigger 
                  value="members" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="reports" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <FileText className="h-4 w-4" />
                  Reports
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-2 backdrop-blur-sm bg-white/80 border-indigo-200 text-indigo-700 shadow-lg">
                <MessageSquare className="h-3 w-3" />
                {withAnnotations.length} with notes
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2 backdrop-blur-sm bg-white/80 border-orange-200 text-orange-700 shadow-lg">
                <AlertTriangle className="h-3 w-3" />
                {churnedMembers.length} churned
              </Badge>
            </div>
          </div>

        <TabsContent value="members" className="space-y-6">
          <EnhancedDataTable
            data={filteredData}
            title="Member Management"
            onAnnotationUpdate={handleAnnotationUpdate}
            onEditMember={(member) => {
              setSelectedMember(member);
              setShowEditModal(true);
            }}
            onFollowUpMember={(member) => {
              setSelectedMember(member);
              setShowFollowUpModal(true);
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PremiumCharts data={filteredData} />
          <AIAnalytics data={localMembershipData} />
        </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="relative overflow-hidden backdrop-blur-xl bg-white/90 border-white/20 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5"></div>
              <CardHeader className="relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Reports & Insights</CardTitle>
                    <CardDescription className="text-slate-600 font-medium">
                      Advanced reporting features coming soon!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative h-96 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-300/20 to-slate-400/20 rounded-full blur-2xl animate-pulse"></div>
                    <FileText className="relative h-16 w-16 text-slate-400 mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-700">Advanced Reporting Suite</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">
                      Comprehensive analytics, detailed member insights, and customizable reports will be available here.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedMember && (
        <>
          <EditMemberModal
            member={selectedMember}
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onUpdateMember={handleUpdateMember}
          />
          
          <FollowUpModal
            memberId={selectedMember.memberId}
            memberName={`${selectedMember.firstName} ${selectedMember.lastName}`}
            open={showFollowUpModal}
            onOpenChange={setShowFollowUpModal}
            onAddFollowUp={handleAddFollowUp}
            existingFollowUps={followUps.filter(f => f.memberId === selectedMember.memberId)}
          />
        </>
      )}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  );
};

export default Index;