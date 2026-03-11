'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, User as UserIcon, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/houston/theme-toggle';
import { LanguageSwitcher } from '@/components/houston/language-switcher';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../../hooks';
import { type User } from '../../services';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface HeaderProps {
  user: User | null;
  onMenuClick: () => void;
  title?: string;
}

export const Header = memo(function Header({ user, onMenuClick, title }: HeaderProps) {
  const { logout } = useAuth();
  const t = useTranslations('Header');

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">{t('openMenu')}</span>
      </Button>

      {title && (
        <h1 className="text-lg font-semibold text-foreground hidden sm:block">
          {title}
        </h1>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationBell className="text-muted-foreground" />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary-100 text-primary-600 text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-100 text-primary-600 text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                {t('profile')}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                {t('settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
});
