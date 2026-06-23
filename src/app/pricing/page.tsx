"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, XCircle, Loader2, CreditCard, Shield } from "lucide-react";

export default function PricingPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    status: string;
    currentPeriodEnd: string;
  } | null>(null);
  const [fetchingSub, setFetchingSub] = useState(true);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const error = searchParams.get("error");
  const alreadyPremium = searchParams.get("status") === "already_premium";

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await fetch("/api/subscriptions");
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch (e) {
        console.error("Failed to load subscription:", e);
      } finally {
        setFetchingSub(false);
      }
    }
    loadSubscription();
  }, []);

  const isActive =
    subscription?.status === "active" &&
    subscription.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > new Date();

  const handleCancel = async () => {
    if (!confirm("¿Estás seguro de que quieres cancelar tu suscripción?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", { method: "DELETE" });
      if (res.ok) {
        setSubscription((prev) =>
          prev ? { ...prev, status: "canceled" } : null
        );
      }
    } catch (e) {
      console.error("Failed to cancel:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {success && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-center">
            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-700 dark:text-green-300">
              ¡Suscripción activada! Ya tienes acceso Premium 🎉
            </p>
          </div>
        )}

        {canceled && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
            <p className="text-yellow-700 dark:text-yellow-300">
              El proceso de pago fue cancelado. Puedes intentarlo de nuevo.
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 dark:text-red-300">
              Ocurrió un error al procesar el pago. Intenta de nuevo.
            </p>
          </div>
        )}

        {alreadyPremium && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <p className="text-blue-700 dark:text-blue-300">
              Ya tienes una suscripción Premium activa.
            </p>
          </div>
        )}

        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Precios simples y claros
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Accede a todas las vacantes 100% remotas sin límites. Cancela cuando
            quieras.
          </p>
        </section>

        <div className="max-w-md mx-auto">
          <Card className="relative border-primary/30 shadow-lg">
            {isActive && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Plan Actual
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Premium
              </CardTitle>
              <CardDescription>
                Para profesionales que buscan sin límites
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-5xl font-bold">$2.99</span>
                <span className="text-muted-foreground">/mes</span>
              </div>

              <ul className="space-y-3">
                {[
                  "Acceso ilimitado a todas las vacantes",
                  "Filtros avanzados sin restricciones",
                  "Nuevas ofertas cada día",
                  "Sin anuncios",
                  "Cancela cuando quieras",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {fetchingSub ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isActive ? (
                <div className="space-y-3">
                  <Badge
                    variant="secondary"
                    className="w-full justify-center py-2 text-sm"
                  >
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Suscripción Activa
                  </Badge>
                  {subscription?.currentPeriodEnd && (
                    <p className="text-xs text-center text-muted-foreground">
                          Válida hasta{" "}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                        "es-ES",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Cancelar Suscripción
                  </Button>
                </div>
              ) : (
                <>
                  {session ? (
                    <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => (window.location.href = "/api/checkout")}
                  >
                    <Sparkles className="h-5 w-5" />
                    Suscribirse por $2.99/mes
                  </Button>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground">
                      Inicia sesión para suscribirte
                    </p>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Pagos seguros procesados por Stripe
                <CreditCard className="h-3 w-3 ml-1" />
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}