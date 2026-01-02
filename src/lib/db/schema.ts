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
}

export interface VocabAudioData {
	key: string; // 主键：`${vocabulary}_${type}`
	blob: Blob; // 音频数据
}
