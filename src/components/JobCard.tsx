"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, Building2 } from "lucide-react";

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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Ahora mismo";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHr < 24) return `Hace ${diffHr}h`;
  if (diffDay < 7) return `Hace ${diffDay}d`;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export default function JobCard({ job }: { job: Job }) {
  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="h-full w-full object-contain"
              />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title & Time */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{job.title}</h3>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(job.createdAt)}
              </span>
            </div>

            {/* Company */}
            <p className="text-sm text-muted-foreground mb-2">{job.company}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {job.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {job.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{job.tags.length - 4}
                </Badge>
              )}
            </div>

            {/* Description preview */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.description}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-4 pt-0">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => window.open(job.sourceUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Postularse
        </Button>
      </CardFooter>
    </Card>
  );
}