import { app, BrowserWindow, ipcMain, Menu, MenuItem } from "electron";
import path from "node:path";
import "dotenv/config";
import squirrel from "electron-squirrel-startup";
import { fileURLToPath } from "node:url";

import {
  getCurrentTimeEntry,
  getProjects,
  stopCurrentTimeEntry,
  getAllEntries,
  getTimeEntries,
  startEntry,
  // eslint-disable-next-line import/no-unresolved
} from "../src/toggl.js";

let mainWindow: BrowserWindow;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrel) {
  app.quit();
}

// Magical Constants
const DROPDOWN_HEIGHT_PER_OPTION = 58; // px
const DROPDOWN_PADDING = 4; // px
const DROPDOWN_HEIGHT_LIMIT = 400; // px

function createWindow(
  source = "index",
  optionOverrides?: object,
  devTools = false,
) {
  const defaultOptions = {
    darkTheme: true,
    frame: false,
    x: 3050,
    y: 10,
    width: 400,
    height: 110,
    minHeight: 100,
    skipTaskbar: true,
    useContentSize: true,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: fileURLToPath(new URL("preload.mjs", import.meta.url)),
      spellcheck: false,
    },
  };
  const options = Object.assign(defaultOptions, optionOverrides);
  const window = new BrowserWindow(options);

  if (process.env.VITE_DEV_SERVER_URL) {
    // Vite Development
    window.loadURL(
      path.posix.join(process.env.VITE_DEV_SERVER_URL, `html/${source}.html`),
    );
  } else {
    // Production
    window.loadFile(
      fileURLToPath(new URL(`../dist/html/${source}.html`, import.meta.url)),
    );
  }

  if (devTools) {
    window.webContents.openDevTools();
  }
  return window;
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});

function moveDropdown(
  mainWindow: BrowserWindow,
  dropdownWindow: BrowserWindow,
) {
  // Always show dropdown below the main window
  const mainWindowBounds = mainWindow.getBounds();
  dropdownWindow.setBounds({
    x: mainWindowBounds.x,
    y: mainWindowBounds.y + mainWindowBounds.height,
    width: mainWindowBounds.width,
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  mainWindow = createWindow();
  const dropdownWindow = createWindow("dropdown", {
    show: false,
    fullscreenable: false,
    movable: false,
    minHeight: 0,
  });
  moveDropdown(mainWindow, dropdownWindow);

  mainWindow.on("move", () => {
    moveDropdown(mainWindow, dropdownWindow);
  });

  // Handle IPC events

  // Toggl API
  ipcMain.handle("toggl:getCurrentTimeEntry", async () =>
    getCurrentTimeEntry(),
  );
  ipcMain.handle("toggl:stopCurrentTimeEntry", async () =>
    stopCurrentTimeEntry(),
  );
  ipcMain.handle(
    "toggl:startEntry",
    async (event, description: string, projectId?: number) =>
      startEntry(description, projectId),
  );
  ipcMain.handle("toggl:getProjects", async () => getProjects());
  ipcMain.handle("toggl:getAllEntries", async () => getAllEntries());
  ipcMain.handle(
    "toggl:getTimeEntries",
    async (event, startDate: Date, endDate: Date) =>
      getTimeEntries(startDate, endDate),
  );

  // Dropdown window
  ipcMain.handle("dropdown:show", async () => {
    dropdownWindow.show();
    // return the focus to the main window to allow the user
    // to continue typing without interruption
    mainWindow.focus();
  });
  ipcMain.handle("dropdown:hide", async () => dropdownWindow.hide());
  ipcMain.handle("dropdown:visible", async () => dropdownWindow.isVisible());
  ipcMain.handle("dropdown:sendOptions", async (event, options) => {
    // Route time entry options to the dropdown window
    // Also adjust the height of the dropdown window based on the number of options
    let height =
      options.length * DROPDOWN_HEIGHT_PER_OPTION + 2 * DROPDOWN_PADDING;
    if (height > DROPDOWN_HEIGHT_LIMIT) height = DROPDOWN_HEIGHT_LIMIT;
    dropdownWindow.setBounds({
      height,
    });
    dropdownWindow.webContents.send("options", options);
  });
  ipcMain.on("dropdown:tabPress", () => {
    // Route tab press to the dropdown window, to allow the user to navigate the options
    dropdownWindow.webContents.send("tabPress");
    dropdownWindow.focus();
    dropdownWindow.setAlwaysOnTop(true, "pop-up-menu");
  });

  // Main window
  ipcMain.on("mainWindow:update", () => {
    mainWindow.webContents.send("update");
  });

  // Context menu
  ipcMain.on("contextWindow:show", () => {
    const menu = new Menu();
    menu.append(
      new MenuItem({
        label: "Always on Top",
        type: "checkbox",
        checked: mainWindow.isAlwaysOnTop(),
        click: () => mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop()),
      }),
    );
    menu.append(
      new MenuItem({
        label: "Resizable",
        type: "checkbox",
        checked: mainWindow.isResizable(),
        click: () => {
          // Not sure how this behaves. According to the docs, making a transparent window resizable may cause it to stop working on some platforms.
          mainWindow.setResizable(!mainWindow.isResizable());
        },
      }),
    );
    menu.append(
      new MenuItem({
        label: "Restart",
        click: () => {
          app.relaunch();
          app.quit();
        },
      }),
    );
    menu.append(
      new MenuItem({
        label: "Quit",
        click: () => app.quit(),
      }),
    );
    menu.popup();
  });
});
