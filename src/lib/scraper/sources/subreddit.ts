import axios from 'axios';
import { JobRaw, ScraperConfig, ScraperSource } from '../types';

export class SubredditScraper implements ScraperSource {
  constructor(
    public config: ScraperConfig,
    private subreddit: string
  ) {}

  async extract(): Promise<JobRaw[]> {
    const url = `https://www.reddit.com/r/${this.subreddit}/new.json?limit=100`;
    try {
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'RemoteRadar/1.0.0 (by /u/remoteradar-bot)'
        }
      });
      
      const jobs: JobRaw[] = [];
      const children = data?.data?.children || [];

      for (const post of children) {
        const { title, url: sourceUrl, selftext: description, created_utc, author: company } = post.data;
        
        // Basic filter for job posts (usually they have "Hiring" or similar in title)
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('hiring') || lowerTitle.includes('job') || lowerTitle.includes('[h]')) {
          jobs.push({
            title,
            company: company || 'Reddit User',
            location: 'Remote',
            sourceUrl: `https://www.reddit.com${post.data.permalink}`,
            description,
            postedAt: new Date(created_utc * 1000),
          });
        }
      }

      return jobs;
    } catch (error: any) {
      console.error(`Error scraping Subreddit ${this.subreddit}:`, error.message);
      return [];
    }
  }
}
