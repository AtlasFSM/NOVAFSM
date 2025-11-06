import { useState, useEffect, useCallback } from 'react';
import { LocalDocument, DocumentType } from '../types';
import {
  getAllDocuments as getAllDocumentsFromDb,
  getDocumentById as getDocumentByIdFromDb,
  getDocumentsByJob,
} from '../services/database';

export const useDocuments = (jobId?: string) => {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let loadedDocuments: LocalDocument[];
      if (jobId) {
        loadedDocuments = await getDocumentsByJob(jobId);
      } else {
        loadedDocuments = await getAllDocumentsFromDb();
      }

      setDocuments(loadedDocuments);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const refreshDocuments = useCallback(() => {
    return loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    isLoading,
    error,
    refreshDocuments,
  };
};

export const useDocument = (documentId: string) => {
  const [document, setDocument] = useState<LocalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedDocument = await getDocumentByIdFromDb(documentId);
      setDocument(loadedDocument);
    } catch (err) {
      console.error('Failed to load document:', err);
      setError('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const refreshDocument = useCallback(() => {
    return loadDocument();
  }, [loadDocument]);

  return {
    document,
    isLoading,
    error,
    refreshDocument,
  };
};
