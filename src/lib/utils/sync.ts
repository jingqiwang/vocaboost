import type { VocabularyData, StudyLogData, VocabReviewLogData, VocabAudioData } from '$lib/db/schema';

// Helper to get timestamp safely
const getTs = (date: Date | string | undefined | null) => {
    if (!date) return 0;
    return new Date(date).getTime();
};

export function mergeVocabularies(local: VocabularyData[], remote: VocabularyData[]): VocabularyData[] {
    const map = new Map<string, VocabularyData>();

    // Add all local items first
    for (const item of local) {
        map.set(item.word, item);
    }

    // Merge with remote
    for (const remoteItem of remote) {
        const localItem = map.get(remoteItem.word);

        if (!localItem) {
            // New word from remote
            // IMPORTANT: We MUST remove the ID from the remote item because 
            // the ID is an auto-increment integer that likely conflicts with 
            // a different word in the local DB (especially after a reset).
            // IndexedDB will generate a new valid ID.
            const { id, ...newItem } = remoteItem;
            map.set(remoteItem.word, newItem as VocabularyData);
        } else {
            // Conflict: Compare timestamps to determine the latest state
            const localTs = getTs(localItem.reviewedAt);
            const remoteTs = getTs(remoteItem.reviewedAt);

            if (remoteTs > localTs) {
                // Remote is newer learning progress
                // Keep local ID to avoid DB issues, but update fields
                map.set(remoteItem.word, { ...remoteItem, id: localItem.id });
            } else if (remoteTs === localTs) {
                // Same date, verify creation
                 const localCreate = getTs(localItem.createdAt);
                 const remoteCreate = getTs(remoteItem.createdAt);
                 if (remoteCreate > localCreate) {
                     map.set(remoteItem.word, { ...remoteItem, id: localItem.id });
                 }
            }
            // else: Local is newer or equal, keep local
        }
    }

    return Array.from(map.values());
}

export function mergeLogs<T extends { createdAt?: Date | string, word?: string, id?: number, knowCount?: number, vagueCount?: number, forgetCount?: number, accuracyRate?: number }>(
    local: T[], 
    remote: T[], 
    uniqueKeyBuilder: (item: T) => string
): T[] {
    const map = new Map<string, T>();

    // 1. Process local items (Trusted IDs)
    let localOverwrites = 0;
    for (const item of local) {
        const key = uniqueKeyBuilder(item);
        if (map.has(key)) localOverwrites++;
        map.set(key, item);
    }

    // #region agent log
    if (typeof fetch !== 'undefined') {
        const keys = local.map(uniqueKeyBuilder);
        const uniqueKeys = new Set(keys).size;
        fetch('http://127.0.0.1:7242/ingest/1475ee5d-0a75-4646-bac4-955ddd8ff015', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'sync.ts:mergeLogs', message: 'local key collision', data: { localLength: local.length, uniqueKeysAfterLocal: uniqueKeys, localOverwrites }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1' }) }).catch(() => {});
    }
    // #endregion

    // 2. Process remote items
    for (const item of remote) {
        const key = uniqueKeyBuilder(item);
        if (!map.has(key)) {
             // New log from remote
             // Strip ID to prevent conflict with local auto-increment
             const { id, ...newItem } = item;
             map.set(key, newItem as T);
        } else {
            // Already exists locally, ignore remote (Local ID is authoritative)
        }
    }

    // Sort by createdAt descending
    return Array.from(map.values()).sort((a, b) => {
        return getTs(b.createdAt) - getTs(a.createdAt);
    });
}

// StudyLog: prefer id when present (local records) so we never collapse; otherwise timestamp + stats
export const studyLogKey = (item: StudyLogData) =>
	item.id != null ? `id_${item.id}` : `${getTs(item.createdAt)}_${item.knowCount}_${item.vagueCount}_${item.forgetCount}_${item.accuracyRate}`;
// VocabReviewLog: prefer id when present; otherwise word + timestamp
export const reviewLogKey = (item: VocabReviewLogData) =>
	item.id != null ? `id_${item.id}` : `${item.word}_${getTs(item.createdAt)}`;

export function mergeAudios(local: any[], remote: any[]): any[] {
    const map = new Map<string, any>();
    
    // Key is 'key' (word)
    local.forEach(i => map.set(i.key, i));
    
    // If remote has new audio, add it. If conflict, assume same or keep local.
    remote.forEach(i => {
        if (!map.has(i.key)) {
            map.set(i.key, i);
        }
    });

    return Array.from(map.values());
}

export function mergeSettings(local: any, remote: any) {
    // Determine which settings are newer? 
    // Settings store doesn't typically have 'updatedAt'. 
    // We will just merge objects, preferring Remote if we considered "Sync" usually implies pulling config?
    // Or actually, simple shallow merge.
    // Given the user story "computer opens webpage", likely they might want settings from phone.
    // For now, let's prefer the one that initiated the merges? 
    // "Push" -> Local overrides Remote (usually).
    // "Pull" -> Remote overrides Local.
    // For specific requirement "merge logic", we'll implement a strategy param?
    // Let's stick to: "Last Write Wins" impossible without timestamp. 
    // Strategy: Return both or let caller decide. 
    // For this utility, we'll implement 'preferRemote' flag?
    // Actually, simply:
    return { ...local, ...remote }; // Remote overrides local keys
}
