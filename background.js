const USAGE_DATA_KEY = 'dailyWebsiteUsage';
let currentActiveHost = null;
let lastActiveTime = Date.now();
async function updateTime() {
    if (!currentActiveHost) return;
    const now = Date.now();
    const timeSpentSeconds = Math.round((now - lastActiveTime) / 1000);
    lastActiveTime = now;
    if (timeSpentSeconds > 0) {
        const { [USAGE_DATA_KEY]: usage = {} } = await chrome.storage.local.get(USAGE_DATA_KEY);
        usage[currentActiveHost] = (usage[currentActiveHost] || 0) + timeSpentSeconds;
        await chrome.storage.local.set({ [USAGE_DATA_KEY]: usage });
    }
}
function updateActiveHost(tab) {
    updateTime();
    if (tab && tab.url && tab.url.startsWith('http')) {
        try {
            const url = new URL(tab.url);
            if (url.hostname && url.hostname !== 'newtab' && url.hostname !== 'null') {
                currentActiveHost = url.hostname;
            } else {
                currentActiveHost = null;
            }
        } catch (error) { currentActiveHost = null; }
    } else {
        currentActiveHost = null;
    }
    lastActiveTime = Date.now();
}
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, updateActiveHost);
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.url) {
        updateActiveHost(tab);
    }
});
chrome.windows.onFocusChanged.addListener(windowId => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        updateTime();
        currentActiveHost = null;
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]) {
                updateActiveHost(tabs[0]);
            }
        });
    }
});
chrome.windows.onRemoved.addListener(async (windowId) => {
    const allWindows = await chrome.windows.getAll({ windowTypes: ['normal'] });
    if (allWindows.length === 0) {
        await updateTime();
    }
});
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'periodic-update') {
        updateTime();
    } else if (alarm.name === 'daily-reset') {
        chrome.storage.local.set({ [USAGE_DATA_KEY]: {} });
    }
});
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed. Setting up alarms.");
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    chrome.alarms.create('daily-reset', { when: tomorrow.getTime(), periodInMinutes: 24 * 60 });
    chrome.alarms.create('periodic-update', { periodInMinutes: 1 / 6 });
});