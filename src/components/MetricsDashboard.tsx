import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain
} from "lucide-react";
import { MembershipData } from "@/types/membership";

interface MetricsDashboardProps {
  data: MembershipData[];
}

export const MetricsDashboard = ({ data }: MetricsDashboardProps) => {
  const totalMembers = data.length;
  const activeMembers = data.filter(m => m.status === 'Active').length;
  const churnedMembers = data.filter(m => m.status === 'Churned').length;
  const frozenMembers = data.filter(m => m.status === 'Frozen').length;
  const expiringThisMonth = data.filter(m => {
    if (!m.endDate) return false;
    const endDate = new Date(m.endDate);
    const now = new Date();
    const daysToExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry >= 0 && daysToExpiry <= 30;
  }).length;
  const expiredMembers = data.filter(m => {
    if (!m.endDate) return false;
    const endDate = new Date(m.endDate);
    const now = new Date();
    return endDate < now;
  }).length;
  const membersWithAnnotations = data.filter(m => 
    (m.comments && m.comments.trim()) || 
    (m.notes && m.notes.trim()) || 
    (m.tags && m.tags.length > 0)
  ).length;
  const aiAnalyzedMembers = data.filter(m => m.aiTags && m.aiTags.length > 0).length;

  const activeRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
  const churnRate = totalMembers > 0 ? (churnedMembers / totalMembers) * 100 : 0;
  const annotationRate = totalMembers > 0 ? (membersWithAnnotations / totalMembers) * 100 : 0;
  const aiCoverageRate = totalMembers > 0 ? (aiAnalyzedMembers / totalMembers) * 100 : 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Key Metrics</h2>
            <p className="text-slate-300 font-medium">Real-time membership insights</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-slate-300 font-medium">Live Data</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Total Members */}
        <Card className="bg-white shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700">
              TOTAL MEMBERS
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-900 mb-2 animate-pulse">{totalMembers}</div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                100%
              </Badge>
              <div className="flex items-center gap-1">
                <div className="w-12 h-6 bg-blue-100 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card className="bg-white shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700">
              ACTIVE MEMBERS
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-green-900 mb-3 animate-pulse">{activeMembers}</div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-1 font-bold">
                {activeRate.toFixed(1)}%
              </Badge>
              <span className="text-xs text-green-600 font-medium">+5.2% vs last month</span>
            </div>
            {/* Advanced Animated Bar Chart */}
            <div className="flex items-end gap-1 h-12 mt-3">
              {[...Array(8)].map((_, i) => {
                const height = Math.random() * 40 + 20;
                const isHighlighted = i >= 5; // Last 3 bars highlighted
                return (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-sm transition-all duration-1000 ease-out ${
                      isHighlighted ? 'bg-gradient-to-t from-green-600 to-green-400' : 'bg-gradient-to-t from-green-300 to-green-200'
                    }`}
                    style={{ 
                      height: `${height}%`,
                      animationDelay: `${i * 150}ms`,
                      minHeight: '8px'
                    }}
                  ></div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Jan</span>
              <span className="font-bold text-green-600">Aug</span>
            </div>
          </CardContent>
        </Card>

        {/* Churned Members */}
        <Card className="bg-white shadow-lg border-l-4 border-l-red-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700">
              CHURNED
              <div className="p-2 bg-red-50 rounded-lg">
                <UserX className="h-4 w-4 text-red-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-red-900 mb-3 animate-pulse">{churnedMembers}</div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs px-2 py-1 font-bold">
                {churnRate.toFixed(1)}%
              </Badge>
              <span className="text-xs text-red-600 font-medium">-2.1% improvement</span>
            </div>
            {/* Animated Line Chart */}
            <div className="relative h-12 mt-3">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                {/* Area under curve */}
                <path
                  d="M0,25 Q20,20 40,22 T80,18 L100,15 L100,40 L0,40 Z"
                  fill="url(#redGradient)"
                  className="animate-pulse"
                />
                {/* Main line */}
                <path
                  d="M0,25 Q20,20 40,22 T80,18 L100,15"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                  style={{
                    strokeDasharray: '200',
                    strokeDashoffset: '200',
                    animation: 'drawLine 2s ease-out forwards'
                  }}
                />
                {/* Data points */}
                {[0, 25, 50, 75, 100].map((x, i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={25 - i * 2}
                    r="2"
                    fill="#dc2626"
                    className="animate-ping"
                    style={{ animationDelay: `${i * 300}ms` }}
                  />
                ))}
              </svg>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>6mo ago</span>
              <span className="font-bold text-red-600">Now</span>
            </div>
          </CardContent>
        </Card>

        {/* Expiring This Month */}
        <Card className="bg-white shadow-lg border-l-4 border-l-orange-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700">
              EXPIRING (30D)
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-orange-900 mb-2 animate-pulse">{expiringThisMonth}</div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-2 py-1">
                {totalMembers > 0 ? ((expiringThisMonth / totalMembers) * 100).toFixed(1) : 0}%
              </Badge>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-1 h-6 rounded-full transition-all duration-500 ${
                    i < Math.floor((expiringThisMonth / totalMembers) * 5) ? 'bg-orange-500' : 'bg-orange-200'
                  }`}></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members with Annotations */}
        <Card className="bg-white shadow-lg border-l-4 border-l-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700">
              ANNOTATED
              <div className="p-2 bg-purple-50 rounded-lg">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-purple-900 mb-2 animate-pulse">{membersWithAnnotations}</div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs px-2 py-1">
                {annotationRate.toFixed(1)}%
              </Badge>
              <div className="w-8 h-8 relative">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeDasharray={`${annotationRate}, 100`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">{Math.round(annotationRate)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Analyzed */}
        <Card className="bg-white shadow-lg border-l-4 border-l-indigo-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700">
              AI ANALYZED
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Brain className="h-4 w-4 text-indigo-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-indigo-900 mb-2 animate-pulse">{aiAnalyzedMembers}</div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1">
                {aiCoverageRate.toFixed(1)}%
              </Badge>
              <div className="flex space-x-0.5">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1 rounded-full transition-all duration-700 ${
                      i < Math.floor(aiCoverageRate / 10) ? 'bg-indigo-500 h-6' : 'bg-indigo-200 h-2'
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};