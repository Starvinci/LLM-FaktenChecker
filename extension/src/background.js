chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startSelection') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelection' });
        });
    } else if (request.action === 'showLoading') {
        chrome.runtime.sendMessage({ action: 'showLoading' });
    } else if (request.action === 'hideLoading') {
        chrome.runtime.sendMessage({ action: 'hideLoading' });
    }
});
