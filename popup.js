document.addEventListener('DOMContentLoaded', async function() {
    // Check for an existing activation key in local storage upon form initialization
    chrome.storage.local.get(['activationKey'], function(result) {
        if (result.activationKey) {
            document.getElementById('activationKey').value = result.activationKey;
            console.log('Activation key loaded from local storage.');
        } else {
            console.log('No activation key found in local storage.');
        }
    });

    const backendURL = await getBackendURL();

    // Fetch GPT model options from backend and populate the select dropdown using fetch API
    fetch(`${backendURL}/getrole`)
    .then(response => response.json())
    .then(data => {
        const gptModelSelect = document.getElementById('gptRole');
        data.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            gptModelSelect.appendChild(option);
        });
        console.log('GPT models fetched and populated successfully.');
    }).catch(error => {
        console.error('Failed to fetch GPT models:', error);
    });

    document.getElementById('settingsForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const activationKey = document.getElementById('activationKey').value;
        const gptRole = document.getElementById('gptRole').value;

        // Basic validation
        if (!activationKey.trim() || !gptRole) {
            console.log('Validation failed: Missing required fields.');
            displayErrorMessage('Please fill in all required fields.');
            return;
        }

        // API call for activation key verification using fetch
        fetch(`${backendURL}/verify-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ activationKey })
        })
        .then(response => {
            if (!response.ok) {
                throw Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if(data.success) {
                console.log('Activation key verified successfully.');
                clearErrorMessage(); 
                alert('Activation key verified successfully. Extension is now activated. Role is `' + gptRole + '`');
                // Save settings using Chrome's storage API's sync space
                chrome.storage.sync.set({ activationKey, gptRole }, function() {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to save settings:', chrome.runtime.lastError);
                        alert('Failed to save settings. Please try again.');
                    } else {
                        console.log('Settings saved successfully.');

                        // Additionally, save the activation key locally using Chrome's storage API's local space
                        chrome.storage.local.set({ activationKey }, function() {
                            if (chrome.runtime.lastError) {
                                console.error('Failed to save activation key locally:', chrome.runtime.lastError);
                            } else {
                                console.log('Activation key saved locally.');
                            }
                        });
                    }
                });
            } else {
                console.error('Activation key verification failed:', data.message);
                displayErrorMessage(data.message);
            }
        })
        .catch(error => {
            console.error('Error during activation key verification:', error);
            displayErrorMessage('An error occurred during activation key verification. Please try again later.');
        });
    });
});

// Dynamic retrieval of backend URL
async function getBackendURL() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['backendURL'], function(result) {
            if (result.backendURL) {
                resolve(result.backendURL);
            } else {
                // Default URL if not set
                resolve('http://api.gomoon.pro');
            }
        });
    });
}

function displayErrorMessage(message) {
    let errorMessageDiv = document.getElementById('errorMessage');
    if (!errorMessageDiv) {
        errorMessageDiv = document.createElement('div');
        errorMessageDiv.id = 'errorMessage';
        errorMessageDiv.style.color = 'red';
        errorMessageDiv.textContent = message;
        const form = document.getElementById('settingsForm');
        form.insertBefore(errorMessageDiv, form.firstChild); // Insert at the top of the form
    } else {
        errorMessageDiv.textContent = message;
    }
}

function clearErrorMessage() {
    const errorMessageDiv = document.getElementById('errorMessage');
    if (errorMessageDiv) {
        errorMessageDiv.remove();
    }
}