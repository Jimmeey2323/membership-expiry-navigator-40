import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Brain, TrendingUp, Users, AlertTriangle, Target } from "lucide-react";
import { MembershipData } from "@/types/membership";
import { AI_TAGS, AITag } from "@/services/geminiAI";

interface AIAnalyticsProps {
  data: MembershipData[];
}

export const AIAnalytics = ({ data }: AIAnalyticsProps) => {
  const aiAnalytics = useMemo(() => {
    const analyzedMembers = data.filter(member => member.aiTags && member.aiTags.length > 0);
    const totalMembers = data.length;
    const analyzedCount = analyzedMembers.length;
    
    // Tag frequency analysis
    const tagCounts: Record<string, number> = {};
    const confidenceScores: number[] = [];
    
    analyzedMembers.forEach(member => {
      if (member.aiTags) {
        member.aiTags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      if (member.aiConfidence) {
        confidenceScores.push(member.aiConfidence);
      }
    });

    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length 
      : 0;

    // Chart data
    const barChartData = sortedTags.map(([tag, count]) => ({
      tag: tag.length > 20 ? tag.substring(0, 20) + '...' : tag,
      fullTag: tag,
      count,
      percentage: ((count / analyzedCount) * 100).toFixed(1)
    }));

    const pieChartData = sortedTags.slice(0, 6).map(([tag, count], index) => ({
      name: tag.length > 15 ? tag.substring(0, 15) + '...' : tag,
      fullName: tag,
      value: count,
      color: `hsl(${250 + index * 30}, 70%, ${60 + index * 5}%)`
    }));

    // Risk analysis
    const riskTags = [
      'Lack of visible results',
      'Workout plateau or repetition fatigue',
      'Cost concerns',
      'Perceived value gap',
      'Time constraints',
      'Health or injury issues',
      'Unresponsive'
    ];

    const riskMembers = analyzedMembers.filter(member => 
      member.aiTags?.some(tag => riskTags.includes(tag))
    );

    return {
      totalMembers,
      analyzedCount,
      analyzedPercentage: totalMembers > 0 ? (analyzedCount / totalMembers * 100).toFixed(1) : 0,
      tagCounts,
      sortedTags,
      averageConfidence: averageConfidence.toFixed(1),
      barChartData,
      pieChartData,
      riskMembers: riskMembers.length,
      riskPercentage: analyzedCount > 0 ? (riskMembers.length / analyzedCount * 100).toFixed(1) : 0,
      topIssue: sortedTags[0] || ['No data', 0],
      uniqueTags: Object.keys(tagCounts).length
    };
  }, [data]);

  const getTagColor = (tag: string): string => {
    const colorMap: Record<string, string> = {
      'Lack of visible results': 'bg-red-100 text-red-800 border-red-200',
      'Workout plateau or repetition fatigue': 'bg-orange-100 text-orange-800 border-orange-200',
      'Cost concerns': 'bg-green-100 text-green-800 border-green-200',
      'Time constraints': 'bg-slate-100 text-slate-800 border-slate-200',
      'Health or injury issues': 'bg-red-200 text-red-900 border-red-300',
      'Unresponsive': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colorMap[tag] || 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.fullTag}</p>
          <p className="text-blue-600">Members: {data.count}</p>
          <p className="text-gray-600">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-blue-600">Count: {data.value}</p>
        </div>
      );
    }
    return null;
  };

  if (aiAnalytics.analyzedCount === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No AI Analysis Data</h3>
              <p className="text-gray-500">
                Run AI analysis on members with comments or notes to see insights here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">AI Analyzed</p>
                <p className="text-2xl font-bold text-purple-900">{aiAnalytics.analyzedCount}</p>
                <p className="text-xs text-purple-500">
                  {aiAnalytics.analyzedPercentage}% of total
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-blue-900">{aiAnalytics.averageConfidence}%</p>
                <p className="text-xs text-blue-500">
                  AI certainty level
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">At Risk</p>
                <p className="text-2xl font-bold text-orange-900">{aiAnalytics.riskMembers}</p>
                <p className="text-xs text-orange-500">
                  {aiAnalytics.riskPercentage}% of analyzed
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Unique Issues</p>
                <p className="text-2xl font-bold text-green-900">{aiAnalytics.uniqueTags}</p>
                <p className="text-xs text-green-500">
                  Different concerns
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Issue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Top Member Concern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div>
              <h3 className="font-semibold text-lg text-orange-900">
                {aiAnalytics.topIssue[0]}
              </h3>
              <p className="text-orange-700">
                Affects {aiAnalytics.topIssue[1]} members ({((aiAnalytics.topIssue[1] / aiAnalytics.analyzedCount) * 100).toFixed(1)}%)
              </p>
            </div>
            <Badge className={getTagColor(aiAnalytics.topIssue[0])}>
              Most Common
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aiAnalytics.barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="tag" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={aiAnalytics.pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {aiAnalytics.pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Issue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiAnalytics.sortedTags.map(([tag, count], index) => {
              const percentage = ((count / aiAnalytics.analyzedCount) * 100);
              return (
                <div key={tag} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getTagColor(tag)} variant="outline">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-sm">{tag}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{count} members</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};