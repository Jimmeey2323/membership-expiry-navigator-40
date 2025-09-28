import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Tag,
  TrendingUp,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { geminiAIService, AITag, AI_TAGS } from "@/services/geminiAI";
import { MembershipData } from "@/types/membership";

interface AIAnalysisModalProps {
  data: MembershipData[];
  onUpdateMember: (member: MembershipData) => void;
  trigger?: React.ReactNode;
}

interface AnalysisProgress {
  total: number;
  completed: number;
  current: string;
  results: Array<{
    memberId: string;
    memberName: string;
    suggestedTags: AITag[];
    confidence: number;
    reasoning: string;
    sentiment?: string;
    churnRisk?: string;
  }>;
}

export const AIAnalysisModal = ({ data, onUpdateMember, trigger }: AIAnalysisModalProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({
    total: 0,
    completed: 0,
    current: '',
    results: []
  });
  const [isOpen, setIsOpen] = useState(false);

  const membersWithContent = data.filter(member => {
    const hasComments = member.comments && member.comments.trim();
    const hasNotes = member.notes && member.notes.trim();
    return hasComments || hasNotes;
  });

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setIsPaused(false);
    setProgress({
      total: membersWithContent.length,
      completed: 0,
      current: '',
      results: []
    });

    try {
      let completedCount = 0;
      const results: AnalysisProgress['results'] = [];

      for (const member of membersWithContent) {
        if (isPaused) {
          toast.info('Analysis paused');
          break;
        }

        setProgress(prev => ({
          ...prev,
          current: `${member.firstName} ${member.lastName}`,
          completed: completedCount
        }));

        try {
          const analysis = await geminiAIService.analyzeMember(member);
          
          if (analysis.suggestedTags.length > 0) {
            // Update the member with AI tags
            const updatedMember: MembershipData = {
              ...member,
              aiTags: analysis.suggestedTags,
              aiAnalysisDate: new Date().toISOString(),
              aiConfidence: analysis.confidence,
              aiReasoning: analysis.reasoning,
              aiSentiment: analysis.sentiment || 'neutral',
              aiChurnRisk: analysis.churnRisk || 'medium'
            };
            
            onUpdateMember(updatedMember);
          }

          results.push({
            memberId: member.memberId,
            memberName: `${member.firstName} ${member.lastName}`,
            suggestedTags: analysis.suggestedTags,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            sentiment: analysis.sentiment || 'neutral',
            churnRisk: analysis.churnRisk || 'medium'
          });

          completedCount++;
          setProgress(prev => ({
            ...prev,
            completed: completedCount,
            results: [...results]
          }));

        } catch (error) {
          console.error(`Failed to analyze ${member.firstName} ${member.lastName}:`, error);
          results.push({
            memberId: member.memberId,
            memberName: `${member.firstName} ${member.lastName}`,
            suggestedTags: ['Miscellaneous'],
            confidence: 0,
            reasoning: 'Analysis failed',
            sentiment: 'neutral',
            churnRisk: 'high'
          });
          completedCount++;
        }
      }

      if (!isPaused) {
        toast.success(`Analysis completed! Processed ${completedCount} members.`);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setIsPaused(false);
    }
  };

  const pauseAnalysis = () => {
    setIsPaused(true);
    setIsAnalyzing(false);
  };

  const resetAnalysis = () => {
    setIsAnalyzing(false);
    setIsPaused(false);
    setProgress({
      total: 0,
      completed: 0,
      current: '',
      results: []
    });
  };

  const getProgressPercentage = () => {
    return progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  };

  const getTagColor = (tag: AITag): string => {
    const colorMap: Record<string, string> = {
      'Lack of visible results': 'bg-red-100 text-red-800',
      'Workout plateau or repetition fatigue': 'bg-orange-100 text-orange-800',
      'Mismatch of class style': 'bg-yellow-100 text-yellow-800',
      'Instructor connection issues': 'bg-pink-100 text-pink-800',
      'Studio environment concerns': 'bg-purple-100 text-purple-800',
      'Inconvenient class timings': 'bg-blue-100 text-blue-800',
      'Location accessibility challenges': 'bg-indigo-100 text-indigo-800',
      'Difficulty booking classes': 'bg-cyan-100 text-cyan-800',
      'Cost concerns': 'bg-green-100 text-green-800',
      'Perceived value gap': 'bg-emerald-100 text-emerald-800',
      'Life changes': 'bg-teal-100 text-teal-800',
      'Time constraints': 'bg-slate-100 text-slate-800',
      'Health or injury issues': 'bg-red-200 text-red-900',
      'Seasonal drop in motivation': 'bg-amber-100 text-amber-800',
      'Preference for alternative fitness options': 'bg-lime-100 text-lime-800',
      'Unresponsive': 'bg-gray-100 text-gray-800',
      'Needs additional discounts': 'bg-violet-100 text-violet-800',
      'Miscellaneous': 'bg-neutral-100 text-neutral-800'
    };
    return colorMap[tag] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentColor = (sentiment: string): string => {
    const colorMap: Record<string, string> = {
      'positive': 'bg-green-100 text-green-700',
      'neutral': 'bg-gray-100 text-gray-700',
      'negative': 'bg-red-100 text-red-700',
      'mixed': 'bg-yellow-100 text-yellow-700'
    };
    return colorMap[sentiment] || 'bg-gray-100 text-gray-700';
  };

  const getChurnRiskColor = (churnRisk: string): string => {
    const colorMap: Record<string, string> = {
      'low': 'bg-green-50 text-green-600 border-green-200',
      'medium': 'bg-orange-50 text-orange-600 border-orange-200',
      'high': 'bg-red-50 text-red-600 border-red-200'
    };
    return colorMap[churnRisk] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg border-0 backdrop-blur-sm">
            <Brain className="h-4 w-4 mr-2" />
            AI Analysis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Member Analysis
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Advanced AI-powered insights and analytics for your membership data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Analysis Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{data.length}</p>
                  <p className="text-sm text-slate-600">Total Members</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{membersWithContent.length}</p>
                  <p className="text-sm text-slate-600">With Content</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{AI_TAGS.length}</p>
                  <p className="text-sm text-slate-600">AI Tags</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{data.filter(m => m.aiTags && m.aiTags.length > 0).length}</p>
                  <p className="text-sm text-slate-600">Already Analyzed</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available AI Tags:</span>
                  <Badge variant="outline">{AI_TAGS.length} tags</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {AI_TAGS.slice(0, 6).map(tag => (
                    <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                      {tag}
                    </Badge>
                  ))}
                  {AI_TAGS.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{AI_TAGS.length - 6} more...
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analysis Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {!isAnalyzing && !isPaused && (
                  <Button onClick={startAnalysis} disabled={membersWithContent.length === 0}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Analysis
                  </Button>
                )}
                
                {isAnalyzing && (
                  <Button onClick={pauseAnalysis} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                {(progress.results.length > 0 || isPaused) && (
                  <Button onClick={resetAnalysis} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>

              {membersWithContent.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      No members found with comments or notes to analyze.
                    </p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {(isAnalyzing || progress.total > 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {progress.completed}/{progress.total}</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  {progress.current && (
                    <p className="text-sm text-slate-600">Currently analyzing: {progress.current}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {progress.results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Analysis Results ({progress.results.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {progress.results.map((result, index) => (
                      <div key={result.memberId} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{result.memberName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {result.sentiment && (
                                <Badge variant="secondary" className={`text-xs ${getSentimentColor(result.sentiment)}`}>
                                  {result.sentiment}
                                </Badge>
                              )}
                              {result.churnRisk && (
                                <Badge variant="outline" className={`text-xs ${getChurnRiskColor(result.churnRisk)}`}>
                                  {result.churnRisk} risk
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {result.confidence}% confidence
                          </Badge>
                        </div>
                        
                        {result.suggestedTags.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {result.suggestedTags.map(tag => (
                                <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-slate-600">{result.reasoning}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No tags suggested</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};