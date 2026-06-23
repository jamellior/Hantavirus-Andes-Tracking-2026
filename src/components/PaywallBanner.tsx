"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";

export default function PaywallBanner() {
  return (
    <div className="relative my-8 mx-auto max-w-md">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl" />
      <div className="relative bg-card border-2 border-primary/30 rounded-2xl p-8 text-center shadow-lg">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">
          Desbloquea todas las vacantes
        </h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Las mejores ofertas 100% remotas están esperando. Sin límites, sin
          restricciones.
        </p>
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full gap-2 text-base"
            onClick={() => (window.location.href = "/api/checkout")}
          >
            <Sparkles className="h-5 w-5" />
            Premium por solo $2.99/mes
          </Button>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Acceso ilimitado a todas las vacantes</li>
            <li>✓ Filtros avanzados sin restricciones</li>
            <li>✓ Nuevas ofertas cada día</li>
          </ul>
        </div>
      </div>
    </div>
  );
}