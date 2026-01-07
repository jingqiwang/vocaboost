export interface VocabularyData {
	// 单词基本信息
	id?: number;
	word: string;
	description: string;
	pronunciation?: string; // 发音(选填)

	// 记忆相关的逻辑
	status: string; // 单词状态
	nextReview: Date; // 下次复习的时间戳 (重要：用于筛选今天要背的词)
	reviewedAt?: Date | null; // 记录最近一次复习的时间
	interval: number; // 复习间隔天数
	easeFactor: number; // 难度系数 (推荐默认 2.5)
	knowCount: number; // 记住次数
	vagueCount: number; // 模糊次数
	forgetCount: number; // 忘记次数

	createdAt: Date; // 创建时间
	updatedAt: Date; // 最后更新时间

	// 同步状态
	isSynced?: boolean; // 是否已同步，默认 false
}

export interface VocabAudioData {
	key: string; // 主键：`${vocabulary}_${type}`
	blob: Blob; // 音频数据
	isSynced?: boolean; // 是否已同步，默认 false
}

export interface VocabReviewLogData {
	id?: number; // 自增主键
	word: string; // 冗余字段，方便快速查询统计而不必做 Join

	// 复习瞬间的快照
	reviewStatus: string; // 当时的选择
	createdAt: Date; // 复习的具体时间

	// 算法轨迹 (用于分析间隔增长情况)
	oldInterval: number; // 复习前的间隔
	newInterval: number; // 复习后的间隔
	oldEaseFactor: number;
	newEaseFactor: number;
	oldNextReview: Date;
	newNextReview: Date;
}

export interface StudyLogData {
	id?: number; // 自增主键
	// 统计核心数据
	knowCount: number; // 正确次数
	vagueCount: number; // 模糊次数
	forgetCount: number; // 错误次数
	accuracyRate: number; // 正确率 (knowCount / totalCount)
	createdAt: Date; // 记录创建日期 (通常用于按天分组查询)
}
