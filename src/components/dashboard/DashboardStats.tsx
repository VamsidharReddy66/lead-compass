import { TrendingUp, TrendingDown, Users, Calendar, CheckCircle, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-accent',
  iconBgColor = 'bg-accent/10',
}: StatCardProps) => {
  return (
    <div className="bg-card rounded-xl p-3 shadow-card">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', iconBgColor)}>
        <Icon className={cn('w-4 h-4', iconColor)} />
      </div>
      <div className="font-display text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{title}</div>
    </div>
  );
};

interface DashboardStatsProps {
  totalLeads: number;
  hotLeads: number;
  todayFollowUps: number;
  closedDeals: number;
  conversionRate: number;
}

const DashboardStats = ({
  totalLeads,
  hotLeads,
  todayFollowUps,
  closedDeals,
  conversionRate,
}: DashboardStatsProps) => {
  return (
    <div className="space-y-3">
      {/* Top row - 2 cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Total Leads"
          value={totalLeads}
          icon={Users}
          iconColor="text-status-new"
          iconBgColor="bg-status-new/10"
        />
        <StatCard
          title="Hot Leads"
          value={hotLeads}
          icon={Flame}
          iconColor="text-lead-hot"
          iconBgColor="bg-lead-hot/10"
        />
      </div>
      {/* Second row - 2 cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Today's Tasks"
          value={todayFollowUps}
          icon={Calendar}
          iconColor="text-accent"
          iconBgColor="bg-accent/10"
        />
        <StatCard
          title="Deals Closed"
          value={closedDeals}
          icon={CheckCircle}
          iconColor="text-status-closed"
          iconBgColor="bg-status-closed/10"
        />
      </div>
      {/* Bottom row - 1 card */}
      <StatCard
        title="Conversion Rate"
        value={`${conversionRate}%`}
        icon={TrendingUp}
        iconColor="text-status-negotiation"
        iconBgColor="bg-status-negotiation/10"
      />
    </div>
  );
};

export default DashboardStats;
