
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Search, ArrowUpDown, Eye, Calendar, Activity, MapPin, User, Crown, Zap, Edit, MessageSquare } from "lucide-react";
import { MembershipData } from "@/types/membership";
import { MemberDetailModal } from "./MemberDetailModal";
import { processTextForDisplay } from "@/lib/textUtils";

interface EnhancedDataTableProps {
  data: MembershipData[];
  title: string;
  className?: string;
  onAnnotationUpdate?: (memberId: string, comments: string, notes: string, tags: string[]) => void;
  onEditMember?: (member: MembershipData) => void;
  onFollowUpMember?: (member: MembershipData) => void;
}

type SortField = keyof MembershipData;
type SortDirection = 'asc' | 'desc';

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
  const itemsPerPage = 12;

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
              {/* Ultra-Modern Header */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                <div className="relative flex items-center justify-between p-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl shadow-2xl">
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
              
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5 z-10 group-hover:text-white transition-colors" />
                        <Input
                          placeholder="Search members..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-4 focus:ring-white/10 rounded-xl w-80 transition-all duration-300 hover:bg-white/15"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 backdrop-blur-md text-white px-4 py-2 text-sm font-bold border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300">
                        <Activity className="h-4 w-4 mr-2" />
                        {filteredAndSortedData.length} members
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

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
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[180px] border-none">Comments</TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[180px] border-none">Notes</TableHead>
                    
                    <TableHead className="text-white font-semibold text-sm h-14 px-4 min-w-[150px] border-none">Tags</TableHead>
                    
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
                        key={member.uniqueId}
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
                            <span className="text-slate-700 font-normal text-sm">{member.soldBy || 'Not assigned'}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px] max-w-[180px]">
                          {(() => {
                            const processed = processTextForDisplay(member.comments || '');
                            return processed.formatted.length > 0 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-gray-700">
                                    <ul className="list-disc list-inside space-y-1 max-h-16 overflow-hidden">
                                      {processed.formatted.slice(0, 2).map((item, idx) => (
                                        <li key={idx} className="truncate">{item}</li>
                                      ))}
                                      {processed.formatted.length > 2 && (
                                        <li className="text-gray-500 italic">+{processed.formatted.length - 2} more...</li>
                                      )}
                                    </ul>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <ul className="list-disc list-inside space-y-1">
                                    {processed.formatted.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            );
                          })()}
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px] max-w-[180px]">
                          {(() => {
                            const processed = processTextForDisplay(member.notes || '');
                            return processed.formatted.length > 0 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-xs text-gray-700">
                                    <ul className="list-disc list-inside space-y-1 max-h-16 overflow-hidden">
                                      {processed.formatted.slice(0, 2).map((item, idx) => (
                                        <li key={idx} className="truncate">{item}</li>
                                      ))}
                                      {processed.formatted.length > 2 && (
                                        <li className="text-gray-500 italic">+{processed.formatted.length - 2} more...</li>
                                      )}
                                    </ul>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <ul className="list-disc list-inside space-y-1">
                                    {processed.formatted.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            );
                          })()}
                        </TableCell>
                        
                        <TableCell className="px-4 py-2 h-[35px]">
                          <div className="flex items-center gap-1">
                            {member.tags && member.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {member.tags.slice(0, 2).map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1 py-0 text-[10px]">
                                    {tag}
                                  </Badge>
                                ))}
                                {member.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 px-1 py-0 text-[10px]">
                                    +{member.tags.length - 2}
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
                            {!member.tags?.length && !member.aiTags?.length && (
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
