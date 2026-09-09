type AlertFeature = {
  id?: string;
  properties?: { severity?: string };
};

type AlertState = {
  alertIds?: unknown;
  alertId?: unknown;
};

export function severeAlertDelta(features: AlertFeature[] = [], state: AlertState = {}) {
  const severe = features.filter((feature) =>
    ['Extreme', 'Severe'].includes(feature?.properties?.severity || '') && typeof feature?.id === 'string' && feature.id.length > 0
  );
  const activeIds = severe.map((feature) => feature.id as string);
  const previousIds = Array.isArray(state.alertIds)
    ? state.alertIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : typeof state.alertId === 'string' && state.alertId.length > 0
      ? [state.alertId]
      : [];
  const seen = new Set(previousIds);
  const unseen = severe.filter((feature) => !seen.has(feature.id as string));
  return { severe, unseen, activeIds, previousIds };
}
