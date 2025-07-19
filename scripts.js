document.addEventListener("DOMContentLoaded", () => {
  const state = {
    settings: {
      name: "",
      timeFormat: "24hr",
      useDeviceTheme: false,
      shortcuts: [
        { name: "ChatGPT", url: "https://chatgpt.com" },
        { name: "Netflix", url: "https://netflix.com" },
        { name: "YouTube", url: "https://www.youtube.com" },
        { name: "Instagram", url: "https://www.instagram.com" },
      ],
    },
  };
  const quickLinksContainer = document.getElementById("quick-links-container");
  const settingsModal = document.getElementById("settings-modal");
  const addShortcutForm = document.getElementById("add-shortcut-form");
  const shortcutsListContainer = document.getElementById("shortcuts-list");
  const nameInput = document.getElementById("name-input");
  const deviceThemeSyncToggle = document.getElementById(
    "device-theme-sync-toggle"
  );
  const themeToggleButton = document.getElementById("theme-toggle");

  const saveSettings = () => {
    chrome.storage.local.set({ startupPageSettings: state.settings });
  };

  const applyTheme = (theme) =>
    document.documentElement.classList.toggle("dark-theme", theme === "dark");

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = (e) => {
    if (state.settings.useDeviceTheme) {
      const newTheme = e.matches ? "dark" : "light";
      applyTheme(newTheme);
    }
  };

  const syncThemeUI = () => {
    themeToggleButton.style.display = state.settings.useDeviceTheme
      ? "none"
      : "flex";
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
    if (state.settings.useDeviceTheme) {
      applyTheme(mediaQuery.matches ? "dark" : "light");
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    }
  };

  const loadSettings = () => {
    chrome.storage.local.get(["startupPageSettings"], (result) => {
      if (result.startupPageSettings) {
        state.settings = { ...state.settings, ...result.startupPageSettings };
      }
      if (!Array.isArray(state.settings.shortcuts)) {
        state.settings.shortcuts = [];
      }
      renderAll();
      syncThemeUI();
      // Apply theme on load AFTER settings are loaded
      if (!state.settings.useDeviceTheme) {
        chrome.storage.local.get(["theme"], (result) => {
          applyTheme(result.theme || "light");
        });
      }
    });
  };

  const renderAll = () => {
    renderShortcuts();
    updateTimeAndGreeting();
    document
      .querySelectorAll('input[name="timeFormat"]')
      .forEach(
        (radio) => (radio.checked = radio.value === state.settings.timeFormat)
      );
    nameInput.value = state.settings.name || "";
    deviceThemeSyncToggle.checked = state.settings.useDeviceTheme;
  };

  themeToggleButton.addEventListener("click", () => {
    const isDark = !document.documentElement.classList.contains("dark-theme");
    applyTheme(isDark ? "dark" : "light");
    chrome.storage.local.set({ theme: isDark ? "dark" : "light" });
  });

  deviceThemeSyncToggle.addEventListener("change", (e) => {
    state.settings.useDeviceTheme = e.target.checked;
    saveSettings();
    syncThemeUI(); // This handles applying the correct theme
    if (!e.target.checked) {
      chrome.storage.local.get(["theme"], (result) => {
        applyTheme(result.theme || "light");
      });
    }
  });

  function updateTimeAndGreeting() {
    const clockElement = document.getElementById("clock");
    const greetingElement = document.getElementById("greeting");
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    let ampm = "";
    if (state.settings.timeFormat === "12hr") {
      ampm = hours >= 12 ? " PM" : " AM";
      hours = hours % 12 || 12;
    }
    clockElement.textContent = `${hours}:${minutes
      .toString()
      .padStart(2, "0")}${ampm}`;
    const currentHour = now.getHours();
    let greetingText;
    if (currentHour < 5) greetingText = "Good evening";
    else if (currentHour < 12) greetingText = "Good morning";
    else if (currentHour < 18) greetingText = "Good afternoon";
    else greetingText = "Good evening";
    const userName = state.settings.name || "";
    greetingElement.textContent = userName.trim()
      ? `${greetingText}, ${userName.trim()}`
      : `${greetingText}.`;
  }

  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const query = document.getElementById("search-input").value.trim();
    if (!query) return;
    try {
      // Check if it's a valid URL structure, but not necessarily a full one
      const url = new URL(query.includes("://") ? query : `https://${query}`);
      // Check for a plausible domain
      if (url.hostname.includes(".")) {
        window.location.href = url.href;
      } else {
        throw new Error("Not a valid URL for direct navigation");
      }
    } catch (_) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}`;
    }
  });

  async function fetchWeather() {
    const weatherElement = document.getElementById("weather");
    try {
      const response = await fetch("https://wttr.in/?format=j1");
      if (!response.ok) throw new Error("Weather API response not OK");
      const data = await response.json();
      const condition = data.current_condition[0];
      const temp = condition.temp_C;
      const location = data.nearest_area[0].areaName[0].value;
      const weatherCode = condition.weatherCode;
      weatherElement.innerHTML = `<span class="material-symbols-outlined">${getWeatherIcon(
        weatherCode
      )}</span><span>${temp}°C in</span><span class="location">${location}</span>`;
    } catch (error) {
      console.error("Weather fetch error:", error);
      weatherElement.innerHTML = `<span class="material-symbols-outlined">cloud_off</span><span>Weather unavailable</span>`;
    }
  }

  function getWeatherIcon(code) {
    const codes = {
      113: "sunny",
      116: "partly_cloudy_day",
      119: "cloud",
      122: "cloudy",
      143: "foggy",
      176: "rainy_light",
      179: "weather_snowy",
      182: "weather_mix",
      185: "weather_mix",
      200: "thunderstorm",
      227: "weather_snowy",
      230: "blizzard",
      248: "foggy",
      260: "foggy",
      263: "rainy_light",
      266: "rainy_light",
      281: "rainy_light",
      284: "rainy",
      293: "rainy",
      296: "rainy",
      299: "rainy_heavy",
      302: "rainy_heavy",
      305: "rainy_heavy",
      308: "rainy_heavy",
      311: "rainy_light",
      314: "rainy",
      317: "weather_mix",
      320: "weather_snowy",
      323: "weather_snowy",
      326: "weather_snowy",
      329: "weather_snowy",
      332: "snowing_heavy",
      335: "snowing_heavy",
      338: "snowing_heavy",
      350: "weather_mix",
      353: "rainy_light",
      356: "rainy_heavy",
      359: "rainy_heavy",
      362: "weather_mix",
      365: "weather_mix",
      368: "weather_snowy",
      371: "snowing_heavy",
      374: "weather_mix",
      377: "weather_mix",
      386: "thunderstorm",
      389: "thunderstorm",
      392: "thunderstorm",
      395: "snowing_heavy",
    };
    return codes[code] || "thermostat";
  }

  function setupSessionRestore() {
    const PROMPT_SHOWN_KEY = "restorePromptShownThisSession";
    const promptElement = document.getElementById("restore-session-prompt");
    const yesBtn = document.getElementById("restore-yes-btn");
    const noBtn = document.getElementById("restore-no-btn");
    let dismissTimeout;
    const hidePrompt = () => {
      if (promptElement) promptElement.classList.remove("visible");
      clearTimeout(dismissTimeout);
    };

    chrome.storage.session.get([PROMPT_SHOWN_KEY], (sessionResult) => {
      if (sessionResult[PROMPT_SHOWN_KEY]) {
        return;
      }
      // Get the last closed session
      chrome.sessions.getRecentlyClosed({ maxResults: 1 }, (sessions) => {
        // Ensure the session exists and it was a window with multiple tabs
        const lastSession = sessions.find(
          (s) => s.window && s.window.tabs.length > 1
        );
        if (lastSession) {
          chrome.storage.session.set({ [PROMPT_SHOWN_KEY]: true });
          promptElement.classList.add("visible");
          dismissTimeout = setTimeout(hidePrompt, 8000); // Increased timeout

          // **THIS IS THE CORRECTED LOGIC**
          yesBtn.addEventListener(
            "click",
            () => {
              const tabsToRestore = lastSession.window.tabs;
              if (tabsToRestore && tabsToRestore.length > 0) {
                // Take the first tab to update the current page
                const firstTab = tabsToRestore.shift();

                chrome.tabs.getCurrent((currentTab) => {
                  // Update the current "New Tab" page to the first restored tab's URL
                  if (currentTab) {
                    chrome.tabs.update(currentTab.id, { url: firstTab.url });
                  } else {
                    // Fallback if we can't get the current tab
                    chrome.tabs.create({ url: firstTab.url, active: true });
                  }
                });

                // Open the rest of the tabs in the background of the current window
                tabsToRestore.forEach((tab) => {
                  if (tab.url) {
                    // Ensure the tab has a URL
                    chrome.tabs.create({
                      url: tab.url,
                      active: false,
                    });
                  }
                });
              }
              hidePrompt();
            },
            { once: true }
          );

          noBtn.addEventListener("click", hidePrompt, { once: true });
        }
      });
    });
  }

  function renderShortcuts() {
    quickLinksContainer.innerHTML = "";
    shortcutsListContainer.innerHTML = "";
    state.settings.shortcuts.forEach((shortcut, index) => {
      // Main page quick links
      const shortcutLink = document.createElement("a");
      shortcutLink.href = shortcut.url;
      shortcutLink.draggable = true;
      shortcutLink.innerHTML = `<img src="https://www.google.com/s2/favicons?sz=32&domain_url=${
        new URL(shortcut.url).hostname
      }" class="favicon" alt=""><span>${shortcut.name}</span>`;
      quickLinksContainer.appendChild(shortcutLink);

      // Settings modal list items
      const listItem = document.createElement("li");
      listItem.className = "shortcut-list-item";
      listItem.dataset.id = index;
      listItem.innerHTML = `
        <span class="drag-handle material-symbols-outlined">drag_indicator</span>
        <img src="https://www.google.com/s2/favicons?sz=32&domain_url=${
          new URL(shortcut.url).hostname
        }" class="favicon" alt="">
        <div class="shortcut-info">
            <div class="shortcut-name">${shortcut.name}</div>
            <div class="shortcut-url">${shortcut.url}</div>
        </div>
        <button class="delete-shortcut-btn" data-index="${index}" aria-label="Delete shortcut">
            <span class="material-symbols-outlined">delete</span>
        </button>`;
      shortcutsListContainer.appendChild(listItem);
    });
  }

  document
    .getElementById("settings-btn")
    .addEventListener("click", () => (settingsModal.style.display = "flex"));
  settingsModal
    .querySelector(".close-modal-btn")
    .addEventListener("click", () => (settingsModal.style.display = "none"));

  addShortcutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("shortcut-name-input").value.trim();
    let url = document.getElementById("shortcut-url-input").value.trim();
    if (name && url) {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }
      state.settings.shortcuts.push({ name, url });
      saveSettings();
      renderShortcuts();
      addShortcutForm.reset();
    }
  });

  shortcutsListContainer.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-shortcut-btn");
    if (deleteBtn) {
      state.settings.shortcuts.splice(parseInt(deleteBtn.dataset.index, 10), 1);
      saveSettings();
      renderShortcuts();
    }
  });

  document.querySelectorAll('input[name="timeFormat"]').forEach((radio) =>
    radio.addEventListener("change", (e) => {
      state.settings.timeFormat = e.target.value;
      saveSettings();
      updateTimeAndGreeting();
    })
  );

  nameInput.addEventListener("input", (e) => {
    state.settings.name = e.target.value;
    saveSettings();
    updateTimeAndGreeting();
  });

  const sharedSortableOptions = {
    animation: 150,
    ghostClass: "sortable-ghost",
    dragClass: "sortable-drag",
    onEnd: function (evt) {
      const [movedItem] = state.settings.shortcuts.splice(evt.oldIndex, 1);
      state.settings.shortcuts.splice(evt.newIndex, 0, movedItem);
      saveSettings();
      renderShortcuts();
    },
  };
  new Sortable(shortcutsListContainer, {
    ...sharedSortableOptions,
    handle: ".drag-handle",
  });
  new Sortable(quickLinksContainer, sharedSortableOptions);

  let currentUsageFilterCount = 7;
  function formatUsageTime(totalSeconds) {
    if (totalSeconds < 60) return "0m";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    let timeString = "";
    if (hours > 0) timeString += `${hours}h `;
    timeString += `${minutes}m`;
    return timeString.trim();
  }

  function renderUsageData() {
    const USAGE_DATA_KEY = "dailyWebsiteUsage";
    const usageListContainer = document.getElementById("usage-list-container");
    const totalUsageElement = document.getElementById("total-usage-time");

    chrome.storage.local.get(USAGE_DATA_KEY, (data) => {
      const usage = data[USAGE_DATA_KEY] || {};

      const totalSeconds = Object.values(usage).reduce(
        (sum, time) => sum + time,
        0
      );
      if (totalUsageElement) {
        totalUsageElement.textContent = `Total: ${formatUsageTime(
          totalSeconds
        )}`;
      }

      usageListContainer.innerHTML = "";
      if (Object.keys(usage).length === 0) {
        usageListContainer.innerHTML =
          '<li style="justify-content:center; color:var(--secondary-text-color); border:none;">No activity tracked yet.</li>';
        return;
      }
      const filteredUsage = Object.entries(usage).filter(
        ([, time]) => time >= 10
      );
      if (filteredUsage.length === 0) {
        usageListContainer.innerHTML =
          '<li style="justify-content:center; color:var(--secondary-text-color); border:none;">No significant activity yet.</li>';
        return;
      }
      const sortedUsage = filteredUsage.sort(([, a], [, b]) => b - a);
      const itemsToShow =
        currentUsageFilterCount === Infinity
          ? sortedUsage
          : sortedUsage.slice(0, currentUsageFilterCount);
      const maxTime = itemsToShow.length > 0 ? itemsToShow[0][1] : 0;

      itemsToShow.forEach(([host, time]) => {
        const percentage = maxTime > 0 ? (time / maxTime) * 100 : 0;
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <img src="https://www.google.com/s2/favicons?sz=32&domain_url=${host}" class="usage-favicon" alt="${host} favicon">
            <span class="usage-host">${host}</span>
            <div class="usage-progress-bar">
                <div class="usage-progress-fill" style="width: ${percentage}%;"></div>
            </div>
            <span class="usage-time">${formatUsageTime(time)}</span>`;
        usageListContainer.appendChild(listItem);
      });
    });
  }

  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const count = button.dataset.count;
      currentUsageFilterCount =
        count === "all" ? Infinity : parseInt(count, 10);
      renderUsageData();
    });
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.dailyWebsiteUsage) {
      renderUsageData();
    }
  });

  // --- Initial calls ---
  loadSettings();
  fetchWeather();
  renderUsageData();
  setInterval(updateTimeAndGreeting, 1000 * 30);
  setupSessionRestore();

  // Make body visible after initial setup to prevent FOUC
  document.body.classList.add("ready");
});
