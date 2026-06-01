import type { User } from '@supabase/supabase-js';

/** Egyetlen fejlesztői fiók — weboldal-szerkesztő és fejlesztői mód. */
export const SITE_DEVELOPER_EMAIL = 'gerzsonpapa@gmail.com';

export function isSiteDeveloper(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  return user.email.toLowerCase() === SITE_DEVELOPER_EMAIL;
}
