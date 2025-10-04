import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  MessageSquare,
  Edit,
  Eye,
  TrendingDown
} from "lucide-react";
import { MembershipData, LapsingMember } from "@/types/membership";

interface LapsingMembersProps {
  data: MembershipData[];
  onEditMember?: (member: MembershipData) => void;
  onFollowUpMember?: (member: MembershipData) => void;
  className?: string;
}

export const LapsingMembers = ({
  data,
  onEditMember,
  onFollowUpMember,
  className = ''
}: LapsingMembersProps) => {
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  const lapsingMembers = useMemo(() => {
    const now = new Date();
    
    return data
      .filter(member => member.status === 'Active')
      .map(member => {
        const endDate = new Date(member.endDate);
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (daysUntilExpiry <= 3) priority = 'critical';
        else if (daysUntilExpiry <= 7) priority = 'high';
        else if (daysUntilExpiry <= 14) priority = 'medium';
        
        return {
          ...member,
          daysUntilExpiry,
          priority,
          followUpRequired: daysUntilExpiry <= 7
        } as LapsingMember;
      })
      .filter(member => member.daysUntilExpiry <= 30 && member.daysUntilExpiry > 0)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [data]);

  const filteredMembers = useMemo(() => {
    if (selectedPriority === 'all') return lapsingMembers;
    return lapsingMembers.filter(member => member.priority === selectedPriority);
  }, [lapsingMembers, selectedPriority]);

  const priorityStats = useMemo(() => {
    return {
      critical: lapsingMembers.filter(m => m.priority === 'critical').length,
      high: lapsingMembers.filter(m => m.priority === 'high').length,
      medium: lapsingMembers.filter(m => m.priority === 'medium').length,
      total: lapsingMembers.length
    };
  }, [lapsingMembers]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (lapsingMembers.length === 0) {
    return (
      <Card className={`backdrop-blur-xl bg-white/95 border-white/20 shadow-xl ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Calendar className="h-5 w-5" />
            Lapsing Members This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-green-400 mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">All Good! 🎉</h3>
            <p className="text-green-600">No members are expiring in the next 30 days.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`backdrop-blur-xl bg-white/95 border-white/20 shadow-xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Lapsing Members - Priority Action Required
          </CardTitle>
          <Badge className="bg-red-100 text-red-800 border-red-300">
            {priorityStats.total} members
          </Badge>
        </div>
        
        {/* Priority Filter Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedPriority === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPriority('all')}
            className="flex items-center gap-2"
          >
            <TrendingDown className="h-4 w-4" />
            All ({priorityStats.total})
          </Button>
          <Button
            variant={selectedPriority === 'critical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPriority('critical')}
            className={`flex items-center gap-2 ${selectedPriority === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50'}`}
          >
            Critical ({priorityStats.critical})
          </Button>
          <Button
            variant={selectedPriority === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPriority('high')}
            className={`flex items-center gap-2 ${selectedPriority === 'high' ? 'bg-orange-600 hover:bg-orange-700' : 'hover:bg-orange-50'}`}
          >
            High ({priorityStats.high})
          </Button>
          <Button
            variant={selectedPriority === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPriority('medium')}
            className={`flex items-center gap-2 ${selectedPriority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' : 'hover:bg-yellow-50'}`}
          >
            Medium ({priorityStats.medium})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {priorityStats.critical > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{priorityStats.critical} members</strong> are expiring within 3 days and require immediate attention!
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <div
              key={member.memberId}
              className={`
                relative p-4 rounded-lg border-l-4 bg-gradient-to-r
                ${member.priority === 'critical' 
                  ? 'border-l-red-500 from-red-50 to-red-50/50' 
                  : member.priority === 'high'
                  ? 'border-l-orange-500 from-orange-50 to-orange-50/50'
                  : 'border-l-yellow-500 from-yellow-50 to-yellow-50/50'
                }
                transition-all duration-200 hover:shadow-lg
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-indigo-700 text-sm">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {member.firstName} {member.lastName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {member.memberId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {member.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className={`${getPriorityBadgeColor(member.priority)} border`}>
                        {member.priority.toUpperCase()} PRIORITY
                      </Badge>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-700">
                          {member.daysUntilExpiry === 1 
                            ? '1 day left' 
                            : `${member.daysUntilExpiry} days left`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">
                          Expires: {new Date(member.endDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {member.followUpRequired && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                          Follow-up Required
                        </Badge>
                      )}
                      
                      <div className="flex gap-1">
                        {onEditMember && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditMember(member)}
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onFollowUpMember && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onFollowUpMember(member)}
                            className="h-8 w-8 p-0 hover:bg-purple-50"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredMembers.length === 0 && selectedPriority !== 'all' && (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No members in the {selectedPriority} priority category</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};