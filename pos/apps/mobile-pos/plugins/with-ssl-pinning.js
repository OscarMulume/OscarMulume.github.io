/**
 * Expo Config Plugin — SSL Pinning.
 *
 * Applique le certificate pinning au build natif :
 *  - Android : network_security_config.xml (pin-set SHA-256) référencé dans le manifest ;
 *  - iOS : NSAppTransportSecurity (HTTPS strict + exceptions par domaine).
 *
 * Configuration attendue (app.json → plugins) :
 *   [".../with-ssl-pinning", {
 *     "enabled": true,
 *     "hosts": [{
 *       "host": "api.pos.msec.app",
 *       "sha256Fingerprints": ["AA..64..hex"],
 *       "includeSubdomains": false
 *     }]
 *   }]
 *
 * NB iOS : pour du pinning strict (NSPinnedDomains) il faut fournir la
 * représentation base64 du CERTIFICAT (pas le hash hex). À compléter selon
 * votre certificat réel ; ici nous forçons HTTPS exclusif + PFS.
 */
const {
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function parseProps(props) {
  const enabled = props !== null && typeof props === 'object' && props.enabled !== false;
  const hosts = Array.isArray(props && props.hosts) ? props.hosts : [];
  if (enabled && hosts.length === 0) {
    throw new Error('with-ssl-pinning : au moins un hôte est requis');
  }
  return { enabled, hosts };
}

function networkSecurityXml(hosts) {
  const domains = hosts
    .map((host) => {
      const pins = host.sha256Fingerprints
        .map((fingerprint) => `          <pin digest="SHA-256">${fingerprint}</pin>`)
        .join('\n');
      return [
        `      <domain-config includeSubdomains="${host.includeSubdomains ? 'true' : 'false'}">`,
        `        <domain>${host.host}</domain>`,
        `        <pin-set expiration="2036-12-31">`,
        pins,
        `        </pin-set>`,
        `      </domain-config>`,
      ].join('\n');
    })
    .join('\n');

  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<network-security-config>`,
    `  <base-config cleartextTrafficPermitted="false" />`,
    domains,
    `</network-security-config>`,
    ``,
  ].join('\n');
}

function withAndroidNetworkSecurityConfig(config, hosts) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlPath = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml',
        'network_security_config.xml',
      );
      await fs.promises.mkdir(path.dirname(xmlPath), { recursive: true });
      await fs.promises.writeFile(xmlPath, networkSecurityXml(hosts), 'utf8');
      return config;
    },
  ]);
}

function withManifestNetworkSecurity(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application ? config.modResults.manifest.application[0] : undefined;
    if (application === undefined) {
      return config;
    }
    const attributes = application.$ ? { ...application.$ } : {};
    attributes['android:networkSecurityConfig'] = '@xml/network_security_config';
    application.$ = attributes;
    return config;
  });
}

function withIosAppTransport(config, hosts) {
  return withInfoPlist(config, (config) => {
    const exceptions = {};
    for (const host of hosts) {
      exceptions[host.host] = {
        NSExceptionAllowsInsecureHTTPLoads: false,
        NSExceptionRequiresForwardSecrecy: true,
        NSIncludesSubdomains: host.includeSubdomains,
      };
    }
    config.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: false,
      NSExceptionDomains: exceptions,
    };
    return config;
  });
}

function withSslPinning(config, props) {
  const { enabled, hosts } = parseProps(props);
  if (!enabled) {
    return config;
  }
  config = withManifestNetworkSecurity(config);
  config = withAndroidNetworkSecurityConfig(config, hosts);
  config = withIosAppTransport(config, hosts);
  return config;
}

module.exports = createRunOncePlugin(withSslPinning, 'with-ssl-pinning', '1.0.0');