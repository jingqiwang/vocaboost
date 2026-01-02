import { db, type VocabReviewLogData } from '$lib/db';
import type { Vocabulary } from './Vocabulary';

export class VocabReviewLog implements VocabReviewLogData {
	id?: number; // 自增主键
	word: string; // 冗余字段，方便快速查询统计而不必做 Join

	// 复习瞬间的快照
	reviewStatus: string;
	createdAt: Date; // 复习的具体时间

	// 算法轨迹 (用于分析间隔增长情况)
	oldInterval: number; // 复习前的间隔
	newInterval: number; // 复习后的间隔
	oldEaseFactor: number;
	newEaseFactor: number;
	oldNextReview: Date;
	newNextReview: Date;

	constructor(data: VocabReviewLogData) {
		this.id = data.id;
		this.word = data.word;
		this.reviewStatus = data.reviewStatus;
		this.createdAt = data.createdAt;
		this.oldInterval = data.oldInterval;
		this.newInterval = data.newInterval;
		this.oldEaseFactor = data.oldEaseFactor;
		this.newEaseFactor = data.newEaseFactor;
		this.oldNextReview = data.oldNextReview;
		this.newNextReview = data.newNextReview;
	}

	static async create(
		vocab: Vocabulary,
		reviewStatus: string,
		newInterval: number,
		newEaseFactor: number,
		newNextReview: Date
	): Promise<VocabReviewLog> {
		const now = new Date();

		const raw: VocabReviewLogData = {
			word: vocab.word,
			reviewStatus: reviewStatus,
			createdAt: now,
			oldInterval: vocab.interval,
			newInterval: newInterval,
			oldEaseFactor: vocab.easeFactor,
			newEaseFactor: newEaseFactor,
			oldNextReview: vocab.nextReview,
			newNextReview: newNextReview
		};

		// 插入 IndexedDB
		const id = await db.vocabReviewLogs.add(raw);
		raw.id = id as number;

		// 返回包装后的类实例
		return new VocabReviewLog(raw);
	}
}
