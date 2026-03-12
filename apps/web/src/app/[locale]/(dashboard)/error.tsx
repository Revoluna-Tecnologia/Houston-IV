"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Ocorreu um erro inesperado. Por favor, tente novamente.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Código: {error.digest}</p>
      )}
      <Button onClick={reset} variant="outline">
        Tentar novamente
      </Button>
    </div>
  );
}
