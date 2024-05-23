chrome.runtime.onInstalled.addListener(() => {
  console.log("AI答题辅助系统 Chrome Extension installed.");
  // Create context menu for asking GPT
  chrome.contextMenus.create({
    id: "askGpt",
    title: "Ask Gomoon",
    contexts: ["selection"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error creating context menu for 'Ask GPT':", chrome.runtime.lastError);
    } else {
      console.log("Context menu for 'Ask GPT' created successfully.");
    }
  });

  // Create context menu for toggling the history panel
  // chrome.contextMenus.create({
  //   id: "toggleHistoryPanel",
  //   title: "Toggle History Panel",
  //   contexts: ["all"]
  // }, () => {
  //   if (chrome.runtime.lastError) {
  //     console.error("Error creating context menu for 'Toggle History Panel':", chrome.runtime.lastError);
  //   } else {
  //     console.log("Context menu for 'Toggle History Panel' created successfully.");
  //   }
  // });
});

// Listen for context menu item click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggleHistoryPanel") {
    // Ensure content script is injected before sending message
    injectContentScriptIfNeeded(tab).then(() => {
      sendMessageToToggleHistoryPanel(tab);
    }).catch(error => console.error("Error injecting content script for toggling history panel:", error));
  } else if (info.menuItemId === "askGpt") {
    chrome.storage.sync.get(["activationKey", "gptRole"], function(result) {
      if (result.activationKey) {
        console.log('Activation key found. Proceeding with GPT request.');
        fetch('http://api.gomoon.pro/askgpt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: info.selectionText,
            activationKey: result.activationKey,
            role: result.gptRole
          })
        })
        .then(response => response.json())
        .then(data => {
          // Ensure content script is injected before sending GPT response
          injectContentScriptIfNeeded(tab).then(() => {
            chrome.tabs.sendMessage(tab.id, {gptResponse: data.message, selectionText: info.selectionText}, () => {
              if (chrome.runtime.lastError) {
                console.error("Error sending GPT response to content script:", chrome.runtime.lastError.message);
              } else {
                console.log("GPT response and question sent to content script successfully.");
              }
            });
          }).catch(error => console.error("Error injecting content script for sending GPT response:", error));
        })
        .catch(error => {
          console.error("Error making GPT request:", error);
          // Send an error message to the content script
          chrome.tabs.sendMessage(tab.id, {error: "GPT request failed. Please try again later."});
        });
      } else {
        console.log('Extension is not activated. Please enter an activation key.');
        injectContentScriptIfNeeded(tab).then(() => {
          chrome.tabs.sendMessage(tab.id, {error: "Invalid activation key."});
        }).catch(error => console.error("Error injecting content script for sending GPT response:", error));
      }
    });
  }
});

function sendMessageToToggleHistoryPanel(tab) {
  chrome.tabs.sendMessage(tab.id, {toggleHistoryPanel: true}, response => {
    if (chrome.runtime.lastError) {
      console.error("Error toggling history panel:", chrome.runtime.lastError.message);
    } else {
      console.log("Toggle history panel message sent successfully.");
    }
  });
}

// Updated function to inject content script if needed
function injectContentScriptIfNeeded(tab) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => !!window.isContentScriptInjected,
    }, (injectionResults) => {
      if (chrome.runtime.lastError || !injectionResults[0].result) {
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          files: ['contentScript.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error injecting content script:", chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            console.log("Content script injected successfully.");
            resolve();
          }
        });
      } else {
        console.log("Content script already injected.");
        resolve();
      }
    });
  });
}