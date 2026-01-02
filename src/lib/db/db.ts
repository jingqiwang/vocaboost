import Dexie, { type EntityTable } from 'dexie';
import type { VocabularyData, VocabAudioData } from './schema';

const db = new Dexie('vocaboost') as Dexie & {
	vocabularies: EntityTable<VocabularyData, 'id'>;
	audios: EntityTable<VocabAudioData, 'key'>;
};

db.version(1).stores({
	vocabularies: '++id, status, word, createdAt, nextReview, reviewedAt',
	audios: 'key'
});

export type { VocabularyData, VocabAudioData };
export { db };
