import prisma from '../prisma';
import { JobRaw, ScraperResult, ScraperSource } from './types';
import { LeverScraper } from './sources/lever';
import { GreenhouseScraper } from './sources/greenhouse';
import { SubredditScraper } from './sources/subreddit';
import { GenericCssScraper } from './sources/generic';

export async function extractAndSave(): Promise<ScraperResult[]> {
  const sources: ScraperSource[] = [
    new LeverScraper({ name: 'Vercel', enabled: true }, 'vercel'),
    new GreenhouseScraper({ name: 'Airbnb', enabled: true }, 'airbnb'),
    new SubredditScraper({ name: 'Reddit Remote Jobs', enabled: true }, 'remotejobs'),
    new SubredditScraper({ name: 'Reddit Remote Work', enabled: true }, 'remotework'),
    // Example of generic CSS scraper
    new GenericCssScraper(
      { name: 'We Work Remotely', enabled: true },
      'https://weworkremotely.com/remote-jobs/search?term=software+engineer',
      {
        container: '.feature',
        title: '.title',
        company: '.company',
        url: 'a[href^="/remote-jobs/"]',
      }
    ),
  ];

  const results: ScraperResult[] = [];

  for (const source of sources) {
    if (!source.config.enabled) continue;

    console.log(`Starting scraper for ${source.config.name}...`);
    let jobsFound = 0;
    let jobsSaved = 0;
    let jobsUpdated = 0;
    const errors: string[] = [];

    try {
      const jobs = await source.extract();
      jobsFound = jobs.length;

      for (const job of jobs) {
        try {
          const existingJob = await prisma.job.findUnique({
            where: { sourceUrl: job.sourceUrl },
          });

          if (existingJob) {
            await prisma.job.update({
              where: { sourceUrl: job.sourceUrl },
              data: {
                title: job.title,
                location: job.location,
                description: job.description || existingJob.description,
                tags: job.tags || existingJob.tags,
                active: true,
              },
            });
            jobsUpdated++;
          } else {
            await prisma.job.create({
              data: {
                title: job.title,
                company: job.company,
                location: job.location,
                description: job.description || 'No description provided.',
                sourceUrl: job.sourceUrl,
                tags: job.tags || [],
                origin: source.config.name,
                active: true,
              },
            });
            jobsSaved++;
          }
        } catch (err: any) {
          console.error(`Error saving job ${job.sourceUrl}:`, err.message);
          errors.push(`Save error: ${err.message}`);
        }
      }
    } catch (err: any) {
      console.error(`Error scraping ${source.config.name}:`, err.message);
      errors.push(`Scrape error: ${err.message}`);
    }

    results.push({
      source: source.config.name,
      jobsFound,
      jobsSaved,
      jobsUpdated,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  return results;
}
