'use strict';

const { DatabaseSync } = require('node:sqlite');

const metrics = ['prefill', 'peak', 'decode'];
const fields = ['model', 'device', 'framework', 'scores'];
const counts = { storage: 5000, list: 100 };

class InvalidRanking extends Error {}

function requireFields(value, names) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== names.length || !names.every((name) => Object.hasOwn(value, name))) {
    throw new InvalidRanking('上榜数据只包含模型、设备、推理框架和三项成绩');
  }
}

function label(value, name) {
  if (typeof value !== 'string') throw new InvalidRanking(`请填写${name}`);
  const text = value.trim().normalize('NFC');
  if (!text || text.length > 120 || /[\p{Cc}\p{Cf}]/u.test(text)) {
    throw new InvalidRanking(`${name}须为 1–120 个可见字符`);
  }
  if (/(?:[a-z][a-z0-9+.-]*:\/\/|\b(?:sk-|AIza|gh[pousr]_)[a-z0-9_-]{16,}|\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b)/i.test(text)) {
    throw new InvalidRanking(`${name}请勿包含密钥或接口地址`);
  }
  return text;
}

function normalize(input) {
  requireFields(input, fields);
  requireFields(input.scores, metrics);
  const [prefill, peak, decode] = metrics.map((key) => {
    const value = input.scores[key];
    if (!Number.isFinite(value) || value < 0.1 || value > 1e7) {
      throw new InvalidRanking('三项成绩须为有效的正数');
    }
    return Math.round(value * 10) / 10;
  });
  const score = Math.round(1000 * Math.cbrt((prefill / 4000) * (peak / 200) * (decode / 800)));
  return {
    model: label(input.model, '模型'),
    device: label(input.device, '设备'),
    framework: label(input.framework, '推理框架'),
    prefill, peak, decode, score,
  };
}

function openRankings(filename) {
  const db = new DatabaseSync(filename);
  db.exec(`
    CREATE TABLE IF NOT EXISTS rankings (
      model TEXT NOT NULL,
      device TEXT NOT NULL,
      framework TEXT NOT NULL,
      prefill REAL NOT NULL,
      peak REAL NOT NULL,
      decode REAL NOT NULL,
      score INTEGER NOT NULL,
      PRIMARY KEY (model, device, framework)
    ) STRICT, WITHOUT ROWID;
    CREATE INDEX IF NOT EXISTS rankings_score ON rankings (score DESC, model, device, framework);
  `);
  const rankingOrder = 'score DESC, model, device, framework';
  const lists = new Map(['score', ...metrics].map((sort) => [
    sort,
    db.prepare(`SELECT model, device, framework, prefill, peak, decode, score FROM rankings
      ORDER BY ${sort === 'score' ? rankingOrder : sort + ' DESC, ' + rankingOrder} LIMIT ${counts.list}`),
  ]));
  const put = db.prepare(`
    INSERT INTO rankings (model, device, framework, prefill, peak, decode, score)
    VALUES ($model, $device, $framework, $prefill, $peak, $decode, $score)
    ON CONFLICT (model, device, framework) DO UPDATE SET prefill = excluded.prefill,
      peak = excluded.peak, decode = excluded.decode, score = excluded.score
    WHERE excluded.score > rankings.score
  `);
  const trim = db.prepare(`
    DELETE FROM rankings WHERE (model, device, framework) IN (
      SELECT model, device, framework FROM rankings ORDER BY ${rankingOrder}
      LIMIT -1 OFFSET ${counts.storage}
    )
  `);
  const find = db.prepare('SELECT score FROM rankings WHERE model = ? AND device = ? AND framework = ?');

  return {
    list(sort) {
      return (lists.get(sort) || lists.get('score')).all();
    },
    submit(input) {
      const row = normalize(input);
      db.exec('BEGIN IMMEDIATE');
      try {
        const { changes } = put.run(row);
        if (changes) trim.run();
        const stored = find.get(row.model, row.device, row.framework);
        db.exec('COMMIT');
        return stored
          ? { status: changes ? 'published' : 'kept', score: stored.score }
          : { status: 'below_limit' };
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    close() {
      db.close();
    },
  };
}

module.exports = { openRankings, InvalidRanking };
