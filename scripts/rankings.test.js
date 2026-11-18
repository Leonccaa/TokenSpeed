'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const { openRankings, InvalidRanking } = require('../lib/rankings');

const result = (model = 'org/example-model', scores = {}) => ({
  model,
  device: '4× V100 32 GB',
  framework: 'Example Engine v0.1.2',
  scores: { prefill: 4000, peak: 200, decode: 800, ...scores },
});

test('keeps the best combined score per model, device and framework and supports alternate sorts', () => {
  const rankings = openRankings(':memory:');
  try {
    assert.deepEqual(rankings.list(), []);
    assert.deepEqual(rankings.submit(result()), { status: 'published', score: 1000 });
    assert.deepEqual(rankings.submit(result()), { status: 'kept', score: 1000 });
    assert.deepEqual(rankings.submit(result('org/example-model', { peak: 180 })), { status: 'kept', score: 1000 });
    const best = rankings.submit(result('org/example-model', { peak: 240 }));
    assert.equal(best.status, 'published');
    assert.ok(best.score > 1000);
    rankings.submit(result('fast-prefill', { prefill: 4800, peak: 80, decode: 200 }));
    assert.equal(rankings.list('score')[0].model, 'org/example-model');
    assert.equal(rankings.list('prefill')[0].model, 'fast-prefill');
    assert.equal(rankings.list('peak')[0].peak, 240);
    assert.deepEqual(rankings.list('invalid-sort'), rankings.list('score'));
  } finally {
    rankings.close();
  }
});

test('validates an exact payload and persists only labels and scores across reopen', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokenspeed-rankings-'));
  const file = path.join(dir, 'rankings.sqlite3');
  let rankings;
  let db;
  try {
    rankings = openRankings(file);
    for (const extra of ['apiKey', 'baseUrl', 'prompt', 'timestamp', 'ip']) {
      assert.throws(() => rankings.submit({ ...result(), [extra]: 'synthetic' }), InvalidRanking);
    }
    assert.throws(() => rankings.submit(result('fixture', { prompt: 'synthetic' })), InvalidRanking);
    assert.throws(() => rankings.submit(result('fixture', { decode: '800' })), InvalidRanking);
    assert.throws(() => rankings.submit(result('fixture', { decode: 0 })), InvalidRanking);
    assert.throws(() => rankings.submit(result('https://fixture.example/v1')), InvalidRanking);
    assert.throws(() => rankings.submit({ ...result(), device: 'sk-synthetic01234567890' }), InvalidRanking);
    assert.deepEqual(rankings.list(), []);
    rankings.submit(result());
    rankings.close();
    rankings = null;
    db = new DatabaseSync(file, { readOnly: true });
    assert.deepEqual(db.prepare('PRAGMA table_info(rankings)').all().map(({ name }) => name),
      ['model', 'device', 'framework', 'prefill', 'peak', 'decode', 'score']);
    db.close();
    db = null;
    rankings = openRankings(file);
    assert.equal(rankings.list().length, 1);
    assert.equal(rankings.list()[0].score, 1000);
  } finally {
    db?.close();
    rankings?.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
