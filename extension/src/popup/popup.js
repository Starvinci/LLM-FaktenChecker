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

            // Content-Script injizieren
            chrome.scripting.executeScript(
                {
                    target: { tabId: activeTab.id },
                    files: ['src/contentScript.js'],
                },
                (results) => {
                    if (chrome.runtime.lastError) {
                        console.error('Fehler bei executeScript:', chrome.runtime.lastError.message);
                        // Entferne die pulsierende Klasse und setze den Button-Text zurück bei Fehler
                        checkButton.textContent = "Bereich prüfen";
                        checkButton.classList.remove("pulsing");
                    } else {
                        console.log('Content-Script erfolgreich injiziert:', results);
                        // Schließe das Popup, um den Fokus auf den Tab zu setzen
                        window.close();
                    }
                }
            );
        });
    });
});
