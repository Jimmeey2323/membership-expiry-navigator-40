import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  LayoutGrid, 
  Calendar, 
  BarChart3, 
  Trello, 
  Clock, 
  List,
  Settings
} from 'lucide-react';
import { ViewMode } from '@/types/membership';

interface ViewSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export const ViewSelector = ({
  currentView,
  onViewChange,
  className = ''
}) => {
  const views = [
    {
      id: 'table' as ViewMode,
      name: 'Table',
      icon: Table,
      description: 'Traditional table view with sortable columns',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'kanban' as ViewMode,
      name: 'Kanban',
      icon: Trello,
      description: 'Board view organized by member status',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'timeline' as ViewMode,
      name: 'Timeline',
      icon: Clock,
      description: 'Chronological view of membership renewals',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'calendar' as ViewMode,
      name: 'Calendar',
      icon: Calendar,
      description: 'Calendar view showing expiry dates',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'pivot' as ViewMode,
      name: 'Pivot',
      icon: BarChart3,
      description: 'Analytics pivot table with aggregations',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'list' as ViewMode,
      name: 'List',
      icon: List,
      description: 'Compact list view with key information',
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 'grid' as ViewMode,
      name: 'Grid',
      icon: LayoutGrid,
      description: 'Card-based grid layout',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <Card className={`backdrop-blur-xl bg-white/95 border-white/20 shadow-xl ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              View Options
            </h3>
            <Badge variant="outline" className="text-xs">
              Multi-View System
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = currentView === view.id;
              
              return (
                <div key={view.id} className="relative group">
                  <div 
                    className={`absolute inset-0 bg-gradient-to-r ${view.color} rounded-lg blur-sm opacity-0 group-hover:opacity-25 transition-opacity duration-300`}
                  />
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewChange(view.id)}
                    className={`
                      relative w-full h-auto p-3 flex flex-col items-center gap-2 border-2 transition-all duration-300
                      ${isActive 
                        ? `bg-gradient-to-r ${view.color} text-white border-transparent shadow-lg scale-105` 
                        : 'bg-white/80 hover:bg-white hover:border-slate-300 hover:scale-105'
                      }
                    `}
                    title={view.description}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                    <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-700'}`}>
                      {view.name}
                    </span>
                  </Button>
                </div>
              );
            })}
          </div>
          
          <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-200">
            Select a view mode to change how your data is displayed
          </div>
        </div>
      </CardContent>
    </Card>
  );
};