import axios from 'axios';
import * as cheerio from 'cheerio';
import { JobRaw, ScraperConfig, ScraperSource } from '../types';

export class GreenhouseScraper implements ScraperSource {
  constructor(
    public config: ScraperConfig,
    private companySlug: string
  ) {}

  async extract(): Promise<JobRaw[]> {
    const url = `https://boards.greenhouse.io/${this.companySlug}`;
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const jobs: JobRaw[] = [];

      $('.opening').each((_, element) => {
        const title = $(element).find('a').text().trim();
        const location = $(element).find('.location').text().trim();
        const path = $(element).find('a').attr('href') || '';
        const sourceUrl = path.startsWith('http') ? path : `https://boards.greenhouse.io${path}`;

        if (title && sourceUrl) {
          jobs.push({
            title,
            company: this.config.name,
            location,
            sourceUrl,
          });
        }
      });

      return jobs;
    } catch (error: any) {
      console.error(`Error scraping Greenhouse for ${this.companySlug}:`, error.message);
      return [];
    }
  }
}
