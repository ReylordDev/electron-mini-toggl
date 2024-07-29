import { net, Notification, app, shell } from "electron";
import "dotenv/config";
import fs from "fs";
import path from "path";

let togglApiKey: string;
let defaultWorkspaceId: string; // default workspace id for the time entries
let workspaceUrl: string;
let headers: Record<string, string>;
const baseUrl = "https://api.track.toggl.com/api/v9";
let notif: Notification;

app.whenReady().then(() => {
  // Read environment variables (development)
  togglApiKey = process.env.TOGGL_API_KEY;
  defaultWorkspaceId = process.env.TOGGL_WORKSPACE_ID;
  if (!togglApiKey || !defaultWorkspaceId) {
    // environment variables not set, read from settings file (prod)
    console.log("Reading settings from file");
    const settingsPath = path.join(
      app.getPath("userData"),
      "toggl-settings.ini",
    );
    if (!fs.existsSync(settingsPath)) {
      // create settings file
      const settingsContent = `[Settings]\n;These variables need to be set. Restart the application afterwards (right-click).\n; example: TOGGL_API_KEY=1234567890abcdef1234567890abcdef\nTOGGL_API_KEY=\nTOGGL_WORKSPACE_ID=\n`;
      fs.writeFileSync(settingsPath, settingsContent, "utf-8");
    }

    // read settings file
    fs.readFile(settingsPath, "utf-8", (err, settingsString) => {
      if (err) {
        console.error(err);
        return;
      }
      settingsString.split("\n").forEach((line) => {
        // read key-value pairs from settings file
        const [key, value] = line.split("=");
        if (key === "TOGGL_API_KEY") {
          togglApiKey = value.trim();
        } else if (key === "TOGGL_WORKSPACE_ID") {
          defaultWorkspaceId = value.trim();
        }
      });

      // create a notification if settings are not set
      const messages = [];
      if (!togglApiKey) {
        messages.push("Toggl API Key not set");
      }
      if (!defaultWorkspaceId) {
        messages.push("Toggl Workspace ID not set");
      }
      if (messages.length > 0) {
        notif = new Notification({
          title: "Toggl settings not set, Click to open settings",
          body: messages.join("\n") + "\n" + settingsPath,
        });
        notif.show();
        shell.openPath(settingsPath);
      }

      // set headers and workspace url for the requests
      const encodedApiKey = Buffer.from(`${togglApiKey}:api_token`).toString(
        "base64",
      );
      workspaceUrl = `${baseUrl}/workspaces/${defaultWorkspaceId}`;
      headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedApiKey}`,
      };
    });
  } else {
    // environment variables are already set (development)
    // set headers and workspace url for the requests
    const encodedApiKey = Buffer.from(`${togglApiKey}:api_token`).toString(
      "base64",
    );
    workspaceUrl = `${baseUrl}/workspaces/${defaultWorkspaceId}`;
    headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedApiKey}`,
    };
  }
});

export interface TimeEntrySharedWith {
  accepted?: boolean;
  user_id?: number;
  user_name?: string;
}

export interface TimeEntry {
  /** When was last updated */
  at?: string;
  /** Whether the time entry is marked as billable */
  billable?: boolean;
  /** Related entities meta fields - if requested */
  client_name?: string;
  /** Time Entry description, null if not provided at creation/update */
  description?: string | null;
  /** Time entry duration. For running entries should be negative, preferable -1 */
  duration?: number;
  /** Used to create a TE with a duration but without a stop time, this field is deprecated for GET endpoints where the value will always be true. */
  duronly?: boolean;
  /** Time Entry ID */
  id?: number;
  /** Permission list */
  permissions?: string[];
  /** Project ID, legacy field */
  pid?: number;
  project_active?: boolean;
  project_billable?: boolean;
  project_color?: string;
  /** Project ID. Can be null if project was not provided or project was later deleted */
  project_id?: number | null;
  project_name?: string;
  /**
   * Custom Type, Added by me.
   */
  project?: Project;
  /** Indicates who the time entry has been shared with */
  shared_with?: TimeEntrySharedWith[];
  /** Start time in UTC */
  start?: string;
  /** Stop time in UTC, can be null if it's still running or created with "duration" and "duronly" fields */
  stop?: string;
  /** Tag IDs, null if tags were not provided or were later deleted */
  tag_ids?: number[];
  /** Tag names, null if tags were not provided or were later deleted */
  tags?: string[];
  /** Task ID. Can be null if task was not provided or project was later deleted */
  task_id?: number | null;
  task_name?: string;
  /** Task ID, legacy field */
  tid?: number;
  /** Time Entry creator ID, legacy field */
  uid?: number;
  user_avatar_url?: string;
  /** Time Entry creator ID */
  user_id?: number;
  user_name?: string;
  /** Workspace ID, legacy field */
  wid?: number;
  /** Workspace ID */
  workspace_id?: number;
}

export interface Project {
  /** Whether the project is active or archived */
  active?: boolean;
  /** Actual hours */
  actual_hours?: number | null;
  /** Actual seconds */
  actual_seconds?: number | null;
  /** Last updated date */
  at?: string;
  /** Whether estimates are based on task hours, premium feature */
  auto_estimates?: boolean | null;
  /** Whether the project is billable, premium feature */
  billable?: boolean | null;
  can_track_time?: boolean;
  /** Client ID legacy field */
  cid?: number;
  /** Client ID */
  client_id?: number | null;
  /** Color */
  color?: string;
  /** Creation date */
  created_at?: string;
  /** Currency, premium feature */
  currency?: string | null;
  /** Current project period, premium feature */
  // current_period?: ModelsRecurringPeriod;
  /** End date */
  end_date?: string;
  /** Estimated hours */
  estimated_hours?: number | null;
  /** Estimated seconds */
  estimated_seconds?: number | null;
  /** Fixed fee, premium feature */
  fixed_fee?: number;
  /** Project ID */
  id?: number;
  /** Integrations data */
  integration_provider?: string;
  /** Whether the project is private */
  is_private?: boolean;
  /** Shared Project */
  is_shared?: boolean;
  /** Name */
  name?: string;
  permissions?: string;
  /** Hourly rate */
  rate?: number;
  /** Last date for rate change */
  rate_last_updated?: string | null;
  /** Whether the project is recurring, premium feature */
  recurring?: boolean;
  /** Project recurring parameters, premium feature */
  // recurring_parameters?: ModelsRecurringProjectParameters[];
  shared_at?: string;
  shared_hash?: string;
  /** Start date */
  start_date?: string;
  /** Status of the project (upcoming, active, ended, archived, deleted) */
  status?: string;
  /** Whether the project is used as template, premium feature */
  template?: boolean | null;
  /** Template ID */
  template_id?: number | null;
  /** Workspace ID legacy field */
  wid?: number;
  /** Workspace ID */
  workspace_id?: number;
}

/**
 * Parses a string representation of a time entry into a TimeEntry object.
 * If the time entry is ongoing, the duration is calculated based on the start time and the current time.
 * @param data - The string representation of the time entry.
 * @returns The parsed TimeEntry object, or null if parsing fails.
 */
function parseTimeEntry(data: string): TimeEntry {
  try {
    const timeEntry: TimeEntry = JSON.parse(data);
    // For ongoing time entries, the duration is set to -1
    // Calculate the duration based on the start time and the current time
    if (timeEntry.duration < 0) {
      const currentTime = new Date().toISOString();
      const startTime = timeEntry.start;
      const duration = Math.floor(
        (new Date(currentTime).getTime() - new Date(startTime).getTime()) /
          1000,
      );
      timeEntry.duration = duration;
    }
    return timeEntry;
  } catch (error) {
    console.error(error);
    console.log(data);
    return null;
  }
}

/**
 * Parses the given data string and returns an array of projects.
 *
 * @param data - The data string to parse.
 * @returns An array of projects.
 */
function parseProjects(data: string): Project[] {
  let result;
  try {
    result = JSON.parse(data);
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Retrieves the current time entry from the Toggl API.
 * @returns A Promise that resolves to the current time entry (ModelsTimeEntry) or null if there is no current time entry.
 */
export function getCurrentTimeEntry(): Promise<TimeEntry | null> {
  return new Promise((resolve, reject) => {
    console.info("Fetching current time entry");
    console.info(`method: GET, url: ${baseUrl}/me/time_entries/current`);
    const request = net.request({
      method: "GET",
      url: `${baseUrl}/me/time_entries/current`,
      headers,
    });
    request.on("response", (response) => {
      console.info(`STATUS: ${response.statusCode}`);
      let data = "";
      response.on("data", (chunk) => {
        data += chunk.toString();
      });
      response.on("end", () => {
        if (data === "null") {
          resolve(null);
          return;
        }
        const timeEntry = parseTimeEntry(data);
        resolve(timeEntry);
      });
    });
    request.on("error", (error) => {
      reject(error);
    });
    request.end();
  });
}

/**
 * Fetches projects from the workspace.
 * @returns A promise that resolves to an array of projects.
 */
export function getProjects(): Promise<Project[]> {
  return new Promise((resolve, reject) => {
    console.log("Fetching projects");
    console.log(`method: GET, url: ${workspaceUrl}/projects`);
    const request = net.request({
      method: "GET",
      url: `${workspaceUrl}/projects`,
      headers,
    });
    request.on("response", (response) => {
      console.log(`STATUS: ${response.statusCode}`);
      let data = "";
      response.on("data", (chunk) => {
        data += chunk.toString();
      });
      response.on("end", () => {
        const projects = parseProjects(data);
        resolve(projects);
      });
    });
    request.on("error", (error) => {
      reject(error);
    });
    request.end();
  });
}

/**
 * Stops the current time entry.
 * If there is no current time entry, the function resolves immediately.
 * @returns A promise that resolves when the current time entry is stopped.
 */
export function stopCurrentTimeEntry(): Promise<void> {
  return new Promise((resolve, reject) => {
    getCurrentTimeEntry().then((timeEntry) => {
      console.log("Stopping current time entry");
      if (!timeEntry) {
        console.log("No current time entry to stop");
        resolve();
        return;
      }
      const url = `${workspaceUrl}/time_entries/${timeEntry.id}/stop`;
      console.log(`method: PUT, url: ${url}`);
      const request = net.request({
        method: "PATCH",
        url,
        headers,
      });
      request.on("response", (response) => {
        console.log(`STATUS: ${response.statusCode}`);
        resolve();
      });
      request.on("error", (error) => {
        reject(error);
      });
      request.end();
    });
  });
}

/**
 * Retrieves time entries between the specified start and end dates.
 *
 * @param startDate - The start date of the time entries.
 * @param endDate - The end date of the time entries.
 * @returns A promise that resolves to an array of time entries.
 */
export function getTimeEntries(
  startDate: Date,
  endDate: Date,
): Promise<TimeEntry[]> {
  return new Promise((resolve, reject) => {
    console.log("Fetching time entries");
    console.log(
      `From: ${startDate.toISOString()}, To: ${endDate.toISOString()}`,
    );
    const url = `${baseUrl}/me/time_entries?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;
    console.log(`method: GET, url: ${url}`);
    const request = net.request({
      method: "GET",
      url,
      headers,
    });
    request.on("response", (response) => {
      console.log(`STATUS: ${response.statusCode}`);
      let data = "";
      response.on("data", (chunk) => {
        data += chunk.toString();
      });
      response.on("end", () => {
        // TODO: Implement pagination
        // TODO: add better parsing
        try {
          const timeEntries: TimeEntry[] = JSON.parse(data);
          resolve(timeEntries);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    });
    request.on("error", (error) => {
      console.error(error);
      reject(error);
    });
    request.end();
  });
}

/**
 * Retrieves all time entries of the last 3 months, which is the maximum age allowed by Toggl.
 * @returns A Promise that resolves to an array of TimeEntry objects.
 */
export function getAllEntries(): Promise<TimeEntry[]> {
  // Why don't we just fetch all time entries in one go? - I don't know.
  // TODO: Explore fetching all time entries in one go.
  return new Promise((resolve, reject) => {
    console.log("Fetching all time entries");
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthsToFetch = 3;
    const startDate = new Date(
      currentYear,
      currentMonth - monthsToFetch + 1,
      1,
    );

    const promises = [];
    for (let i = 0; i < monthsToFetch; i++) {
      const start = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + i,
        1,
      );
      const end = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + i + 1,
        0,
      );
      promises.push(getTimeEntries(start, end));
    }

    Promise.all(promises)
      .then((results) => {
        const allTimeEntries = results.flat();
        resolve(allTimeEntries);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

/**
 * Starts a time entry with the given description and optional project ID.
 * @param description - The description of the time entry.
 * @param projectId - The ID of the project (optional, otherwise no project).
 * @returns A Promise that resolves when the time entry is started.
 */
export function startEntry(
  description: string,
  projectId?: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("Starting time entry");
    console.log(`description: ${description}, projectId: ${projectId}`);
    const url = `${workspaceUrl}/time_entries`;
    const initialBody = {
      description,
      created_with: "electron-mini-toggl",
      start: new Date().toISOString(),
      workspace_id: Number(defaultWorkspaceId),
      duration: -1,
      tags: ["mini-player"], // tag entries created by the mini player
    };
    let bodyObj;
    if (projectId) {
      bodyObj = { ...initialBody, project_id: projectId };
    } else {
      bodyObj = initialBody;
    }
    const body = JSON.stringify(bodyObj);
    console.log(`method: POST, url: ${url}`);
    const request = net.request({
      method: "POST",
      url,
      headers: headers,
    });
    request.on("response", (response) => {
      console.log(`STATUS: ${response.statusCode}`);
      // capture body of response
      // - can be called more than once for large result
      let responseData = "";
      response.on("data", (chunk) => {
        console.log(`BODY: ${chunk}`);
        responseData += chunk.toString();
      });

      // when response is complete, print body
      response.on("end", () => {
        console.log(`Response Body: ${responseData}`);
      });
      resolve();
    });
    request.on("error", (error) => {
      reject(error);
    });
    request.write(body);
    request.end();
  });
}
