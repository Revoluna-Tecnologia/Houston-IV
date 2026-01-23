/**
 * Modulo de Comunicacao - Components
 * Exporta todos os componentes do modulo
 */

// Layout
export { ChatLayout, ChatLayoutEmpty } from './ChatLayout';

// Conversation List
export { ConversationList } from './ConversationList';
export { ConversationItem } from './ConversationList/ConversationItem';
export { ConversationSearch } from './ConversationList/ConversationSearch';

// Chat Window
export { ChatWindow } from './ChatWindow';
export { ChatHeader } from './ChatWindow/ChatHeader';
export { MessageList } from './ChatWindow/MessageList';
export { MessageBubble } from './ChatWindow/MessageBubble';
export { MessageInput } from './ChatWindow/MessageInput';
export { TypingIndicator } from './ChatWindow/TypingIndicator';

// WhatsApp
export { WhatsAppSetup } from './WhatsApp/WhatsAppSetup';
export { QRCodeDisplay } from './WhatsApp/QRCodeDisplay';
export { ConnectionStatus } from './WhatsApp/ConnectionStatus';

// Contacts
export { ContactItem } from './Contacts/ContactItem';
export { ContactList } from './Contacts/ContactList';
export { AddContactForm } from './Contacts/AddContactForm';
export { AddContactModal } from './Contacts/AddContactModal';

// Shift Offers
export { ShiftOfferCard } from './ShiftOffer/ShiftOfferCard';
export { ShiftOfferForm } from './ShiftOffer/ShiftOfferForm';
export { ShiftOfferModal } from './ShiftOffer/ShiftOfferModal';

// Types
export type { ChatLayoutProps } from './ChatLayout';
export type { ConversationListProps } from './ConversationList';
export type { ConversationItemProps } from './ConversationList/ConversationItem';
export type { ConversationSearchProps } from './ConversationList/ConversationSearch';
export type { ChatWindowProps } from './ChatWindow';
export type { ChatHeaderProps } from './ChatWindow/ChatHeader';
export type { MessageListProps } from './ChatWindow/MessageList';
export type { MessageBubbleProps } from './ChatWindow/MessageBubble';
export type { MessageInputProps } from './ChatWindow/MessageInput';
export type { TypingIndicatorProps } from './ChatWindow/TypingIndicator';
export type { WhatsAppSetupProps } from './WhatsApp/WhatsAppSetup';
export type { QRCodeDisplayProps } from './WhatsApp/QRCodeDisplay';
export type { ConnectionStatusProps } from './WhatsApp/ConnectionStatus';
export type { ContactItemProps } from './Contacts/ContactItem';
export type { ContactListProps } from './Contacts/ContactList';
export type { AddContactFormProps } from './Contacts/AddContactForm';
export type { AddContactModalProps } from './Contacts/AddContactModal';
export type { ShiftOfferCardProps } from './ShiftOffer/ShiftOfferCard';
export type { ShiftOfferFormProps } from './ShiftOffer/ShiftOfferForm';
export type { ShiftOfferModalProps } from './ShiftOffer/ShiftOfferModal';
