"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Users,
  Crown,
  RefreshCw,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface Stats {
  activeJobs: number;
  totalUsers: number;
  premiumUsers: number;
  recentJobs: Array<{
    id: string;
    title: string;
    company: string;
    origin: string;
    createdAt: string;
    active: boolean;
  }>;
  lastScraperRun: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scraperLog, setScraperLog] = useState<string[]>([]);

  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && !isAdmin) {
      router.push("/");
      return;
    }
    if (status === "authenticated" && isAdmin) {
      fetchStats();
    }
  }, [status, isAdmin, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setScraperLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Iniciando scraping...`]);
    try {
      const res = await fetch("/api/admin/scrape", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setScraperLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ Scraping completado: ${data.extracted || 0} vacantes extraídas`,
        ]);
        fetchStats();
      } else {
        const err = await res.json();
        setScraperLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ❌ Error: ${err.error || "Falló el scraping"}`,
        ]);
      }
    } catch (e) {
      setScraperLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ Error de conexión`,
      ]);
    } finally {
      setScraping(false);
    }
  };

  const handleClean = async () => {
    setCleaning(true);
    setScraperLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Iniciando limpieza...`]);
    try {
      const res = await fetch("/api/admin/clean", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setScraperLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ Limpieza completada: ${data.removed || 0} enlaces caídos eliminados`,
        ]);
        fetchStats();
      } else {
        const err = await res.json();
        setScraperLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ❌ Error: ${err.error || "Falló la limpieza"}`,
        ]);
      }
    } catch (e) {
      setScraperLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ❌ Error de conexión`,
      ]);
    } finally {
      setCleaning(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Monitoreo de RemoteRadar</p>
          </div>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vacantes Activas</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.activeJobs ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Último scrape: {stats?.lastScraperRun
                  ? new Date(stats.lastScraperRun).toLocaleString("es-ES")
                  : "Nunca"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalUsers ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Crecimiento de usuarios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Premium</CardTitle>
              <Crown className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.premiumUsers ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalUsers
                  ? `${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}% conversión`
                  : "Sin datos"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones del Scraper</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={handleScrape}
                disabled={scraping}
              >
                {scraping ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {scraping ? "Scrapeando..." : "Forzar Scraping Manual"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleClean}
                disabled={cleaning}
              >
                {cleaning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {cleaning ? "Limpiando..." : "Forzar Limpieza de Enlaces Caídos"}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Vacantes</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentJobs && stats.recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.company} · {job.origin}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin vacantes aún</p>
              )}
            </CardContent>
          </Card>

          {/* Scraper Logs */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Logs del Scraper</CardTitle>
            </CardHeader>
            <CardContent>
              {scraperLog.length > 0 ? (
                <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
                  {scraperLog.map((log, i) => (
                    <div key={i} className="text-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay logs aún. Usa los botones de acción para iniciar scraping.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}