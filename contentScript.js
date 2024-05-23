// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // if (!sender.tab) {
  //   // 检查发送方是否存在
  //   console.error("Sender tab does not exist.");
  //   return;
  // }
  
  if (request.gptResponse) {
    console.log("Received GPT response:", request.gptResponse);
    displayGptResponse(request.gptResponse, request.selectionText);
    sendResponse({status: "success"});
  } else if (request.error) {
    //alert("GPT request error:", request.error);
    console.log("GPT request error:", request.error);
    displayGptResponse("Click on the plugin settings and enter the Activation Key", "Error: " + request.error); // Display error in the same UI for consistency
    sendResponse({status: "error", message: request.error});
  } else if (!request.gptResponse && !request.error) {
    console.error("No text provided for GPT request.");
    displayGptResponse("Error: No text provided for GPT request.", "");
    sendResponse({status: "error", message: "No text provided."});
  } else if (request.toggleHistoryPanel) {
    console.log('Toggling history panel'); // Added log to verify function call
    toggleHistoryPanel();
    sendResponse({status: "success"});
  }
  return true; // Keep the messaging channel open for asynchronous response
});

// Function to display GPT's response or error message
function displayGptResponse(response, question) {
  // Create a new div element to display the GPT response
  let responseDiv = document.createElement('div');
  responseDiv.style.position = 'fixed';
  responseDiv.style.bottom = '20px';
  responseDiv.style.left = '50%'; /* 将左边距设置为屏幕宽度的一半 */
  responseDiv.style.transform = 'translateX(-50%)'; /* 居中对齐 */
  responseDiv.style.padding = '10px';
  responseDiv.style.backgroundColor = 'white';
  responseDiv.style.border = '1px solid #ddd';
  responseDiv.style.boxShadow = '0 0 8px rgba(0,0,0,0.2)'; /* 添加阴影效果 */
  responseDiv.style.zIndex = '1000';
  responseDiv.style.fontWeight = 'bold'; /* 设置文字加粗 */
  responseDiv.innerText = response;

  // Add hover effect to the div
  responseDiv.addEventListener('mouseover', () => {
    responseDiv.style.boxShadow = '0 0 8px rgba(0,0,0,0.4)'; /* 悬浮时加深阴影效果 */
  });

  responseDiv.addEventListener('mouseout', () => {
    responseDiv.style.boxShadow = '0 0 8px rgba(0,0,0,0.2)'; /* 鼠标移出时恢复阴影效果 */
  });

  // Append the div to the document body
  document.body.appendChild(responseDiv);

  // Automatically remove the div after 5 seconds
  setTimeout(() => {
    document.body.removeChild(responseDiv);
  }, 5000);

  // Add the new response to the history panel
  if(question) { // Only update history if there's a question (not for errors or empty responses)
    if(!document.getElementById('gptHistoryPanel')) {
      createHistoryPanel();
    }
    const entry = document.createElement('div');
    // entry.style.padding = '10px';
    // entry.style.borderBottom = '1px solid #eee';
    // entry.innerText = `
    //   <span style="color: yellow;">Q: ${question}</span><br>
    //   <span style="color: red;">A: ${response}</span>
    // `;
    chrome.storage.sync.get(["gptRole"], function(result){
      var gptRole = result.gptRole;

      const roleElement = document.createElement('span');
      roleElement.style.color = 'block';
      if (typeof gptRole !== "undefined"){
        roleElement.textContent = `Use Rule is: ${result.gptRole}`;
      } else {
        roleElement.textContent = `Use Rule is: No Rule`;
      }
      const questionElement = document.createElement('span');
      questionElement.style.color = 'blue';
      questionElement.textContent = `Q: ${question}`;
      const answerElement = document.createElement('span');
      answerElement.style.color = 'red';
      answerElement.textContent = `A: ${response}`;
      entry.appendChild(roleElement);
      entry.appendChild(document.createElement('br'));
      entry.appendChild(questionElement);
      entry.appendChild(document.createElement('br'));
      entry.appendChild(answerElement);
      document.getElementById('gptHistoryPanel').prepend(entry); // Add the new entry to the top

      // Ensure the history panel is visible
      document.getElementById('gptHistoryPanel').style.display = 'block';
    });
  }
}

// Function to create the history panel if it doesn't exist
function createHistoryPanel() {
  let historyPanel = document.createElement('div');
  historyPanel.id = 'gptHistoryPanel';
  historyPanel.style.position = 'fixed';
  historyPanel.style.top = '10px';
  historyPanel.style.right = '10px';
  historyPanel.style.width = '350px';
  historyPanel.style.height = '83%';
  historyPanel.style.backgroundColor = 'white';
  historyPanel.style.overflowY = 'scroll';
  historyPanel.style.border = '1px solid #ddd';
  historyPanel.style.zIndex = '1000';
  historyPanel.style.display = 'none';

  // Additional styling
  historyPanel.style.padding = '10px';
  historyPanel.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
  historyPanel.style.fontFamily = 'Arial, sans-serif';

  document.body.appendChild(historyPanel);
}

// Function to toggle the history panel's visibility
function toggleHistoryPanel() {
  console.log('Toggle History Panel function called.'); // Added log to verify function call
  if (!document.getElementById('gptHistoryPanel')) {
    createHistoryPanel();
  }
  let historyPanel = document.getElementById('gptHistoryPanel');
  historyPanel.style.display = historyPanel.style.display === 'none' ? 'block' : 'none';
  historyPanel.style.top = '40px'; // 将历史面板靠近"Toggle History"框
  historyPanel.style.right = '10px'; // 将历史面板靠近"Toggle History"框
}

// Add a button to toggle the history panel visibility
let toggleButton = document.createElement('button');
toggleButton.innerText = 'Gomoon !';
toggleButton.style.position = 'fixed';
toggleButton.style.bottom = '30px';
toggleButton.style.right = '30px';
toggleButton.style.zIndex = '1001';
toggleButton.style.backgroundColor = '#4CAF50';
toggleButton.style.color = 'white';
toggleButton.style.fontSize = '16px';

// Additional styling
toggleButton.style.padding = '10px';
toggleButton.style.border = 'none';
toggleButton.style.borderRadius = '4px';
toggleButton.style.cursor = 'pointer';
toggleButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
toggleButton.style.fontFamily = 'Arial, sans-serif';

document.body.appendChild(toggleButton);

toggleButton.addEventListener('click', function() {
  console.log('Toggle History button clicked.'); // Added log for button click
  toggleHistoryPanel();
});

// Add CSS for the history panel and toggle button directly via JavaScript for simplicity
document.head.insertAdjacentHTML('beforeend', `
<style>
  #gptHistoryPanel {
    box-shadow: 0 0 8px rgba(0,0,0,0.1);
    font-family: Arial, sans-serif;
    font-size: 16px; /* Increased font size for readability */
    line-height: 1.5;
    display: none; /* Initially hidden */
  }
  #gptHistoryPanel > div {
    border-bottom: 1px solid #eee;
    padding: 12px; /* Increased padding for better spacing */
  }
  button {
    font-size: 16px; /* Increased font size for better readability */
    padding: 8px 15px; /* Adjusted padding for a larger, more clickable area */
    cursor: pointer;
    border: none; /* Removed border for cleaner design */
    border-radius: 4px; /* Added border radius for a modern look */
    background-color: #4CAF50; /* Ensuring button color is correctly set for higher visibility */
    color: white; /* Ensuring text color is white for contrast */
  }
</style>`)