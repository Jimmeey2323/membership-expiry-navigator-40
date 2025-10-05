import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedDataTable } from "@/components/EnhancedDataTable";
import { GroupableDataTable } from "@/components/GroupableDataTable";
import { LapsingMembers } from "@/components/LapsingMembers";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { PremiumCharts } from "@/components/PremiumCharts";
import { AIAnalytics } from "@/components/AIAnalytics";
import { AddMemberModal } from "@/components/AddMemberModal";
import { EditMemberModal } from "@/components/EditMemberModal";
import { FollowUpModal, FollowUpEntry } from "@/components/FollowUpModal";
import { AIAnalysisModal } from "@/components/AIAnalysisModal";
import { AppLayout } from "@/components/layout/AppLayout";
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
  Edit,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface DashboardContentProps {
  membershipData: MembershipData[];
  localMembershipData: MembershipData[];
  setLocalMembershipData: React.Dispatch<React.SetStateAction<MembershipData[]>>;
  refetch: () => Promise<any>;
  isLoading: boolean;
}

const DashboardContent = ({ 
  membershipData, 
  localMembershipData, 
  setLocalMembershipData, 
  refetch, 
  isLoading 
}: DashboardContentProps) => {
  const { getFilteredData } = useFilters();
  const [followUps, setFollowUps] = useState<FollowUpEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  useEffect(() => {
    if (membershipData && Array.isArray(membershipData)) {
      console.log("Processing membership data:", membershipData.length, "records");
      
      // Check for corrupted records
      const corruptedRecords = (membershipData as MembershipData[]).filter((m: MembershipData) => 
        !m?.membershipName || m.membershipName.trim() === '' || 
        !m?.location || m.location.trim() === ''
      );
      
      if (corruptedRecords.length > 0) {
        console.warn("Corrupted records found:", corruptedRecords.length);
        toast.error(`Warning: ${corruptedRecords.length} records have missing membership or location data`);
      }
      
      setLocalMembershipData(membershipData as MembershipData[]);
    } else {
      console.log("No valid membership data available");
      setLocalMembershipData([]);
    }
  }, [membershipData]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl max-w-md">
          <CardHeader>
            <CardTitle className="text-blue-600">🔄 Lapsed & Renewals Tracker</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-500 mb-4" />
            <p className="text-slate-600">Loading membership data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

    const handleAnnotationUpdate = (memberId: string, comments: string, notes: string, tags: string[], associate?: string, associateInCharge?: string, stage?: string) => {
      // Save annotations to both Member_Annotations and Expirations sheets
      const member = localMembershipData.find(member => member.memberId === memberId);
      if (member) {
        // Use provided associate or fallback to soldBy or default
        const associateName = associate || member.soldBy || 'System';
        
        // Update local state immediately for instant UI feedback
        const updatedMember = {
          ...member,
          commentsText: comments, // Use commentsText for legacy compatibility
          notesText: notes,
          tagsText: tags,
          associateInCharge: associateInCharge || member.associateInCharge,
          stage: stage || member.stage
        };
        
        setLocalMembershipData(prev => {
          const updated = prev.map(m => {
            if (m.memberId === memberId) {
              // Create a completely new object to ensure React detects the change
              return {
                ...m,
                commentsText: comments,
                notesText: notes,
                tagsText: [...tags], // Ensure arrays are also new references
                // Add a timestamp to force React to detect changes
                lastUpdated: Date.now()
              };
            }
            return m;
          });
          return updated;
        });
        
        // Force a re-render by updating the refresh key
        setRefreshKey(prev => prev + 1);
        
        // Save to Member_Annotations sheet with clean format
        const saveAnnotationPromise = googleSheetsService.saveAnnotation(
          member.memberId,
          member.email,
          comments,
          notes,
          tags,
          member.uniqueId,
          associateName,
          new Date().toISOString()
        );

        // Save to Expirations sheet (updateSingleMember)
        const updateSingleMemberPromise = googleSheetsService.updateSingleMember(updatedMember);

        Promise.all([saveAnnotationPromise, updateSingleMemberPromise])
          .then(() => {
            // Clear cache and refetch data to show updated annotations
            googleSheetsService.clearAnnotationsCache();
            toast.success('Notes and comments saved successfully!');
            // Optionally refetch to ensure sync with server
            setTimeout(() => {
              refetch();
            }, 1000);
          })
          .catch(error => {
            console.error('Failed to save annotations to Google Sheets:', error);
            toast.error('Failed to save annotations to Google Sheets.');
            // Revert local state on error
            setLocalMembershipData(prev => 
              prev.map(m => m.memberId === memberId ? member : m)
            );
          });
      }
    };

  const handleAddMember = (newMember: MembershipData) => {
    setLocalMembershipData(prev => [...prev, newMember]);
    toast.success('Member added successfully!');
  };

  const handleUpdateMember = (updatedMember: MembershipData) => {
    // Update local data immediately
    setLocalMembershipData(prev =>
      prev.map(member =>
        member.memberId === updatedMember.memberId ? updatedMember : member
      )
    );
    
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
  const totalMembers = filteredData.length; // Show filtered count, not full dataset
  
  // Calculate category breakdowns from already filtered data
  const activeMembers = filteredData.filter(member => member.status === 'Active');
  const churnedMembers = filteredData.filter(member => member.status === 'Churned');
  const expiringMembers = filteredData.filter(member => {
    if (!member.endDate) return false;
    const endDate = new Date(member.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && member.status === 'Active';
  });
  const withAnnotations = filteredData.filter(member => 
    (member.commentsText && member.commentsText.trim()) || 
    (member.notesText && member.notesText.trim()) || 
    (member.tagsText && member.tagsText.length > 0) ||
    (member.comments && member.comments.length > 0) || 
    (member.notes && member.notes.length > 0) || 
    (member.tags && member.tags.length > 0)
  );

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

        {/* Refined Dashboard Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/5 via-purple-900/5 to-indigo-900/5 rounded-xl blur-lg opacity-60 animate-pulse"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/30">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur-sm opacity-25 animate-pulse"></div>
                <div className="relative p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg">
                  <div className="relative">
                    <Users className="h-6 w-6 animate-pulse" />
                    <div className="absolute inset-0 bg-white/20 rounded blur-sm animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent tracking-tight">
                  Lapsed & Renewals Tracker
                </h1>
                <p className="text-slate-600 font-medium text-sm mt-0.5">Advanced member lifecycle management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AIAnalysisModal
                data={filteredData}
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
                    toast.info('Refreshing data...');
                    await refetch();
                    toast.success('Data refreshed successfully!');
                  } catch (error) {
                    console.error('Failed to refresh data:', error);
                    toast.error('Failed to refresh data. Please try again.');
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

        {/* Metrics Dashboard */}
        <MetricsDashboard data={filteredData} />

        {/* Ultra-Modern Content Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-purple-900/10 rounded-xl blur-lg opacity-50"></div>
              <TabsList className="relative grid w-full sm:w-auto grid-cols-4 backdrop-blur-xl bg-white/90 border-white/20 shadow-lg">
                <TabsTrigger 
                  value="members" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Users className="h-4 w-4" />
                  Data Table
                </TabsTrigger>
                <TabsTrigger 
                  value="priority" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white transition-all duration-300"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Priority View
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
          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredData.length} members
          </div>
          <EnhancedDataTable
            key={refreshKey}
            data={filteredData}
            title="Member Data Table with Multi-View Options"
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

        <TabsContent value="priority" className="space-y-6">
          <LapsingMembers
            data={filteredData}
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
          <AIAnalytics data={filteredData} />
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
      <DashboardContentWithLayout />
    </FilterProvider>
  );
};

const DashboardContentWithLayout = () => {
  const [localMembershipData, setLocalMembershipData] = useState<MembershipData[]>([]);

  const { data: membershipData, refetch, isLoading, error } = useQuery({
    queryKey: ["membershipData"],
    queryFn: async () => {
      try {
        console.log("Fetching membership data...");
        // Fetch fresh data and remap annotations
        const data = await googleSheetsService.getMembershipData();
        console.log("Membership data fetched successfully:", data?.length || 0, "records");
        
        // Trigger annotation refresh in the background
        setTimeout(() => {
          googleSheetsService.fetchAnnotations().catch((err) => {
            console.warn("Annotations fetch failed:", err);
          });
        }, 100);
        return data;
      } catch (error) {
        console.error("Error fetching membership data:", error);
        // Return empty array instead of throwing to prevent crash
        return [];
      }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to force fresh fetching
    retry: false, // Don't retry on failure to prevent endless loading
  });

  useEffect(() => {
    if (membershipData && Array.isArray(membershipData)) {
      console.log("Processing membership data:", membershipData.length, "records");
      
      // Check for corrupted records
      const corruptedRecords = (membershipData as MembershipData[]).filter((m: MembershipData) => 
        !m?.membershipName || m.membershipName.trim() === '' || 
        !m?.location || m.location.trim() === ''
      );
      
      if (corruptedRecords.length > 0) {
        console.warn("Corrupted records found:", corruptedRecords.length);
        toast.error(`Warning: ${corruptedRecords.length} records have missing membership or location data`);
      }
      
      setLocalMembershipData(membershipData as MembershipData[]);
    } else {
      console.log("No valid membership data available");
      setLocalMembershipData([]);
    }
  }, [membershipData]);

  if (error) {
    console.error("Query error:", error);
    return (
      <AppLayout 
        filterData={localMembershipData || []} 
        showFilterSidebar={true}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Connection Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Unable to connect to Google Sheets. Please check your internet connection and try again.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout filterData={localMembershipData || []} showFilterSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl max-w-md">
            <CardHeader>
              <CardTitle>Loading Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span>Fetching membership data from Google Sheets...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout filterData={localMembershipData || []} showFilterSidebar={true}>
      <DashboardContent 
        membershipData={membershipData}
        localMembershipData={localMembershipData}
        setLocalMembershipData={setLocalMembershipData}
        refetch={refetch}
        isLoading={isLoading}
      />
    </AppLayout>
  );
};

export default Index;