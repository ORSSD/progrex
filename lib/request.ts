import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';

/**
 * Visitor IP for rate limiting and logs.
 *
 * Only ONE header is trusted, set by whichever proxy sits directly in front of the app;
 * any other header could be forged by the visitor to dodge the login limit.
 * - Default `x-real-ip`: set by Dokploy's Traefik from the real connection.
 * - Behind Cloudflare: set CLIENT_IP_HEADER=cf-connecting-ip (and only accept traffic from
 *   Cloudflare), otherwise every visitor would share Cloudflare's address.
 */
export async function clientIp() {
  const name = ((env as unknown as { CLIENT_IP_HEADER?: string }).CLIENT_IP_HEADER || 'x-real-ip').toLowerCase();
  const value = (await headers()).get(name)?.split(',')[0]?.trim();
  return (value || 'unknown').slice(0, 64);
}

/** One-line security log entry; shows up in the container logs (Dokploy → Logs). */
export function securityLog(event: string, details: Record<string, string | number>) {
  console.warn(`[security] ${event} ${Object.entries(details).map(([k, v]) => `${k}=${v}`).join(' ')}`);
}
