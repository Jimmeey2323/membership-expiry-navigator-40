
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Search, ArrowUpDown, Eye, Calendar, Activity, MapPin, User, Crown, Zap, Edit, MessageSquare, Filter, Grid, List, BarChart3, Trello, Clock, LayoutGrid, Users, UserCheck } from "lucide-react";
import { MembershipData, ViewMode } from "@/types/membership";
import { MemberDetailModal } from "./MemberDetailModal";
import { ViewSelector } from "./ViewSelector";
import { processTextForDisplay, extractFirstName } from "@/lib/textUtils";
import { formatDateTimeIST, parseAnnotationText, getCurrentMonthDateRange, isCurrentMonth } from "@/lib/dateUtils";

interface EnhancedDataTableProps {
  data: MembershipData[];
  title: string;
  className?: string;
  onAnnotationUpdate?: (memberId: string, comments: string, notes: string, tags: string[], associate?: string, associateInCharge?: string, stage?: string) => void;
  onEditMember?: (member: MembershipData) => void;
  onFollowUpMember?: (member: MembershipData) => void;
}

type SortField = keyof MembershipData;
type SortDirection = 'asc' | 'desc';

// Utility function to safely extract text from structured comments/notes
const extractStructuredText = (legacyText: string | undefined, structuredArray: any[] | undefined): string => {
  if (legacyText) return legacyText;
  if (Array.isArray(structuredArray)) {
    return structuredArray.map(item => item.text || '').join('\n');
  }
  return '';
};

export const EnhancedDataTable = ({
  data,
  title,
  className = '',
  onAnnotationUpdate,
  onEditMember,
  onFollowUpMember
}: EnhancedDataTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('table');
  const [showCurrentMonthOnly, setShowCurrentMonthOnly] = useState(false);
  const itemsPerPage = 12;

  // Get current month range for default filtering
  const currentMonthRange = useMemo(() => getCurrentMonthDateRange(), []);

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

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      // Search filter
      const matchesSearch = Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Current month filter (default enabled)
      const matchesMonth = showCurrentMonthOnly ? isCurrentMonth(item.endDate) : true;
      
      return matchesSearch && matchesMonth;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection, showCurrentMonthOnly]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-white" /> 
      : <ChevronDown className="h-4 w-4 text-white" />;
  };

  const handleRowClick = (member: MembershipData) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  const handleAnnotationSave = (memberId: string, comments: string, notes: string, tags: string[], associate?: string, associateInCharge?: string, stage?: string) => {
    if (onAnnotationUpdate) {
      onAnnotationUpdate(memberId, comments, notes, tags, associate, associateInCharge, stage);
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
      return <User className="h-4 w-4 text-gray-600" />;
    }
    return <Zap className="h-4 w-4 text-blue-600" />;
  };

  return (
    <>
      <TooltipProvider>
        <div className={`relative overflow-hidden ${className}`}>
          {/* Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 animate-pulse opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent"></div>
          
          <Card className="relative backdrop-blur-xl bg-white/95 border-white/20 shadow-2xl">
            <div className="p-6">
              {/* Enhanced Header with Grid Layout */}
              <div className="space-y-6 mb-8">
                {/* Main Header */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                  <div className="relative p-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/20 rounded-xl blur-md animate-pulse"></div>
                          <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                            <Activity className="h-7 w-7 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">
                            {title}
                          </h3>
                          <p className="text-indigo-200 font-medium">
                            Advanced membership management system
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 backdrop-blur-md text-white px-4 py-2 text-sm font-bold border border-white/30 shadow-lg">
                          <Activity className="h-4 w-4 mr-2" />
                          {filteredAndSortedData.length} members
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search and Controls Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Search Section */}
                  <div className="lg:col-span-1">
                    <Card className="backdrop-blur-xl bg-white/95 border-white/20 shadow-lg">
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Search & Filter
                        </h4>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                              placeholder="Search members..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="pl-10 bg-white border-slate-200 focus:border-indigo-300"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-slate-600">Current Month Only</label>
                            <Button
                              variant={showCurrentMonthOnly ? "default" : "outline"}
                              size="sm"
                              onClick={() => setShowCurrentMonthOnly(!showCurrentMonthOnly)}
                              className={showCurrentMonthOnly ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                            >
                              <Filter className="h-4 w-4 mr-2" />
                              {showCurrentMonthOnly ? "ON" : "OFF"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* View Selector */}
                  <div className="lg:col-span-2">
                    <ViewSelector
                      currentView={currentView}
                      onViewChange={setCurrentView}
                    />
                  </div>
                </div>
              </div>

              {/* Multi-View Content */}
              {currentView === 'table' && (
                <>
                  {/* Ultra-Modern Table */}
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-indigo-50/20 to-white"></div>
                    <Table className="relative">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 hover:bg-gradient-to-r hover:from-indigo-900 hover:via-purple-900 hover:to-indigo-900 border-none h-14">
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 border-none">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-white hover:text-white/80 hover:bg-transparent transition-colors"
                        onClick={() => handleSort('memberId')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Member ID {getSortIcon('memberId')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[200px] border-none">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-white hover:text-white/80 hover:bg-transparent"
                        onClick={() => handleSort('firstName')}
                      >
                        Member Name {getSortIcon('firstName')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[250px] border-none">Email Address</TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[280px] border-none">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-white hover:text-white/80 hover:bg-transparent"
                        onClick={() => handleSort('membershipName')}
                      >
                        Membership Type {getSortIcon('membershipName')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[150px] border-none">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-white hover:text-white/80 hover:bg-transparent"
                        onClick={() => handleSort('endDate')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Expiry Date {getSortIcon('endDate')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[180px] border-none">
                      <MapPin className="h-4 w-4 mr-2 inline" />
                      Location
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 text-center min-w-[120px] border-none">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-white hover:text-white/80 hover:bg-transparent"
                        onClick={() => handleSort('sessionsLeft')}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Sessions {getSortIcon('sessionsLeft')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 text-center min-w-[120px] border-none">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-white hover:text-white/80 hover:bg-transparent"
                        onClick={() => handleSort('status')}
                      >
                        Status {getSortIcon('status')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[150px] border-none">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-white hover:text-white/80 hover:bg-transparent"
                        onClick={() => handleSort('soldBy')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Associate {getSortIcon('soldBy')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[200px] border-none">
                      <MessageSquare className="h-4 w-4 mr-2 inline" />
                      Comments
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[150px] border-none">
                      <UserCheck className="h-4 w-4 mr-2 inline" />
                      Associate In Charge
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[180px] border-none">
                      <Users className="h-4 w-4 mr-2 inline" />
                      Stage
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[140px] border-none">
                      <Calendar className="h-4 w-4 mr-2 inline" />
                      Date/Time
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[200px] border-none">
                      Notes
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[120px] border-none">
                      Tags
                    </TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[120px] text-center border-none">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {paginatedData.map((member) => {
                    const daysUntilExpiry = getDaysUntilExpiry(member.endDate);
                    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                    const isChurned = member.status === 'Churned';
                    
                    return (
                      <TableRow 
                        key={`${member.uniqueId}-${member.lastUpdated || 0}`}
                        className="bg-white border-b border-slate-200/50 hover:bg-slate-50/70 transition-all duration-200 cursor-pointer group"
                        style={{ height: '35px' }}
                        onClick={() => handleRowClick(member)}
                      >
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center font-medium text-indigo-700 text-xs">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </div>
                            <span className="font-mono text-slate-700 font-medium text-sm">{member.memberId}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900 text-sm">
                              {member.firstName} {member.lastName}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Eye className="h-3 w-3 text-slate-500" />
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <span className="text-slate-600 font-normal text-sm">{member.email}</span>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center gap-2">
                            {getMembershipIcon(member.membershipName)}
                            <span className="text-slate-700 font-normal text-sm truncate max-w-[200px]">
                              {member.membershipName}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 font-normal text-sm">
                              {new Date(member.endDate).toLocaleDateString()}
                            </span>
                            {isExpiringSoon && !isChurned && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 px-1 py-0 text-[10px]">
                                {daysUntilExpiry}d
                              </Badge>
                            )}
                            {isChurned && (
                              <Badge variant="destructive" className="text-xs px-1 py-0 text-[10px]">
                                Churned
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-700 font-normal text-sm">{member.location}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px] text-center">
                          <Badge 
                            variant={(member.sessionsLeft || 0) > 10 ? "default" : (member.sessionsLeft || 0) > 3 ? "secondary" : (member.sessionsLeft || 0) > 0 ? "outline" : "destructive"}
                            className={`font-medium text-xs px-2 py-1 ${
                              (member.sessionsLeft || 0) > 10 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              (member.sessionsLeft || 0) > 3 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              (member.sessionsLeft || 0) > 0 ? 'bg-amber-100 text-amber-800 border-amber-300' : ''
                            }`}
                          >
                            {member.sessionsLeft || 0}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px] text-center">
                          <Badge 
                            variant={
                              member.status === 'Active' ? "default" : 
                              member.status === 'Frozen' ? "secondary" : 
                              member.status === 'Trial' ? "outline" :
                              member.status === 'Pending' ? "outline" :
                              member.status === 'Suspended' ? "secondary" :
                              "destructive"
                            }
                            className={`font-medium text-xs px-2 py-1 ${
                              member.status === 'Active' 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                : member.status === 'Frozen'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : member.status === 'Trial'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : member.status === 'Pending'
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : member.status === 'Suspended'
                                ? 'bg-gray-100 text-gray-800 border-gray-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-700 font-normal text-sm">{extractFirstName(member.soldBy || 'Not assigned')}</span>
                          </div>
                        </TableCell>
                        
                        {/* Comments Column */}
                        <TableCell className="px-4 py-2 h-[35px] max-w-[200px]">
                          {(() => {
                            // Handle both legacy string format and new structured format
                            const commentsText = member.commentsText || 
                              (Array.isArray(member.comments) ? member.comments.map(c => c.text).join('\n') : '') || '';
                            const parsedComments = parseAnnotationText(commentsText);
                            const latestComment = parsedComments[parsedComments.length - 1];
                            
                            return latestComment ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-gray-700">
                                    <div className="truncate max-w-[180px]">{latestComment.text}</div>
                                    {parsedComments.length > 1 && (
                                      <div className="text-gray-500 italic text-[10px]">+{parsedComments.length - 1} more</div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    {parsedComments.map((comment, idx) => (
                                      <div key={idx} className="border-l-2 border-blue-200 pl-2">
                                        <p className="text-sm">{comment.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-gray-400">No comments</span>
                            );
                          })()}
                        </TableCell>
                        
                        {/* Associate In Charge Column */}
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-slate-500" />
                            <span className="text-xs text-slate-700 font-medium truncate">
                              {extractFirstName(member.associateInCharge || '-')}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Stage Column */}
                        <TableCell className="px-4 py-2 h-[35px] max-w-[180px]">
                          {member.stage ? (
                            <Badge variant="outline" className="text-xs truncate max-w-full">
                              {member.stage}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">No stage set</span>
                          )}
                        </TableCell>
                        
                        {/* Date/Time Column */}
                        <TableCell className="px-4 py-2 h-[35px]">
                          {(() => {
                            // Handle both legacy string format and new structured format
                            const commentsText = member.commentsText || 
                              (Array.isArray(member.comments) ? member.comments.map(c => c.text).join('\n') : '') || '';
                            const parsedComments = parseAnnotationText(commentsText);
                            const latestComment = parsedComments[parsedComments.length - 1];
                            
                            return latestComment?.createdAt ? (
                              <div className="text-xs text-slate-600">
                                {formatDateTimeIST(latestComment.createdAt)}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            );
                          })()}
                        </TableCell>
                        
                        {/* Notes Column */}
                        <TableCell className="px-4 py-2 h-[35px] max-w-[200px]">
                          {(() => {
                            // Handle both legacy string format and new structured format
                            const notesText = member.notesText || 
                              (Array.isArray(member.notes) ? member.notes.map(n => n.text).join('\n') : '') || '';
                            const parsedNotes = parseAnnotationText(notesText);
                            const latestNote = parsedNotes[parsedNotes.length - 1];
                            
                            return latestNote ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-gray-700">
                                    <div className="truncate max-w-[180px]">{latestNote.text}</div>
                                    {parsedNotes.length > 1 && (
                                      <div className="text-gray-500 italic text-[10px]">+{parsedNotes.length - 1} more</div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    {parsedNotes.map((note, idx) => (
                                      <div key={idx} className="border-l-2 border-green-200 pl-2">
                                        <p className="text-sm">{note.text}</p>
                                        {note.createdBy && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            by {note.createdBy} • {formatDateTimeIST(note.createdAt || '')}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-gray-400">No notes</span>
                            );
                          })()}
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center gap-1">
                            {((member.tagsText && member.tagsText.length > 0) || (member.tags && member.tags.length > 0)) && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {(member.tagsText || []).slice(0, 2).map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1 py-0 text-[10px]">
                                    {tag}
                                  </Badge>
                                ))}
                                {(member.tagsText?.length || 0) > 2 && (
                                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 px-1 py-0 text-[10px]">
                                    +{(member.tagsText?.length || 0) - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {member.aiTags && member.aiTags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {member.aiTags.slice(0, 1).map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className="text-xs bg-purple-50 text-purple-700 border-purple-200 px-1 py-0 text-[10px]">
                                    🤖 {tag}
                                  </Badge>
                                ))}
                                {member.aiTags.length > 1 && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 px-1 py-0 text-[10px]">
                                    +{member.aiTags.length - 1} AI
                                  </Badge>
                                )}
                                
                                {/* Sentiment and Churn Risk Indicators */}
                                <div className="flex items-center gap-1 mt-1">
                                  {member.aiSentiment && member.aiSentiment !== 'neutral' && (
                                    <Badge variant="secondary" className={`text-[9px] px-1 py-0 ${getSentimentColorClasses(member.aiSentiment)}`}>
                                      {getSentimentEmoji(member.aiSentiment)} {member.aiSentiment}
                                    </Badge>
                                  )}
                                  {member.aiChurnRisk && member.aiChurnRisk !== 'medium' && (
                                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getChurnRiskColorClasses(member.aiChurnRisk)}`}>
                                      {getChurnRiskEmoji(member.aiChurnRisk)} {member.aiChurnRisk}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            {!member.tagsText?.length && !member.aiTags?.length && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center justify-center gap-1">
                            {onEditMember && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditMember(member);
                                }}
                                className="h-6 w-6 p-0 backdrop-blur-sm bg-white/80 hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {onFollowUpMember && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFollowUpMember(member);
                                }}
                                className="h-6 w-6 p-0 backdrop-blur-sm bg-white/80 hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Modern Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200/50 shadow-lg backdrop-blur-sm">
                <p className="text-slate-700 text-sm font-medium">
                  Showing <span className="text-indigo-600 font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="text-indigo-600 font-semibold">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span> of{' '}
                  <span className="text-indigo-600 font-semibold">{filteredAndSortedData.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 font-medium px-4 shadow-sm transition-all duration-200"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 font-medium px-4 shadow-sm transition-all duration-200"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
                </>
              )}

              {/* Kanban View */}
              {currentView === 'kanban' && (
                <div className="space-y-4">
                  <div className="flex gap-6 overflow-x-auto pb-4">
                    {['Active', 'Churned', 'Frozen', 'Pending', 'Suspended', 'Trial'].map((status) => {
                      const statusMembers = filteredAndSortedData.filter(member => member.status === status);
                      const statusColor = {
                        Active: 'bg-green-50 border-green-200',
                        Churned: 'bg-red-50 border-red-200',
                        Frozen: 'bg-blue-50 border-blue-200',
                        Pending: 'bg-yellow-50 border-yellow-200',
                        Suspended: 'bg-orange-50 border-orange-200',
                        Trial: 'bg-purple-50 border-purple-200'
                      }[status];
                      
                      return (
                        <div key={status} className={`min-w-[300px] rounded-lg border-2 ${statusColor} p-4`}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800">{status}</h3>
                            <Badge variant="secondary" className="text-xs">{statusMembers.length}</Badge>
                          </div>
                          <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {statusMembers.map((member) => {
                              const commentsText = extractStructuredText(member.commentsText, member.comments);
                              const notesText = extractStructuredText(member.notesText, member.notes);
                              const latestComments = parseAnnotationText(commentsText);
                              const latestComment = latestComments[latestComments.length - 1];
                              
                              return (
                                <Card key={`${member.uniqueId}-${member.lastUpdated || 0}`} className="p-3 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-200">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-medium text-sm text-slate-800 truncate">
                                        {member.firstName} {member.lastName}
                                      </h4>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedMember(member)}
                                        className="h-6 w-6 p-0 hover:bg-slate-100"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-slate-600 truncate">{member.membershipName}</p>
                                    <p className="text-xs text-slate-500">Expires: {member.endDate}</p>
                                    {latestComment && (
                                      <div className="bg-slate-50 rounded p-2 text-xs text-slate-600">
                                        <p className="truncate">{latestComment.text}</p>
                                        <p className="text-slate-400 text-xs mt-1">by {latestComment.createdBy}</p>
                                      </div>
                                    )}
                                    <div className="flex gap-1 mt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onEditMember?.(member)}
                                        className="h-6 text-xs px-2 flex-1"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onFollowUpMember?.(member)}
                                        className="h-6 text-xs px-2 flex-1"
                                      >
                                        <MessageSquare className="h-3 w-3 mr-1" />Note
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timeline View */}
              {currentView === 'timeline' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-green-500" />
                      Membership Timeline
                    </h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {filteredAndSortedData
                        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                        .map((member, index) => {
                          const commentsText = extractStructuredText(member.commentsText, member.comments);
                          const notesText = extractStructuredText(member.notesText, member.notes);
                          const latestComments = parseAnnotationText(commentsText);
                          const latestComment = latestComments[latestComments.length - 1];
                          const daysUntilExpiry = Math.ceil((new Date(member.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          const isExpiringSoon = daysUntilExpiry <= 14;
                          const isExpired = daysUntilExpiry < 0;
                          
                          return (
                            <div key={`${member.uniqueId}-${member.lastUpdated || 0}`} className="relative flex items-start space-x-4 pb-4">
                              {/* Timeline Line */}
                              {index < filteredAndSortedData.length - 1 && (
                                <div className="absolute left-4 top-8 w-0.5 h-16 bg-slate-200"></div>
                              )}
                              
                              {/* Timeline Dot */}
                              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-yellow-500' : 'bg-green-500'
                              }`}>
                                <Calendar className="h-4 w-4 text-white" />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-medium text-slate-800">{member.firstName} {member.lastName}</h4>
                                    <p className="text-sm text-slate-600">{member.membershipName}</p>
                                    <p className="text-xs text-slate-500">{member.location}</p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={isExpired ? 'destructive' : isExpiringSoon ? 'secondary' : 'default'}>
                                      {member.status}
                                    </Badge>
                                    <p className={`text-xs mt-1 ${
                                      isExpired ? 'text-red-600 font-semibold' : 
                                      isExpiringSoon ? 'text-yellow-600 font-semibold' : 'text-slate-500'
                                    }`}>
                                      {isExpired ? `Expired ${Math.abs(daysUntilExpiry)} days ago` : 
                                       isExpiringSoon ? `Expires in ${daysUntilExpiry} days` : 
                                       `Expires: ${member.endDate}`}
                                    </p>
                                  </div>
                                </div>
                                
                                {latestComment && (
                                  <div className="bg-slate-50 rounded-md p-3 mb-3">
                                    <p className="text-sm text-slate-700">{latestComment.text}</p>
                                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                      <span>by {latestComment.createdBy}</span>
                                      <span>{formatDateTimeIST(latestComment.createdAt)}</span>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedMember(member)}
                                    className="flex-1"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEditMember?.(member)}
                                    className="flex-1"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onFollowUpMember?.(member)}
                                    className="flex-1"
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />Note
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar View */}
              {currentView === 'calendar' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                      Membership Expiry Calendar
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                      {(() => {
                        const monthGroups = filteredAndSortedData.reduce((groups, member) => {
                          const expiryDate = new Date(member.endDate);
                          const monthKey = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}`;
                          const monthName = expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                          
                          if (!groups[monthKey]) {
                            groups[monthKey] = { name: monthName, members: [] };
                          }
                          groups[monthKey].members.push(member);
                          return groups;
                        }, {} as Record<string, { name: string; members: MembershipData[] }>);
                        
                        return Object.entries(monthGroups)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([monthKey, monthData]) => (
                            <Card key={monthKey} className="p-4 bg-orange-50 border-orange-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-slate-800">{monthData.name}</h4>
                                <Badge variant="secondary" className="text-xs">{monthData.members.length}</Badge>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {monthData.members.map((member) => {
                                  const daysUntilExpiry = Math.ceil((new Date(member.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                  const isExpired = daysUntilExpiry < 0;
                                  const isExpiringSoon = daysUntilExpiry <= 7;
                                  
                                  return (
                                    <div key={`${member.uniqueId}-${member.lastUpdated || 0}`} className={`p-2 rounded border-l-4 ${
                                      isExpired ? 'bg-red-50 border-red-400' : 
                                      isExpiringSoon ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'
                                    }`}>
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-slate-800">{member.firstName} {member.lastName}</p>
                                          <p className="text-xs text-slate-600">{member.membershipName}</p>
                                          <p className="text-xs text-slate-500">Expires: {member.endDate}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSelectedMember(member)}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Eye className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onEditMember?.(member)}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      {(isExpired || isExpiringSoon) && (
                                        <p className={`text-xs mt-1 font-semibold ${
                                          isExpired ? 'text-red-600' : 'text-yellow-600'
                                        }`}>
                                          {isExpired ? `Expired ${Math.abs(daysUntilExpiry)} days ago` : `Expires in ${daysUntilExpiry} days`}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </Card>
                          ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Pivot View */}
              {currentView === 'pivot' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-red-500" />
                      Analytics Pivot Table
                    </h3>
                    
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {(() => {
                        const stats = {
                          total: filteredAndSortedData.length,
                          active: filteredAndSortedData.filter(m => m.status === 'Active').length,
                          churned: filteredAndSortedData.filter(m => m.status === 'Churned').length,
                          expiringSoon: filteredAndSortedData.filter(m => {
                            const daysUntil = Math.ceil((new Date(m.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            return daysUntil <= 14 && daysUntil >= 0;
                          }).length
                        };
                        
                        return [
                          { label: 'Total Members', value: stats.total, color: 'bg-blue-100 text-blue-800' },
                          { label: 'Active', value: stats.active, color: 'bg-green-100 text-green-800' },
                          { label: 'Churned', value: stats.churned, color: 'bg-red-100 text-red-800' },
                          { label: 'Expiring Soon', value: stats.expiringSoon, color: 'bg-yellow-100 text-yellow-800' }
                        ].map((stat, index) => (
                          <div key={index} className="bg-slate-50 rounded-lg p-4 text-center">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stat.color} mb-2`}>
                              {stat.value}
                            </div>
                            <p className="text-sm text-slate-600">{stat.label}</p>
                          </div>
                        ));
                      })()}
                    </div>
                    
                    {/* Pivot Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* By Status */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-800 mb-3">Members by Status</h4>
                        <div className="space-y-2">
                          {['Active', 'Churned', 'Frozen', 'Pending', 'Suspended', 'Trial'].map((status) => {
                            const count = filteredAndSortedData.filter(m => m.status === status).length;
                            const percentage = filteredAndSortedData.length > 0 ? ((count / filteredAndSortedData.length) * 100).toFixed(1) : '0';
                            return (
                              <div key={status} className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">{status}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{count}</span>
                                  <span className="text-xs text-slate-500">({percentage}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* By Location */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-800 mb-3">Members by Location</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(() => {
                            const locationCounts = filteredAndSortedData.reduce((acc, member) => {
                              acc[member.location] = (acc[member.location] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            return Object.entries(locationCounts)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 10)
                              .map(([location, count]) => {
                                const percentage = filteredAndSortedData.length > 0 ? ((count / filteredAndSortedData.length) * 100).toFixed(1) : '0';
                                return (
                                  <div key={location} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 truncate">{location}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{count}</span>
                                      <span className="text-xs text-slate-500">({percentage}%)</span>
                                    </div>
                                  </div>
                                );
                              });
                          })()}
                        </div>
                      </div>
                      
                      {/* By Membership Type */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-800 mb-3">By Membership Type</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(() => {
                            const membershipCounts = filteredAndSortedData.reduce((acc, member) => {
                              acc[member.membershipName] = (acc[member.membershipName] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            return Object.entries(membershipCounts)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 10)
                              .map(([membershipName, count]) => {
                                const percentage = filteredAndSortedData.length > 0 ? ((count / filteredAndSortedData.length) * 100).toFixed(1) : '0';
                                return (
                                  <div key={membershipName} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 truncate">{membershipName}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{count}</span>
                                      <span className="text-xs text-slate-500">({percentage}%)</span>
                                    </div>
                                  </div>
                                );
                              });
                          })()}
                        </div>
                      </div>
                      
                      {/* Expiry Timeline */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-800 mb-3">Expiry Timeline</h4>
                        <div className="space-y-2">
                          {(() => {
                            const now = new Date();
                            const ranges = [
                              { label: 'Expired', filter: (m: MembershipData) => new Date(m.endDate) < now },
                              { label: 'Next 7 days', filter: (m: MembershipData) => {
                                const days = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return days >= 0 && days <= 7;
                              }},
                              { label: 'Next 30 days', filter: (m: MembershipData) => {
                                const days = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return days >= 8 && days <= 30;
                              }},
                              { label: 'Next 90 days', filter: (m: MembershipData) => {
                                const days = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return days >= 31 && days <= 90;
                              }},
                              { label: '90+ days', filter: (m: MembershipData) => {
                                const days = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                return days > 90;
                              }}
                            ];
                            
                            return ranges.map((range) => {
                              const count = filteredAndSortedData.filter(range.filter).length;
                              const percentage = filteredAndSortedData.length > 0 ? ((count / filteredAndSortedData.length) * 100).toFixed(1) : '0';
                              return (
                                <div key={range.label} className="flex justify-between items-center">
                                  <span className="text-sm text-slate-600">{range.label}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{count}</span>
                                    <span className="text-xs text-slate-500">({percentage}%)</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* List View */}
              {currentView === 'list' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <List className="h-5 w-5 mr-2 text-teal-500" />
                      Member List View
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {filteredAndSortedData.map((member, index) => {
                        const commentsText = extractStructuredText(member.commentsText, member.comments);
                        const latestComments = parseAnnotationText(commentsText);
                        const latestComment = latestComments[latestComments.length - 1];
                        const daysUntilExpiry = Math.ceil((new Date(member.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isExpired = daysUntilExpiry < 0;
                        const isExpiringSoon = daysUntilExpiry <= 14;
                        
                        return (
                          <div key={`${member.uniqueId}-${member.lastUpdated || 0}`} className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md ${
                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          }`}>
                            <div className="flex items-center space-x-4 flex-1">
                              <div className={`w-3 h-3 rounded-full ${
                                isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-slate-800 truncate">{member.firstName} {member.lastName}</h4>
                                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                                      <span className="truncate">{member.membershipName}</span>
                                      <span>•</span>
                                      <span className="truncate">{member.location}</span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-slate-600">
                                    <Badge variant={member.status === 'Active' ? 'default' : member.status === 'Churned' ? 'destructive' : 'secondary'}>
                                      {member.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-right min-w-24">
                                    <p className={`font-medium ${
                                      isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-slate-700'
                                    }`}>
                                      {member.endDate}
                                    </p>
                                    <p className={`text-xs ${
                                      isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : 'text-slate-500'
                                    }`}>
                                      {isExpired ? `${Math.abs(daysUntilExpiry)}d ago` : 
                                       isExpiringSoon ? `${daysUntilExpiry}d left` : 
                                       `${daysUntilExpiry}d left`}
                                    </p>
                                  </div>
                                  {latestComment && (
                                    <div className="min-w-0 flex-1 max-w-xs">
                                      <p className="text-xs text-slate-600 truncate">{latestComment.text}</p>
                                      <p className="text-xs text-slate-400">by {latestComment.createdBy}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedMember(member)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEditMember?.(member)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onFollowUpMember?.(member)}
                                className="h-8 w-8 p-0"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Grid View */}
              {currentView === 'grid' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <LayoutGrid className="h-5 w-5 mr-2 text-indigo-500" />
                      Member Grid View
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                      {filteredAndSortedData.map((member) => {
                        const commentsText = extractStructuredText(member.commentsText, member.comments);
                        const notesText = extractStructuredText(member.notesText, member.notes);
                        const latestComments = parseAnnotationText(commentsText);
                        const latestComment = latestComments[latestComments.length - 1];
                        const daysUntilExpiry = Math.ceil((new Date(member.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isExpired = daysUntilExpiry < 0;
                        const isExpiringSoon = daysUntilExpiry <= 14;
                        
                        return (
                          <Card key={`${member.uniqueId}-${member.lastUpdated || 0}`} className={`p-4 hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${
                            isExpired ? 'border-red-500 bg-red-50' : 
                            isExpiringSoon ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50'
                          }`}>
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-800 truncate">{member.firstName} {member.lastName}</h4>
                                  <p className="text-sm text-slate-600 truncate">{member.email}</p>
                                </div>
                                <Badge variant={
                                  member.status === 'Active' ? 'default' : 
                                  member.status === 'Churned' ? 'destructive' : 
                                  'secondary'
                                } className="text-xs">
                                  {member.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-slate-600">
                                  <Crown className="h-3 w-3 mr-1" />
                                  <span className="truncate">{member.membershipName}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="truncate">{member.location}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span className={`${
                                    isExpired ? 'text-red-600 font-semibold' : 
                                    isExpiringSoon ? 'text-yellow-600 font-semibold' : 'text-slate-600'
                                  }`}>
                                    {member.endDate}
                                  </span>
                                </div>
                              </div>
                              
                              {(isExpired || isExpiringSoon) && (
                                <div className={`text-xs font-semibold p-2 rounded ${
                                  isExpired ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {isExpired ? `Expired ${Math.abs(daysUntilExpiry)} days ago` : `Expires in ${daysUntilExpiry} days`}
                                </div>
                              )}
                              
                              {latestComment && (
                                <div className="bg-white rounded p-2 border border-slate-200">
                                  <p className="text-xs text-slate-700 line-clamp-2">{latestComment.text}</p>
                                  <div className="flex justify-between items-center mt-1 text-xs text-slate-500">
                                    <span>by {latestComment.createdBy}</span>
                                    <span>{formatDateTimeIST(latestComment.createdAt).split(' ')[0]}</span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex gap-1 pt-2 border-t border-slate-200">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedMember(member)}
                                  className="flex-1 text-xs h-7"
                                >
                                  <Eye className="h-3 w-3 mr-1" />View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEditMember?.(member)}
                                  className="flex-1 text-xs h-7"
                                >
                                  <Edit className="h-3 w-3 mr-1" />Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onFollowUpMember?.(member)}
                                  className="flex-1 text-xs h-7"
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />Note
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </Card>
      </div>
      </TooltipProvider>

      <MemberDetailModal
        member={selectedMember}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMember(null);
        }}
        onSave={handleAnnotationSave}
      />
    </>
  );
};
