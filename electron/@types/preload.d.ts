import {
  getCurrentTimeEntry,
  stopCurrentTimeEntry,
  getProjects,
  getAllEntries,
  getTimeEntries,
  startEntry,
  // eslint-disable-next-line import/no-unresolved
} from "src/toggl";

declare global {
  interface Window {
    // For some reason typeof hides the possible null return type
    togglApi: {
      getCurrentTimeEntry: typeof getCurrentTimeEntry;
      stopCurrentTimeEntry: typeof stopCurrentTimeEntry;
      getProjects: typeof getProjects;
      getTimeEntries: typeof getTimeEntries;
      getAllEntries: typeof getAllEntries;
      startEntry: typeof startEntry;
    };
    dropdown: {
      toggle: () => void;
      show: () => void;
      hide: () => void;
      visible: () => Promise<boolean>;
      sendTabPress: () => void;
      onTabPressReceive: (callback: () => void) => void;
      sendOptions: (options: ModelsTimeEntry[]) => void;
      onOptionsReceive: (
        callback: (options: ModelsTimeEntry[]) => void,
      ) => void;
    };
    mainWindow: {
      sendUpdateRequest: () => void;
      onUpdateRequestReceive: (callback: () => void) => void;
    };
    contextWindow: {
      show: () => void;
    };
  }
}
