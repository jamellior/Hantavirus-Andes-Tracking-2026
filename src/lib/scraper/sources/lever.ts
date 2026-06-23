import axios from 'axios';
import * as cheerio from 'cheerio';
import { JobRaw, ScraperConfig, ScraperSource } from '../types';

export class LeverScraper implements ScraperSource {
  constructor(
    public config: ScraperConfig,
    private companySlug: string
  ) {}

  async extract(): Promise<JobRaw[]> {
    const url = `https://jobs.lever.co/${this.companySlug}`;
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const jobs: JobRaw[] = [];

      $('.posting').each((_, element) => {
        const title = $(element).find('h5').text().trim();
        const location = $(element).find('.location').text().trim();
        const sourceUrl = $(element).find('.posting-title').attr('href') || '';
        const tags = $(element).find('.sort-by-team, .sort-by-commitment').map((_, el) => $(el).text().trim()).get();

        if (title && sourceUrl) {
          jobs.push({
            title,
            company: this.config.name,
            location,
            sourceUrl,
            tags,
          });
        }
      });

      return jobs;
    } catch (error: any) {
      console.error(`Error scraping Lever for ${this.companySlug}:`, error.message);
      return [];
    }
  }
}
