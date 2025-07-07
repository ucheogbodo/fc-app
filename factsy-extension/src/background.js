const DEFAULT_FACTSY_URL = "https://your-factsy-app-url.com"; // fallback if not set

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "factsy-fact-check",
    title: "Fact-check with Factsy",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factsy-fact-check" && info.selectionText) {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["factsy_url"], (result) => {
        const factsyUrl = result.factsy_url || DEFAULT_FACTSY_URL;
        const url = `${factsyUrl}?q=${encodeURIComponent(info.selectionText)}`;
        chrome.tabs.create({ url });
      });
    } else {
      const url = `${DEFAULT_FACTSY_URL}?q=${encodeURIComponent(info.selectionText)}`;
      chrome.tabs.create({ url });
    }
  }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "factsy-fact-check-shortcut") {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => window.getSelection().toString(),
      },
      (results) => {
        const selected = results && results[0] && results[0].result;
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(["factsy_url"], (result) => {
            const factsyUrl = result.factsy_url || DEFAULT_FACTSY_URL;
            if (selected && selected.trim()) {
              const url = `${factsyUrl}?q=${encodeURIComponent(selected)}`;
              chrome.tabs.create({ url });
            } else {
              chrome.action.openPopup();
            }
          });
        } else {
          if (selected && selected.trim()) {
            const url = `${DEFAULT_FACTSY_URL}?q=${encodeURIComponent(selected)}`;
            chrome.tabs.create({ url });
          } else {
            chrome.action.openPopup();
          }
        }
      }
    );
  }
}); 