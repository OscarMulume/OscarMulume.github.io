'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createPortalSession } from '../../lib/session';

const loginInput = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(['CLIENT', 'STAFF', 'ADMIN', 'OWNER']).default('CLIENT'),
  clientId: z.string().trim().uuid().optional(),
});

/**
 * Connexion démo du boilerplate : aucun backend d’authentification n'existe
 * encore. La validation et la pose du cookie httpOnly (signé HMAC-SHA-256)
 * sont néanmoins la passerelle réelle — aucune valeur ici n'est stockée côté
 * client autrement que via le cookie sécurisé.
 */
export async function loginAction(formData: FormData): Promise<never> {
  const parsed = loginInput.safeParse({
    email: formData.get('email'),
    role: formData.get('role') ?? 'CLIENT',
    clientId: formData.get('clientId') || undefined,
  });

  if (!parsed.success) {
    redirect('/connexion?erreur=format');
  }

  const { email, role, clientId } = parsed.data;
  await createPortalSession({
    sub: email,
    role,
    subjectClientId: role === 'CLIENT' ? (clientId ?? null) : null,
  });

  revalidatePath('/espace', 'layout');
  redirect('/espace');
}