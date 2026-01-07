import Dexie, { type EntityTable } from 'dexie';
import type { VocabularyData, VocabAudioData, VocabReviewLogData, StudyLogData } from './schema';

const db = new Dexie('vocaboost') as Dexie & {
	vocabularies: EntityTable<VocabularyData, 'id'>;
	audios: EntityTable<VocabAudioData, 'key'>;
	vocabReviewLogs: EntityTable<VocabReviewLogData, 'id'>;
	studyLogs: EntityTable<StudyLogData, 'id'>;
};

// Version 2: Original schema
db.version(2).stores({
	vocabularies: '++id, status, word, createdAt, nextReview, reviewedAt, knowCount, forgetCount',
	audios: 'key',
	vocabReviewLogs: '++id, word, reviewStatus, createdAt',
	studyLogs: '++id, createdAt'
});

// Version 3: Add isSynced field for incremental sync
db.version(3).stores({
	vocabularies: '++id, status, word, createdAt, nextReview, reviewedAt, knowCount, forgetCount, isSynced',
	audios: 'key, isSynced',
	vocabReviewLogs: '++id, word, reviewStatus, createdAt',
	studyLogs: '++id, createdAt'
}).upgrade(async tx => {
	// 迁移：将现有数据标记为已同步
	await tx.table('vocabularies').toCollection().modify(item => {
		item.isSynced = true;
	});
	await tx.table('audios').toCollection().modify(item => {
		item.isSynced = true;
	});
});

export type { VocabularyData, VocabAudioData, VocabReviewLogData, StudyLogData };
export { db };

