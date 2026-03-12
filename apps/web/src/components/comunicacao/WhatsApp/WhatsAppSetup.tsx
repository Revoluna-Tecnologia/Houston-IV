"use client";

/**
 * WhatsAppSetup Component
 * Wizard de configuracao do WhatsApp
 * SRP: Orquestra o fluxo de setup, delegando UI para subcomponentes
 */

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { ConnectionStatus } from "./ConnectionStatus";
import {
  WhatsAppInstanceStatus,
  type WhatsAppInstance,
  type CreateWhatsAppInstanceDto,
} from "@/services/comunicacao/types";

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-8 w-8 text-green-500"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TrashIcon = () => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

type SetupStep = "create" | "connect" | "connected";

export interface WhatsAppSetupProps {
  instance: WhatsAppInstance | null;
  qrCode: string | null;
  pairingCode: string | null;
  status: WhatsAppInstanceStatus | null;
  phoneNumber: string | null;
  isLoading: boolean;
  isConnecting: boolean;
  onCreate: (
    data: CreateWhatsAppInstanceDto,
  ) => Promise<WhatsAppInstance | void>;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onDelete: () => Promise<void>;
  onRefreshQR: () => Promise<void>;
  onGetPairingCode: (phoneNumber: string) => Promise<string>;
  className?: string;
}

export function WhatsAppSetup({
  instance,
  qrCode,
  pairingCode,
  status,
  phoneNumber,
  isLoading,
  isConnecting,
  onCreate,
  onConnect,
  onDisconnect,
  onDelete,
  onRefreshQR,
  onGetPairingCode,
  className,
}: WhatsAppSetupProps) {
  const t = useTranslations("Comunicacao");
  const tActions = useTranslations("Common.actions");
  const [instanceName, setInstanceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine current step
  const currentStep: SetupStep = !instance
    ? "create"
    : status === WhatsAppInstanceStatus.CONNECTED
      ? "connected"
      : "connect";

  const handleCreate = useCallback(async () => {
    if (!instanceName.trim()) return;

    setIsCreating(true);
    try {
      await onCreate({ instanceName: instanceName.trim() });
    } finally {
      setIsCreating(false);
    }
  }, [instanceName, onCreate]);

  const handleDelete = useCallback(async () => {
    if (!confirm(t("whatsapp.deleteConfirm"))) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, t]);

  const handleGetPairingCode = useCallback(
    async (phone: string) => {
      await onGetPairingCode(phone);
    },
    [onGetPairingCode],
  );

  return (
    <div className={cn("mx-auto max-w-lg", className)}>
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <WhatsAppIcon />
          </div>
          <CardTitle>{t("whatsapp.title")}</CardTitle>
          <CardDescription>
            {currentStep === "create" && t("whatsapp.descriptionDisconnected")}
            {currentStep === "connect" && t("whatsapp.descriptionConnecting")}
            {currentStep === "connected" && t("whatsapp.descriptionConnected")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step: Create Instance */}
          {currentStep === "create" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instanceName">
                  {t("whatsapp.instanceName")}
                </Label>
                <Input
                  id="instanceName"
                  placeholder={t("whatsapp.instancePlaceholder")}
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">
                  {t("whatsapp.instanceHint")}
                </p>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!instanceName.trim() || isCreating}
                className="w-full"
              >
                {isCreating
                  ? tActions("creating")
                  : t("whatsapp.createInstance")}
              </Button>
            </div>
          )}

          {/* Step: Connect */}
          {currentStep === "connect" && instance && (
            <div className="space-y-4">
              {/* Instance info */}
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="font-medium">{instance.instanceName}</p>
                  <ConnectionStatus
                    status={status || WhatsAppInstanceStatus.DISCONNECTED}
                    size="sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <TrashIcon />
                </Button>
              </div>

              {/* Connect button or QR */}
              {!isConnecting && !qrCode ? (
                <Button
                  onClick={onConnect}
                  className="w-full"
                  disabled={isLoading}
                >
                  {t("whatsapp.connect")}
                </Button>
              ) : (
                <QRCodeDisplay
                  qrCode={qrCode}
                  pairingCode={pairingCode}
                  isLoading={isConnecting && !qrCode}
                  onRefresh={onRefreshQR}
                  onGetPairingCode={handleGetPairingCode}
                />
              )}
            </div>
          )}

          {/* Step: Connected */}
          {currentStep === "connected" && instance && (
            <div className="space-y-4">
              {/* Instance info */}
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <ConnectionStatus
                  status={WhatsAppInstanceStatus.CONNECTED}
                  phoneNumber={phoneNumber}
                  showPhone
                  size="lg"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {instance.instanceName}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onDisconnect}
                  className="flex-1"
                >
                  {t("whatsapp.disconnect")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <TrashIcon />
                  <span className="ml-2">{tActions("delete")}</span>
                </Button>
              </div>

              {/* Stats placeholder */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">
                    {t("whatsapp.messagesToday")}
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">
                    {t("whatsapp.activeConversations")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
