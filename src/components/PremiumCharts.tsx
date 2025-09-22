
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
  RadialBarChart, RadialBar, ComposedChart
} from "recharts";
import { MembershipData } from "@/types/membership";
import { useFilters } from "@/contexts/FilterContext";
import { 
  TrendingUp, Users, MapPin, Calendar, BarChart3, Activity,
  Crown, Target, Zap, Award, DollarSign, Clock
} from "lucide-react";

interface PremiumChartsProps {
  data: MembershipData[];
}

const PREMIUM_COLORS = {
  primary: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'],
  gradients: [
    'url(#gradient1)', 'url(#gradient2)', 'url(#gradient3)', 'url(#gradient4)',
    'url(#gradient5)', 'url(#gradient6)', 'url(#gradient7)', 'url(#gradient8)'
  ]
};

export const PremiumCharts = ({ data }: PremiumChartsProps) => {
  const { getFilteredData, hasActiveFilters, getActiveFilterCount } = useFilters();
  const [activeChart, setActiveChart] = useState<'overview' | 'revenue' | 'engagement' | 'trends'>('overview');

  // Use filtered data from global context
  const filteredData = getFilteredData(data);

  // Data processing using filtered data
  const statusData = filteredData.reduce((acc, member) => {
    acc[member.status] = (acc[member.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusData).map(([name, value], index) => ({ 
    name, 
    value,
    color: PREMIUM_COLORS.primary[index % PREMIUM_COLORS.primary.length]
  }));

  const membershipTypeData = filteredData.reduce((acc, member) => {
    const shortName = member.membershipName.length > 20 
      ? member.membershipName.substring(0, 20) + '...' 
      : member.membershipName;
    acc[shortName] = (acc[shortName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(membershipTypeData)
    .map(([name, count]) => ({ name, count, fullName: name }))
    .slice(0, 8);

  const locationData = filteredData.reduce((acc, member) => {
    if (member.location && member.location !== '-') {
      acc[member.location] = (acc[member.location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const locationChartData = Object.entries(locationData)
    .map(([name, count]) => ({ name, count }))
    .slice(0, 6);

  // Advanced trend data with revenue simulation
  const trendData = [
    { month: 'Jan', active: 120, expired: 25, new: 35, revenue: 45000, engagement: 78 },
    { month: 'Feb', active: 135, expired: 28, new: 42, revenue: 52000, engagement: 82 },
    { month: 'Mar', active: 148, expired: 22, new: 38, revenue: 48000, engagement: 79 },
    { month: 'Apr', active: 156, expired: 30, new: 45, revenue: 58000, engagement: 85 },
    { month: 'May', active: 168, expired: 26, new: 52, revenue: 62000, engagement: 88 },
    { month: 'Jun', active: 185, expired: 24, new: 48, revenue: 67000, engagement: 91 }
  ];

  const sessionsData = filteredData.reduce((acc, member) => {
    const range = member.sessionsLeft === 0 ? '0' :
                 member.sessionsLeft <= 5 ? '1-5' :
                 member.sessionsLeft <= 10 ? '6-10' :
                 member.sessionsLeft <= 20 ? '11-20' : '20+';
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sessionsChartData = Object.entries(sessionsData).map(([range, count]) => ({ range, count }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-2xl backdrop-blur-sm bg-white/95">
          <p className="font-bold text-slate-800 mb-3 text-base">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-slate-700 font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const GradientDefs = () => (
    <defs>
      <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
      </linearGradient>
      <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9}/>
        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
      </linearGradient>
      <linearGradient id="gradient3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
        <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
      </linearGradient>
      <linearGradient id="gradient4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9}/>
        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.3}/>
      </linearGradient>
      <radialGradient id="radialGradient1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
        <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.6}/>
      </radialGradient>
    </defs>
  );

  const chartButtons = [
    { key: 'overview', label: 'Member Overview', icon: Users, color: 'from-blue-500 to-blue-600' },
    { key: 'revenue', label: 'Revenue Analytics', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    { key: 'engagement', label: 'Engagement Metrics', icon: Activity, color: 'from-purple-500 to-purple-600' },
    { key: 'trends', label: 'Growth Trends', icon: TrendingUp, color: 'from-orange-500 to-orange-600' }
  ] as const;

  const renderChart = () => {
    switch (activeChart) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200">
              <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                Membership Status Distribution
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <GradientDefs />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="url(#radialGradient1)"
                    dataKey="value"
                    stroke="white"
                    strokeWidth={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '14px', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200">
              <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <div className="p-2 bg-purple-500 text-white rounded-lg">
                  <Target className="h-5 w-5" />
                </div>
                Sessions Distribution
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sessionsChartData}>
                  <GradientDefs />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                  <XAxis 
                    dataKey="range" 
                    stroke="#64748B"
                    fontSize={12}
                    fontWeight={600}
                  />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill="url(#gradient2)" 
                    radius={[8, 8, 0, 0]}
                    stroke="#8B5CF6"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-200">
              <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                Revenue & Member Growth Correlation
              </h4>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={trendData}>
                  <GradientDefs />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} fontWeight={600} />
                  <YAxis yAxisId="members" orientation="left" stroke="#64748B" fontSize={12} />
                  <YAxis yAxisId="revenue" orientation="right" stroke="#10B981" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="members" dataKey="new" fill="url(#gradient1)" name="New Members" radius={[4, 4, 0, 0]} />
                  <Area yAxisId="revenue" dataKey="revenue" stroke="#10B981" fill="url(#gradient3)" name="Revenue ($)" />
                  <Line yAxisId="members" type="monotone" dataKey="active" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 6 }} name="Active Members" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'engagement':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-200">
              <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <div className="p-2 bg-purple-500 text-white rounded-lg">
                  <Activity className="h-5 w-5" />
                </div>
                Engagement Score Trends
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <GradientDefs />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} fontWeight={600} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#8B5CF6" 
                    fill="url(#gradient2)" 
                    strokeWidth={3}
                    name="Engagement %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-200">
              <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-lg">
                  <MapPin className="h-5 w-5" />
                </div>
                Location Performance
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart data={locationChartData} innerRadius="20%" outerRadius="90%">
                  <RadialBar 
                    dataKey="count" 
                    cornerRadius={10}
                    fill="url(#gradient1)"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-200">
              <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <div className="p-2 bg-orange-500 text-white rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Multi-Metric Growth Analysis
              </h4>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <GradientDefs />
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} fontWeight={600} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="active" 
                    stroke="#10B981" 
                    strokeWidth={4} 
                    dot={{ r: 8, fill: "#10B981", strokeWidth: 2, stroke: "white" }}
                    name="Active Members"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="new" 
                    stroke="#3B82F6" 
                    strokeWidth={4} 
                    dot={{ r: 8, fill: "#3B82F6", strokeWidth: 2, stroke: "white" }}
                    name="New Signups"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expired" 
                    stroke="#EF4444" 
                    strokeWidth={4} 
                    dot={{ r: 8, fill: "#EF4444", strokeWidth: 2, stroke: "white" }}
                    name="Expired"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
    }
  };

  const getChartStats = () => {
    const totalMembers = filteredData.length;
    const activeMembers = filteredData.filter(m => m.status === 'Active').length;
    const totalSessions = filteredData.reduce((sum, m) => sum + m.sessionsLeft, 0);
    const avgSessions = totalMembers > 0 ? Math.round(totalSessions / totalMembers) : 0;
    const activeRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
    const revenueProjection = totalMembers * 89; // Average monthly fee simulation

    return [
      { label: 'Total Members', value: totalMembers.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
      { label: 'Active Rate', value: `${activeRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp },
      { label: 'Total Sessions', value: totalSessions.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50', icon: Activity },
      { label: 'Est. Revenue', value: `$${revenueProjection.toLocaleString()}`, color: 'text-orange-600', bg: 'bg-orange-50', icon: DollarSign }
    ];
  };

  return (
    <Card className="premium-card shadow-2xl border-2 border-slate-200 bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-sm">
      <div className="p-8">
        {/* Premium Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white rounded-2xl shadow-xl">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                Premium Analytics Dashboard
                <Crown className="h-6 w-6 text-yellow-500" />
              </h3>
              <p className="text-slate-600 font-medium">
                {hasActiveFilters() 
                  ? `Showing filtered results (${getActiveFilterCount()} filter${getActiveFilterCount() !== 1 ? 's' : ''} active) - ${filteredData.length}/${data.length} members`
                  : `Comprehensive insights for ${data.length} members`
                }
              </p>
            </div>
          </div>
          
          {hasActiveFilters() && (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm font-medium">
              Filtered View
            </Badge>
          )}
          
          <div className="flex gap-3">
            {chartButtons.map((button) => (
              <Button
                key={button.key}
                variant={activeChart === button.key ? "default" : "outline"}
                size="lg"
                onClick={() => setActiveChart(button.key)}
                className={`${
                  activeChart === button.key 
                    ? `bg-gradient-to-r ${button.color} text-white shadow-xl scale-105 border-0` 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                } transition-all duration-300 font-semibold px-6 py-3`}
              >
                <button.icon className="h-5 w-5 mr-2" />
                {button.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {getChartStats().map((stat, index) => (
            <div 
              key={index} 
              className={`${stat.bg} p-6 rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 bg-white rounded-xl shadow-md`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <Badge variant="secondary" className="bg-white/60 text-slate-700 font-semibold">
                  Live
                </Badge>
              </div>
              <p className="text-slate-600 font-semibold mb-1 text-sm uppercase tracking-wide">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chart Container */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-orange-500/5"></div>
          <div className="relative p-8">
            {renderChart()}
          </div>
        </div>
      </div>
    </Card>
  );
};
