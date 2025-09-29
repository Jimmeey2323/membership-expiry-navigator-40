import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  ChevronLeft, 
  Search, 
  ArrowUpDown, 
  Eye, 
  Calendar, 
  Activity, 
  MapPin, 
  User, 
  Crown, 
  Zap, 
  Edit, 
  MessageSquare,
  Layers,
  Users,
  BarChart3,
  Tag,
  FileText
} from "lucide-react";
import { processTextForDisplay } from "@/lib/textUtils";
import { MembershipData } from "@/types/membership";
import { MemberDetailModal } from "./MemberDetailModal";

interface GroupableDataTableProps {
  data: MembershipData[];
  title: string;
  className?: string;
  onAnnotationUpdate?: (memberId: string, comments: string, notes: string, tags: string[]) => void;
  onEditMember?: (member: MembershipData) => void;
  onFollowUpMember?: (member: MembershipData) => void;
}

type SortField = keyof MembershipData;
type SortDirection = 'asc' | 'desc';
type GroupByField = 'status' | 'location' | 'membershipName' | 'frozen' | 'none';

export const GroupableDataTable = ({
  data,
  title,
  className = '',
  onAnnotationUpdate,
  onEditMember,
  onFollowUpMember
}: GroupableDataTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByField>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Reset to first page when search term or groupBy changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, groupBy]);

  // Helper functions for AI analysis styling
  const getSentimentColorClasses = (sentiment: string): string => {
    const colorMap: Record<string, string> = {
      'positive': 'bg-green-50 text-green-600 border-green-200',
      'neutral': 'bg-gray-50 text-gray-600 border-gray-200',
      'negative': 'bg-red-50 text-red-600 border-red-200',
      'mixed': 'bg-yellow-50 text-yellow-600 border-yellow-200'
    };
    return colorMap[sentiment] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getSentimentEmoji = (sentiment: string): string => {
    const emojiMap: Record<string, string> = {
      'positive': '😊',
      'neutral': '😐',
      'negative': '😞',
      'mixed': '🤔'
    };
    return emojiMap[sentiment] || '😐';
  };

  const getChurnRiskColorClasses = (churnRisk: string): string => {
    const colorMap: Record<string, string> = {
      'low': 'bg-green-50 text-green-600 border-green-200',
      'medium': 'bg-orange-50 text-orange-600 border-orange-200',
      'high': 'bg-red-50 text-red-600 border-red-200'
    };
    return colorMap[churnRisk] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getChurnRiskEmoji = (churnRisk: string): string => {
    const emojiMap: Record<string, string> = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🔴'
    };
    return emojiMap[churnRisk] || '⚪';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  const getDaysUntilExpiry = (endDate: string): number => {
    if (!endDate) return 999;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMembershipIcon = (membershipName: string) => {
    if (membershipName?.toLowerCase().includes('premium') || membershipName?.toLowerCase().includes('unlimited')) {
      return <Crown className="h-3 w-3 text-yellow-600" />;
    }
    if (membershipName?.toLowerCase().includes('basic')) {
      return <User className="h-3 w-3 text-slate-600" />;
    }
    return <Zap className="h-3 w-3 text-blue-600" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Active': { color: 'bg-green-500 text-white', icon: <Zap className="h-3 w-3" /> },
      'Churned': { color: 'bg-red-500 text-white', icon: <User className="h-3 w-3" /> },
      'Frozen': { color: 'bg-blue-500 text-white', icon: <Activity className="h-3 w-3" /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { color: 'bg-gray-500 text-white', icon: <User className="h-3 w-3" /> };
    
    return (
      <Badge className={`${config.color} text-xs font-bold border-0 px-2 py-1 h-5 flex items-center gap-1`}>
        {config.icon}
        <span className="text-xs">{status}</span>
      </Badge>
    );
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => 
      Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      // Apply pagination to ungrouped data
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);
      return { 'All Members': paginatedData };
    }

    const groups: Record<string, MembershipData[]> = {};
    
    filteredAndSortedData.forEach(member => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'status':
          groupKey = member.status || 'Unknown';
          break;
        case 'location':
          groupKey = member.location || 'Unknown Location';
          break;
        case 'membershipName':
          groupKey = member.membershipName || 'Unknown Membership';
          break;
        case 'frozen':
          groupKey = member.frozen?.toLowerCase() === 'true' ? 'Frozen' : 'Active';
          break;
        default:
          groupKey = 'All Members';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(member);
    });

    // Apply pagination to grouped data
    if (groupBy !== 'none') {
      const groupEntries = Object.entries(groups);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      // For groups, we paginate the groups themselves, not individual members
      const paginatedGroups = groupEntries.slice(startIndex, endIndex);
      return Object.fromEntries(paginatedGroups);
    }

    return groups;
  }, [filteredAndSortedData, groupBy, currentPage, itemsPerPage]);

  // Pagination calculations
  const totalEntries = groupBy === 'none' 
    ? filteredAndSortedData.length 
    : Object.keys(groupedData).length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalEntries);

  const getGroupTotal = (members: MembershipData[]) => {
    return {
      totalMembers: members.length,
      totalSessions: members.reduce((sum, member) => sum + (member.sessionsLeft || 0), 0),
      activeCount: members.filter(m => m.status === 'Active').length,
      churnedCount: members.filter(m => m.status === 'Churned').length,
      frozenCount: members.filter(m => m.status === 'Frozen').length
    };
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" /> 
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const handleRowClick = (member: MembershipData) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

    const handleAnnotationSave = (memberId: string, comments: string, notes: string, tags: string[]) => {
    if (onAnnotationUpdate) {
      onAnnotationUpdate(memberId, comments, notes, tags);
    }
    setIsDetailModalOpen(false);
    setSelectedMember(null);
  };

  const getGroupColor = (groupName: string, index: number = 0) => {
    const colorVariants = [
      'from-emerald-500 to-emerald-600',
      'from-blue-500 to-blue-600', 
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-cyan-500 to-cyan-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600',
      'from-amber-500 to-amber-600',
      'from-lime-500 to-lime-600',
      'from-violet-500 to-violet-600'
    ];

    switch (groupBy) {
      case 'status':
        if (groupName === 'Active') return 'from-emerald-500 to-emerald-600';
        if (groupName === 'Churned') return 'from-red-500 to-red-600';
        if (groupName === 'Frozen') return 'from-blue-500 to-blue-600';
        return 'from-slate-500 to-slate-600';
      case 'location':
        return colorVariants[index % colorVariants.length];
      case 'membershipName':
        return colorVariants[index % colorVariants.length];
      case 'frozen':
        return groupName === 'Frozen' ? 'from-blue-500 to-blue-600' : 'from-emerald-500 to-emerald-600';
      default:
        return colorVariants[index % colorVariants.length];
    }
  };

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(groupName)) {
        newCollapsed.delete(groupName);
      } else {
        newCollapsed.add(groupName);
      }
      return newCollapsed;
    });
  };

  const isGroupCollapsed = (groupName: string) => {
    return collapsedGroups.has(groupName);
  };

  return (
    <>
      <TooltipProvider>
        <Card className={`premium-card shadow-2xl border-2 border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-sm ${className}`}>
          <div className="p-8">
            {/* Enhanced Header with Grouping Controls */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
                  <div className="relative p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {title}
                  </h3>
                  <p className="text-slate-600 font-medium mt-1">
                    Advanced groupable member management
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Group By Selector */}
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-600" />
                  <Select value={groupBy} onValueChange={(value: GroupByField) => setGroupBy(value)}>
                    <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-slate-300 focus:border-blue-500">
                      <SelectValue placeholder="Group by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Grouping</SelectItem>
                      <SelectItem value="status">By Status</SelectItem>
                      <SelectItem value="location">By Location</SelectItem>
                      <SelectItem value="membershipName">By Membership Type</SelectItem>
                      <SelectItem value="frozen">By Account Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-sm"></div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl w-80 transition-all duration-300 shadow-lg"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-6 py-3 text-base font-bold border border-blue-200 shadow-md"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    {Object.keys(groupedData).length} {groupBy === 'none' ? 'items' : 'groups'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Grouped Tables */}
            <div className="space-y-8">
              {Object.entries(groupedData).map(([groupName, members], groupIndex) => {
                const groupTotal = getGroupTotal(members);
                const colorClass = getGroupColor(groupName, groupIndex);
                
                return (
                  <div key={groupName} className="space-y-4">
                    {/* Group Header - Now Collapsible */}
                    {groupBy !== 'none' && (
                      <div className={`p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl cursor-pointer hover:shadow-2xl hover:from-slate-800 hover:to-slate-800 transition-all duration-300`} onClick={() => toggleGroupCollapse(groupName)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl transition-transform duration-300 hover:scale-110">
                              {isGroupCollapsed(groupName) ? <ChevronDown className="h-6 w-6" /> : <ChevronUp className="h-6 w-6" />}
                            </div>
                            <div className="p-2 bg-white/20 rounded-xl">
                              <Layers className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="text-2xl font-bold flex items-center gap-2">
                                {groupName}
                                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                  {isGroupCollapsed(groupName) ? 'Click to expand' : 'Click to collapse'}
                                </Badge>
                              </h4>
                              <p className="text-white/80 font-medium">
                                {members.length} members in this group
                              </p>
                            </div>
                          </div>
                          
                          {/* Group Summary Cards */}
                          <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold">{groupTotal.totalMembers}</p>
                              <p className="text-sm text-white/80">Total</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold">{groupTotal.activeCount}</p>
                              <p className="text-sm text-white/80">Active</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold">{groupTotal.churnedCount}</p>
                              <p className="text-sm text-white/80">Churned</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold">{groupTotal.frozenCount}</p>
                              <p className="text-sm text-white/80">Frozen</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data Table - Now Collapsible */}
                    {!isGroupCollapsed(groupName) && (
                    <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xl animate-in slide-in-from-top-2 duration-300 border-l-4 border-r-4 border-l-black border-r-black">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-4 border-blue-500 h-14 hover:from-slate-800 hover:to-slate-800 transition-all duration-300">
                            <TableHead className="text-white font-bold text-xs px-4 whitespace-nowrap">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs"
                                onClick={() => handleSort('memberId')}
                              >
                                <User className="h-3 w-3 mr-1" />
                                ID {getSortIcon('memberId')}
                              </Button>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-4 whitespace-nowrap min-w-[180px]">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs"
                                onClick={() => handleSort('firstName')}
                              >
                                Member {getSortIcon('firstName')}
                              </Button>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-4 whitespace-nowrap min-w-[120px]">
                              <Crown className="h-3 w-3 mr-1 inline" />
                              Membership
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-4 whitespace-nowrap min-w-[80px]">
                              <Zap className="h-3 w-3 mr-1 inline" />
                              Status
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-4 whitespace-nowrap min-w-[100px]">
                              <Calendar className="h-3 w-3 mr-1 inline" />
                              End Date
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-4 whitespace-nowrap min-w-[100px]">
                              <MapPin className="h-3 w-3 mr-1 inline" />
                              Location
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-6 whitespace-nowrap min-w-[200px] max-w-[250px]">
                              <MessageSquare className="h-3 w-3 mr-1 inline" />
                              Comments
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-6 whitespace-nowrap min-w-[200px] max-w-[250px]">
                              <FileText className="h-3 w-3 mr-1 inline" />
                              Notes
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-4 whitespace-nowrap min-w-[100px]">
                              <Tag className="h-3 w-3 mr-1 inline" />
                              Tags
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-4 whitespace-nowrap w-16">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        
                        <TableBody className="bg-white divide-y divide-slate-100">
                          {members.map((member, index) => {
                            const daysUntilExpiry = getDaysUntilExpiry(member.endDate);
                            const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                            const isExpired = daysUntilExpiry < 0;
                            
                            return (
                              <TableRow 
                                key={member.uniqueId}
                                className="hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-indigo-50/70 transition-all duration-300 cursor-pointer h-[45px] max-h-[45px] border-b border-slate-100/80 group backdrop-blur-sm"
                                onClick={() => handleRowClick(member)}
                              >
                                <TableCell className="px-4 py-1 h-[45px] max-h-[45px] overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                                      {member.firstName?.[0]}{member.lastName?.[0]}
                                    </div>
                                    <span className="font-mono text-slate-700 text-xs font-medium truncate">{member.memberId}</span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-4 py-1 h-[45px] max-h-[45px] overflow-hidden">
                                  <div className="flex flex-col justify-center h-full">
                                    <span className="font-semibold text-slate-900 text-sm truncate">
                                      {member.firstName} {member.lastName}
                                    </span>
                                    <span className="text-slate-500 text-xs truncate">
                                      {member.email}
                                    </span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-4 py-1 h-[45px] max-h-[45px] overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    {getMembershipIcon(member.membershipName)}
                                    <span className="text-xs text-slate-700 font-medium truncate">
                                      {member.membershipName?.replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-4 py-1 h-[45px] max-h-[45px] overflow-hidden">
                                  {getStatusBadge(member.status)}
                                </TableCell>
                                
                                <TableCell className="px-4 py-1 h-[45px] max-h-[45px] overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    <div className="flex flex-col">
                                      <span className="text-xs text-slate-700 font-medium">
                                        {formatDate(member.endDate)}
                                      </span>
                                      {(isExpiringSoon || isExpired) && (
                                        <div className="w-full h-1 bg-slate-200 rounded-full mt-0.5">
                                          <div 
                                            className={`h-full rounded-full ${
                                              isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.max(0, Math.min(100, (30 - Math.abs(daysUntilExpiry)) / 30 * 100))}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-4 py-1 h-[45px] max-h-[45px] overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-400" />
                                    <span className="text-xs text-slate-700 font-medium truncate">{member.location}</span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-6 py-1 h-[45px] max-h-[45px] overflow-hidden min-w-[200px] max-w-[250px]">
                                  {member.comments ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-2 cursor-pointer">
                                            <MessageSquare className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                            <span className="text-sm text-slate-700 truncate font-medium">
                                              {member.comments.replace(/<[^>]*>/g, '').slice(0, 35)}...
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-sm">
                                          <div className="text-sm">{member.comments}</div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className="text-sm text-slate-400">-</span>
                                  )}
                                </TableCell>
                                
                                <TableCell className="px-6 py-1 h-[45px] max-h-[45px] overflow-hidden min-w-[200px] max-w-[250px]">
                                  {member.notes ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-2 cursor-pointer">
                                            <FileText className="h-3 w-3 text-green-500 flex-shrink-0" />
                                            <span className="text-sm text-slate-700 truncate font-medium">
                                              {member.notes.replace(/<[^>]*>/g, '').slice(0, 35)}...
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-sm">
                                          <div className="text-sm">{member.notes}</div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className="text-sm text-slate-400">-</span>
                                  )}
                                </TableCell>
                                
                                <TableCell className="px-4 py-1 h-[45px] max-h-[45px] overflow-hidden">
                                  <div className="flex flex-wrap gap-1">
                                    {member.tags?.slice(0, 2).map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs px-1 py-0 bg-slate-100 text-slate-700 h-4">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {member.aiTags?.slice(0, 1).map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs px-1 py-0 bg-purple-50 text-purple-700 border-purple-200 h-4">
                                        🤖
                                      </Badge>
                                    ))}
                                    {member.aiSentiment && member.aiSentiment !== 'neutral' && (
                                      <Badge className={`text-xs px-1 py-0 h-4 ${getSentimentColorClasses(member.aiSentiment)}`}>
                                        {getSentimentEmoji(member.aiSentiment)}
                                      </Badge>
                                    )}
                                    {member.aiChurnRisk && member.aiChurnRisk !== 'medium' && (
                                      <Badge className={`text-xs px-1 py-0 h-4 ${getChurnRiskColorClasses(member.aiChurnRisk)}`}>
                                        {getChurnRiskEmoji(member.aiChurnRisk)}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-4 py-1 h-[45px] max-h-[45px] overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    {onEditMember && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditMember(member);
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRowClick(member);
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-slate-100 hover:text-slate-600"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Modern Pagination */}
            <div className="mt-8 pb-6 px-6">
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 font-medium">
                    Showing {startEntry} to {endEntry} of {totalEntries} {groupBy === 'none' ? 'entries' : 'groups'}
                  </span>
                  <select 
                    className="px-3 py-1 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-10 px-4 bg-white hover:bg-blue-50 border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {totalPages > 0 && [...Array(totalPages)].slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((_, index) => {
                      const pageNum = Math.max(0, currentPage - 3) + index + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-10 w-10 p-0 transition-all duration-200 ${
                            currentPage === pageNum 
                              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                              : 'bg-white hover:bg-blue-50 border-slate-300'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-10 px-4 bg-white hover:bg-blue-50 border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </TooltipProvider>

      <MemberDetailModal
        member={selectedMember}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSave={handleAnnotationSave}
      />
    </>
  );
};