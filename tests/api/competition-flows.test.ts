import { describe, it, expect } from 'vitest';
import app from '../../src/server/app';

// Helper to make test requests without external HTTP client
async function request(path: string, options: RequestInit = {}) {
  // Using express directly via fetch-like in-memory testing or basic request handler
  // Since Express app can handle requests, let's test via direct app handlers or node http
  return new Promise<{ status: number; body: any }>((resolve) => {
    const http = require('http');
    const server = http.createServer(app);
    server.listen(0, async () => {
      const port = server.address().port;
      try {
        const res = await fetch(`http://localhost:${port}${path}`, options);
        const text = await res.text();
        let body: any;
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
        server.close();
        resolve({ status: res.status, body });
      } catch (e) {
        server.close();
        throw e;
      }
    });
  });
}

describe('Ascend Competition API Lifecycle', () => {
  it('lists seeded events including Ascend Open and IPF Nationals', async () => {
    const res = await request('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const openEvt = res.body.find((e: any) => e.rulesSnapshot.profileId === 'ascend_open');
    const ipfEvt = res.body.find((e: any) => e.rulesSnapshot.profileId === 'ipf_inspired');

    expect(openEvt).toBeDefined();
    expect(ipfEvt).toBeDefined();
  });

  it('rejects illegal rules modification for IPF event (bodyweight ratio as primary)', async () => {
    const ipfEvents = await request('/api/events');
    const ipfEvt = ipfEvents.body.find((e: any) => e.rulesSnapshot.profileId === 'ipf_inspired');

    const illegalRules = {
      ...ipfEvt.rulesSnapshot,
      primaryRankingMetric: 'bodyweight_ratio',
    };

    const res = await request(`/api/events/${ipfEvt.id}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(illegalRules),
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((err: string) => err.includes('do not permit bodyweight ratio'))).toBe(true);
  });

  it('records 3-referee votes and evaluates 2-1 majority Good Lift', async () => {
    const ipfEvents = await request('/api/events');
    const ipfEvt = ipfEvents.body.find((e: any) => e.rulesSnapshot.profileId === 'ipf_inspired');

    // Declare a new attempt for testing
    const createRes = await request(`/api/events/${ipfEvt.id}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athleteId: 'ath-ipf-2',
        liftType: 'deadlift',
        attemptNumber: 3,
        weightKg: 287.5,
      }),
    });

    expect(createRes.status).toBe(201);
    const attemptId = createRes.body.id;

    // Vote 1: Chief White
    await request(`/api/events/${ipfEvt.id}/attempts/${attemptId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refereeId: 'ref-chief',
        refereeRole: 'chief',
        decision: 'good_lift',
      }),
    });

    // Vote 2: Left Red (infraction DL-01)
    await request(`/api/events/${ipfEvt.id}/attempts/${attemptId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refereeId: 'ref-left',
        refereeRole: 'left',
        decision: 'no_lift',
        infractionReasonCodes: ['DL-01'],
      }),
    });

    // Vote 3: Right White -> 2-1 White Majority!
    const vote3Res = await request(`/api/events/${ipfEvt.id}/attempts/${attemptId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refereeId: 'ref-right',
        refereeRole: 'right',
        decision: 'good_lift',
      }),
    });

    expect(vote3Res.status).toBe(200);
    expect(vote3Res.body.majorityDecision).toBe('good_lift');
    expect(vote3Res.body.status).toBe('good_lift');
  });

  it('generates CSV results export with proper headers', async () => {
    const ipfEvents = await request('/api/events');
    const ipfEvt = ipfEvents.body.find((e: any) => e.rulesSnapshot.profileId === 'ipf_inspired');

    const csvRes = await request(`/api/events/${ipfEvt.id}/sheets/csv-results`);
    expect(csvRes.status).toBe(200);
    expect(typeof csvRes.body).toBe('string');
    expect(csvRes.body).toContain('Rank,Lot,Name,Team,Category,Bodyweight (kg)');
    expect(csvRes.body).toContain('Alexander Cole');
  });

  it('queries append-only audit trail verifying recorded actions', async () => {
    const ipfEvents = await request('/api/events');
    const ipfEvt = ipfEvents.body.find((e: any) => e.rulesSnapshot.profileId === 'ipf_inspired');

    const auditRes = await request(`/api/events/${ipfEvt.id}/audit`);
    expect(auditRes.status).toBe(200);
    expect(Array.isArray(auditRes.body)).toBe(true);
    expect(auditRes.body.length).toBeGreaterThan(0);
  });
});

