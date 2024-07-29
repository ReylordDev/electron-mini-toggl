import { TimeEntry, Project } from "../src/toggl";

/**
 * This is the main-window renderer file.
 */

const timeEntryUpdateInterval = 5000; // Update the current time entry every 5 seconds
let seconds = 0;
let currentEntry: TimeEntry = null;
let currentProject: Project = null;
let allProjects: Project[] = []; // List used for getting the project names by id
const previousEntries: TimeEntry[] = []; // List used for the dropdown

const currentDisplayElement = document.getElementById("current-entry-display");
const currentDescriptionElement = document.getElementById(
  "current-entry-description",
);
const currentProjectElement = document.getElementById("current-entry-project");
const inputElement: HTMLInputElement = document.getElementById(
  "new-entry-input",
) as HTMLInputElement;
const timerElement = document.getElementById("current-timer");
const stopButton = document.getElementById("stop-button");
const startButton = document.getElementById("start-button");

window.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    // Activate the dropdown if it's not visible
    window.dropdown.visible().then((visible) => {
      if (!visible) {
        return;
      }
      console.log("You pressed Tab");
      window.dropdown.sendTabPress();
    });
  }
});

window.addEventListener("auxclick", (event) => {
  if (event.button === 2) {
    // Open the context window
    console.log("You pressed right click");
    event.preventDefault();
    window.contextWindow.show();
  }
});

window.mainWindow.onUpdateRequestReceive(() => {
  console.log("Update request received");
  update();
});

startButton.addEventListener("click", () => {
  console.log("Starting time entry");
  const input = inputElement.value;
  console.log(input);
  if (!input) {
    return;
  }
  if (input.includes("@")) {
    // The input contains a description and a project
    const [description, project] = input.split("@");
    const projectMatch = allProjects.find(
      (proj) => proj.name.toLowerCase() === project.toLowerCase(),
    );
    if (projectMatch) {
      // Start the time entry with the project and refresh the window
      window.togglApi
        .startEntry(description, projectMatch.id)
        .then(() => {
          inputElement.value = "";
          window.dropdown.hide();
          update();
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      // There was a project in the input but it wasn't found
      console.error("Project not found");
    }
  } else {
    // The input only contains a description
    window.togglApi
      // Start the time entry and refresh the window
      .startEntry(input)
      .then(() => {
        inputElement.value = "";
        window.dropdown.hide();
        update();
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

stopButton.addEventListener("click", () => {
  if (!currentEntry) {
    return;
  } else {
    window.togglApi
      // Stop the current time entry and refresh the window
      .stopCurrentTimeEntry()
      .then(() => {
        currentEntry = null;
        currentProject = null;
        console.log("Time entry stopped");
        update();
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

// Update the dropdown selection based on the current text input
inputElement.addEventListener("input", () => {
  const input = inputElement.value;
  if (!input || input.length < 2) {
    // Hide the dropdown if the input is empty or too short
    window.dropdown.hide();
    return;
  }
  console.debug(`Input: ${input}`);
  const options = previousEntries.filter(
    (entry) =>
      entry.description &&
      entry.description.toLowerCase().includes(input.toLowerCase()),
  );
  console.debug(options);
  if (options.length === 0) {
    // Hide the dropdown if there are no options
    window.dropdown.hide();
    return;
  }
  // Find the project name for each option
  options.forEach((option) => {
    option.project = allProjects.find(
      (project) => project.id === option.project_id,
    );
  });

  // Send the options to the dropdown
  window.dropdown.sendOptions(options);
  window.dropdown.show();
});

/**
 * Fetch the current time entry and update the window based on it.
 * If there is no time entry running, show the input field.
 * If there is a time entry running, show the current time entry + project and timer.
 */
function update() {
  window.togglApi.getCurrentTimeEntry().then((timeEntry) => {
    if (!timeEntry) {
      console.log("No time entry running");
      currentEntry = null;
      currentProject = null;
      currentDescriptionElement.innerText = "";
      currentDisplayElement.style.display = "none";
      inputElement.style.display = "flex";
      timerElement.style.display = "none";
      startButton.style.display = "flex";
      stopButton.style.display = "none";
    } else {
      console.log(
        "Time entry running",
        timeEntry.description,
        timeEntry.project_id,
      );
      if (timeEntry.description !== currentDescriptionElement.innerText) {
        // The time entry has changed
        console.log("Updating time entry");
        currentProject = allProjects.find(
          (project) => project.id === timeEntry.project_id,
        );
        currentDescriptionElement.innerText = timeEntry.description;
        currentProjectElement.innerText = currentProject
          ? "🞄 " + currentProject.name
          : "";
        currentProjectElement.style.color = currentProject?.color || "white";
        currentDisplayElement.style.display = "flex";
        inputElement.style.display = "none";
        inputElement.value = "";
        timerElement.style.display = "flex";
        timerElement.innerText = formatTime(timeEntry.duration);
        stopButton.style.display = "flex";
        startButton.style.display = "none";
        seconds = timeEntry.duration;
      }
      currentEntry = timeEntry;
    }
  });
}

/** Calculate the hours, minutes, and seconds from the total number of seconds */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
  } else {
    return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
  }
}

/** Convert the number to a string and pad it with a zero if it's only one digit */
function padZero(value: number): string {
  return value.toString().padStart(2, "0");
}

// Get all previous time entries (last 3 months) once on startup to populate the dropdown
window.togglApi.getAllEntries().then((entries) => {
  entries.forEach((entry) => {
    // Only add the entry if it's not already in the list
    if (
      !previousEntries.find(
        (prev) =>
          prev.description === entry.description &&
          prev.project_id === entry.project_id,
      )
    ) {
      previousEntries.push(entry);
    }
  });
});

// Initial update once the projects are fetched
window.togglApi.getProjects().then((projects) => {
  console.log("Initial update");
  console.log("Length of projects", projects.length);
  allProjects = projects;
  update();
});

setInterval(update, timeEntryUpdateInterval);
setInterval(() => {
  seconds++;
  timerElement.innerText = formatTime(seconds);
}, 1000);
