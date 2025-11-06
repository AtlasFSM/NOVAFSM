import { useState, useEffect, useCallback } from 'react';
import { LocalAsset, AssetStatus } from '../types';
import {
  getAllAssets as getAllAssetsFromDb,
  getAssetById as getAssetByIdFromDb,
  getAssetsByStatus,
  updateAssetStatus as updateAssetStatusInDb,
} from '../services/database';

export const useAssets = (filterStatus?: AssetStatus) => {
  const [assets, setAssets] = useState<LocalAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let loadedAssets: LocalAsset[];
      if (filterStatus) {
        loadedAssets = await getAssetsByStatus(filterStatus);
      } else {
        loadedAssets = await getAllAssetsFromDb();
      }

      setAssets(loadedAssets);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError('Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const refreshAssets = useCallback(() => {
    return loadAssets();
  }, [loadAssets]);

  return {
    assets,
    isLoading,
    error,
    refreshAssets,
  };
};

export const useAsset = (assetId: string) => {
  const [asset, setAsset] = useState<LocalAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAsset = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedAsset = await getAssetByIdFromDb(assetId);
      setAsset(loadedAsset);
    } catch (err) {
      console.error('Failed to load asset:', err);
      setError('Failed to load asset');
    } finally {
      setIsLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  const updateAssetStatus = useCallback(
    async (status: AssetStatus) => {
      try {
        // Update local database
        await updateAssetStatusInDb(assetId, status);

        // Reload asset
        await loadAsset();
      } catch (err) {
        console.error('Failed to update asset:', err);
        throw err;
      }
    },
    [assetId, loadAsset]
  );

  const refreshAsset = useCallback(() => {
    return loadAsset();
  }, [loadAsset]);

  return {
    asset,
    isLoading,
    error,
    updateAssetStatus,
    refreshAsset,
  };
};
