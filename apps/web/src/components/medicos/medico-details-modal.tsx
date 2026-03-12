"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useDateLocale } from "@/lib/date-locale";
import { Modal, StatusBadge } from "@/components/houston";
import type {
  Medico,
  Especialidade,
  Escalista,
  Candidatura,
  CandidaturaStatus,
} from "../../services/types";

export interface MedicoDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medico: Medico | null;
  especialidade?: Especialidade | null;
  escalistas?: Escalista[];
  candidaturas?: Candidatura[];
  onEdit: () => void;
  onDelete: () => void;
}

export function MedicoDetailsModal({
  open,
  onOpenChange,
  medico,
  especialidade,
  escalistas = [],
  candidaturas = [],
  onEdit,
  onDelete,
}: MedicoDetailsModalProps) {
  const t = useTranslations("Medicos.details");
  const tCommon = useTranslations("Common");
  const tCandidaturas = useTranslations("Candidaturas.status");
  const dateLocale = useDateLocale();

  const STATUS_LABELS: Record<CandidaturaStatus, string> = {
    pendente: tCandidaturas("pending"),
    aprovada: tCandidaturas("approved"),
    rejeitada: tCandidaturas("rejected"),
  };

  if (!medico) return null;

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "dd/MM/yyyy", { locale: dateLocale });
  };

  const formatCpf = (cpf: string | null) => {
    if (!cpf) return "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={t("title")} size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{medico.nome}</h2>
            <p className="text-sm text-gray-500">
              CRM {medico.crm}/{medico.crmUf}
            </p>
          </div>
          <StatusBadge
            status={
              medico.ativo
                ? tCommon("status.active")
                : tCommon("status.inactive")
            }
            variant={medico.ativo ? "success" : "error"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{t("fullName")}</p>
            <p className="font-medium">{medico.nome}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("crmUf")}</p>
            <p className="font-medium">
              {medico.crm}/{medico.crmUf}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{t("cpf")}</p>
            <p className="font-medium">{formatCpf(medico.cpf)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("specialty")}</p>
            <p className="font-medium">{especialidade?.nome || "-"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{tCommon("labels.email")}</p>
            <p className="font-medium">{medico.email || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{tCommon("labels.phone")}</p>
            <p className="font-medium">{formatPhone(medico.telefone)}</p>
          </div>
        </div>

        {escalistas.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-gray-500">
              {t("linkedGroups", { count: escalistas.length })}
            </p>
            <div className="space-y-2">
              {escalistas.map((escalista) => (
                <div
                  key={escalista.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm">
                    {t("groupId", { id: escalista.grupoId })}
                  </span>
                  <StatusBadge
                    status={
                      escalista.status === "ativo"
                        ? tCommon("status.active")
                        : escalista.status === "pendente"
                          ? tCommon("status.pending")
                          : tCommon("status.inactive")
                    }
                    variant={
                      escalista.status === "ativo"
                        ? "success"
                        : escalista.status === "pendente"
                          ? "pending"
                          : "error"
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {candidaturas.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-gray-500">
              {t("candidaturasHistory", { count: candidaturas.length })}
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {candidaturas.map((candidatura) => (
                <div
                  key={candidatura.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="text-sm">
                      {t("vagaId", { id: candidatura.vagaId })}
                    </span>
                    <p className="text-xs text-gray-500">
                      {formatDate(candidatura.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={STATUS_LABELS[candidatura.status]}
                    variant={
                      candidatura.status === "aprovada"
                        ? "success"
                        : candidatura.status === "rejeitada"
                          ? "error"
                          : "pending"
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="destructive" onClick={onDelete}>
            {tCommon("actions.delete")}
          </Button>
          <Button onClick={onEdit}>{tCommon("actions.edit")}</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("actions.close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
