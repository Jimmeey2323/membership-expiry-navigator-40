import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  X
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
  const availableTags = AI_TAGS.filter(tag => tagStats[tag] > 0);

  // Filter tags based on search term
  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTagToggle = (tag: AITag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <div className={`${className} space-y-2`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
        <Input
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-7 h-7 text-xs"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
            onClick={() => setSearchTerm('')}
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        )}
      </div>

      {/* Clear button */}
      {selectedTags.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllTags}
          className="w-full h-6 text-xs"
        >
          <X className="h-2.5 w-2.5 mr-1" />
          Clear {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}
        </Button>
      )}

      {/* Tags list */}
      <div className="max-h-32 overflow-y-auto space-y-1">
        {filteredTags.length > 0 ? (
          filteredTags.map(tag => {
            const count = tagStats[tag] || 0;
            const isSelected = selectedTags.includes(tag);
            
            return (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`
                  w-full flex items-center justify-between p-2 rounded-md border transition-colors text-left
                  ${isSelected 
                    ? 'bg-purple-500 border-purple-500 text-white' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Checkbox
                    checked={isSelected}
                    className="h-3 w-3"
                  />
                  <span className="text-xs font-medium truncate">{tag}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs h-4 px-1.5 ml-2 flex-shrink-0 ${
                    isSelected 
                      ? 'bg-white/20 text-white border-white/30' 
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </Badge>
              </button>
            );
          })
        ) : (
          <div className="text-xs text-slate-500 text-center py-2">
            {searchTerm ? 'No tags found' : 'No AI tags available'}
          </div>
        )}
      </div>
    </div>
  );
};