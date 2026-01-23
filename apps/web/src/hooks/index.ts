export { useAuth } from './use-auth';
export { useCurrentUser } from './use-current-user';
export { useVagas } from './use-vagas';
export { useCandidaturas } from './use-candidaturas';
export { useMedicos } from './use-medicos';
export { useHospitais } from './use-hospitais';
export { useGrades } from './use-grades';
export { usePagamentos } from './use-pagamentos';
export { useTableSort } from './use-table-sort';
export { usePagination } from './use-pagination';
export { useEscalistas } from './use-escalistas';
export { useUsers } from './use-users';

// Comunicacao hooks
export {
  useConversations,
  useMessages,
  useContacts,
  useWhatsAppInstance,
  useWebSocket,
  useFileUpload,
  useAudioRecording,
} from './comunicacao';

// Tickets hooks
export { useTickets, useTicket, useTicketComments, useTicketAnalytics } from './tickets';

// Kanban hooks
export { useKanbanBoard, useKanbanCard } from './kanban';
