import { useState, useEffect, useCallback } from 'react';
import { LocalForm, FormStatus } from '../types';
import {
  getAllForms as getAllFormsFromDb,
  getFormById as getFormByIdFromDb,
  getFormsByJob,
  updateFormStatus as updateFormStatusInDb,
} from '../services/database';

export const useForms = (jobId?: string) => {
  const [forms, setForms] = useState<LocalForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let loadedForms: LocalForm[];
      if (jobId) {
        loadedForms = await getFormsByJob(jobId);
      } else {
        loadedForms = await getAllFormsFromDb();
      }

      setForms(loadedForms);
    } catch (err) {
      console.error('Failed to load forms:', err);
      setError('Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const refreshForms = useCallback(() => {
    return loadForms();
  }, [loadForms]);

  return {
    forms,
    isLoading,
    error,
    refreshForms,
  };
};

export const useForm = (formId: string) => {
  const [form, setForm] = useState<LocalForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedForm = await getFormByIdFromDb(formId);
      setForm(loadedForm);
    } catch (err) {
      console.error('Failed to load form:', err);
      setError('Failed to load form');
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const updateFormStatus = useCallback(
    async (status: FormStatus) => {
      try {
        // Update local database
        await updateFormStatusInDb(formId, status);

        // Reload form
        await loadForm();
      } catch (err) {
        console.error('Failed to update form:', err);
        throw err;
      }
    },
    [formId, loadForm]
  );

  const refreshForm = useCallback(() => {
    return loadForm();
  }, [loadForm]);

  return {
    form,
    isLoading,
    error,
    updateFormStatus,
    refreshForm,
  };
};
