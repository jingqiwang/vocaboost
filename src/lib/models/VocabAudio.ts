import { db, type VocabAudioData } from '$lib/db';

export class VocabAudio implements VocabAudioData {
	key: string; // 主键：`${vocabulary}_${type}`
	blob: Blob; // 音频数据
	isSynced?: boolean; // 同步状态

	constructor(data: VocabAudioData) {
		this.key = data.key;
		this.blob = data.blob;
		this.isSynced = data.isSynced;
	}

	static async create(key: string, blob: Blob): Promise<VocabAudio> {
		const raw: VocabAudioData = {
			key: key,
			blob: blob,
			isSynced: false // 新音频需要同步
		};

		await db.audios.put(raw);

		return new VocabAudio(raw);
	}

    static async findByKey(key: string): Promise<VocabAudio | null> {
        const audioData = await db.audios.get(key);
        if (!audioData) return null;
        return new VocabAudio(audioData);
    }
}
