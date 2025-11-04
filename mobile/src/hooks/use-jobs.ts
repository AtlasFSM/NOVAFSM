import { useState, useEffect, useCallback } from 'react';
import { LocalJob, JobStatus, JobUpdateRequest } from '../types';
import {
  getAllJobs as getAllJobsFromDb,
  getJobById as getJobByIdFromDb,
  getJobsByStatus,
  updateJobStatus as updateJobStatusInDb,
} from '../services/database';
import { queueJobUpdate } from '../services/sync';

export const useJobs = (filterStatus?: JobStatus) => {
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let loadedJobs: LocalJob[];
      if (filterStatus) {
        loadedJobs = await getJobsByStatus(filterStatus);
      } else {
        loadedJobs = await getAllJobsFromDb();
      }

      setJobs(loadedJobs);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const refreshJobs = useCallback(() => {
    return loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    isLoading,
    error,
    refreshJobs,
  };
};

export const useJob = (jobId: string) => {
  const [job, setJob] = useState<LocalJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedJob = await getJobByIdFromDb(jobId);
      setJob(loadedJob);
    } catch (err) {
      console.error('Failed to load job:', err);
      setError('Failed to load job');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const updateJob = useCallback(
    async (updates: JobUpdateRequest) => {
      try {
        // Update local database
        if (updates.status) {
          await updateJobStatusInDb(jobId, updates.status);
        }

        // Queue for sync
        await queueJobUpdate(jobId, updates);

        // Reload job
        await loadJob();
      } catch (err) {
        console.error('Failed to update job:', err);
        throw err;
      }
    },
    [jobId, loadJob]
  );

  const refreshJob = useCallback(() => {
    return loadJob();
  }, [loadJob]);

  return {
    job,
    isLoading,
    error,
    updateJob,
    refreshJob,
  };
};
