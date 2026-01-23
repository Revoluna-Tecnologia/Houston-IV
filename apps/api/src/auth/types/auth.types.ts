/**
 * Sistema RBAC - Tipos e Enums
 * Baseado na estrutura do Houston III
 */

// Roles hierárquicos (nível 0-4)
export enum AppRole {
  ADMINISTRADOR = 'administrador',
  MODERADOR = 'moderador',
  GESTOR = 'gestor',
  COORDENADOR = 'coordenador',
  ESCALISTA = 'escalista',
}

// Hierarquia de roles (maior = mais permissões)
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  [AppRole.ADMINISTRADOR]: 4,
  [AppRole.MODERADOR]: 3,
  [AppRole.GESTOR]: 2,
  [AppRole.COORDENADOR]: 1,
  [AppRole.ESCALISTA]: 0,
}

// Permissões granulares por recurso (padrão CRUD)
export enum AppPermission {
  // Vagas
  VAGAS_SELECT = 'vagas.select',
  VAGAS_INSERT = 'vagas.insert',
  VAGAS_UPDATE = 'vagas.update',
  VAGAS_DELETE = 'vagas.delete',

  // Membros
  MEMBROS_SELECT = 'membros.select',
  MEMBROS_INSERT = 'membros.insert',
  MEMBROS_UPDATE = 'membros.update',
  MEMBROS_DELETE = 'membros.delete',

  // Médicos
  MEDICOS_SELECT = 'medicos.select',
  MEDICOS_INSERT = 'medicos.insert',
  MEDICOS_UPDATE = 'medicos.update',
  MEDICOS_DELETE = 'medicos.delete',

  // Grupos
  GRUPOS_SELECT = 'grupos.select',
  GRUPOS_INSERT = 'grupos.insert',
  GRUPOS_UPDATE = 'grupos.update',
  GRUPOS_DELETE = 'grupos.delete',

  // Roles
  ROLES_SELECT = 'roles.select',
  ROLES_INSERT = 'roles.insert',
  ROLES_UPDATE = 'roles.update',
  ROLES_DELETE = 'roles.delete',

  // Candidaturas
  CANDIDATURAS_SELECT = 'candidaturas.select',
  CANDIDATURAS_INSERT = 'candidaturas.insert',
  CANDIDATURAS_UPDATE = 'candidaturas.update',
  CANDIDATURAS_DELETE = 'candidaturas.delete',

  // Hospitais
  HOSPITAIS_SELECT = 'hospitais.select',
  HOSPITAIS_INSERT = 'hospitais.insert',
  HOSPITAIS_UPDATE = 'hospitais.update',
  HOSPITAIS_DELETE = 'hospitais.delete',

  // Relatórios
  RELATORIOS_SELECT = 'relatorios.select',
  RELATORIOS_INSERT = 'relatorios.insert',
  RELATORIOS_UPDATE = 'relatorios.update',
  RELATORIOS_DELETE = 'relatorios.delete',

  // Pagamentos
  PAGAMENTOS_SELECT = 'pagamentos.select',
  PAGAMENTOS_INSERT = 'pagamentos.insert',
  PAGAMENTOS_UPDATE = 'pagamentos.update',
  PAGAMENTOS_DELETE = 'pagamentos.delete',

  // Checkin/Checkout
  CHECKIN_CHECKOUT_SELECT = 'checkin_checkout.select',
  CHECKIN_CHECKOUT_INSERT = 'checkin_checkout.insert',
  CHECKIN_CHECKOUT_UPDATE = 'checkin_checkout.update',
  CHECKIN_CHECKOUT_DELETE = 'checkin_checkout.delete',

  // Comunicação (Chat/Mensagens)
  COMUNICACAO_SELECT = 'comunicacao.select',
  COMUNICACAO_INSERT = 'comunicacao.insert',
  COMUNICACAO_UPDATE = 'comunicacao.update',
  COMUNICACAO_DELETE = 'comunicacao.delete',

  // WhatsApp (Gerenciamento de instâncias)
  WHATSAPP_MANAGE = 'whatsapp.manage',
  WHATSAPP_INSTANCES = 'whatsapp.instances',

  // Tickets
  TICKETS_SELECT = 'tickets.select',
  TICKETS_INSERT = 'tickets.insert',
  TICKETS_UPDATE = 'tickets.update',
  TICKETS_DELETE = 'tickets.delete',
  TICKETS_MANAGE = 'tickets.manage',

  // Kanban
  KANBAN_SELECT = 'kanban.select',
  KANBAN_INSERT = 'kanban.insert',
  KANBAN_UPDATE = 'kanban.update',
  KANBAN_DELETE = 'kanban.delete',

  // Notificações
  NOTIFICATIONS_SELECT = 'notifications.select',
  NOTIFICATIONS_UPDATE = 'notifications.update',
  NOTIFICATIONS_MANAGE = 'notifications.manage',
}

// Interface do usuário autenticado com roles e permissões
export interface AuthenticatedUser {
  id: string
  email: string
  name?: string
  roles: AppRole[]
  permissions: AppPermission[]
  grupoIds: string[]
  hospitalIds: string[]
  setorIds: string[]
}

// Interface para user_roles do banco
export interface UserRoleRecord {
  role: AppRole
  grupo_ids: string[]
  hospital_ids: string[]
  setor_ids: string[]
}

// Interface para role_permissions do banco
export interface RolePermissionRecord {
  permission: AppPermission
}

// Helper para verificar se um role é superior a outro
export function isRoleHigherOrEqual(
  userRole: AppRole,
  requiredRole: AppRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

// Helper para obter o maior role de uma lista
export function getHighestRole(roles: AppRole[]): AppRole {
  return roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest
  )
}
