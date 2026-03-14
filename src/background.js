// static/background.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch { return false; }
}

let cooldownUntil = 0;
const COOLDOWN_PERIOD_SKIP = 15 * 60 * 1000;     // 15 minutes for skip
const COOLDOWN_PERIOD_WORKOUT = 30 * 60 * 1000; // 30 minutes for completed workout

/**
 * Show settings page to the user, so he can start using extension
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: '/settings.html' });
  }
});

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if the current day is in the activeWeekdays array
 * @param {number[]} activeWeekdays - Array of day numbers (0=Sun, 6=Sat)
 * @returns {boolean}
 */
function isActiveDay(activeWeekdays) {
  const today = new Date().getDay(); // 0-6
  return activeWeekdays.includes(today);
}

/**
 * Check if current time is within the active time range
 * @param {string} startTime - "HH:MM" format
 * @param {string} endTime - "HH:MM" format
 * @returns {boolean}
 */
function isWithinActiveTime(startTime, endTime) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!/^\d{1,2}:\d{2}$/.test(startTime) || !/^\d{1,2}:\d{2}$/.test(endTime)) {
    return true; // default to active if time format is invalid
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight ranges (e.g., 22:00 to 06:00)
  if (endMinutes < startMinutes) {
    // Active if current time is after start OR before end
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  // Normal range (e.g., 09:00 to 18:00)
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Check if daily interruption limit has been reached
 * Returns true if the extension should be active (limit not reached)
 * @returns {Promise<boolean>}
 */
async function checkDailyLimit() {
  const { maxInterruptionsPerDay } = await chrome.storage.sync.get('maxInterruptionsPerDay');

  // If 0 or not set, unlimited
  if (!maxInterruptionsPerDay || maxInterruptionsPerDay <= 0) {
    return true;
  }

  const { dailyInterruptionCount, lastInterruptionDate } =
    await chrome.storage.local.get(['dailyInterruptionCount', 'lastInterruptionDate']);

  const today = getTodayDateString();

  // Reset count if it's a new day
  if (lastInterruptionDate !== today) {
    await chrome.storage.local.set({
      dailyInterruptionCount: 0,
      lastInterruptionDate: today
    });
    return true;
  }

  // Check if limit reached
  const currentCount = dailyInterruptionCount || 0;
  return currentCount < maxInterruptionsPerDay;
}

/**
 * Increment the daily interruption counter
 */
async function incrementDailyCount() {
  const { dailyInterruptionCount, lastInterruptionDate } =
    await chrome.storage.local.get(['dailyInterruptionCount', 'lastInterruptionDate']);

  const today = getTodayDateString();

  // Reset if new day, otherwise increment
  const newCount = (lastInterruptionDate === today)
    ? (dailyInterruptionCount || 0) + 1
    : 1;

  await chrome.storage.local.set({
    dailyInterruptionCount: newCount,
    lastInterruptionDate: today
  });
}

/**
 * Check if the extension should be active based on all schedule settings
 * @returns {Promise<boolean>}
 */
async function isExtensionActive() {
  const settings = await chrome.storage.sync.get([
    'activeWeekdays',
    'activeTimeStart',
    'activeTimeEnd'
  ]);

  // Use defaults if not set (weekdays 9am-6pm)
  const activeWeekdays = settings.activeWeekdays ?? [1, 2, 3, 4, 5];
  const activeTimeStart = settings.activeTimeStart ?? '09:00';
  const activeTimeEnd = settings.activeTimeEnd ?? '18:00';

  // Check day
  if (!isActiveDay(activeWeekdays)) {
    return false;
  }

  // Check time
  if (!isWithinActiveTime(activeTimeStart, activeTimeEnd)) {
    return false;
  }

  // Check daily limit
  if (!(await checkDailyLimit())) {
    return false;
  }

  return true;
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: '/preworkout.html' });
});

// Listen for completed navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  
  // We only care about the main frame (not iframes)
  if (details.frameId === 0) {
    checkUrl(details.url, details.tabId);
  }
});

// Listen for messages from the workout site (externally_connectable)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!sender.url || !sender.url.startsWith(API_BASE_URL)) {
    sendResponse({ success: false, error: 'unauthorized' });
    return;
  }
  if (message.action === 'workoutComplete') {
    handleBackToExtension(sender.tab.id);
    sendResponse({ success: true });
  }
});

// Listen for messages from the preworkout page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCooldown') {
    startCooldown();
    sendResponse({success: true});
    return true;
  }
  if (message.action === 'startWorkout') {
    // Start cooldown immediately when workout begins
    startCooldown(COOLDOWN_PERIOD_WORKOUT);
    incrementDailyCount().then(() => {
      sendResponse({success: true});
    });
    return true;
  }
  if (message.action === 'incrementDailyCount') {
    incrementDailyCount().then(() => {
      sendResponse({success: true});
    });
    return true;
  }
});
 
function startCooldown(duration = COOLDOWN_PERIOD_SKIP) {
  cooldownUntil = Date.now() + duration;
  chrome.storage.local.set({ cooldownUntil });
}

async function isInCooldown() {
  // Fast path: in-memory value is still valid
  if (Date.now() < cooldownUntil) return true;

  // Service worker may have restarted — check storage
  const { cooldownUntil: stored } = await chrome.storage.local.get('cooldownUntil');
  cooldownUntil = stored || 0;
  
  return Date.now() < cooldownUntil;
}

// Function to check if the URL is in the trigger sites list
async function checkUrl(url, tabId) {
  // Check cooldown first (fastest check)
  if (await isInCooldown()) return;

  // Check if extension should be active (schedule + daily limit)
  if (!(await isExtensionActive())) return;

  const { triggerSites } = await chrome.storage.sync.get('triggerSites');

  const sites = Array.isArray(triggerSites) ? triggerSites : [];
  const currentHostname = new URL(url).hostname;

  if (sites.some(site => currentHostname === site || currentHostname.endsWith('.' + site))) {
    const encodedUrl = encodeURIComponent(url);
    const redirectUrl = chrome.runtime.getURL(`preworkout.html?original=${encodedUrl}`);
    chrome.tabs.update(tabId, { url: redirectUrl });
  }
}

function handleBackToExtension(tabId) {
  chrome.storage.local.get(['originalUrl'], (result) => {
    if (result.originalUrl && isSafeUrl(result.originalUrl)) {
      // Start cooldown BEFORE redirecting back (longer duration for completed workout)
      startCooldown(COOLDOWN_PERIOD_WORKOUT);

      // Redirect to the original URL
      chrome.tabs.update(tabId, { url: result.originalUrl });

      // Clean up the storage
      chrome.storage.local.remove(['originalUrl']);
    } else {
      chrome.tabs.remove(tabId);
    }
  });
}
