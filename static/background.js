// static/background.js
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: '/settings.html' }); // Replace 'settings.html' with the correct path
});
