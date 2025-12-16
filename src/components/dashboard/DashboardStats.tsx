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
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-accent',
  iconBgColor = 'bg-accent/10',
}: StatCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBgColor)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
              isPositive && 'text-status-closed bg-status-closed/10',
              isNegative && 'text-status-lost bg-status-lost/10',
              !isPositive && !isNegative && 'text-muted-foreground bg-secondary'
            )}
          >
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="font-display text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
      {changeLabel && <div className="text-xs text-muted-foreground mt-1">{changeLabel}</div>}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Leads"
        value={totalLeads}
        change={12}
        changeLabel="vs last month"
        icon={Users}
        iconColor="text-status-new"
        iconBgColor="bg-status-new/10"
      />
      <StatCard
        title="Hot Leads"
        value={hotLeads}
        change={8}
        icon={Flame}
        iconColor="text-lead-hot"
        iconBgColor="bg-lead-hot/10"
      />
      <StatCard
        title="Today's Follow-ups"
        value={todayFollowUps}
        icon={Calendar}
        iconColor="text-accent"
        iconBgColor="bg-accent/10"
      />
      <StatCard
        title="Deals Closed"
        value={closedDeals}
        change={15}
        icon={CheckCircle}
        iconColor="text-status-closed"
        iconBgColor="bg-status-closed/10"
      />
      <StatCard
        title="Conversion Rate"
        value={`${conversionRate}%`}
        change={3}
        icon={TrendingUp}
        iconColor="text-status-negotiation"
        iconBgColor="bg-status-negotiation/10"
      />
    </div>
  );
};

export default DashboardStats;
