import { cookies } from 'next/headers';
import { LANG_COOKIE, dict } from './i18n';
import type { Lang } from './types';

/** The visitor's language, chosen with the header toggle and stored in a cookie. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === 'ar' ? 'ar' : 'en';
}

export async function getDict() {
  const lang = await getLang();
  return { lang, d: dict[lang] };
}
