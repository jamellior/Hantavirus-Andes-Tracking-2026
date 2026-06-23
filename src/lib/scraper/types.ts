export interface JobRaw {
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  description?: string;
  salary?: string;
  type?: string;
  tags?: string[];
  logo?: string;
  postedAt?: Date;
}

export interface ScraperConfig {
  name: string;
  enabled: boolean;
  interval?: number;
}

export interface ScraperSource {
  config: ScraperConfig;
  extract(): Promise<JobRaw[]>;
}

export interface ScraperResult {
  source: string;
  jobsFound: number;
  jobsSaved: number;
  jobsUpdated: number;
  errors?: string[];
}
