import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Página não encontrada</h2>
      <p className="text-muted-foreground">
        A página que você procura não existe.
      </p>
    </div>
  );
}
