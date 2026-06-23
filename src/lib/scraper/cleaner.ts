import axios from 'axios';
import prisma from '../prisma';
import { Job } from '@prisma/client';

export async function cleanJobs() {
  console.log('Starting job cleaner...');
  
  const activeJobs = await prisma.job.findMany({
    where: { active: true },
  });

  console.log(`Found ${activeJobs.length} active jobs to validate.`);

  let validatedCount = 0;
  let markedInactiveCount = 0;

  const BATCH_SIZE = 10;
  for (let i = 0; i < activeJobs.length; i += BATCH_SIZE) {
    const batch = activeJobs.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.allSettled(
      batch.map(async (job: Job) => {
        try {
          // 1. Try HEAD request first
          const response = await axios.head(job.sourceUrl, { 
            timeout: 8000,
            maxRedirects: 5,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            validateStatus: (status) => status < 500
          });

          if (response.status === 404 || response.status === 410) {
            return { id: job.id, inactive: true, reason: `Status ${response.status}` };
          }

          // 2. Perform GET to check for text patterns in body
          const getResponse = await axios.get(job.sourceUrl, { 
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          const body = typeof getResponse.data === 'string' ? getResponse.data.toLowerCase() : '';
          const expiredPatterns = [
            "not found", 
            "expired", 
            "position closed", 
            "no longer available", 
            "job is closed", 
            "vacancy closed",
            "this job is no longer active"
          ];

          if (expiredPatterns.some(pattern => body.includes(pattern))) {
            return { id: job.id, inactive: true, reason: "Expired keywords found in body" };
          }

          // Check if redirected to a generic page (e.g. greenhouse boards)
          const finalUrl = getResponse.request.res.responseUrl || job.sourceUrl;
          if (finalUrl !== job.sourceUrl && (finalUrl.endsWith('/jobs') || finalUrl.endsWith('/boards'))) {
             return { id: job.id, inactive: true, reason: "Redirected to general jobs page" };
          }

          return { id: job.id, inactive: false };
        } catch (error: any) {
          if (error.response) {
            if (error.response.status === 404 || error.response.status === 410) {
              return { id: job.id, inactive: true, reason: `Error Status ${error.response.status}` };
            }
          }
          return { id: job.id, inactive: false, error: error.message };
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.inactive) {
        await prisma.job.update({
          where: { id: result.value.id },
          data: { active: false },
        });
        markedInactiveCount++;
      }
      validatedCount++;
    }
  }

  console.log(`Cleaner finished. Validated: ${validatedCount}, Marked Inactive: ${markedInactiveCount}`);
  return { validatedCount, markedInactiveCount };
}
