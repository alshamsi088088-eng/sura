import { describe, expect, it } from 'vitest';
import { buildWeeklyProgressPayload, getCurrentWeekKey } from '../controllers/readingProgressController.js';

describe('reading progress helpers', () => {
  it('builds a weekly payload from completed items', () => {
    const payload = buildWeeklyProgressPayload([
      { contentType: 'article', progress: 100 },
      { contentType: 'article', progress: 80 },
      { contentType: 'novel', progress: 100 },
      { contentType: 'novel', progress: 100 },
    ]);

    expect(payload).toEqual({
      completed: 3,
      average: 95,
      articles: 1,
      chapters: 2,
    });
  });

  it('uses the current ISO week key', () => {
    const key = getCurrentWeekKey(new Date('2026-07-07T12:00:00.000Z'));
    expect(key).toBe('2026-W28');
  });
});
