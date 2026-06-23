import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import { JobRaw, ScraperConfig, ScraperSource } from '../types';

export interface GenericSelectors {
  container: string;
  title: string;
  company?: string;
  location?: string;
  url: string;
}

export class GenericCssScraper implements ScraperSource {
  constructor(
    public config: ScraperConfig,
    private url: string,
    private selectors: GenericSelectors,
    private usePlaywright: boolean = false
  ) {}

  async extract(): Promise<JobRaw[]> {
    if (this.usePlaywright) {
      return this.extractWithPlaywright();
    }
    return this.extractWithCheerio();
  }

  private async extractWithCheerio(): Promise<JobRaw[]> {
    try {
      const { data } = await axios.get(this.url);
      const $ = cheerio.load(data);
      return this.parse($);
    } catch (error: any) {
      console.error(`Error scraping ${this.url} with Cheerio:`, error.message);
      return [];
    }
  }

  private async extractWithPlaywright(): Promise<JobRaw[]> {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(this.url, { waitUntil: 'networkidle' });
      const content = await page.content();
      const $ = cheerio.load(content);
      return this.parse($);
    } catch (error: any) {
      console.error(`Error scraping ${this.url} with Playwright:`, error.message);
      return [];
    } finally {
      if (browser) await browser.close();
    }
  }

  private parse($: cheerio.CheerioAPI): JobRaw[] {
    const jobs: JobRaw[] = [];
    $(this.selectors.container).each((_, element) => {
      const title = $(element).find(this.selectors.title).text().trim();
      const company = this.selectors.company ? $(element).find(this.selectors.company).text().trim() : this.config.name;
      const location = this.selectors.location ? $(element).find(this.selectors.location).text().trim() : 'Remote';
      let sourceUrl = $(element).find(this.selectors.url).attr('href') || '';

      if (sourceUrl && !sourceUrl.startsWith('http')) {
        const baseUrl = new URL(this.url).origin;
        sourceUrl = baseUrl + sourceUrl;
      }

      if (title && sourceUrl) {
        jobs.push({ title, company, location, sourceUrl });
      }
    });
    return jobs;
  }
}
