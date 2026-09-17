import { createPosApi } from '@pos/api';
import type { PosApi } from '@pos/api';

import { ExpoSecureStorage } from '@pos/security/mobile';

import { appVersion, deviceId, posConfig } from '../config';

const storage = new ExpoSecureStorage();

/** Récupère le jeton stocké en Keychain/Keystore (jamais en mémoire persistante). */
export async function readAuthToken(): Promise<string | null> {
  return storage.getItem('pos.auth.token');
}

let api: PosApi | null = null;

export function usePosApi(): PosApi {
  if (api === null) {
    api = createPosApi({
      url: posConfig.apiUrl,
      deviceId,
      appVersion,
      tokenProvider: readAuthToken,
    });
  }
  return api;
}