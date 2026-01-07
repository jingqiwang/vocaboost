import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	return await resolve(event);
};

// 全局配置：允许最大 10MB 的请求体（用于音频数据同步）
export const config = {
	bodySizeLimit: 10 * 1024 * 1024 // 10MB in bytes
};
