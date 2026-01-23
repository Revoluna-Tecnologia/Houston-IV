'use client';

/**
 * ChatLayout Component
 * Layout principal do modulo de comunicacao
 * SRP: Orquestra layout 2 colunas (sidebar + chat) com responsividade
 */

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export interface ChatLayoutProps {
  /** Sidebar content (conversation list) */
  sidebar: React.ReactNode;
  /** Main content (chat window) */
  children: React.ReactNode;
  /** Optional header actions */
  headerActions?: React.ReactNode;
  /** Whether a conversation is selected (for mobile view) */
  hasActiveConversation?: boolean;
  /** Callback when back button is clicked on mobile */
  onBackClick?: () => void;
  /** Sidebar width in pixels */
  sidebarWidth?: number;
  /** Custom class name */
  className?: string;
}

export function ChatLayout({
  sidebar,
  children,
  headerActions,
  hasActiveConversation = false,
  onBackClick,
  sidebarWidth = 360,
  className,
}: ChatLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, show sidebar when no conversation, show chat when conversation selected
      if (mobile) {
        setShowSidebar(!hasActiveConversation);
      } else {
        setShowSidebar(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [hasActiveConversation]);

  // Update view when conversation changes on mobile
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(!hasActiveConversation);
    }
  }, [isMobile, hasActiveConversation]);

  const handleBackClick = useCallback(() => {
    if (isMobile) {
      setShowSidebar(true);
    }
    onBackClick?.();
  }, [isMobile, onBackClick]);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  return (
    <div className={cn('flex h-full overflow-hidden', className)}>
      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 border-r bg-background transition-all duration-200',
          isMobile ? 'absolute inset-y-0 left-0 z-20 w-full' : '',
          isMobile && !showSidebar && '-translate-x-full'
        )}
        style={!isMobile ? { width: sidebarWidth } : undefined}
      >
        {/* Sidebar Header (mobile) */}
        {isMobile && (
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h1 className="text-lg font-semibold">Conversas</h1>
            {headerActions}
          </div>
        )}

        {/* Sidebar Content */}
        <div className={cn('h-full', isMobile && 'h-[calc(100%-3.5rem)]')}>
          {sidebar}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn('flex flex-1 flex-col overflow-hidden bg-background')}>
        {/* Desktop Header */}
        {!isMobile && headerActions && (
          <div className="flex h-14 items-center justify-end border-b px-4">
            {headerActions}
          </div>
        )}

        {/* Mobile Header with Back */}
        {isMobile && hasActiveConversation && (
          <div className="flex h-14 items-center gap-2 border-b px-2">
            <button
              onClick={handleBackClick}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
              aria-label="Voltar para conversas"
            >
              <ArrowLeftIcon />
            </button>
          </div>
        )}

        {/* Chat Content */}
        <div className={cn('flex-1 overflow-hidden', isMobile && hasActiveConversation && 'h-[calc(100%-3.5rem)]')}>
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobile && showSidebar && hasActiveConversation && (
        <button
          className="fixed inset-0 z-10 bg-black/50"
          onClick={handleToggleSidebar}
          aria-label="Fechar menu"
        />
      )}
    </div>
  );
}

/**
 * ChatLayoutEmpty Component
 * Estado vazio quando nenhuma conversa esta selecionada
 */
export function ChatLayoutEmpty({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12 text-muted-foreground"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-semibold">Nenhuma conversa selecionada</h2>
      <p className="max-w-sm text-muted-foreground">
        Selecione uma conversa na lista ou inicie uma nova conversa para começar a trocar mensagens.
      </p>
    </div>
  );
}
