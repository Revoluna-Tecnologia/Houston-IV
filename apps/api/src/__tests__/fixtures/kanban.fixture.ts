import type {
  KanbanCard,
  KanbanTag,
  KanbanTimeline,
  KanbanLink,
} from "../../generated/prisma/client";

export const createKanbanCardFixture = (
  overrides?: Partial<KanbanCard>,
): KanbanCard => ({
  id: "card-1",
  title: "Implementar feature X",
  description: "Descricao detalhada da tarefa",
  status: "backlog",
  tab: "projetos",
  assigneeId: "user-1",
  grupoId: "grupo-1",
  createdById: "user-2",
  createdAt: new Date("2024-12-20T10:00:00Z"),
  updatedAt: new Date("2024-12-20T15:30:00Z"),
  deletedAt: null,
  ...overrides,
});

export const createKanbanTagFixture = (
  overrides?: Partial<KanbanTag>,
): KanbanTag => ({
  id: "tag-1",
  name: "Frontend",
  color: "#3B82F6",
  grupoId: "grupo-1",
  createdBy: "user-1",
  createdAt: new Date("2024-12-20T10:00:00Z"),
  ...overrides,
});

export const createKanbanTimelineFixture = (
  overrides?: Partial<KanbanTimeline>,
): KanbanTimeline => ({
  id: "timeline-1",
  cardId: "card-1",
  type: "create",
  authorId: "user-1",
  content: "Card criado",
  metadata: null,
  createdAt: new Date("2024-12-20T10:00:00Z"),
  ...overrides,
});

export const createKanbanLinkFixture = (
  overrides?: Partial<KanbanLink>,
): KanbanLink => ({
  id: "link-1",
  title: "Design no Figma",
  url: "https://figma.com/file/xxx",
  cardId: "card-1",
  createdBy: "user-1",
  createdAt: new Date("2024-12-20T10:00:00Z"),
  ...overrides,
});

type CardWithRelations = KanbanCard & {
  tags: { tag: KanbanTag }[];
  links: { id: string; title: string; url: string }[];
  timeline: KanbanTimeline[];
};

export const createKanbanCardWithRelationsFixture = (
  overrides?: Partial<KanbanCard>,
): CardWithRelations => ({
  ...createKanbanCardFixture(overrides),
  tags: [{ tag: createKanbanTagFixture() }],
  links: [
    {
      id: "link-1",
      title: "Design no Figma",
      url: "https://figma.com/file/xxx",
    },
  ],
  timeline: [createKanbanTimelineFixture()],
});

export const createKanbanCardListFixture = (): CardWithRelations[] => [
  createKanbanCardWithRelationsFixture({
    id: "card-1",
    title: "Task 1",
    status: "backlog",
  }),
  createKanbanCardWithRelationsFixture({
    id: "card-2",
    title: "Task 2",
    status: "in_progress",
  }),
  createKanbanCardWithRelationsFixture({
    id: "card-3",
    title: "Task 3",
    status: "done",
  }),
];
