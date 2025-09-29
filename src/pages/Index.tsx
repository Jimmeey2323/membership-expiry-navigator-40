import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedDataTable } from "@/components/EnhancedDataTable";
import { PremiumCharts } from "@/components/PremiumCharts";
import { GlobalFilterPanel } from "@/components/GlobalFilterPanel";
import { AddMemberModal } from "@/components/AddMemberModal";
import { EditMemberModal } from "@/components/EditMemberModal";
import { FollowUpModal, FollowUpEntry } from "@/components/FollowUpModal";
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
    setLocalMembershipData(prev => 
      prev.map(member => 
        member.memberId === memberId ? { ...member, comments, notes, tags } : member
      )
    );
  };

  const handleAddMember = (newMember: MembershipData) => {
    setLocalMembershipData(prev => [...prev, newMember]);
    toast.success('Member added successfully!');
  };

  const handleUpdateMember = (updatedMember: MembershipData) => {
    setLocalMembershipData(prev =>
      prev.map(member =>
        member.memberId === updatedMember.memberId ? updatedMember : member
      )
    );
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 space-y-6">
      {/* Global Filter Panel - Now at the top */}
      <GlobalFilterPanel data={localMembershipData} />

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Membership Dashboard</h1>
          <p className="text-slate-600 mt-1">Monitor and manage your membership data with advanced analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => refetch()}
            disabled={isLoading}
            variant="outline"
            className="backdrop-blur-sm bg-white/70 border-white/30 hover:bg-white/90"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">Total Members</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalMembers.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">Active Members</CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{activeMembers.length.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-700">Expiring Soon</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{expiringMembers.length.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <Calendar className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-sm text-orange-600">Next 30 days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700">Churned</CardTitle>
              <UserX className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{churnedMembers.length.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm text-red-600">-3% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used actions for member management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        className="h-20 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-white/60 border-white/40 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent"
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{action.name}</span>
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
                  className="h-20 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-200 backdrop-blur-sm bg-white/60 border-white/40 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{action.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 backdrop-blur-xl bg-white/80 border-white/20">
            <TabsTrigger value="members" className="flex items-center gap-2 data-[state=active]:bg-white/90">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white/90">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-white/90">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1 backdrop-blur-sm bg-white/70">
              <MessageSquare className="h-3 w-3" />
              {withAnnotations.length} with notes
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 backdrop-blur-sm bg-white/70">
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
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle>Reports & Insights</CardTitle>
              <CardDescription>
                Comprehensive reporting features coming soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Advanced Reports</h3>
                <p className="text-slate-500">Detailed member insights and analytics reports will be available here.</p>
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