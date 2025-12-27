import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const word = url.searchParams.get('word');
	const accent = url.searchParams.get('accent') || 'uk';

	if (!word) {
		throw error(400, 'Missing word parameter');
	}

	const formatType = accent === 'uk' ? '1' : '2';
	const audioUrl = `https://dict.youdao.com/dictvoice?type=${formatType}&audio=${encodeURIComponent(word)}`;

	try {
		const response = await fetch(audioUrl);

		if (!response.ok) {
			throw error(response.status, `Failed to fetch audio: ${response.statusText}`);
		}

		const blob = await response.blob();

		// 返回音频数据
		return new Response(blob, {
			headers: {
				'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
				'Cache-Control': 'public, max-age=31536000', // 缓存1年
			}
		});
	} catch (err) {
		console.error('Audio fetch error:', err);
		throw error(500, 'Failed to fetch audio from Youdao');
	}
};