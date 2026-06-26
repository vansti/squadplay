import { query } from '../../models/db.js';

export interface WordPair {
  id: string;
  wordA: string;
  wordB: string;
  category: string;
}

/**
 * Fetch a random word pair from the database
 */
export async function getRandomWordPair(): Promise<WordPair> {
  const result = await query(
    'SELECT id, word_a AS "wordA", word_b AS "wordB", category FROM word_pairs ORDER BY RANDOM() LIMIT 1',
  );

  if (result.rows.length === 0) {
    throw new Error('No word pairs found in database');
  }

  return result.rows[0] as WordPair;
}
