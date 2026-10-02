import { test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { apiLimiter, aiEndpointLimiter } from '../src/middleware/rateLimiter.js';

test('Security Middleware (Helmet, CORS, Rate Limit, JSON limit)', async (t) => {
  // Save original config limits to restore later
  const originalApiMax = config.rateLimits.api.max;
  const originalAiMax = config.rateLimits.ai.max;

  // Helper to reset limiters for test IPs
  const resetLimiters = () => {
    apiLimiter.resetKey('::ffff:127.0.0.1');
    apiLimiter.resetKey('::1');
    apiLimiter.resetKey('127.0.0.1');
    aiEndpointLimiter.resetKey('::ffff:127.0.0.1');
    aiEndpointLimiter.resetKey('::1');
    aiEndpointLimiter.resetKey('127.0.0.1');
  };

  await t.test('JSON Body Limit should reject oversized payload safely', async () => {
    // Generate a payload larger than 100kb
    const largeString = 'a'.repeat(150 * 1024); // 150kb
    const res = await request(app)
      .post('/api/projects/analyze')
      .send({ url: largeString });

    assert.strictEqual(res.status, 413);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'PAYLOAD_TOO_LARGE');
    assert.ok(!res.body.error.message.includes('stack')); // Ensure no internal stack trace
  });

  await t.test('Helmet should set security headers', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    
    assert.ok(res.headers['x-content-type-options'], 'Missing x-content-type-options header');
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['content-security-policy'], 'Missing content-security-policy header');
  });

  await t.test('CORS should be configured properly', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', config.clientUrl)
      .set('Access-Control-Request-Method', 'GET');
      
    assert.ok(res.headers['access-control-allow-origin']);
    assert.strictEqual(res.headers['access-control-allow-origin'], config.clientUrl);
  });
  
  await t.test('General API rate limiting should return 429', async () => {
    // Use deliberately small limits
    config.rateLimits.api.max = 2;
    resetLimiters();

    // 2 legitimate requests
    for (let i = 0; i < 2; i++) {
      const res = await request(app)
        .get('/api/health');
      assert.strictEqual(res.status, 200);
    }
    
    // 3rd should be blocked
    const resBlocked = await request(app)
      .get('/api/health');
      
    assert.strictEqual(resBlocked.status, 429);
    assert.strictEqual(resBlocked.body.success, false);
    assert.strictEqual(resBlocked.body.error.code, 'TOO_MANY_REQUESTS');
  });

  await t.test('AI/expensive endpoint rate limiting should return 429', async () => {
    config.rateLimits.ai.max = 1;
    resetLimiters();

    // 1 legitimate request (returns 400 because no URL provided, but gets past rate limit!)
    const res1 = await request(app)
      .post('/api/projects/analyze')
      .send({});
    assert.notStrictEqual(res1.status, 429);
    
    // 2nd should be blocked
    const resBlocked = await request(app)
      .post('/api/projects/analyze')
      .send({});
      
    assert.strictEqual(resBlocked.status, 429);
    assert.strictEqual(resBlocked.body.success, false);
    assert.strictEqual(resBlocked.body.error.code, 'TOO_MANY_REQUESTS');
  });

  // Restore configs
  config.rateLimits.api.max = originalApiMax;
  config.rateLimits.ai.max = originalAiMax;
});
