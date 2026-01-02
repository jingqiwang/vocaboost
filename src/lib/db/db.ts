import Dexie, { type EntityTable } from 'dexie';
import type { VocabularyData, VocabAudioData, VocabReviewLogData, StudyLogData } from './schema';

const db = new Dexie('vocaboost') as Dexie & {
	vocabularies: EntityTable<VocabularyData, 'id'>;
	audios: EntityTable<VocabAudioData, 'key'>;
	vocabReviewLogs: EntityTable<VocabReviewLogData, 'id'>;
	studyLogs: EntityTable<StudyLogData, 'id'>;
};

db.version(1).stores({
	vocabularies: '++id, status, word, createdAt, nextReview, reviewedAt',
	audios: 'key',
	vocabReviewLogs: '++id, word, reviewStatus, createdAt',
	studyLogs: '++id, createdAt'
});

export type { VocabularyData, VocabAudioData, VocabReviewLogData, StudyLogData };
export { db };
