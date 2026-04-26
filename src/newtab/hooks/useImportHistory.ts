import { useEffect, useState } from "react";
import { IMPORT_STATE_STORAGE_KEY } from "../../shared/constants";
import type { ImportProgressMessage } from "../../shared/types";

interface ImportState {
	importing: boolean;
	current: number;
	total: number;
	done: boolean;
	error?: string;
}

export const useImportHistory = () => {
	const [state, setState] = useState<ImportState>({
		importing: false,
		current: 0,
		total: 0,
		done: false,
	});

	useEffect(() => {
		chrome.storage.session.get(IMPORT_STATE_STORAGE_KEY).then((result) => {
			if (result[IMPORT_STATE_STORAGE_KEY]) {
				setState(result[IMPORT_STATE_STORAGE_KEY] as ImportProgressMessage);
			}
		});

		const handler = (message: ImportProgressMessage) => {
			if (message.type === "IMPORT_PROGRESS") {
				setState({
					importing: message.importing,
					current: message.current,
					total: message.total,
					done: message.done,
					error: message.error,
				});
			}
		};
		chrome.runtime.onMessage.addListener(handler);
		return () => chrome.runtime.onMessage.removeListener(handler);
	}, []);

	return state;
};
