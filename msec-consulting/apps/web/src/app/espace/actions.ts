'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { destroyPortalSession } from '../../lib/session';

export async function logoutAction(): Promise<void> {
  await destroyPortalSession();
  revalidatePath('/', 'layout');
  redirect('/');
}