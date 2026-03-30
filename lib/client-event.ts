'use client';

/** Calls GET /api/init and stores the real event id (fixes stale localStorage after DB reset). */
export async function initDefaultEventAndStore(): Promise<number> {
  const initRes = await fetch('/api/init');
  if (!initRes.ok) {
    let msg = 'Failed to initialize event';
    try {
      const j = (await initRes.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await initRes.json()) as { eventId: number; eventCode: string };
  localStorage.setItem('eventId', data.eventId.toString());
  localStorage.setItem('eventCode', data.eventCode);
  return data.eventId;
}
