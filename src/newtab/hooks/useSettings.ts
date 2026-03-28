import { useState, useEffect, useCallback } from "react";
import type { Settings } from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/constants";

export const useSettings = () => {
	const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		chrome.storage.sync.get("settings").then((result) => {
			if (result.settings) {
				setSettingsState({ ...DEFAULT_SETTINGS, ...result.settings });
			}
			setLoaded(true);
		});

		const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
			if (changes.settings?.newValue) {
				setSettingsState({ ...DEFAULT_SETTINGS, ...changes.settings.newValue });
			}
		};
		chrome.storage.sync.onChanged.addListener(handler);
		return () => chrome.storage.sync.onChanged.removeListener(handler);
	}, []);

	const updateSettings = useCallback(
		(partial: Partial<Settings>) => {
			const updated = { ...settings, ...partial };
			setSettingsState(updated);
			chrome.storage.sync.set({ settings: updated });
		},
		[settings],
	);

	return { settings, updateSettings, loaded };
};
