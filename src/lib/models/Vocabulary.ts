import { db, type VocabularyData } from '$lib/db';

export class Vocabulary implements VocabularyData {
	id?: number;
	word: string;
	description: string;
	pronunciation?: string; // 发音(选填)

	// 记忆相关的逻辑
	reviewStatus: string; // 单词状态
	nextReview: Date; // 下次复习的时间戳 (重要：用于筛选今天要背的词)
	interval: number; // 复习间隔天数
	easeFactor: number; // 难度系数 (推荐默认 2.5)
	knowCount: number; // 记住次数
	vagueCount: number; // 模糊次数
	forgetCount: number; // 忘记次数

	createdAt: Date; // 创建时间
	updatedAt: Date; // 最后更新时间

	constructor(data: VocabularyData) {
		this.id = data.id;
		this.word = data.word;
		this.description = data.description;

		this.reviewStatus = data.reviewStatus;
		this.easeFactor = data.easeFactor;

		this.interval = data.interval;
		this.knowCount = data.knowCount;
		this.vagueCount = data.vagueCount;
		this.forgetCount = data.forgetCount;

		this.nextReview = data.nextReview;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	static async create(data: Partial<VocabularyData>): Promise<Vocabulary> {
		if (!data.word || !data.description) throw new Error('Word and description are required');

		const now = new Date();
		// 初始状态：新词通常明天才开始复习，或者立即复习
		// 这里设为当前时刻，确保它立即出现在“今日待学”中
		const initialNextReview = new Date();
		initialNextReview.setHours(0, 0, 0, 0);

		// 构造基础对象
		const raw: VocabularyData = {
			word: data.word,
			description: data.description,
			pronunciation: data.pronunciation ?? '',
			reviewStatus: data.reviewStatus ?? 'new',
			interval: data.interval ?? 0,
			easeFactor: data.easeFactor ?? 2.5,
			knowCount: data.knowCount ?? 0,
			vagueCount: data.vagueCount ?? 0,
			forgetCount: data.forgetCount ?? 0,

			nextReview: initialNextReview,

			createdAt: now,
			updatedAt: now
		};

		// 插入 IndexedDB
		const id = await db.vocabularies.add(raw);
		raw.id = id as number;

		// 返回包装后的类实例
		return new Vocabulary(raw);
	}

	/**
	 * 通过 word 找到对应的 vocabulary
	 * @param word 通过 word 找到对应的单词
	 * @returns
	 */
	static async findByWord(word: string): Promise<Vocabulary | null> {
		const data = await db.vocabularies.where({ word }).first();
		return data ? new Vocabulary(data) : null;
	}

	/**
	 * 获取今天需要复习的单词
	 */
	static async getTodayNewVocabularies(): Promise<Vocabulary[]> {
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
		const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

		const vocabularies = await db.vocabularies
			.where('createdAt')
			.between(startOfDay, endOfDay, true, true)
			.reverse()
			.toArray();

		return vocabularies.map((v) => new Vocabulary(v));
	}

	/**
	 * 重置复习进度（回到新词状态）
	 */
	async resetReview(newDescription?: string) {
		if (newDescription) this.description = newDescription;

		this.reviewStatus = 'new';
		this.interval = 0;
		this.easeFactor = 2.5;
		this.knowCount = 0;
		this.vagueCount = 0;
		this.forgetCount = 0;

		const now = new Date();
		now.setHours(0, 0, 0, 0);
		this.nextReview = now;

        await this.save();
	}

	async delete(): Promise<void> {
		if (!this.id) throw new Error('Cannot delete a vocabulary without an ID');
		await db.vocabularies.delete(this.id);
	}

	/**
	 * 将当前实例持久化到数据库
	 * 如果是新词则新增，如果是旧词则更新
	 */
	async save(): Promise<void> {
		this.updatedAt = new Date();
		const data = this.toData();

		if (this.id) {
			// 已有 ID，执行更新
			await db.vocabularies.put(data);
		} else {
			// 没有 ID，执行新增并回填生成的 ID
			const generatedId = await db.vocabularies.add(data);
			this.id = generatedId as number;
		}
	}

	/**
	 *
	 * @param result 更新单词的下次 review 时间，使用的是 SM2 记忆法
	 * @returns
	 */
	updateNextReview(result: string): Vocabulary {
		let { interval, easeFactor, knowCount, vagueCount, reviewStatus } = this;

		switch (result) {
			case 'know':
				knowCount++;
				easeFactor += 0.1;
				reviewStatus = interval >= 30 ? 'mastered' : 'learning';
				// 间隔计算逻辑：1 -> 6 -> interval * EF
				if (knowCount === 1) {
					interval = 1;
				} else if (knowCount === 2) {
					interval = 6;
				} else {
					interval = Math.round(interval * easeFactor);
				}
				break;
			case 'vague':
				// 模糊：不增加成功计数，间隔仅微增，降低 EF
				vagueCount++;
				// 模糊处理：间隔只增加 20%，不计入连续成功，EF 轻微惩罚
				interval = Math.max(1, Math.round(interval * 1.2));
				easeFactor = Math.max(1.3, easeFactor - 0.15);
				reviewStatus = 'learning';
				break;

			case 'forget':
				// 忘记：彻底重置
				knowCount = 0;
				interval = 1;
				easeFactor -= 0.2;
				reviewStatus = 'learning';
				break;
		}

		const nextDate = new Date();
		nextDate.setDate(nextDate.getDate() + interval);
		nextDate.setHours(0, 0, 0, 0); // 极其重要：方便查询今天到期的单词

		this.interval = interval;
		this.easeFactor = easeFactor;
		this.knowCount = knowCount;
		this.vagueCount = vagueCount;
		this.reviewStatus = reviewStatus;
		this.nextReview = nextDate;

		return this;
	}

	toData(): VocabularyData {
		return {
			id: this.id,
			word: this.word,
			description: this.description,
			pronunciation: this.pronunciation,

			reviewStatus: this.reviewStatus,
			nextReview: this.nextReview,
			interval: this.interval,
			easeFactor: this.easeFactor,
			knowCount: this.knowCount,
			vagueCount: this.vagueCount,
			forgetCount: this.forgetCount,

			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		};
	}
}
