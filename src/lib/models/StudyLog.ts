import { db, type StudyLogData } from '$lib/db';

export class StudyLog implements StudyLogData {
	id?: number; // 自增主键
	knowCount: number; // 正确次数
	vagueCount: number; // 模糊次数
	forgetCount: number; // 错误次数
	accuracyRate: number; // 正确率 (knowCount / totalCount)
	createdAt: Date; // 记录创建日期 (通常用于按天分组查询)

	constructor(data: StudyLogData) {
		this.id = data.id;
		this.knowCount = data.knowCount;
		this.vagueCount = data.vagueCount;
		this.forgetCount = data.forgetCount;
		this.accuracyRate = data.accuracyRate;
		this.createdAt = data.createdAt;
	}

	static async create(data: Partial<StudyLogData>): Promise<StudyLog> {
		const now = new Date();

		const raw: StudyLogData = {
			knowCount: data.knowCount ?? 0,
			vagueCount: data.vagueCount ?? 0,
			forgetCount: data.forgetCount ?? 0,
			accuracyRate: data.accuracyRate ?? 0,
			createdAt: now
		};

		// 插入 IndexedDB
		const id = await db.studyLogs.add(raw);
		raw.id = id as number;

		// 返回包装后的类实例
		return new StudyLog(raw);
	}

    /**
     * 获取学习总数
     */
	static async count(): Promise<number> {
		return db.studyLogs.count();
	}

	/**
	 * 获取最近一次复习时间
	 */
	static async getLastStudyLog(): Promise<StudyLog | null> {
		const data = await db.studyLogs.orderBy('createdAt').reverse().first();

		if (!data) return null;

		return new StudyLog(data);
	}

	/**
	 * 获取最近 N 天的学习记录
	 */
	static async getRecentLogs(days: number): Promise<StudyLog[]> {
		const now = new Date();
		const startDate = new Date(now);
		startDate.setDate(now.getDate() - days);
		startDate.setHours(0, 0, 0, 0);

		const logs = await db.studyLogs
			.where('createdAt')
			.aboveOrEqual(startDate)
			.toArray();

		return logs.map((log) => new StudyLog(log));
	}
}
