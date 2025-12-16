import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Target, UserPlus, MoreVertical, Mail, Phone, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AddAgentDialog from '@/components/venture/AddAgentDialog';
import AgentPerformanceCard from '@/components/venture/AgentPerformanceCard';
import { useVentureAgents } from '@/hooks/useVentureAgents';

const VentureDashboardPage = () => {
  const { profile } = useAuth();
  const [showAddAgent, setShowAddAgent] = useState(false);
  const { agents, loading, refetch } = useVentureAgents();

  const stats = [
    { label: 'Total Agents', value: agents.length.toString(), icon: Users, color: 'text-blue-500' },
    { label: 'Active Agents', value: agents.filter(a => a.status === 'active').length.toString(), icon: TrendingUp, color: 'text-status-success' },
    { label: 'Total Leads', value: '0', icon: Target, color: 'text-accent' },
    { label: 'Conversion Rate', value: '0%', icon: BarChart3, color: 'text-purple-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Venture Dashboard</h1>
            <p className="text-muted-foreground">Manage your agents and track performance</p>
          </div>
          <Button variant="accent" onClick={() => setShowAddAgent(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agents Section */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Your Agents</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddAgent(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading agents...</div>
            ) : agents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">No agents added yet</p>
                <Button variant="accent" onClick={() => setShowAddAgent(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Agent
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <AgentPerformanceCard key={agent.id} agent={agent} onUpdate={refetch} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddAgentDialog 
        open={showAddAgent} 
        onOpenChange={setShowAddAgent} 
        onSuccess={refetch}
      />
    </DashboardLayout>
  );
};

export default VentureDashboardPage;
