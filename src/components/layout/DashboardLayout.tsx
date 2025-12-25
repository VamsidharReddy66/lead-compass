import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  Bell,
  Search,
  Plus,
  UserCog,
  GitBranch,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, userRole, signOut, isVentureAdmin } = useAuth();

  const agentNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: GitBranch, label: 'Pipeline', path: '/pipeline' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const ventureNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/venture-dashboard' },
    { icon: UserCog, label: 'Agents', path: '/venture-dashboard' },
    { icon: Users, label: 'All Leads', path: '/leads' },
    { icon: GitBranch, label: 'Pipeline', path: '/pipeline' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const navItems = isVentureAdmin ? ventureNavItems : agentNavItems;

  // Bottom nav items (subset for mobile - max 5)
  const bottomNavItems = isVentureAdmin 
    ? [
        { icon: LayoutDashboard, label: 'Home', path: '/venture-dashboard' },
        { icon: Users, label: 'Leads', path: '/leads' },
        { icon: GitBranch, label: 'Pipeline', path: '/pipeline' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
        { icon: Users, label: 'Leads', path: '/leads' },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
        { icon: GitBranch, label: 'Pipeline', path: '/pipeline' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = () => {
    if (!userRole) return '';
    switch (userRole.role) {
      case 'venture_admin': return 'Venture Admin';
      case 'venture_agent': return 'Venture Agent';
      case 'independent_agent': return 'Independent Agent';
      case 'super_admin': return 'Super Admin';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar z-40 transition-all duration-300 flex-col hidden md:flex',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <Link to={isVentureAdmin ? '/venture-dashboard' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="font-display font-bold text-lg text-sidebar-foreground">LeadFlow</span>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={`${item.path}-${index}`}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-foreground font-medium">
                {getInitials(profile?.full_name)}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || 'User'}
                </div>
                <div className="text-xs text-sidebar-foreground/60">{getRoleLabel()}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full mt-4 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-lg border-b border-border z-50 flex items-center justify-between px-4 md:hidden">
        <Link to={isVentureAdmin ? '/venture-dashboard' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">LeadFlow</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-card shadow-xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* User Info */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-foreground font-medium">{getInitials(profile?.full_name)}</span>
                </div>
                <div>
                  <div className="text-sm font-medium">{profile?.full_name || 'User'}</div>
                  <div className="text-xs text-muted-foreground">{getRoleLabel()}</div>
                </div>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="p-4 space-y-1">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={`mobile-${item.path}-${index}`}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Sign Out */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn(
        'flex-1 transition-all duration-300',
        'md:ml-64', // Desktop margin
        isCollapsed && 'md:ml-20',
        'pb-20 md:pb-0' // Add bottom padding for mobile nav
      )}>
        {/* Desktop Header */}
        <header className="sticky top-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border z-30 items-center justify-between px-6 hidden md:flex">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search leads, contacts..."
              className="pl-10 bg-secondary border-0"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </Button>
            {!isVentureAdmin && (
              <Button variant="accent">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 pt-16 md:pt-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 flex items-center justify-around px-2 md:hidden safe-area-pb">
        {bottomNavItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={`bottom-${item.path}-${index}`}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
