
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
        <Card className={`premium-card shadow-2xl border border-gray-200 bg-white ${className}`}>
          <div className="p-8">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
                  <div className="relative p-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-2xl shadow-xl">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent">
                    {title}
                  </h3>
                  <p className="text-gray-600 font-medium mt-1">
                    Comprehensive member management
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-500/20 rounded-xl blur-sm"></div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 bg-white border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 rounded-xl w-80 transition-all duration-300 shadow-lg"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-3 text-base font-bold border border-gray-600 shadow-md"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    {filteredAndSortedData.length} members
                  </Badge>
                </div>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50/30 via-transparent to-gray-50/30"></div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b border-gray-600 hover:bg-gradient-to-r hover:from-gray-700 hover:via-gray-600 hover:to-gray-700 transition-all duration-300">
                    <TableHead className="text-white font-bold text-sm h-16 px-6">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-bold text-white hover:text-gray-200 hover:bg-transparent transition-colors"
                        onClick={() => handleSort('memberId')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Member ID {getSortIcon('memberId')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 min-w-[200px]">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-bold text-white hover:text-gray-200 hover:bg-transparent"
                        onClick={() => handleSort('firstName')}
                      >
                        Member Name {getSortIcon('firstName')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 min-w-[250px]">Email Address</TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 min-w-[280px]">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-bold text-white hover:text-gray-200 hover:bg-transparent"
                        onClick={() => handleSort('membershipName')}
                      >
                        Membership Type {getSortIcon('membershipName')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 min-w-[150px]">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-bold text-white hover:text-gray-200 hover:bg-transparent"
                        onClick={() => handleSort('endDate')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Expiry Date {getSortIcon('endDate')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 min-w-[180px]">
                      <MapPin className="h-4 w-4 mr-2 inline" />
                      Location
                    </TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 text-center min-w-[120px]">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-bold text-white hover:text-gray-200 hover:bg-transparent"
                        onClick={() => handleSort('sessionsLeft')}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Sessions {getSortIcon('sessionsLeft')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 text-center min-w-[120px]">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-bold text-white hover:text-gray-200 hover:bg-transparent"
                        onClick={() => handleSort('status')}
                      >
                        Status {getSortIcon('status')}
                      </Button>
                    </TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 min-w-[150px]">Tags & Notes</TableHead>
                    
                    <TableHead className="text-white font-bold text-sm h-16 px-6 min-w-[120px] text-center">Actions</TableHead>
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
                        className="border-b border-gray-100 hover:bg-gray-50 transition-all duration-300 cursor-pointer group h-20"
                        onClick={() => handleRowClick(member)}
                      >
                        <TableCell className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700 text-sm">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </div>
                            <span className="font-mono text-gray-700 font-semibold">{member.memberId}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 text-base">
                                {member.firstName} {member.lastName}
                              </span>
                              <span className="text-gray-500 text-sm">
                                ID: {member.memberId}
                              </span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Eye className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-6 py-6">
                          <span className="text-gray-700 font-medium">{member.email}</span>
                        </TableCell>
                        
                        <TableCell className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            {getMembershipIcon(member.membershipName)}
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-gray-700 font-medium truncate max-w-[240px] block">
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
                            <span className="text-gray-700 font-medium">
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
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 font-medium">{member.location}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-6 py-6 text-center">
                          <Badge 
                            variant={(member.sessionsLeft || 0) > 10 ? "default" : (member.sessionsLeft || 0) > 3 ? "secondary" : (member.sessionsLeft || 0) > 0 ? "outline" : "destructive"}
                            className={`font-bold text-base px-4 py-2 ${
                              (member.sessionsLeft || 0) > 10 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              (member.sessionsLeft || 0) > 3 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              (member.sessionsLeft || 0) > 0 ? 'bg-amber-100 text-amber-800 border-amber-300' : ''
                            }`}
                          >
                            {member.sessionsLeft || 0}
                          </Badge>
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
                                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 px-2 py-1">
                                    +{member.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {(member.comments || member.notes) && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                <span className="text-xs text-gray-500">Has notes</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="px-6 py-6">
                          <div className="flex items-center justify-center gap-2">
                            {onEditMember && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditMember(member);
                                }}
                                className="backdrop-blur-sm bg-white/80 hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                              >
                                <Edit className="h-4 w-4" />
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
                                className="backdrop-blur-sm bg-white/80 hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800"
                              >
                                <MessageSquare className="h-4 w-4" />
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

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-lg">
                <p className="text-gray-700 text-base font-semibold">
                  Showing <span className="text-gray-600 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="text-gray-600 font-bold">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span> of{' '}
                  <span className="text-gray-600 font-bold">{filteredAndSortedData.length}</span> results
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-gray-300 hover:bg-white hover:border-gray-500 font-semibold px-6 shadow-md"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-base font-bold text-gray-700 shadow-md">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-gray-300 hover:bg-white hover:border-gray-500 font-semibold px-6 shadow-md"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
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
