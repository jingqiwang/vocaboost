import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// 正确的配置导出方式
export const config = {
    bodySizeLimit: 10 * 1024 * 1024 // 10MB in bytes
};

const SYNC_DIR = path.join(os.homedir(), 'vocaboost_sync');
const SYNC_FILE = path.join(SYNC_DIR, 'data.json');

async function ensureDir() {
    try {
        await fs.access(SYNC_DIR);
    } catch {
        await fs.mkdir(SYNC_DIR, { recursive: true });
    }
}

export const GET: RequestHandler = async () => {
    try {
        await ensureDir();
        const data = await fs.readFile(SYNC_FILE, 'utf-8');
        return json(JSON.parse(data));
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return json(null);
        }
        throw error(500, `Failed to read sync file: ${err.message}`);
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();
        await ensureDir();
        await fs.writeFile(SYNC_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return json({ success: true, path: SYNC_FILE });
    } catch (err: any) {
        throw error(500, `Failed to write sync file: ${err.message}`);
    }
};