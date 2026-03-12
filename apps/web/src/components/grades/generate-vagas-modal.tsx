"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatCurrency } from "@/lib/format-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/houston";
import type { Grade } from "../../services/types";

const ZapIcon = () => (
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
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export interface GenerateVagasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: Grade | null;
  especialidades: { id: string; nome: string }[];
  onConfirm: (especialidadeId: string, valor: number) => Promise<void>;
}

export function GenerateVagasModal({
  open,
  onOpenChange,
  grade,
  especialidades,
  onConfirm,
}: GenerateVagasModalProps) {
  const t = useTranslations("Grades.generateVagas");
  const tCommon = useTranslations("Common.actions");
  const formatCurrency = useFormatCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [especialidadeId, setEspecialidadeId] = useState("");
  const [valor, setValor] = useState(0);

  const handleConfirm = async () => {
    if (!especialidadeId || valor <= 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm(especialidadeId, valor);
      setEspecialidadeId("");
      setValor(0);
    } catch {
      // Error handled by onConfirm callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEspecialidadeId("");
    setValor(0);
    onOpenChange(false);
  };

  if (!grade) return null;

  const slotsCount = 100;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={t("title")}
      description={t("description")}
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-lg bg-blue-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <ZapIcon />
          </div>
          <div>
            <p className="text-sm font-medium">{t("summary")}</p>
            <p className="text-sm text-gray-600">
              {t("summaryDescription", { slots: slotsCount })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="especialidade">{t("specialty")}</Label>
            <Select value={especialidadeId} onValueChange={setEspecialidadeId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectSpecialty")} />
              </SelectTrigger>
              <SelectContent>
                {especialidades.map((esp) => (
                  <SelectItem key={esp.id} value={esp.id}>
                    {esp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">{t("valuePerVaga")}</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-2">{t("estimatedTotal")}</h4>
          <p className="text-2xl font-semibold text-primary-600">
            {formatCurrency(slotsCount * valor)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {slotsCount} vagas x {formatCurrency(valor)}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !especialidadeId || valor <= 0}
          >
            {isSubmitting ? t("generating") : t("generateButton")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
