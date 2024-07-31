// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { TimeEntry } from "../src/toggl";

// Expose protected methods that allow the renderer processes to use

/**
 * This file has not been split between the index and the dropdown windows
 * Because of problems with the vite configuration.
 */

contextBridge.exposeInMainWorld("togglApi", {
  getCurrentTimeEntry: () => ipcRenderer.invoke("toggl:getCurrentTimeEntry"),
  stopCurrentTimeEntry: () => ipcRenderer.invoke("toggl:stopCurrentTimeEntry"),
  getProjects: () => ipcRenderer.invoke("toggl:getProjects"),
  getTimeEntries: (startDate: Date, endDate: Date) =>
    ipcRenderer.invoke("toggl:getTimeEntries", startDate, endDate),
  getAllEntries: () => ipcRenderer.invoke("toggl:getAllEntries"),
  startEntry: (description: string, projectId: number | null) =>
    ipcRenderer.invoke("toggl:startEntry", description, projectId),
});

contextBridge.exposeInMainWorld("dropdown", {
  show: () => ipcRenderer.invoke("dropdown:show"),
  hide: () => ipcRenderer.invoke("dropdown:hide"),
  visible: () => ipcRenderer.invoke("dropdown:visible"),
  sendOptions: (options: TimeEntry[]) =>
    ipcRenderer.invoke("dropdown:sendOptions", options),
  onOptionsReceive: (callback: (options: TimeEntry[]) => void) => {
    ipcRenderer.on("options", (_, options) => callback(options));
  },
  sendTabPress: () => ipcRenderer.send("dropdown:tabPress"),
  onTabPressReceive: (callback: () => void) => {
    ipcRenderer.on("tabPress", callback);
  },
});

contextBridge.exposeInMainWorld("mainWindow", {
  sendUpdateRequest: () => ipcRenderer.send("mainWindow:update"),
  onUpdateRequestReceive: (callback: () => void) => {
    ipcRenderer.on("update", callback);
  },
});

contextBridge.exposeInMainWorld("contextWindow", {
  show: () => ipcRenderer.send("contextWindow:show"),
});
