import { useState } from 'react';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  created_at: string;
  description: string;
}

interface ActivityHistoryProps {
  activities: Activity[];
}

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const ActivityHistory = ({ activities }: ActivityHistoryProps) => {
  const [showAll, setShowAll] = useState(false);
  
  const visibleActivities = showAll ? activities : activities.slice(0, 3);
  const hasMore = activities.length > 3;

  return (
    <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <History className="w-4 h-4" />
        Activity History
      </h3>

      {activities.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activities yet</p>
      ) : (
        <div className="space-y-3">
          {visibleActivities.map((a) => {
            const activityDate = new Date(a.created_at);
            const timeAgo = getTimeAgo(activityDate);
            const formattedDate = activityDate.toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div key={a.id} className="border-l-2 border-border pl-3 py-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-foreground">{a.description}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                  <span className="text-[10px] text-muted-foreground/60">• {timeAgo}</span>
                </div>
              </div>
            );
          })}
          
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show {activities.length - 3} more
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityHistory;
