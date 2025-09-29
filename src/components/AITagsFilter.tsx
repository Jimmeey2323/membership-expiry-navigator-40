import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  Filter,
  Tag
} from "lucide-react";
import { AI_TAGS, AITag } from "@/services/geminiAI";
import { MembershipData } from "@/types/membership";

interface AITagsFilterProps {
  data: MembershipData[];
  selectedTags: AITag[];
  onTagsChange: (tags: AITag[]) => void;
  className?: string;
}

export const AITagsFilter = ({ data, selectedTags, onTagsChange, className }: AITagsFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get tag statistics from data
  const getTagStats = () => {
    const tagCounts: Record<string, number> = {};
    
    data.forEach(member => {
      if (member.aiTags && member.aiTags.length > 0) {
        member.aiTags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return tagCounts;
  };

  const tagStats = getTagStats();
  const totalAnalyzedMembers = data.filter(m => m.aiTags && m.aiTags.length > 0).length;

  // Filter tags based on search term
  const filteredTags = AI_TAGS.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTagToggle = (tag: AITag) => {
    const isSelected = selectedTags.includes(tag);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleSelectAll = () => {
    onTagsChange([...filteredTags]);
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const getTagColor = (tag: AITag): string => {
    const colorMap: Record<string, string> = {
      'Lack of visible results': 'bg-red-100 text-red-800 border-red-200',
      'Workout plateau or repetition fatigue': 'bg-orange-100 text-orange-800 border-orange-200',
      'Mismatch of class style': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Instructor connection issues': 'bg-pink-100 text-pink-800 border-pink-200',
      'Studio environment concerns': 'bg-purple-100 text-purple-800 border-purple-200',
      'Inconvenient class timings': 'bg-blue-100 text-blue-800 border-blue-200',
      'Location accessibility challenges': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Difficulty booking classes': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Cost concerns': 'bg-green-100 text-green-800 border-green-200',
      'Perceived value gap': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Life changes': 'bg-teal-100 text-teal-800 border-teal-200',
      'Time constraints': 'bg-slate-100 text-slate-800 border-slate-200',
      'Health or injury issues': 'bg-red-200 text-red-900 border-red-300',
      'Seasonal drop in motivation': 'bg-amber-100 text-amber-800 border-amber-200',
      'Preference for alternative fitness options': 'bg-lime-100 text-lime-800 border-lime-200',
      'Unresponsive': 'bg-gray-100 text-gray-800 border-gray-200',
      'Needs additional discounts': 'bg-violet-100 text-violet-800 border-violet-200',
      'Miscellaneous': 'bg-neutral-100 text-neutral-800 border-neutral-200'
    };
    return colorMap[tag] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                AI Tags Filter
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {selectedTags.length} selected
                  </Badge>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Stats Summary */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-purple-800">Total Analyzed</p>
                  <p className="text-purple-600">{totalAnalyzedMembers} members</p>
                </div>
                <div>
                  <p className="font-medium text-purple-800">Unique Tags Found</p>
                  <p className="text-purple-600">{Object.keys(tagStats).length} tags</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search AI tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredTags.every(tag => selectedTags.includes(tag))}
              >
                <Filter className="h-3 w-3 mr-1" />
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedTags.length === 0}
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>

            {/* Tag List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredTags.map(tag => {
                const count = tagStats[tag] || 0;
                const isSelected = selectedTags.includes(tag);
                const percentage = totalAnalyzedMembers > 0 ? (count / totalAnalyzedMembers * 100).toFixed(1) : '0';
                
                return (
                  <div
                    key={tag}
                    className={`flex items-center space-x-3 p-2 rounded-lg border transition-colors ${
                      isSelected ? 'bg-purple-50 border-purple-200' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Checkbox
                      id={tag}
                      checked={isSelected}
                      onCheckedChange={() => handleTagToggle(tag)}
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={tag} 
                        className="cursor-pointer flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="h-3 w-3 text-purple-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {tag}
                          </span>
                        </div>
                        
                        {count > 0 && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getTagColor(tag)}`}
                            >
                              {count} ({percentage}%)
                            </Badge>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                );
              })}
              
              {filteredTags.length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p>No tags found matching "{searchTerm}"</p>
                </div>
              )}
            </div>

            {/* Selected Tags Summary */}
            {selectedTags.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Selected Tags ({selectedTags.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <Badge 
                      key={tag} 
                      className={`text-xs ${getTagColor(tag)} cursor-pointer hover:opacity-80`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};