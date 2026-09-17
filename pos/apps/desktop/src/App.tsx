import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useState } from 'react';

import { TauriKeychainStorage } from '@pos/security/desktop';
import { posBrand } from '@pos/ui';
import { check } from '@tauri-apps/plugin-updater';

const storage = new TauriKeychainStorage();

interface DesktopState {
  readonly status: string;
  readonly storedToken: string | null;
}

const initial: DesktopState = {
  status: 'Prêt',
  storedToken: null,
};

export function App(): ReactNode {
  const [state, setState] = useState<DesktopState>(initial);

  const handleSave = useCallback(async (): Promise<void> => {
    try {
      await storage.setItem('pos.auth.token', 'demo-token-abc123');
      const token = await storage.getItem('pos.auth.token');
      setState({ status: 'Jeton enregistré dans le Keychain système', storedToken: token });
    } catch (error: unknown) {
      setState({ status: `Erreur Keychain : ${String(error)}`, storedToken: null });
    }
  }, []);

  const handleCheckUpdate = useCallback(async (): Promise<void> => {
    try {
      const update = await check();
      setState((previous) => ({
        status: update === null ? "Aucune mise à jour disponible" : `Mise à jour ${update.version} disponible`,
        storedToken: previous.storedToken,
      }));
    } catch (error: unknown) {
      setState((previous) => ({
        status: `Mise à jour indisponible (hors runtime Tauri ?) : ${String(error)}`,
        storedToken: previous.storedToken,
      }));
    }
  }, []);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        color: posBrand.colors.text,
        background: posBrand.colors.background,
        minHeight: '100vh',
        padding: posBrand.spacing.xl,
      }}
    >
      <h1 style={{ fontSize: posBrand.typography.heading }}>M-Sec POS — Caisse fixe</h1>

      <section
        style={{
          background: posBrand.colors.surface,
          borderRadius: posBrand.radii.lg,
          border: `1px solid ${posBrand.colors.border}`,
          padding: posBrand.spacing.xl,
          maxWidth: 640,
        }}
      >
        <p>Texte de status : <strong>{state.status}</strong></p>

        <div style={{ display: 'flex', gap: posBrand.spacing.md, marginTop: posBrand.spacing.lg }}>
          <button
            onClick={() => void handleSave()}
            style={buttonStyle(posBrand.colors.primary)}
          >
            Enregistrer un jeton (Keychain)
          </button>
          <button
            onClick={() => void handleCheckUpdate()}
            style={buttonStyle(posBrand.colors.success)}
          >
            Vérifier mise à jour (Tauri Updater)
          </button>
        </div>

        <p style={{ color: posBrand.colors.textMuted, fontSize: posBrand.typography.caption }}>
          Jeton relu depuis le Keychain : {state.storedToken === null ? '—' : state.storedToken}
        </p>
      </section>
    </main>
  );
}

function buttonStyle(background: string): CSSProperties {
  return {
    background,
    color: '#fff',
    border: 'none',
    borderRadius: posBrand.radii.md,
    padding: `${posBrand.spacing.md}px ${posBrand.spacing.lg}px`,
    fontWeight: posBrand.fontWeights.bold,
    cursor: 'pointer',
  };
}