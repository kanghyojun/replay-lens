'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Trophy, History, Home, LogOut, FileVideo } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/matches', label: 'Match History', icon: History },
    { href: '/ladder', label: 'Ladder', icon: Trophy },
    { href: '/replays', label: 'Replays', icon: FileVideo },
  ];

  if (!user) {
    return null;
  }

  return (
    <TooltipProvider>
      <aside className="fixed left-0 top-0 h-screen w-16 border-r bg-background flex flex-col items-center py-4 space-y-4">
        {/* Logo/Home */}
        <Link href="/" className="mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            SC
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-xs font-semibold cursor-default">
                {user.battletag.slice(0, 2).toUpperCase()}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{user.battletag}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="w-12 h-12 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
