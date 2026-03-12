"use client";

/**
 * ConversationList Component
 * Lista de conversas com busca e filtros
 * SRP: Orquestra a lista, delegando renderizacao para subcomponentes
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationItem } from "./ConversationItem";
import type {
  Conversation,
  ConversationType,
} from "@/services/comunicacao/types";

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const ArchiveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <rect width="20" height="5" x="2" y="3" rx="1" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </svg>
);

type FilterType = "all" | "direct" | "group" | "archived";

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string | null) => void;
  onCreateNew: () => void;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  isLoading,
  onSelect,
  onCreateNew,
  className,
}: ConversationListProps) {
  const t = useTranslations("Comunicacao");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Filtrar por tipo
    switch (filter) {
      case "direct":
        result = result.filter(
          (c) => c.type === ("direct" as ConversationType) && !c.isArchived,
        );
        break;
      case "group":
        result = result.filter(
          (c) => c.type === ("group" as ConversationType) && !c.isArchived,
        );
        break;
      case "archived":
        result = result.filter((c) => c.isArchived);
        break;
      case "all":
      default:
        result = result.filter((c) => !c.isArchived);
        break;
    }

    // Filtrar por busca
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(searchLower);
        const previewMatch = c.lastMessagePreview
          ?.toLowerCase()
          .includes(searchLower);
        const participantMatch = c.participants?.some(
          (p) =>
            p.user?.name?.toLowerCase().includes(searchLower) ||
            p.medico?.nome?.toLowerCase().includes(searchLower) ||
            p.phoneNumber?.includes(searchLower),
        );
        return nameMatch || previewMatch || participantMatch;
      });
    }

    return result;
  }, [conversations, filter, search]);

  const handleItemClick = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect],
  );

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "all", label: t("conversations.filters.all") },
    { key: "direct", label: t("conversations.filters.direct") },
    { key: "group", label: t("conversations.filters.groups") },
    { key: "archived", label: t("conversations.filters.archived") },
  ];

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">{t("conversations.title")}</h2>
        <Button size="sm" onClick={onCreateNew}>
          <PlusIcon />
          <span className="ml-1 hidden sm:inline">
            {t("conversations.new")}
          </span>
        </Button>
      </div>

      {/* Search */}
      <div className="border-b p-3">
        <ConversationSearch value={search} onChange={setSearch} />
      </div>

      {/* Filters */}
      <div className="flex gap-1 border-b p-2">
        {filterButtons.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(key)}
            className="h-7 px-2 text-xs"
          >
            {key === "archived" && <ArchiveIcon />}
            <span className={key === "archived" ? "ml-1" : ""}>{label}</span>
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : filteredConversations.length === 0 ? (
          <EmptyState filter={filter} hasSearch={!!search.trim()} />
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedId === conversation.id}
                onClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  filter,
  hasSearch,
}: {
  filter: FilterType;
  hasSearch: boolean;
}) {
  const t = useTranslations("Comunicacao");

  let message = t("conversations.empty.noConversations");

  if (hasSearch) {
    message = t("conversations.empty.noSearchResults");
  } else if (filter === "archived") {
    message = t("conversations.empty.noArchived");
  } else if (filter === "direct") {
    message = t("conversations.empty.noDirect");
  } else if (filter === "group") {
    message = t("conversations.empty.noGroups");
  }

  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
