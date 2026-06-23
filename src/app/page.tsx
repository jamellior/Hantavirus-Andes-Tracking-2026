"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import JobCard from "@/components/JobCard";
import PaywallBanner from "@/components/PaywallBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Loader2,
  Briefcase,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  description: string;
  tags: string[];
  sourceUrl: string;
  origin: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  isPremium: boolean;
  reachedLimit: boolean;
}

const ALL_TAGS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Node.js",
  "Python", "Rust", "Go", "AWS", "DevOps", "Frontend",
  "Backend", "Fullstack", "Mobile", "Data", "ML/AI",
  "Design", "Product", "Remote", "Senior", "Junior",
];

export default function HomePage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [titleFilter, setTitleFilter] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      if (titleFilter) params.set("title", titleFilter);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar vacantes");
      const data = await res.json();
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [page, titleFilter, selectedTags]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setTitleFilter("");
    setSelectedTags([]);
    setPage(1);
  };

  const hasFilters = titleFilter || selectedTags.length > 0;
  const showPaywall = pagination?.reachedLimit ?? false;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Encuentra tu{" "}
            <span className="text-primary">trabajo remoto</span> ideal
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Miles de vacantes 100% remotas de todo el mundo, actualizadas en
            tiempo real. Sin ofertas híbridas ni presenciales.
          </p>
        </section>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto mb-6 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por cargo, tecnología o empresa..."
              className="pl-10 h-12"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 px-6">
            Buscar
          </Button>
        </form>

        {/* Tags Filter */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {ALL_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer transition-colors text-sm px-3 py-1.5"
                onClick={() => toggleTag(tag)}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
          {hasFilters && (
            <div className="text-center mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Results Stats */}
        {pagination && !loading && (
          <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>
                {pagination.total === 0
                  ? "Sin resultados"
                  : `${pagination.total} vacante${pagination.total !== 1 ? "s" : ""} encontrada${pagination.total !== 1 ? "s" : ""}`}
              </span>
              {pagination.isPremium && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Premium
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>100% Remoto</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchJobs}>Reintentar</Button>
          </div>
        )}

        {/* Job List with Paywall */}
        {!loading && !error && (
          <div className="relative">
            {/* Job Cards Grid */}
            <div
              className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-500 ${
                showPaywall ? "blur-sm opacity-30 pointer-events-none select-none" : ""
              }`}
            >
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Paywall Overlay */}
            {showPaywall && <PaywallBanner />}

            {/* No results */}
            {jobs.length === 0 && !loading && (
              <div className="text-center py-20 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No se encontraron vacantes</p>
                <p className="text-sm">Prueba con otros filtros</p>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}