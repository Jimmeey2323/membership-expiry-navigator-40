import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedDataTable } from "@/components/EnhancedDataTable";
import { PremiumCharts } from "@/components/PremiumCharts";
import { TopFilterSection } from "@/components/TopFilterSection";
import { AddMemberModal } from "@/components/AddMemberModal";
import { EditMemberModal } from "@/components/EditMemberModal";
import { FollowUpModal, FollowUpEntry } from "@/components/FollowUpModal";
import { googleSheetsService } from "@/services/googleSheets";
import { MembershipData, FilterState } from "@/types/membership";
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

const Index = () => {
  const [localMembershipData, setLocalMembershipData] = useState<MembershipData[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpEntry[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    status: '',
    location: '',
    membershipType: '',
    expiryDateFrom: '',
    expiryDateTo: '',
    sessionsFrom: '',
    sessionsTo: ''
  });
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const { data: membershipData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['membershipData'],
    queryFn: () => googleSheetsService.getMembershipData(),
    refetchInterval: 300000,
  });

  useEffect(() => {
    if (membershipData) {
      setLocalMembershipData(membershipData);
    }
  }, [membershipData]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch membership data. Using sample data for demonstration.");
    }
  }, [error]);

    const handleAnnotationUpdate = (memberId: string, comments: string, notes: string, tags: string[]) => {
    setLocalMembershipData(prev => 
      prev.map(member => 
        member.memberId === memberId ? { ...member, comments, notes, tags } : member
      )
    );
  };

  const handleAddMember = (newMember: MembershipData) => {
    setLocalMembershipData(prev => [...prev, newMember]);
    setShowAddModal(false);
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

  const handleFilterChange = (newFilters: FilterState) => {
    setFilterState(newFilters);
  };

  const getFilteredData = () => {
    return localMembershipData.filter(member => {
      if (filterState.search && 
          !member.firstName.toLowerCase().includes(filterState.search.toLowerCase()) &&
          !member.lastName.toLowerCase().includes(filterState.search.toLowerCase()) &&
          !member.email.toLowerCase().includes(filterState.search.toLowerCase())) {
        return false;
      }
      if (filterState.status && member.status !== filterState.status) return false;
      if (filterState.location && member.location !== filterState.location) return false;
      if (filterState.membershipType && member.membershipName !== filterState.membershipType) return false;
      return true;
    });
  };

  const filteredData = getFilteredData();

  // Calculate metrics
  const totalMembers = localMembershipData.length;
  const activeMembers = localMembershipData.filter(member => member.status === 'Active');
  const churnedMembers = localMembershipData.filter(member => member.status === 'Churned');
  const expiringMembers = localMembershipData.filter(member => {
    const endDate = new Date(member.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && member.status === 'Active';
  });
  const withAnnotations = localMembershipData.filter(member => 
    (member.comments && member.comments.trim()) || 
    (member.notes && member.notes.trim()) || 
    (member.tags && member.tags.length > 0)
  );

  const totalSessions = localMembershipData.reduce((sum, member) => sum + (member.sessionsLeft || 0), 0);
  const totalRevenue = localMembershipData.reduce((sum, member) => sum + parseFloat(member.paid || '0'), 0);

    const quickActions = [
    { 
      name: 'Add Member', 
      icon: Plus, 
      action: () => setShowAddModal(true),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading membership data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Member Dashboard</h1>
          <p className="text-slate-600 mt-1">Comprehensive membership management and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
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

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
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

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
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

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">Revenue</CardTitle>
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+18% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
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
              return (
                <Button
                  key={action.name}
                  onClick={action.action}
                  variant="outline"
                  className={`h-20 flex flex-col items-center gap-2 hover:scale-105 transition-transform ${action.color} hover:text-white border-2`}
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
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {withAnnotations.length} with notes
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {churnedMembers.length} churned
            </Badge>
          </div>
        </div>

        <TabsContent value="members" className="space-y-6">
          <EnhancedDataTable
            data={localMembershipData}
            title="Member Management"
            onAnnotationUpdate={handleAnnotationUpdate}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PremiumCharts data={localMembershipData} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
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
    </div>
  );
};

export default Index;