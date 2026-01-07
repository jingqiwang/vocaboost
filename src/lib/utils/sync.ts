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

export function mergeLogs<T extends { createdAt?: Date | string, word?: string, id?: number }>(
    local: T[], 
    remote: T[], 
    uniqueKeyBuilder: (item: T) => string
): T[] {
    const map = new Map<string, T>();

    // 1. Process local items (Trusted IDs)
    for (const item of local) {
        const key = uniqueKeyBuilder(item);
        map.set(key, item);
    }

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

// For logs, unique key usually involves timestamp + word (if available)
export const studyLogKey = (item: StudyLogData) => `${getTs(item.createdAt)}`;
export const reviewLogKey = (item: VocabReviewLogData) => `${item.word}_${getTs(item.createdAt)}`;

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
