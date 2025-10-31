// static/background.js

let cooldownUntil = 0;
const COOLDOWN_PERIOD = 15 * 60 * 1000; // 15 minutes in milliseconds
// const API_BASE_URL = "http://localhost:3000";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: '/settings.html' });
});

// Listen for completed navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  
  console.log('basic url to:', API_BASE_URL);
  if (details.url === `${API_BASE_URL}/back_to_extension`) {
      handleBackToExtension(details.tabId);
      return;
  } 
  // We only care about the main frame (not iframes)
  if (details.frameId === 0) {
    checkUrl(details.url, details.tabId);
  }
});

// Listen for messages from the preworkout page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCooldown') {
    startCooldown();
    sendResponse({success: true});
  }
});
 
function startCooldown() {
  cooldownUntil = Date.now() + COOLDOWN_PERIOD;
  console.log('Cooldown started until:', new Date(cooldownUntil));
}

function isInCooldown() {
  return Date.now() < cooldownUntil;
}

// Function to check if the URL is in the trigger sites list
function checkUrl(url, tabId) {
  if (isInCooldown()) {
    console.log('In cooldown period, allowing navigation');
    return; // Allow navigation during cooldown
  }
  chrome.storage.sync.get(['triggerSites'], (result) => {
    const triggerSites = result.triggerSites || [];
    const currentHostname = new URL(url).hostname;

    if (triggerSites.some(site => currentHostname.includes(site))) {
      console.log('Trigger site visited!:', url);
      const encodedUrl = encodeURIComponent(url);
      const redirectUrl = chrome.runtime.getURL(`preworkout.html?original=${encodedUrl}`);
      console.log('Redirecting to:', redirectUrl);
      // Add your logic here for when a trigger site is visited
      // For example, you could show a notification or open your extension's popup
      // Redirect to your extension page
      chrome.tabs.update(tabId, { url: redirectUrl });
    }
  });
}

function handleBackToExtension(tabId) {
  chrome.storage.local.get(['originalUrl'], (result) => {
    if (result.originalUrl) {
      
      console.log('Redirecting back to:', result.originalUrl);
      
      // Start cooldown BEFORE redirecting back
      startCooldown();
      
      // Redirect to the original URL
      chrome.tabs.update(tabId, { url: result.originalUrl });
      
      // Clean up the storage
      chrome.storage.local.remove(['originalUrl'], () => {
        console.log('Original URL removed from storage');
      });
    } else {
      console.log('No original URL found in storage');
      // Optionally redirect to a default page or close the tab
      // chrome.tabs.remove(tabId);
    }
  });
}
