document.addEventListener('DOMContentLoaded', () => {
    console.log('popup.js geladen');

    const checkButton = document.getElementById('checkButton1');
    const videoToggle = document.getElementById('videoToggle');

    // Sicherstellen, dass die Elemente existieren
    if (!checkButton) {
        console.error('Button "checkButton1" wurde nicht gefunden!');
        return;
    }
    if (!videoToggle) {
        console.error('Checkbox "videoToggle" wurde nicht gefunden!');
        return;
    }

    // Laden des Slider-Zustands
    const savedToggleState = localStorage.getItem('videoToggle');
    if (savedToggleState === 'true') {
        videoToggle.checked = true;
    }

    // Speichern des Slider-Zustands
    videoToggle.addEventListener('change', () => {
        localStorage.setItem('videoToggle', videoToggle.checked);
        console.log('Slider-Zustand gespeichert:', videoToggle.checked);
    });

    checkButton.addEventListener('click', () => {
        console.log('Button "Bereich prüfen" wurde geklickt');

        // Aktive Tabs abrufen
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0 || !tabs[0].id) {
                console.error('Kein aktiver Tab gefunden.');
                return;
            }

            const activeTab = tabs[0];
            console.log('Aktiver Tab:', activeTab);

            // Sicherstellen, dass die URL kein geschützter Bereich ist
            if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('https://chrome.google.com/')) {
                console.error('Content-Script kann nicht in geschützten Seiten geladen werden:', activeTab.url);
                return;
            }

            // Content-Script injizieren
            chrome.scripting.executeScript(
                {
                    target: { tabId: activeTab.id },
                    files: ['src/contentScript.js']
                },
                (results) => {
                    if (chrome.runtime.lastError) {
                        console.error('Fehler bei executeScript:', chrome.runtime.lastError.message);
                    } else {
                        console.log('Content-Script erfolgreich injiziert:', results);
                    }
                }
            );
        });
    });

    // Content-Script direkt für die aktuelle Seite ausführen
    chrome.tabs.executeScript(null, { file: 'src/contentScript.js' }, () => {
        if (chrome.runtime.lastError) {
            console.error('Fehler beim Ausführen des Content-Scripts:', chrome.runtime.lastError.message);
        } else {
            console.log('Content-Script direkt ausgeführt.');
        }
    });
});
