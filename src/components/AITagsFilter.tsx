import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";
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

  const getTagStats = () => {
    const tagCounts: Record<string, number> = {};
    data.forEach(member => {
      if (member.aiTags && Array.isArray(member.aiTags)) {
        member.aiTags.forEach(tag => {
          if (typeof tag === 'string') {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });
    return tagCounts;
  };

  const tagStats = getTagStats();

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

  const clearAllTags = () => {
    onTagsChange([]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700">AI Tags</span>
        {selectedTags.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllTags} className="h-5 px-2 text-xs">
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-7 h-7 text-xs"
        />
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map(tag => (
            <Badge
              key={tag}
              className="text-xs cursor-pointer hover:bg-red-500"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
              <X className="h-2 w-2 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md bg-slate-50">
        {filteredTags.map(tag => {
          const isSelected = selectedTags.includes(tag);
          const count = tagStats[tag] || 0;

          return (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`w-full flex items-center justify-between p-1.5 border-b border-slate-200 last:border-0 transition-colors text-left ${
                isSelected ? 'bg-blue-500 text-white' : 'bg-white hover:bg-blue-50 text-slate-700'
              }`}
            >
              <span className="text-xs font-medium truncate flex-1">{tag}</span>
              <span className={`text-xs ml-2 px-1 rounded ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredTags.length === 0 && (
        <div className="text-center py-2 text-slate-500 text-xs">
          No tags found
        </div>
      )}
    </div>
  );
};
