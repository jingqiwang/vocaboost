import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface Settings {
	dailyReviewCount: number;
	reminderTime: string;
	autoCleanup: boolean;
}

const defaultSettings: Settings = {
	dailyReviewCount: 10,
	reminderTime: '09:00',
	autoCleanup: true
};

const createSettingsStore = () => {
	const { subscribe, set, update } = writable<Settings>(defaultSettings);

	if (browser) {
		const stored = localStorage.getItem('vocaboost_settings');
		if (stored) {
			try {
				set({ ...defaultSettings, ...JSON.parse(stored) });
			} catch (e) {
				console.error('Failed to parse settings', e);
			}
		}

		subscribe((value) => {
			localStorage.setItem('vocaboost_settings', JSON.stringify(value));
		});
	}

	return {
		subscribe,
		set,
		update,
		reset: () => set(defaultSettings)
	};
};

export const settings = createSettingsStore();
