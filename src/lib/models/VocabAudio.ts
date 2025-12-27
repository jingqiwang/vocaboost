import { db, type VocabAudioData } from '$lib/db';

export class VocabAudio implements VocabAudioData {
	key: string; // 主键：`${vocabulary}_${type}`
	blob: Blob; // 音频数据

	constructor(data: VocabAudioData) {
		this.key = data.key;
		this.blob = data.blob;
	}

	static async create(key: string, blob: Blob): Promise<VocabAudio> {
		const raw: VocabAudioData = {
			key: key,
			blob: blob
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
