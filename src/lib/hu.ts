/** Felhasználónak megjelenő szövegek magyarítása (auth, API, státuszok). */

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Hibás e-mail cím vagy jelszó',
  'User already registered': 'Ez az e-mail cím már regisztrálva van',
  'Email not confirmed': 'Az e-mail cím még nincs megerősítve',
  'Signup requires a valid password': 'Érvényes jelszót adj meg',
  'Password should be at least 6 characters': 'A jelszónak legalább 6 karakter hosszúnak kell lennie',
  'Unable to validate email address: invalid format': 'Érvénytelen e-mail cím formátum',
  'User not found': 'Nem található felhasználó ezzel az e-mail címmel',
  'Email rate limit exceeded': 'Túl sok kérés. Próbáld újra később.',
  'For security purposes, you can only request this once every 60 seconds':
    'Biztonsági okokból csak 60 másodpercenként kérhető újra.',
};

const PARTIAL_PATTERNS: [RegExp, string][] = [
  [/duplicate key/i, 'Ez az adat már létezik a rendszerben.'],
  [/violates foreign key/i, 'A művelet nem hajtható végre (kapcsolódó adatok miatt).'],
  [/violates row-level security/i, 'Nincs jogosultságod ehhez a művelethez.'],
  [/JWT expired/i, 'A munkamenet lejárt. Jelentkezz be újra.'],
  [/not found/i, 'A kért elem nem található.'],
  [/network/i, 'Hálózati hiba. Ellenőrizd az internetkapcsolatot.'],
  [/timeout/i, 'Időtúllépés. Próbáld újra.'],
  [/permission denied/i, 'Nincs jogosultságod ehhez a művelethez.'],
  [/too many requests/i, 'Túl sok kérés. Próbáld újra később.'],
];

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktív',
  pending: 'Függőben',
  approved: 'Jóváhagyva',
  rejected: 'Elutasítva',
  claimed: 'Igényelt',
  fulfilled: 'Teljesített',
  ended: 'Lezárult',
  sold: 'Elkelt',
  cancelled: 'Visszavont',
  deleted: 'Törölve',
  hidden: 'Rejtett',
  open: 'Nyitott',
  closed: 'Lezárva',
  resolved: 'Megoldva',
  dismissed: 'Elutasítva',
  reviewed: 'Átnézve',
  in_progress: 'Folyamatban',
  duplicate: 'Duplikált',
};

/** Auth és API hibaüzenetek magyarítása. */
export function translateMessage(message: string | null | undefined): string {
  if (!message?.trim()) return 'Ismeretlen hiba történt.';

  const trimmed = message.trim();
  if (AUTH_ERRORS[trimmed]) return AUTH_ERRORS[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, hu] of Object.entries(AUTH_ERRORS)) {
    if (lower === key.toLowerCase()) return hu;
  }

  for (const [pattern, hu] of PARTIAL_PATTERNS) {
    if (pattern.test(trimmed)) return hu;
  }

  // Már magyar (ékezetes betű vagy tipikus magyar szó)
  if (/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/.test(trimmed)) return trimmed;
  if (/\b(nem|hiba|sikertelen|kötelező|jelentkezz|próbáld)\b/i.test(trimmed)) return trimmed;

  return 'Hiba történt. Próbáld újra, vagy vedd fel a kapcsolatot az ügyfélszolgálattal.';
}

/** Belső státuszkódok megjelenítése (ha nincs dedikált címke). */
export function translateStatus(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export const REMOTE_BADGE = 'Távmunka';
export const REMOTE_BADGE_SEEKER = 'Távmunka OK';
export const REMOTE_FILTER = 'Csak távmunkás állások';
export const REMOTE_TOGGLE_JOB = 'Távmunka / otthoni munkavégzés';
export const REMOTE_TOGGLE_JOB_CREATE = 'Távmunka / otthoni munkavégzés lehetséges';
export const REMOTE_TOGGLE_SEEKER = 'Távmunkát is vállalok';
