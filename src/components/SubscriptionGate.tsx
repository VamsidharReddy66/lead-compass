import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const { subscription, isLoading, hasAccess, isTrialActive, daysRemaining } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // User has access (trial or paid subscription)
  if (hasAccess) {
    return (
      <>
        {isTrialActive && daysRemaining <= 3 && daysRemaining > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  Your trial ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={() => navigate('/settings?tab=subscription')}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  // No access - show upgrade screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full rounded-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <Crown className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-xl">
            {subscription?.status === 'trial' ? 'Trial Expired' : 'Subscription Required'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {subscription?.status === 'trial'
              ? 'Your free trial has ended. Upgrade to continue using all features.'
              : 'Subscribe to a plan to access the full features of the application.'}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-status-closed" />
              <span>Unlimited lead management</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-status-closed" />
              <span>Advanced analytics & insights</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-status-closed" />
              <span>Priority customer support</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-status-closed" />
              <span>Pipeline management tools</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              className="w-full"
              onClick={() => navigate('/settings?tab=subscription')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              View Plans & Upgrade
            </Button>
          </div>

          {subscription && (
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                Current: {subscription.plan_name} ({subscription.status})
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGate;
