import { VocabAudio } from '$lib/models/VocabAudio';

export class AudioService {
	static async fetchAudio(word: string, accent: 'us' | 'uk' = 'uk'): Promise<Blob> {
		const audioUrl = `/api/audio?word=${encodeURIComponent(word)}&accent=${accent}`;
		const response = await fetch(audioUrl);
		if (!response.ok) throw new Error(`下载音频失败: ${response.statusText}`);
		return await response.blob();
	}

	static async fetchAndSaveAudio(word: string, accent: 'uk' | 'us' = 'uk'): Promise<void> {
		const audioKey = `${word}_${accent}`;
		// 已存在则不重复保存
		if (await VocabAudio.findByKey(audioKey)) return;
		const blob = await this.fetchAudio(word, accent);
		await VocabAudio.create(audioKey, blob);
	}

	static async play(blob: Blob): Promise<void> {
		return new Promise((resolve, reject) => {
			const localUrl = URL.createObjectURL(blob);
			const audio = new Audio(localUrl);

			audio.onended = () => {
				URL.revokeObjectURL(localUrl);
				resolve();
			};

			audio.onerror = () => {
				URL.revokeObjectURL(localUrl);
				reject(new Error('音频播放失败'));
			};

			audio.play().catch((err) => {
				URL.revokeObjectURL(localUrl);
				reject(err);
			});
		});
	}

	static async speakWord(word: string, accent: 'uk' | 'us' = 'uk'): Promise<void> {
		const audioKey = `${word}_${accent}`;
		let vocabAudio = await VocabAudio.findByKey(audioKey);
		if (!vocabAudio) {
			const blob = await this.fetchAudio(word, accent);
			vocabAudio = await VocabAudio.create(audioKey, blob);
		}
		await this.play(vocabAudio.blob);
	}
}
