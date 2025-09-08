import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Search, ArrowUpDown, Eye, Calendar, Activity, MapPin, User, Crown, Zap, Group, BarChart3, Layers } from "lucide-react";
import { MembershipData } from "@/types/membership";
import { MemberDetailModal } from "./MemberDetailModal";

interface GroupableDataTableProps {
  data: MembershipData[];
  title: string;
  className?: string;
  onAnnotationUpdate?: (memberId: string, comments: string, notes: string, tags: string[]) => void;
}

type SortField = keyof MembershipData;
type SortDirection = 'asc' | 'desc';
type GroupByField = 'status' | 'location' | 'membershipName' | 'frozen' | 'none';

export const GroupableDataTable = ({
  data,
  title,
  className = '',
  onAnnotationUpdate
}: GroupableDataTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupByField>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const itemsPerPage = 12;

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
      return { 'All Members': filteredAndSortedData };
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

    return groups;
  }, [filteredAndSortedData, groupBy]);

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

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMembershipIcon = (membershipName: string) => {
    if (membershipName?.toLowerCase().includes('premium') || membershipName?.toLowerCase().includes('unlimited')) {
      return <Crown className="h-4 w-4 text-yellow-600" />;
    }
    if (membershipName?.toLowerCase().includes('basic')) {
      return <User className="h-4 w-4 text-slate-600" />;
    }
    return <Zap className="h-4 w-4 text-blue-600" />;
  };

  const getGroupColor = (groupName: string) => {
    switch (groupBy) {
      case 'status':
        if (groupName === 'Active') return 'from-emerald-500 to-emerald-600';
        if (groupName === 'Churned') return 'from-red-500 to-red-600';
        if (groupName === 'Frozen') return 'from-blue-500 to-blue-600';
        return 'from-slate-500 to-slate-600';
      case 'location':
        return 'from-purple-500 to-purple-600';
      case 'membershipName':
        return 'from-orange-500 to-orange-600';
      case 'frozen':
        return groupName === 'Frozen' ? 'from-blue-500 to-blue-600' : 'from-emerald-500 to-emerald-600';
      default:
        return 'from-slate-500 to-slate-600';
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
                  <Group className="h-5 w-5 text-slate-600" />
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
              {Object.entries(groupedData).map(([groupName, members]) => {
                const groupTotal = getGroupTotal(members);
                const colorClass = getGroupColor(groupName);
                
                return (
                  <div key={groupName} className="space-y-4">
                    {/* Group Header - Now Collapsible */}
                    {groupBy !== 'none' && (
                      <div className={`p-6 rounded-2xl bg-gradient-to-r ${colorClass} text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300`} onClick={() => toggleGroupCollapse(groupName)}>
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
                    <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xl animate-in slide-in-from-top-2 duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b-2 border-slate-200">
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-bold text-slate-800 hover:text-blue-600"
                                onClick={() => handleSort('memberId')}
                              >
                                <User className="h-4 w-4 mr-2" />
                                Member ID {getSortIcon('memberId')}
                              </Button>
                            </TableHead>
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6 min-w-[200px]">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-bold text-slate-800 hover:text-blue-600"
                                onClick={() => handleSort('firstName')}
                              >
                                Member Name {getSortIcon('firstName')}
                              </Button>
                            </TableHead>
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6 min-w-[250px]">Email</TableHead>
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6 min-w-[280px]">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-bold text-slate-800 hover:text-blue-600"
                                onClick={() => handleSort('membershipName')}
                              >
                                Membership Type {getSortIcon('membershipName')}
                              </Button>
                            </TableHead>
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6 min-w-[150px]">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-bold text-slate-800 hover:text-blue-600"
                                onClick={() => handleSort('endDate')}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                End Date {getSortIcon('endDate')}
                              </Button>
                            </TableHead>
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6 min-w-[180px]">
                              <MapPin className="h-4 w-4 mr-2 inline" />
                              Location
                            </TableHead>
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6 text-center min-w-[120px]">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-bold text-slate-800 hover:text-blue-600"
                                onClick={() => handleSort('status')}
                              >
                                Status {getSortIcon('status')}
                              </Button>
                            </TableHead>
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6 min-w-[150px]">Current Usage</TableHead>
                            <TableHead className="text-slate-800 font-bold text-sm h-16 px-6 min-w-[150px]">Comments & Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                          {members.slice(0, itemsPerPage).map((member) => {
                            const daysUntilExpiry = getDaysUntilExpiry(member.endDate);
                            const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                            const isChurned = member.status === 'Churned';
                            
                            return (
                              <TableRow 
                                key={member.uniqueId}
                                className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-white hover:to-purple-50/50 transition-all duration-300 cursor-pointer group h-20"
                                onClick={() => handleRowClick(member)}
                              >
                                <TableCell className="px-6 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">
                                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                    </div>
                                    <span className="font-mono text-slate-700 font-semibold">{member.memberId}</span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-6 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-900 text-base">
                                        {member.firstName} {member.lastName}
                                      </span>
                                      <span className="text-slate-500 text-sm">
                                        ID: {member.memberId}
                                      </span>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <Eye className="h-4 w-4 text-blue-600" />
                                    </div>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-6 py-6">
                                  <span className="text-slate-700 font-medium">{member.email}</span>
                                </TableCell>
                                
                                <TableCell className="px-6 py-6">
                                  <div className="flex items-center gap-2">
                                    {getMembershipIcon(member.membershipName)}
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span className="text-slate-700 font-medium truncate max-w-[240px] block">
                                          {member.membershipName}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>{member.membershipName}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-6 py-6">
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="text-slate-700 font-medium">
                                      {new Date(member.endDate).toLocaleDateString()}
                                    </span>
                                    {isExpiringSoon && !isChurned && (
                                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 px-2 py-1">
                                        {daysUntilExpiry}d left
                                      </Badge>
                                    )}
                                    {isChurned && (
                                      <Badge variant="destructive" className="text-xs px-2 py-1">
                                        Churned
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-6 py-6">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                    <span className="text-slate-700 font-medium">{member.location}</span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="px-6 py-6 text-center">
                                  <Badge 
                                    variant={member.status === 'Active' ? "default" : member.status === 'Frozen' ? "secondary" : "destructive"}
                                    className={`font-bold px-4 py-2 ${
                                      member.status === 'Active' 
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' 
                                        : member.status === 'Frozen'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : 'bg-red-100 text-red-800 border-red-300'
                                    }`}
                                  >
                                    {member.status}
                                  </Badge>
                                </TableCell>
                                
                                <TableCell className="px-6 py-6">
                                  <span className="text-slate-700 font-medium">
                                    {member.currentUsage || '-'}
                                  </span>
                                </TableCell>
                                
                                <TableCell className="px-6 py-6">
                                  <div className="flex flex-col gap-2">
                                    {member.tags && member.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {member.tags.slice(0, 2).map((tag, index) => (
                                          <Badge 
                                            key={index} 
                                            variant="outline" 
                                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2 py-1"
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                        {member.tags.length > 2 && (
                                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200 px-2 py-1">
                                            +{member.tags.length - 2}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    {(member.comments || member.notes) && (
                                      <div className="text-xs text-slate-600 truncate max-w-[120px]">
                                        {member.comments || member.notes}
                                      </div>
                                    )}
                                    {!member.tags?.length && !member.comments && !member.notes && (
                                      <span className="text-xs text-slate-400 italic">No annotations</span>
                                    )}
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