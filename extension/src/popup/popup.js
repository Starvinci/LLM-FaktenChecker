// src/popup.js

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

    // Speichern des Slider-Zustands und Senden von Nachrichten
    videoToggle.addEventListener('change', () => {
        const isEnabled = videoToggle.checked;
        localStorage.setItem('videoToggle', isEnabled);
        console.log('Slider-Zustand gespeichert:', isEnabled);

        // Sende eine Nachricht an das content script direkt
        if (isEnabled) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0 || !tabs[0].id) {
                    console.error('Kein aktiver Tab gefunden.');
                    return;
                }
                // Injektieren des videoMonitor.js Skripts
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabs[0].id },
                        files: ['src/videoMonitor.js'],
                    },
                    () => {
                        if (chrome.runtime.lastError) {
                            console.error('Fehler beim Injektieren von videoMonitor.js:', chrome.runtime.lastError.message);
                            alert(`Fehler beim Injektieren von videoMonitor.js: ${chrome.runtime.lastError.message}`);
                        } else {
                            console.log('videoMonitor.js erfolgreich injiziert');
                            //alert('Video-Faktencheck aktiviert und videoMonitor.js injiziert');
                        }
                    }
                );
            });
        } else {
            // Senden Sie eine Nachricht an das Content Script, um die Überwachung zu stoppen
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0 || !tabs[0].id) {
                    console.error('Kein aktiver Tab gefunden.');
                    return;
                }
                chrome.tabs.sendMessage(tabs[0].id, { action: 'disableVideoCheck' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Fehler beim Senden der Nachricht:', chrome.runtime.lastError.message);
                        alert(`Fehler beim Senden der Nachricht: ${chrome.runtime.lastError.message}`);
                    } else {
                        console.log('Video-Faktencheck deaktiviert');
                        //alert('Video-Faktencheck deaktiviert');
                    }
                });
            });
        }
    });

    checkButton.addEventListener('click', () => {
        console.log('Button "Bereich prüfen" wurde geklickt');

        // Ändere den Button-Text zu "Auswahl" und füge die pulsierende Klasse hinzu
        checkButton.textContent = "Auswahl";
        checkButton.classList.add("pulsing");

        // Aktive Tabs abrufen
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0 || !tabs[0].id) {
                console.error('Kein aktiver Tab gefunden.');
                // Setze den Button zurück bei Fehler
                checkButton.textContent = "Bereich prüfen";
                checkButton.classList.remove("pulsing");
                return;
            }

            const activeTab = tabs[0];
            console.log('Aktiver Tab:', activeTab);

            // Sicherstellen, dass die URL kein geschützter Bereich ist
            if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('https://chrome.google.com/')) {
                console.error('Content-Script kann nicht in geschützten Seiten geladen werden:', activeTab.url);
                // Setze den Button zurück bei Fehler
                checkButton.textContent = "Bereich prüfen";
                checkButton.classList.remove("pulsing");
                return;
            }

            // Content-Skript injizieren (optional, falls benötigt)
            // Da wir `videoMonitor.js` direkt injizieren, könnte `contentScript.js` entfernt werden.
            // Falls `contentScript.js` jedoch zusätzliche Funktionen hat, lassen Sie ihn.
            chrome.scripting.executeScript(
                {
                    target: { tabId: activeTab.id },
                    files: ['src/contentScript.js'],
                },
                (results) => {
                    if (chrome.runtime.lastError) {
                        console.error('Fehler bei executeScript:', chrome.runtime.lastError.message);
                        alert(`Fehler bei executeScript: ${chrome.runtime.lastError.message}`);
                        // Entferne die pulsierende Klasse und setze den Button-Text zurück bei Fehler
                        checkButton.textContent = "Bereich prüfen";
                        checkButton.classList.remove("pulsing");
                    } else {
                        console.log('Content-Script erfolgreich injiziert:', results);
                        //alert('Content-Script erfolgreich injiziert'); // Debugging-Alert
                        // Schließe das Popup, um den Fokus auf den Tab zu setzen
                        window.close();
                    }
                }
            );
        });
    });
});
