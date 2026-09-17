/**
 * Configuration SSL Pinning (certificate pinning).
 * Les empreintes SHA-256 (format hexadécimal, 64 caractères) proviennent des
 * certificats d'autorité de votre infrastructure :
 *
 *   openssl s_client -connect api.pos.msec.app:443 -showcerts </dev/null \
 *     2>/dev/null | openssl x509 -pubkey -noout | \
 *     openssl pkey -pubin -outform DER | openssl dgst -sha256
 *
 * Cette configuration est consommée par :
 *  - le plugin Expo `plugins/with-ssl-pinning.js` (iOS ATS + Android NetworkSecurityConfig)
 *  - le démarrage du client API (check avant chaque appel HTTPS)
 */

export interface PinnedHost {
  readonly host: string;
  readonly sha256Fingerprints: readonly string[];
  readonly includeSubdomains: boolean;
  /** Uniquement hors production (Expo Go, builds de dev). */
  readonly allowDevSelfSigned: boolean;
}

export interface PinningConfig {
  readonly enabled: boolean;
  readonly hosts: readonly PinnedHost[];
}

const SHA256_HEX_GLOBAL = /^[A-Fa-f0-9]{64}$/;

export function isSha256Fingerprint(value: string): boolean {
  return SHA256_HEX_GLOBAL.test(value);
}

function normalizeFingerprints(input: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const value = raw.toLowerCase();
    if (!isSha256Fingerprint(value)) {
      throw new TypeError(`Empreinte SHA-256 invalide: ${raw}`);
    }
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return Object.freeze(out);
}

function normalizeHost(host: string): string {
  const normalized = host.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new TypeError('Hôte vide');
  }
  if (normalized.includes('://') || normalized.includes('/')) {
    throw new TypeError(`Hôte invalide (URL complète interdite): ${host}`);
  }
  return normalized;
}

export function createPinnedHost(input: PinnedHost): PinnedHost {
  const fingerprints = normalizeFingerprints(input.sha256Fingerprints);
  if (fingerprints.length === 0) {
    throw new TypeError(`Aucune empreinte pour ${input.host}`);
  }
  return Object.freeze({
    host: normalizeHost(input.host),
    sha256Fingerprints: fingerprints,
    includeSubdomains: input.includeSubdomains,
    allowDevSelfSigned: input.allowDevSelfSigned,
  });
}

export function createPinningConfig(
  hosts: readonly PinnedHost[],
  enabled = true,
): PinningConfig {
  return Object.freeze({
    enabled,
    hosts: Object.freeze(hosts.map((h) => createPinnedHost(h))),
  });
}

export function assertPinningConfig(config: PinningConfig): void {
  if (config.hosts.length === 0) {
    throw new Error('PinningConfig: au moins un hôte est requis');
  }
  // Vérifie aussi que chaque empreinte est utilisable.
  for (const host of config.hosts) {
    createPinnedHost(host);
  }
}

/**
 * Config de référence du POS. ⚠️ Remplacer les empreintes par celles de votre
 * certificat réel (voir commande openssl en tête de fichier) avant la prod.
 */
export const POS_PINNING: PinningConfig = createPinningConfig(
  [
    {
      host: 'api.pos.msec.app',
      sha256Fingerprints: [
        '0000000000000000000000000000000000000000000000000000000000000000',
      ],
      includeSubdomains: false,
      allowDevSelfSigned: false,
    },
  ],
  true,
);

export function assertCertMatchesPinning(
  config: PinningConfig,
  host: string,
  serverSha256Fingerprint: string,
): boolean {
  if (!config.enabled) {
    return true;
  }
  const pin = config.hosts.find((h) => h.host === host.toLowerCase());
  if (pin === undefined) {
    return false;
  }
  return pin.sha256Fingerprints.includes(serverSha256Fingerprint.toLowerCase());
}