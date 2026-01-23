'use client';

/**
 * Pagina de Comunicacao
 * Orquestra todos os componentes do modulo de chat
 * SRP: Responsavel pela pagina e estado global do modulo
 */

import { useState, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useConversations,
  useMessages,
  useContacts,
  useWhatsAppInstance,
  useCurrentUser,
} from '../../../hooks';
import {
  ChatLayout,
  ChatLayoutEmpty,
  ConversationList,
  ChatWindow,
  ContactList,
  AddContactModal,
  WhatsAppSetup,
} from '../../../components/comunicacao';
import { ConversationType, type Conversation, type Contact, type MessageType } from '../../../services/comunicacao/types';

const SettingsIcon = () => (
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
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

type TabType = 'conversations' | 'contacts' | 'whatsapp';

export default function ComunicacaoPage() {
  const { user } = useCurrentUser();
  const grupoId = user?.grupoIds?.[0] || '';

  // State
  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Hooks
  const {
    conversations,
    isLoading: isLoadingConversations,
    create: createConversation,
    archive: archiveConversation,
  } = useConversations();

  const {
    messages,
    isLoading: isLoadingMessages,
    hasMore: hasMoreMessages,
    isSending,
    loadMore: loadMoreMessages,
    send: sendMessage,
    markAsRead,
  } = useMessages({ conversationId: selectedConversationId });

  const {
    contacts,
    isLoading: isLoadingContacts,
    create: createContact,
    update: updateContact,
  } = useContacts();

  const {
    instance,
    qrCode,
    pairingCode,
    status,
    phoneNumber,
    isLoading: isLoadingWhatsApp,
    isConnecting,
    create: createInstance,
    connect,
    disconnect,
    delete: deleteInstance,
    refreshQR,
    getPairingCode,
  } = useWhatsAppInstance({ grupoId });

  // Derived state
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const isLoading = isLoadingConversations || isLoadingContacts || isLoadingWhatsApp;

  // Handlers
  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
    markAsRead();
  }, [markAsRead]);

  const handleBackToList = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  const handleStartChatWithContact = useCallback(
    async (contact: Contact) => {
      // Check if conversation already exists
      const existingConversation = conversations.find(
        (c) =>
          c.type === ConversationType.DIRECT &&
          c.participants?.some((p) => p.phoneNumber === contact.phoneNumber)
      );

      if (existingConversation) {
        setSelectedConversationId(existingConversation.id);
        setActiveTab('conversations');
        return;
      }

      // Create new conversation
      try {
        const newConversation = await createConversation({
          type: ConversationType.DIRECT,
          participantPhones: [contact.phoneNumber],
        });
        setSelectedConversationId(newConversation.id);
        setActiveTab('conversations');
      } catch {
        // Error handled by hook
      }
    },
    [conversations, createConversation]
  );

  const handleToggleFavorite = useCallback(
    async (contact: Contact) => {
      await updateContact(contact.id, { isFavorite: !contact.isFavorite });
    },
    [updateContact]
  );

  const handleToggleBlock = useCallback(
    async (contact: Contact) => {
      await updateContact(contact.id, { isBlocked: !contact.isBlocked });
    },
    [updateContact]
  );

  const handleAddContact = useCallback(
    async (data: { name: string; phoneNumber: string }) => {
      setIsAddingContact(true);
      try {
        await createContact(data);
        setShowAddContact(false);
      } finally {
        setIsAddingContact(false);
      }
    },
    [createContact]
  );

  const handleSendMessage = useCallback(
    async (content: string, type: MessageType = 'text' as MessageType) => {
      if (!selectedConversationId) return;
      await sendMessage(content, type);
    },
    [selectedConversationId, sendMessage]
  );

  const handleArchiveConversation = useCallback(async () => {
    if (!selectedConversationId) return;
    await archiveConversation(selectedConversationId, true);
    setSelectedConversationId(null);
  }, [selectedConversationId, archiveConversation]);

  // Loading state
  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="flex flex-1">
          <div className="w-80 border-r p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Sidebar content based on active tab
  const renderSidebar = () => {
    return (
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="h-full flex flex-col">
        <div className="border-b px-2 py-1">
          <TabsList className="w-full">
            <TabsTrigger value="conversations" className="flex-1">
              Conversas
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex-1">
              Contatos
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex-1">
              WhatsApp
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conversations" className="flex-1 mt-0 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            isLoading={isLoadingConversations}
            onSelect={(id) => {
              const conv = conversations.find(c => c.id === id);
              if (conv) handleSelectConversation(conv);
            }}
            onCreateNew={() => setShowAddContact(true)}
          />
        </TabsContent>

        <TabsContent value="contacts" className="flex-1 mt-0 overflow-hidden">
          <ContactList
            contacts={contacts}
            isLoading={isLoadingContacts}
            onStartChat={handleStartChatWithContact}
            onToggleFavorite={handleToggleFavorite}
            onToggleBlock={handleToggleBlock}
            onAddContact={() => setShowAddContact(true)}
          />
        </TabsContent>

        <TabsContent value="whatsapp" className="flex-1 mt-0 overflow-auto p-4">
          <WhatsAppSetup
            instance={instance}
            qrCode={qrCode}
            pairingCode={pairingCode}
            status={status}
            phoneNumber={phoneNumber}
            isLoading={isLoadingWhatsApp}
            isConnecting={isConnecting}
            onCreate={createInstance}
            onConnect={connect}
            onDisconnect={disconnect}
            onDelete={deleteInstance}
            onRefreshQR={refreshQR}
            onGetPairingCode={getPairingCode}
          />
        </TabsContent>
      </Tabs>
    );
  };

  // Main content
  const renderMainContent = () => {
    if (!selectedConversation) {
      return <ChatLayoutEmpty />;
    }

    return (
      <ChatWindow
        conversation={selectedConversation}
        messages={messages}
        isLoading={isLoadingMessages}
        hasMore={hasMoreMessages}
        isSending={isSending}
        onLoadMore={loadMoreMessages}
        onSend={handleSendMessage}
        onArchive={handleArchiveConversation}
      />
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatLayout
        sidebar={renderSidebar()}
        hasActiveConversation={!!selectedConversationId}
        onBackClick={handleBackToList}
        headerActions={
          <Button variant="ghost" size="icon" title="Configuracoes">
            <SettingsIcon />
          </Button>
        }
      >
        {renderMainContent()}
      </ChatLayout>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddContact}
        isSubmitting={isAddingContact}
        onClose={() => setShowAddContact(false)}
        onSubmit={handleAddContact}
      />
    </div>
  );
}
