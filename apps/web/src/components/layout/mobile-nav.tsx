'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  Building2,
  ClipboardList,
  Grid3X3,
  DollarSign,
  UserCog,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '../../hooks';
import { UserRole, type User } from '../../services';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/vagas', label: 'Vagas', icon: <Calendar className="h-5 w-5" /> },
  { href: '/candidaturas', label: 'Candidaturas', icon: <Users className="h-5 w-5" /> },
  { href: '/medicos', label: 'Medicos', icon: <Stethoscope className="h-5 w-5" /> },
  { href: '/hospitais', label: 'Hospitais', icon: <Building2 className="h-5 w-5" /> },
  { href: '/escalistas', label: 'Escalistas', icon: <ClipboardList className="h-5 w-5" /> },
  { href: '/grades', label: 'Grades', icon: <Grid3X3 className="h-5 w-5" /> },
  { href: '/pagamentos', label: 'Pagamentos', icon: <DollarSign className="h-5 w-5" /> },
  { href: '/admin/users', label: 'Usuarios', icon: <UserCog className="h-5 w-5" />, adminOnly: true },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface MobileNavProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ user, open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isAdmin = user?.role === UserRole.ADMINISTRADOR;

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  const handleLogout = () => {
    onOpenChange(false);
    logout();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-16 px-6 border-b border-gray-200 flex flex-row items-center">
          <SheetTitle className="text-xl font-semibold text-primary-500">
            Houston IV
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-primary-500' : 'text-gray-500'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary-100 text-primary-600 text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
