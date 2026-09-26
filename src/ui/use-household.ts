import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import { createHouseholdActions } from 'src/data/household-actions';
import { useI18n } from 'src/ui/i18n';
import type { HouseholdActions } from 'src/data/household-actions';
import { createHouseholdRepository } from 'src/data/household-repository';
import { pricesByProduct, toPricePoints } from 'src/domain/deals';
import { buildOverview } from 'src/domain/shopping';
import type { HouseholdSnapshot, ProductOverview } from 'src/domain/shopping';

type LoadState = 'loading' | 'ready' | 'error';

export type RunAction = (
  key: string,
  work: (actions: HouseholdActions) => Promise<unknown>,
  successMessage?: string,
) => Promise<void>;

const notify = (message: string, variant: 'success' | 'error') => {
  // The host API is absent outside Twenty (e.g. in tests); never let a
  // notification failure break an action.
  enqueueSnackbar({ message, variant, duration: 3000 }).catch(() => {});
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const useHousehold = () => {
  const [snapshot, setSnapshot] = useState<HouseholdSnapshot | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [now, setNow] = useState(() => new Date());
  const isMounted = useRef(true);
  const { t } = useI18n();

  const repository = useMemo(
    () => createHouseholdRepository(new RestApiClient()),
    [],
  );
  const actions = useMemo(() => createHouseholdActions(repository), [repository]);

  const reload = useCallback(async () => {
    try {
      const next = await repository.loadSnapshot();

      if (!isMounted.current) {
        return;
      }
      setSnapshot(next);
      setNow(new Date());
      setLoadState('ready');
      setLoadError(null);
    } catch (error) {
      if (!isMounted.current) {
        return;
      }
      setLoadError(errorMessage(error));
      setLoadState('error');
    }
  }, [repository]);

  useEffect(() => {
    isMounted.current = true;
    reload();

    // Keep relative times and estimates current while the page stays open.
    const clock = setInterval(() => setNow(new Date()), 60_000);
    const refresh = setInterval(reload, 5 * 60_000);

    return () => {
      isMounted.current = false;
      clearInterval(clock);
      clearInterval(refresh);
    };
  }, [reload]);

  const run: RunAction = useCallback(
    async (key, work, successMessage) => {
      setBusyKey(key);
      try {
        await work(actions);
        await reload();
        if (successMessage) {
          setAnnouncement(successMessage);
          notify(successMessage, 'success');
        }
      } catch (error) {
        const message = t('Could not save: {error}', { error: errorMessage(error) });

        setAnnouncement(message);
        notify(message, 'error');
      } finally {
        if (isMounted.current) {
          setBusyKey(null);
        }
      }
    },
    [actions, reload, t],
  );

  const overview: ProductOverview[] = useMemo(
    () => (snapshot ? buildOverview(snapshot, now) : []),
    [snapshot, now],
  );

  const prices = useMemo(
    () =>
      pricesByProduct(
        toPricePoints(snapshot?.purchases ?? [], snapshot?.priceObservations ?? []),
        now,
      ),
    [snapshot, now],
  );

  return {
    snapshot,
    overview,
    prices,
    now,
    loadState,
    loadError,
    busyKey,
    announcement,
    reload,
    run,
  };
};

export type Household = ReturnType<typeof useHousehold>;
