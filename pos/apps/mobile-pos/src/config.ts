import Constants from 'expo-constants';

interface PosRuntimeConfig {
  readonly apiUrl: string;
  readonly syncEndpoint: string;
  readonly pinningEnabled: boolean;
  readonly deviceIdOverride?: string;
}

function readPosExtra(): PosRuntimeConfig | undefined {
  const config: unknown = Constants.expoConfig?.extra?.pos;
  if (config === null || config === undefined) {
    return undefined;
  }
  if (typeof config === 'object') {
    return config as PosRuntimeConfig;
  }
  return undefined;
}

const fallback: PosRuntimeConfig = {
  apiUrl: 'https://api.pos.msec.app/api/trpc',
  syncEndpoint: 'https://api.pos.msec.app/api/sync',
  pinningEnabled: true,
};

const extras = readPosExtra();

export const posConfig: PosRuntimeConfig = {
  apiUrl: extras?.apiUrl ?? fallback.apiUrl,
  syncEndpoint: extras?.syncEndpoint ?? fallback.syncEndpoint,
  pinningEnabled: extras?.pinningEnabled ?? fallback.pinningEnabled,
  deviceIdOverride: extras?.deviceIdOverride,
};

export const appVersion: string = Constants.expoConfig?.version ?? '1.0.0';

/** Identifiant stable de la caisse. En production : configuré par MDM/env, puis persistant. */
export const deviceId: string =
  posConfig.deviceIdOverride ?? 'device-mobile-0001';