import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  WEATHER_RESORTS,
  deriveResortWeather,
  readStoredWeatherMap,
  saveStoredWeatherMap,
  type DerivedResortWeather,
  type OpenMeteoMultiModelResponse,
  type ResortWeatherEntry,
  type WeatherMap,
  type WeatherResortId,
} from '../lib/weather';

export interface UseSkiWeatherResult {
  weatherMap: WeatherMap;
  derivedByResort: Partial<Record<WeatherResortId, DerivedResortWeather>>;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  refreshAll: (manual?: boolean) => Promise<void>;
}

export function useSkiWeather(
  onShowToast?: (message: string) => void,
): UseSkiWeatherResult {
  const initialMap = useMemo(() => readStoredWeatherMap(), []);

  const [weatherMap, setWeatherMap] = useState<WeatherMap>(initialMap);
  const [isLoading, setIsLoading] = useState<boolean>(
    Object.keys(initialMap).length === 0,
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshAll = useCallback(
    async (manual = false) => {
      if (manual) {
        setIsRefreshing(true);
      } else if (Object.keys(readStoredWeatherMap()).length === 0) {
        setIsLoading(true);
      }
      setErrorMessage(null);

      const previousMap = readStoredWeatherMap();
      const nextMap: WeatherMap = {...previousMap};
      let liveSuccessCount = 0;
      let cacheHitCount = 0;

      const results = await Promise.allSettled(
        WEATHER_RESORTS.map(async (resort) => {
          const response = await fetch(resort.apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const swCacheStatus = response.headers.get('X-SW-Cache');
          const swCachedAt = response.headers.get('X-SW-Cached-At');
          const json = (await response.json()) as OpenMeteoMultiModelResponse;

          if (!json || !json.hourly || !Array.isArray(json.hourly.time)) {
            throw new Error('INVALID_WEATHER_PAYLOAD');
          }

          const isSwCachedFallback = swCacheStatus === 'HIT' || !navigator.onLine;
          const prevEntry = previousMap[resort.id];
          const timestamp =
            isSwCachedFallback && swCachedAt
              ? swCachedAt
              : isSwCachedFallback && prevEntry?.fetchedAt
                ? prevEntry.fetchedAt
                : new Date().toISOString();

          return {
            id: resort.id,
            entry: {
              data: json,
              fetchedAt: timestamp,
              fromCache: isSwCachedFallback,
            } satisfies ResortWeatherEntry,
          };
        }),
      );

      results.forEach((result, index) => {
        const resortId = WEATHER_RESORTS[index].id;
        if (result.status === 'fulfilled') {
          nextMap[resortId] = result.value.entry;
          if (result.value.entry.fromCache) {
            cacheHitCount += 1;
          } else {
            liveSuccessCount += 1;
          }
        } else if (previousMap[resortId]) {
          nextMap[resortId] = {
            ...previousMap[resortId]!,
            fromCache: true,
          };
          cacheHitCount += 1;
        }
      });

      const hasAnyData = Object.keys(nextMap).length > 0;
      if (hasAnyData) {
        setWeatherMap(nextMap);
        saveStoredWeatherMap(nextMap);
      } else {
        setErrorMessage(
          '目前處於離線狀態且尚未快取四大雪場氣象數據，請於有網絡時先載入一次。',
        );
      }

      if (manual && onShowToast) {
        if (liveSuccessCount > 0) {
          onShowToast(`已更新 ${liveSuccessCount} 大雪場即時氣象並寫入離線快取`);
        } else if (cacheHitCount > 0) {
          onShowToast('目前無訊號，已載入最後一次快取的四大雪場氣象');
        } else {
          onShowToast('載入失敗，請檢查網絡連線');
        }
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [onShowToast],
  );

  useEffect(() => {
    void refreshAll(false);
  }, [refreshAll]);

  const derivedByResort = useMemo(() => {
    const map: Partial<Record<WeatherResortId, DerivedResortWeather>> = {};
    WEATHER_RESORTS.forEach((resort) => {
      const entry = weatherMap[resort.id];
      const derived = deriveResortWeather(entry?.data, resort.elevation);
      if (derived) {
        map[resort.id] = derived;
      }
    });
    return map;
  }, [weatherMap]);

  return {
    weatherMap,
    derivedByResort,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshAll,
  };
}
