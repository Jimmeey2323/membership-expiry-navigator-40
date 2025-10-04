import { useState, useMemo } from "react";
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
  FileText,
  Clock
} from "lucide-react";
import { processTextForDisplay } from "@/lib/textUtils";
import { MembershipData, StructuredComment, StructuredNote, StructuredTag } from "@/types/membership";
import { MemberDetailModal } from "./MemberDetailModal";

// Utility function to extract text from structured annotations
const extractStructuredText = (legacyText?: string, structuredData?: StructuredComment[] | StructuredNote[] | StructuredTag[]): string => {
  if (legacyText) return legacyText;
  if (!structuredData || !Array.isArray(structuredData)) return '';
  
  return structuredData.map(item => {
    if (typeof item === 'string') return item;
    return item.text || item.tag || '';
  }).join(' | ');
};

// Utility function to render structured annotations as React elements
const renderStructuredAnnotations = (
  legacyText?: string, 
  structuredData?: StructuredComment[] | StructuredNote[] | StructuredTag[],
  maxLength?: number
) => {
  const text = extractStructuredText(legacyText, structuredData);
  if (!text) return '';
  
  const cleanText = text.replace(/<[^>]*>/g, '');
  return maxLength && cleanText.length > maxLength 
    ? cleanText.slice(0, maxLength) + '...' 
    : cleanText;
};

interface GroupableDataTableProps {
  data: MembershipData[];
  title: string;
  className?: string;
  onAnnotationUpdate?: (memberId: string, comments: string, notes: string, tags: string[], associate?: string) => void;
  onEditMember?: (member: MembershipData) => void;
  onFollowUpMember?: (member: MembershipData) => void;
}

type SortField = keyof MembershipData;
type SortDirection = 'asc' | 'desc';
type GroupByField = 'status' | 'location' | 'membershipName' | 'frozen' | 'none';
type ViewMode = 'compact' | 'comfortable' | 'detailed' | 'card' | 'minimal';

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
  const [viewMode, setViewMode] = useState<ViewMode>('comfortable');
  
  // Get current month date range for default filter
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };
  
  const [dateFilter, setDateFilter] = useState(getCurrentMonthRange());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 80,
    member: 200,
    membership: 120,
    status: 100,
    endDate: 140,
    location: 100,
    comments: 400,
    notes: 400,
    tags: 140,
    actions: 100
  });

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

  const getViewModeStyles = (mode: ViewMode) => {
    const styles = {
      compact: { height: 'h-[32px]', fontSize: 'text-xs', padding: 'px-2 py-1' },
      comfortable: { height: 'h-[40px]', fontSize: 'text-sm', padding: 'px-3 py-2' },
      detailed: { height: 'h-[48px]', fontSize: 'text-sm', padding: 'px-4 py-3' },
      card: { height: 'h-[56px]', fontSize: 'text-base', padding: 'px-6 py-4' },
      minimal: { height: 'h-[28px]', fontSize: 'text-xs', padding: 'px-2 py-0.5' }
    };
    return styles[mode];
  };

  // Column width resize handler
  const handleColumnResize = (columnKey: string, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.max(50, newWidth) // Minimum width of 50px
    }));
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
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
    let filtered = data.filter(member => {
      // Date filter for current month
      if (member.endDate && dateFilter.start && dateFilter.end) {
        const memberEndDate = new Date(member.endDate);
        const startDate = new Date(dateFilter.start);
        const endDate = new Date(dateFilter.end);
        
        if (memberEndDate < startDate || memberEndDate > endDate) {
          return false;
        }
      }
      
      // Search filter
      return Object.values(member).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'endDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection, dateFilter]);

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

  // Pagination logic
  const paginatedData = useMemo(() => {
    const allMembers = groupBy === 'none' ? filteredAndSortedData : Object.values(groupedData).flat();
    const totalItems = allMembers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: allMembers.slice(startIndex, endIndex),
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [filteredAndSortedData, groupedData, groupBy, currentPage, itemsPerPage]);

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

    const handleAnnotationSave = (memberId: string, comments: string, notes: string, tags: string[], associate?: string) => {
    if (onAnnotationUpdate) {
      onAnnotationUpdate(memberId, comments, notes, tags, associate);
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
              
              <div className="flex flex-wrap items-center gap-4">
                {/* View Mode Selector */}
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl p-1">
                  {(['minimal', 'compact', 'comfortable', 'detailed', 'card'] as ViewMode[]).map((mode) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode(mode)}
                      className={`text-xs font-medium transition-all duration-200 ${
                        viewMode === mode 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Date Filter for Current Month */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-300 rounded-xl p-2">
                    <Input
                      type="date"
                      value={dateFilter.start}
                      onChange={(e) => setDateFilter(prev => ({...prev, start: e.target.value}))}
                      className="w-36 text-xs border-none bg-transparent"
                    />
                    <span className="text-slate-400">to</span>
                    <Input
                      type="date"
                      value={dateFilter.end}
                      onChange={(e) => setDateFilter(prev => ({...prev, end: e.target.value}))}
                      className="w-36 text-xs border-none bg-transparent"
                    />
                  </div>
                </div>

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
                    {paginatedData.totalItems} total items
                  </Badge>
                </div>
              </div>
            </div>

            {/* Paginated Table */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
                <Table>
                        <TableHeader>
                          <TableRow className={`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-slate-600 ${getViewModeStyles(viewMode).height} hover:from-slate-800 hover:to-slate-800 transition-all duration-300`}>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.id + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('memberId')}
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  ID {getSortIcon('memberId')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.id;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('id', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.member + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('firstName')}
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  Member {getSortIcon('firstName')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.member;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('member', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.membership + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('membershipName')}
                                >
                                  <Crown className="h-3 w-3 mr-1" />
                                  Membership {getSortIcon('membershipName')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.membership;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('membership', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.status + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('status')}
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Status {getSortIcon('status')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.status;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('status', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.endDate + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('endDate')}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  End Date {getSortIcon('endDate')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.endDate;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('endDate', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.location + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('location')}
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Location {getSortIcon('location')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.location;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('location', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.comments + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('comments')}
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Comments {getSortIcon('comments')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.comments;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('comments', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.notes + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('notes')}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Notes {getSortIcon('notes')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.notes;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('notes', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.tags + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 font-bold text-white hover:text-blue-200 text-xs text-left"
                                  onClick={() => handleSort('tags')}
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  Tags {getSortIcon('tags')}
                                </Button>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.tags;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('tags', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-bold text-xs px-3 text-left" style={{ width: columnWidths.actions + 'px' }}>
                              <div className="flex items-center justify-between group">
                                <span className="text-xs">Actions</span>
                                <div 
                                  className="w-1 h-6 bg-slate-600 cursor-col-resize hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  onMouseDown={(e) => {
                                    const startX = e.clientX;
                                    const startWidth = columnWidths.actions;
                                    const handleMouseMove = (e: MouseEvent) => {
                                      const newWidth = startWidth + (e.clientX - startX);
                                      handleColumnResize('actions', newWidth);
                                    };
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove);
                                      document.removeEventListener('mouseup', handleMouseUp);
                                    };
                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                  }}
                                />
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        
                        <TableBody className="bg-white divide-y divide-slate-100">
                          {groupBy === 'none' ? (
                            // Paginated view when no grouping
                            paginatedData.items.map((member, index) => {
                              const daysUntilExpiry = getDaysUntilExpiry(member.endDate);
                              const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                              const isExpired = daysUntilExpiry < 0;
                              const styles = getViewModeStyles(viewMode);
                            
                            return (
                              <TableRow 
                                key={member.uniqueId || index}
                                className={`hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-indigo-50/70 transition-all duration-300 cursor-pointer ${styles.height} border-b border-slate-100/80 group backdrop-blur-sm`}
                                onClick={() => handleRowClick(member)}
                              >
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.id + 'px' }}>
                                  <span className={`font-mono text-slate-700 font-medium truncate ${styles.fontSize}`}>{member.memberId}</span>
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.member + 'px' }}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
                                      {member.firstName?.[0]}{member.lastName?.[0]}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={`font-semibold text-slate-900 truncate ${styles.fontSize}`}>
                                        {member.firstName} {member.lastName}
                                      </span>
                                      <span className={`text-slate-500 truncate ${viewMode === 'minimal' ? 'hidden' : 'text-xs'}`}>
                                        {member.email}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.membership + 'px' }}>
                                  <div className="flex items-center gap-1">
                                    {getMembershipIcon(member.membershipName)}
                                    <span className={`text-slate-700 font-medium truncate ${styles.fontSize}`}>
                                      {member.membershipName?.replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.status + 'px' }}>
                                  {getStatusBadge(member.status)}
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.endDate + 'px' }}>
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3 text-slate-400" />
                                      <span className={`text-slate-700 font-medium ${styles.fontSize}`}>
                                        {formatDate(member.endDate)}
                                      </span>
                                    </div>
                                    {viewMode !== 'minimal' && (
                                      <span className={`text-slate-500 ${styles.fontSize}`}>
                                        {Math.abs(daysUntilExpiry)} days {isExpired ? 'overdue' : 'left'}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.location + 'px' }}>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-400" />
                                    <span className={`text-slate-700 font-medium truncate ${styles.fontSize}`}>{member.location}</span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.comments + 'px' }}>
                                  {member.comments ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-2 cursor-pointer">
                                            <MessageSquare className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                            <span className={`text-slate-700 truncate font-medium ${styles.fontSize}`}>
                                              {renderStructuredAnnotations(member.commentsText, member.comments, 80)}...
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-lg">
                                          <div className={`max-h-32 overflow-y-auto ${styles.fontSize}`}>
                                            {extractStructuredText(member.commentsText, member.comments)}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className={`text-slate-400 ${styles.fontSize}`}>No comments</span>
                                  )}
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.notes + 'px' }}>
                                  {member.notes ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-2 cursor-pointer">
                                            <FileText className="h-3 w-3 text-green-500 flex-shrink-0" />
                                            <span className={`text-slate-700 truncate font-medium ${styles.fontSize}`}>
                                              {renderStructuredAnnotations(member.notesText, member.notes, 80)}...
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-lg">
                                          <div className={`max-h-32 overflow-y-auto ${styles.fontSize}`}>
                                            {extractStructuredText(member.notesText, member.notes)}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className={`text-slate-400 ${styles.fontSize}`}>No notes</span>
                                  )}
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.tags + 'px' }}>
                                  <div className="flex flex-wrap gap-1">
                                    {member.tags?.slice(0, 2).map((tag, index) => (
                                      <Badge key={index} variant="secondary" className={`px-2 py-0.5 bg-slate-100 text-slate-700 h-5 rounded-full ${styles.fontSize}`}>
                                        {typeof tag === 'string' ? tag : (tag as any)?.text || (tag as any)?.tag || String(tag)}
                                      </Badge>
                                    ))}
                                    {member.aiTags?.slice(0, 1).map((tag, index) => (
                                      <Badge key={index} variant="outline" className={`px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200 h-5 rounded-full ${styles.fontSize}`}>
                                        🤖 AI
                                      </Badge>
                                    ))}
                                    {member.aiSentiment && member.aiSentiment !== 'neutral' && (
                                      <Badge className={`px-2 py-0.5 h-5 rounded-full ${getSentimentColorClasses(member.aiSentiment)} ${styles.fontSize}`}>
                                        {getSentimentEmoji(member.aiSentiment)}
                                      </Badge>
                                    )}
                                    {member.aiChurnRisk && member.aiChurnRisk !== 'medium' && (
                                      <Badge className={`px-2 py-0.5 h-5 rounded-full ${getChurnRiskColorClasses(member.aiChurnRisk)} ${styles.fontSize}`}>
                                        {getChurnRiskEmoji(member.aiChurnRisk)}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                
                                <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.actions + 'px' }}>
                                  <div className="flex items-center justify-center gap-1">
                                    {onEditMember && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditMember(member);
                                        }}
                                        className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRowClick(member);
                                      }}
                                      className="h-7 w-7 p-0 hover:bg-slate-100 hover:text-slate-600 rounded-full"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                            })
                          ) : (
                            // Grouped view with collapsible sections
                            Object.entries(groupedData).map(([groupName, members]) => {
                              const isCollapsed = isGroupCollapsed(groupName);
                              const groupStats = getGroupTotal(members);
                              
                              return [
                                // Group Header Row
                                <TableRow key={`group-${groupName}`} className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300">
                                  <TableCell colSpan={12} className="px-4 py-3">
                                    <div className="flex items-center justify-between">
                                      <Button
                                        variant="ghost"
                                        onClick={() => toggleGroupCollapse(groupName)}
                                        className="flex items-center gap-3 text-left p-0 h-auto hover:bg-transparent"
                                      >
                                        {isCollapsed ? (
                                          <ChevronRight className="h-5 w-5 text-slate-600" />
                                        ) : (
                                          <ChevronDown className="h-5 w-5 text-slate-600" />
                                        )}
                                        <div>
                                          <h3 className="text-lg font-bold text-slate-800">{groupName}</h3>
                                          <p className="text-sm text-slate-600">
                                            {members.length} members • {groupStats.activeCount} active • {groupStats.totalSessions} sessions
                                          </p>
                                        </div>
                                      </Button>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                          Active: {groupStats.activeCount}
                                        </Badge>
                                        {groupStats.churnedCount > 0 && (
                                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                            Churned: {groupStats.churnedCount}
                                          </Badge>
                                        )}
                                        {groupStats.frozenCount > 0 && (
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                            Frozen: {groupStats.frozenCount}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>,
                                // Group Members (if not collapsed)
                                ...(!isCollapsed ? members.map((member, index) => {
                                  const daysUntilExpiry = getDaysUntilExpiry(member.endDate);
                                  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                                  const isExpired = daysUntilExpiry < 0;
                                  const styles = getViewModeStyles(viewMode);
                                  
                                  return (
                                    <TableRow 
                                      key={`${groupName}-${member.uniqueId || index}`}
                                      className={`hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-indigo-50/70 transition-all duration-300 cursor-pointer ${styles.height} border-b border-slate-100/80 group backdrop-blur-sm`}
                                      onClick={() => handleRowClick(member)}
                                    >
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.id + 'px' }}>
                                        <span className={`font-mono text-slate-700 font-medium truncate ${styles.fontSize}`}>{member.memberId}</span>
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.member + 'px' }}>
                                        <div className="flex items-center gap-2">
                                          {getMembershipIcon(member.membershipName)}
                                          <span className={`text-slate-700 font-medium truncate ${styles.fontSize}`}>{member.firstName} {member.lastName}</span>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.membership + 'px' }}>
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs font-medium px-2 py-1 ${member.membershipName?.toLowerCase().includes('premium') || member.membershipName?.toLowerCase().includes('unlimited') ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-300' : member.membershipName?.toLowerCase().includes('basic') ? 'bg-slate-50 text-slate-700 border-slate-300' : 'bg-blue-50 text-blue-700 border-blue-300'}`}
                                          >
                                            <span className={`truncate ${styles.fontSize}`}>{member.membershipName}</span>
                                          </Badge>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.startDate + 'px' }}>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3 text-green-500 flex-shrink-0" />
                                          <span className={`text-slate-700 font-medium ${styles.fontSize}`}>{formatDate(member.orderDate)}</span>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.endDate + 'px' }}>
                                        <div className="flex items-center gap-2">
                                          <Calendar className={`h-3 w-3 flex-shrink-0 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : 'text-slate-500'}`} />
                                          <span className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-slate-700'} ${styles.fontSize}`}>
                                            {formatDate(member.endDate)}
                                          </span>
                                          {(isExpired || isExpiringSoon) && (
                                            <Badge 
                                              variant="outline" 
                                              className={`ml-2 text-xs px-2 py-1 ${isExpired ? 'bg-red-50 text-red-700 border-red-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'}`}
                                            >
                                              {isExpired ? `${Math.abs(daysUntilExpiry)}d ago` : `${daysUntilExpiry}d left`}
                                            </Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.status + 'px' }}>
                                        {getStatusBadge(member.status)}
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.location + 'px' }}>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3 text-slate-500 flex-shrink-0" />
                                          <span className={`text-slate-700 truncate ${styles.fontSize}`}>{member.location}</span>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.sessions + 'px' }}>
                                        <div className="flex items-center gap-2">
                                          <Activity className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                          <span className={`text-slate-700 font-medium ${styles.fontSize}`}>{member.sessionsLeft || 0}</span>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.churn + 'px' }}>
                                        <div className="flex items-center gap-1">
                                          <span className="text-lg">{getChurnRiskEmoji(member.aiChurnRisk || 'low')}</span>
                                          <span className={`text-slate-700 font-medium capitalize ${styles.fontSize}`}>{member.aiChurnRisk || 'low'}</span>
                                        </div>
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.tags + 'px' }}>
                                        {member.tags && member.tags.length > 0 ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center gap-2 cursor-pointer">
                                                  <Tag className="h-3 w-3 text-purple-500 flex-shrink-0" />
                                                  <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
                                                    {member.tags.slice(0, 2).map((tag, tagIndex) => {
                                                      const tagText = typeof tag === 'string' ? tag : (tag as any)?.text || (tag as any)?.tag || String(tag);
                                                      return (
                                                        <Badge key={tagIndex} variant="secondary" className={`text-xs px-2 py-1 bg-purple-50 text-purple-700 border-purple-200 ${styles.fontSize}`}>
                                                          {tagText.length > 15 ? tagText.slice(0, 15) + '...' : tagText}
                                                        </Badge>
                                                      );
                                                    })}
                                                    {member.tags.length > 2 && (
                                                      <Badge variant="outline" className={`text-xs px-2 py-1 ${styles.fontSize}`}>
                                                        +{member.tags.length - 2}
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent className="bg-slate-900 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 max-w-lg p-3">
                                                <div className="space-y-2">
                                                  <h4 className="font-semibold text-cyan-200">AI Analysis Tags</h4>
                                                  <div className="flex flex-wrap gap-1">
                                                    {member.tags.map((tag, tagIndex) => (
                                                      <Badge key={tagIndex} variant="secondary" className="text-xs bg-cyan-900/50 text-cyan-300 border-cyan-500/30">
                                                        {typeof tag === 'string' ? tag : (tag as any)?.text || (tag as any)?.tag || String(tag)}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : (
                                          <span className={`text-slate-400 ${styles.fontSize}`}>No tags</span>
                                        )}
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.comments + 'px' }}>
                                        {member.comments ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center gap-2 cursor-pointer">
                                                  <MessageSquare className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                                  <span className={`text-slate-700 truncate font-medium ${styles.fontSize}`}>
                                                    {renderStructuredAnnotations(member.commentsText, member.comments, 30)}...
                                                  </span>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent className="bg-slate-900 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 max-w-lg p-3">
                                                <div className={`max-h-32 overflow-y-auto ${styles.fontSize}`}>
                                                  {extractStructuredText(member.commentsText, member.comments)}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : (
                                          <span className={`text-slate-400 ${styles.fontSize}`}>No comments</span>
                                        )}
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-left overflow-hidden`} style={{ width: columnWidths.notes + 'px' }}>
                                        {member.notes ? (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center gap-2 cursor-pointer">
                                                  <FileText className="h-3 w-3 text-green-500 flex-shrink-0" />
                                                  <span className={`text-slate-700 truncate font-medium ${styles.fontSize}`}>
                                                    {renderStructuredAnnotations(member.notesText, member.notes, 30)}...
                                                  </span>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent className="bg-slate-900 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 max-w-lg p-3">
                                                <div className={`max-h-32 overflow-y-auto ${styles.fontSize}`}>
                                                  {extractStructuredText(member.notesText, member.notes)}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ) : (
                                          <span className={`text-slate-400 ${styles.fontSize}`}>No notes</span>
                                        )}
                                      </TableCell>
                                      
                                      <TableCell className={`${styles.padding} text-center`} style={{ width: columnWidths.actions + 'px' }}>
                                        <div className="flex items-center justify-center gap-1">
                                          {onEditMember && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onEditMember(member);
                                              }}
                                              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full"
                                            >
                                              <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRowClick(member);
                                            }}
                                            className="h-7 w-7 p-0 hover:bg-slate-100 hover:text-slate-600 rounded-full"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                }) : [])
                              ].flat();
                            })
                          )}
                        </TableBody>
                      </Table>
                    
                      {/* Pagination Controls - Only show when not grouped */}
                      {groupBy === 'none' && (
                        <div className="mt-6 px-6 pb-6">
                        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600 font-medium">
                              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, paginatedData.totalItems)} to {Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems} entries
                            </span>
                            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                              setItemsPerPage(Number(value));
                              setCurrentPage(1);
                            }}>
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              disabled={!paginatedData.hasPrevPage}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <ChevronLeft className="h-4 w-4 -ml-2" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={!paginatedData.hasPrevPage}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                                const pageNum = Math.max(1, Math.min(
                                  paginatedData.totalPages - 4,
                                  Math.max(1, currentPage - 2)
                                )) + i;
                                if (pageNum <= paginatedData.totalPages) {
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={pageNum === currentPage ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNum)}
                                      className="h-8 w-8 p-0"
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                }
                                return null;
                              })}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={!paginatedData.hasNextPage}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(paginatedData.totalPages)}
                              disabled={!paginatedData.hasNextPage}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                              <ChevronRight className="h-4 w-4 -ml-2" />
                            </Button>
                          </div>
                        </div>
                        </div>
                      )}
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