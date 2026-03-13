"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColorSummary, MaterialType, PrinterType } from "@/lib/types";

type FetchStatus = { loading: boolean; error: string | null };

interface PricingConfig {
  id: string;
  machineAmortizationPerHour: number;
  operationCostPerHour: number;
  consumablesCostPerHour: number;
  marginUnit: number;
  marginMedium: number;
  marginBulk: number;
  updatedAt: string;
}

interface FetchResult<T> {
  data: T;
  status: FetchStatus;
  reload: () => Promise<void>;
}

const jsonHeaders = { "Content-Type": "application/json" };

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { headers: jsonHeaders, signal });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

function useFetchable<T>(url: string, initialData: T): FetchResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [status, setStatus] = useState<FetchStatus>({
    loading: true,
    error: null,
  });

  const fetcher = useCallback(
    async (signal?: AbortSignal) => {
      setStatus({ loading: true, error: null });
      try {
        const payload = await fetchJson<T>(url, signal);
        setData(payload);
        setStatus({ loading: false, error: null });
      } catch (error: unknown) {
        if ((error as Error).name === "AbortError") return;
        setStatus({ loading: false, error: (error as Error).message });
      }
    },
    [url]
  );

  const reload = useCallback(() => fetcher(undefined), [fetcher]);

  useEffect(() => {
    const controller = new AbortController();
    fetcher(controller.signal);
    return () => controller.abort();
  }, [fetcher]);

  return { data, status, reload };
}

export function useAdminCatalog() {
  const materialsResult = useFetchable<MaterialType[]>("/api/admin/materials", []);
  const colorsResult = useFetchable<ColorSummary[]>("/api/admin/colors", []);
  const printersResult = useFetchable<{ printers: PrinterType[] }>("/api/admin/printers", {
    printers: [],
  });
  const pricingResult = useFetchable<PricingConfig | null>("/api/admin/pricing", null);

  const aggregatedLoading = useMemo(
    () =>
      materialsResult.status.loading ||
      colorsResult.status.loading ||
      printersResult.status.loading ||
      pricingResult.status.loading,
    [
      materialsResult.status.loading,
      colorsResult.status.loading,
      printersResult.status.loading,
      pricingResult.status.loading,
    ]
  );

  const { reload: reloadMaterials } = materialsResult;
  const { reload: reloadColors } = colorsResult;
  const { reload: reloadPrinters } = printersResult;
  const { reload: reloadPricing } = pricingResult;

  const reloadAll = useCallback(async () => {
    await Promise.all([reloadMaterials(), reloadColors(), reloadPrinters(), reloadPricing()]);
  }, [reloadMaterials, reloadColors, reloadPrinters, reloadPricing]);

  return {
    materials: materialsResult.data,
    colors: colorsResult.data,
    printers: printersResult.data.printers,
    pricingConfig: pricingResult.data,
    loading: {
      materials: materialsResult.status.loading,
      colors: colorsResult.status.loading,
      printers: printersResult.status.loading,
      pricing: pricingResult.status.loading,
      any: aggregatedLoading,
    },
    errors: {
      materials: materialsResult.status.error,
      colors: colorsResult.status.error,
      printers: printersResult.status.error,
      pricing: pricingResult.status.error,
    },
    reloadAll,
    reloadMaterials,
    reloadColors,
    reloadPrinters,
    reloadPricing,
  };
}
