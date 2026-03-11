'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  Building2,
  ClipboardList,
  Grid3X3,
  DollarSign,
  MessageSquare,
  Ticket,
  UserCog,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '../../hooks';
import { UserRole, type User } from '../../services';

interface NavItemConfig {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItemConfigs: NavItemConfig[] = [
  { href: '/', labelKey: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/vagas', labelKey: 'vagas', icon: <Calendar className="h-5 w-5" /> },
  { href: '/candidaturas', labelKey: 'candidaturas', icon: <Users className="h-5 w-5" /> },
  { href: '/medicos', labelKey: 'medicos', icon: <Stethoscope className="h-5 w-5" /> },
  { href: '/hospitais', labelKey: 'hospitais', icon: <Building2 className="h-5 w-5" /> },
  { href: '/escalistas', labelKey: 'escalistas', icon: <ClipboardList className="h-5 w-5" /> },
  { href: '/grades', labelKey: 'grades', icon: <Grid3X3 className="h-5 w-5" /> },
  { href: '/pagamentos', labelKey: 'pagamentos', icon: <DollarSign className="h-5 w-5" /> },
  { href: '/comunicacao', labelKey: 'comunicacao', icon: <MessageSquare className="h-5 w-5" /> },
  { href: '/tickets', labelKey: 'tickets', icon: <Ticket className="h-5 w-5" /> },
  { href: '/admin/users', labelKey: 'users', icon: <UserCog className="h-5 w-5" />, adminOnly: true },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface SidebarProps {
  user: User | null;
}

export const Sidebar = memo(function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const t = useTranslations('Navigation');

  const isAdmin = user?.role === UserRole.ADMINISTRADOR;

  const filteredNavItems = useMemo(() =>
    navItemConfigs.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-background border-r border-border">
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold text-primary-500">{t('brand')}</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <span className={isActive ? 'text-primary-500' : 'text-muted-foreground'}>
                {item.icon}
              </span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary-100 text-primary-600 text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
});
