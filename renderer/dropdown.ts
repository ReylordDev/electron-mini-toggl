// eslint-disable-next-line import/no-unresolved
import { TimeEntry } from "../src/toggl.js";

/**
 * This is the dropdown-window renderer file.
 */

let selectedElement: HTMLLIElement = undefined; // The currently selected element
const listElement = document.getElementById("time-entries-list");
const selectedBackgroundColor = "bg-cyan-800";

/**
 * Create a list item for the dropdown.
 * @param timeEntry The time entry which has the description and project information.
 * @returns The list item element.
 */
function createListItem(timeEntry: TimeEntry) {
  const li = document.createElement("li");
  li.classList.add(
    "flex",
    "items-center",
    "justify-center",
    "cursor-pointer",
    "w-full",
    "h-14",
    "rounded-xl",
    "gap-1",
    `hover:${selectedBackgroundColor}`,
  );

  const descriptionDisplay = document.createElement("span");
  descriptionDisplay.innerText = timeEntry.description;
  li.appendChild(descriptionDisplay);

  const projectDisplay = document.createElement("span");
  if (timeEntry.project) {
    projectDisplay.innerText = "🞄 " + timeEntry.project.name;
    projectDisplay.style.color = timeEntry.project.color;
  }
  li.appendChild(projectDisplay);

  li.addEventListener("click", () => {
    console.log("Option clicked", timeEntry);
    window.togglApi
      // Start the time entry and refresh the window
      .startEntry(timeEntry.description, timeEntry.project?.id)
      .then(() => {
        console.log("Entry started");
        window.dropdown.hide();
        window.mainWindow.sendUpdateRequest();
      })
      .catch((err) => {
        console.error(err);
      });
  });
  return li;
}

// When the options are received, create the list items and add them to the list.
window.dropdown.onOptionsReceive((options) => {
  listElement.innerHTML = "";
  console.log("Options received", options);
  options.forEach((option) => {
    const li = createListItem(option);
    listElement.appendChild(li);
  });
  window.dropdown.show();
});

/**
 * Update the selected element in the dropdown.
 * @param newElement The new selected element.
 */
function updateSelection(newElement: HTMLLIElement) {
  if (selectedElement) {
    selectedElement.classList.remove(selectedBackgroundColor);
  }
  selectedElement = newElement;
  selectedElement.classList.add(selectedBackgroundColor);
}

// When tab is first pressed, select the first option.
window.dropdown.onTabPressReceive(() => {
  const firstOption: HTMLLIElement = listElement.children[0] as HTMLLIElement;
  if (firstOption) {
    console.log("Tab pressed", firstOption);
    updateSelection(firstOption);
  }
});

window.addEventListener("keydown", (event) => {
  console.log("Key pressed", event.key);
  console.log(event.shiftKey);

  if (event.key === "Tab") {
    if (!selectedElement) {
      // The initial tab press is handled in the main window renderer.
      // maybe change
      return;
    }
    // Use Tab to cycle through the options
    let nextElement: HTMLLIElement;
    if (event.shiftKey) {
      // Shift + Tab
      // Select the previous option
      nextElement = selectedElement.previousElementSibling as HTMLLIElement;
      if (!nextElement) {
        nextElement = listElement.children[
          listElement.children.length - 1
        ] as HTMLLIElement;
      }
    } else {
      // Tab
      // Select the next option
      nextElement = selectedElement.nextElementSibling as HTMLLIElement;
      if (!nextElement) {
        nextElement = listElement.children[0] as HTMLLIElement;
      }
    }
    updateSelection(nextElement);
    return;
  }

  if (event.key === "Enter") {
    // Start the selected time entry
    if (selectedElement) {
      selectedElement.click();
    }
  }
});
