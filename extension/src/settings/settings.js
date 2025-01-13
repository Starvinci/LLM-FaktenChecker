document.addEventListener('DOMContentLoaded', () => {
    const flags = document.querySelectorAll('.flag');
    const worldIcon = document.getElementById('world-icon');
    const saveSettingsBtn = document.getElementById('save-settings');
    const closeSettingsBtn = document.getElementById('close-settings');

    let selectedCountries = new Set();
    let worldwide = false;

    // Funktion zum Aktualisieren der Auswahlanzeige
    function updateSelection() {
        // Flaggen selektieren
        flags.forEach(flag => {
            if (selectedCountries.has(flag.getAttribute('data-country'))) {
                flag.classList.add('selected');
            } else {
                flag.classList.remove('selected');
            }
        });

        // Weltkugel selektieren
        if (worldwide) {
            worldIcon.classList.add('selected');
            flags.forEach(flag => flag.classList.remove('selected'));
        } else {
            worldIcon.classList.remove('selected');
        }
    }

    // Event Listener für Flaggenklicks
    flags.forEach(flag => {
        flag.addEventListener('click', () => {
            if (worldwide) return; // Keine Auswahl möglich, wenn weltweit ausgewählt

            const country = flag.getAttribute('data-country');
            if (selectedCountries.has(country)) {
                selectedCountries.delete(country);
            } else {
                selectedCountries.add(country);
            }
            updateSelection();
        });
    });

    // Event Listener für Weltkugel-Icon
    worldIcon.addEventListener('click', () => {
        worldwide = !worldwide;
        if (worldwide) {
            selectedCountries.clear();
        }
        updateSelection();
    });

    // Event Delegation für Add- und Remove-Buttons
    document.addEventListener('click', function(event) {
        // Add-Button
        const addBtn = event.target.closest('.add-source-btn');
        if (addBtn) {
            addSource(addBtn);
            return; // Stoppt weitere Verarbeitung dieses Events
        }

        // Remove-Button
        const removeBtn = event.target.closest('.remove-source-btn');
        if (removeBtn) {
            removeSource(removeBtn);
            return;
        }
    });

    // Funktion zum Generieren einer eindeutigen ID
    function generateUniqueId(prefix = 'source') {
        return prefix + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Funktion zum Hinzufügen einer neuen Quelle
    function addSource(button) {
        console.log('addSource aufgerufen'); // Debugging
        const sourceItem = button.closest('.source-item');

        // Entferne den Add-Button vom aktuellen source-item
        const addButton = sourceItem.querySelector('.add-source-btn');
        if (addButton) {
            addButton.remove();
        }

        // Clone das source-item, das nun nur noch den Remove-Button hat
        const newSourceItem = sourceItem.cloneNode(true);

        // Leere den Wert des Eingabefelds und generiere eine neue eindeutige ID
        const input = newSourceItem.querySelector('input[type="url"]');
        input.value = '';
        input.id = generateUniqueId('source');

        // Stelle sicher, dass das neue source-item den Add-Button wieder enthält
        const sourceButtons = newSourceItem.querySelector('.source-buttons');

        // Entferne den vorhandenen Remove-Button, falls nötig (da es sich um das geklonte Element handelt)
        // Optional: Falls das geklonte Element bereits den Remove-Button hat, lassen wir ihn bestehen
        // Füge den Add-Button zum neuen source-item hinzu
        const newAddButton = document.createElement('button');
        newAddButton.type = 'button';
        newAddButton.classList.add('add-source-btn');
        newAddButton.innerHTML = '<i class="fas fa-plus-circle"></i>';
        sourceButtons.appendChild(newAddButton);

        // Append das neue source-item zur Liste
        sourceItem.parentElement.appendChild(newSourceItem);

        console.log('Neue Source hinzugefügt'); // Debugging
    }

    // Funktion zum Entfernen einer Quelle
    function removeSource(button) {
        console.log('removeSource aufgerufen'); // Debugging
        const sourceItem = button.closest('.source-item');
        const sourceList = sourceItem.parentElement;

        // Überprüfe, ob mehr als eine Quelle vorhanden ist
        const sourceItems = sourceList.querySelectorAll('.source-item');
        if (sourceItems.length > 1) {
            sourceItem.remove();
            console.log('Source entfernt'); // Debugging
        } else {
            alert('Mindestens eine Quelle muss vorhanden sein.');
        }
    }

    // Funktion zum Speichern der Einstellungen
    saveSettingsBtn.addEventListener('click', () => {
        const prioritizedSources = Array.from(document.querySelectorAll('input[name="prioritized_sources[]"]'))
            .map(input => input.value.trim())
            .filter(value => value !== '');
        const neglectedSources = Array.from(document.querySelectorAll('input[name="neglected_sources[]"]'))
            .map(input => input.value.trim())
            .filter(value => value !== '');
        const countries = Array.from(selectedCountries);
        const searchWorldwide = worldwide;

        const settings = {
            searchWorldwide: searchWorldwide,
            countries: countries,
            prioritizedSources: prioritizedSources,
            neglectedSources: neglectedSources
        };

        // // Validierung: Wenn weltweit ausgewählt ist, dürfen keine Länder angegeben sein
        // if (searchWorldwide && countries.length > 0) {
        //     alert('Wenn "Weltweit" ausgewählt ist, dürfen keine Länder ausgewählt sein.');
        //     return;
        // }

        // // Validierung: Mindestens eine Quelle in jeder Liste
        // if (!searchWorldwide && countries.length === 0) {
        //     alert('Bitte wählen Sie mindestens ein Land oder "Weltweit" aus.');
        //     return;
        // }

        // if (prioritizedSources.length === 0) {
        //     alert('Bitte fügen Sie mindestens eine priorisierte Quelle hinzu.');
        //     return;
        // }

        // if (neglectedSources.length === 0) {
        //     alert('Bitte fügen Sie mindestens eine zu vernachlässigende Quelle hinzu.');
        //     return;
        // }

        // Senden der Einstellungen an das Backend
        fetch('http://localhost:5003/api/save-settings', {  // Stellen Sie sicher, dass die URL korrekt ist
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success || data.message === "Einstellungen wurden erfolgreich gespeichert.") {
                // Toast-Benachrichtigung erstellen
                const toast = document.createElement('div');
                toast.textContent = 'Einstellungen erfolgreich gespeichert!';
                toast.style.position = 'fixed';
                toast.style.top = '-50px'; // Startposition außerhalb des Fensters
                toast.style.left = '50%';
                toast.style.transform = 'translateX(-50%)';
                toast.style.padding = '10px 20px';
                toast.style.backgroundColor = '#28a745'; // Grün für Erfolg
                toast.style.color = '#fff';
                toast.style.fontSize = '14px';
                toast.style.borderRadius = '5px';
                toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                toast.style.zIndex = '9999';
                toast.style.transition = 'top 0.5s ease-in-out'; // Sanftes Hereinfahren
                document.body.appendChild(toast);
        
                // Toast einblenden
                setTimeout(() => {
                    toast.style.top = '20px'; // Zielposition innerhalb des Fensters
                }, 100);
        
                // Fenster nach 2 Sekunden schließen
                setTimeout(() => {
                    toast.style.top = '-50px'; // Toast ausblenden
                    setTimeout(() => {
                        document.body.removeChild(toast); // Toast entfernen
                        window.close(); // Fenster schließen
                    }, 500); // Warten, bis die Animation abgeschlossen ist
                }, 2000); // Toast bleibt 2 Sekunden sichtbar
            } else {
                alert('Fehler beim Speichern der Einstellungen: ' + data.message);
            }
        });
        
    });

    // Funktion zum Schließen der Einstellungsseite
    closeSettingsBtn.addEventListener('click', () => {
        window.close(); // Schließt das Fenster (funktioniert nur, wenn es über `window.open` geöffnet wurde)
    });

    // Laden der gespeicherten Einstellungen beim Start
    function loadSettings() {
        fetch('/api/get-settings')  // Backend-Endpunkt zum Abrufen der Einstellungen
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const settings = data.settings;
                    if (settings.searchWorldwide) {
                        worldwide = true;
                        updateSelection();
                    } else {
                        settings.countries.forEach(country => {
                            selectedCountries.add(country);
                        });
                        updateSelection();
                    }

                    // Laden der priorisierten Quellen
                    const prioritizedSourcesList = document.getElementById('prioritized-sources-list');
                    prioritizedSourcesList.innerHTML = '';
                    if (settings.prioritizedSources.length > 0) {
                        settings.prioritizedSources.forEach((source, index) => {
                            const sourceItem = document.createElement('div');
                            sourceItem.classList.add('source-item');
                            sourceItem.innerHTML = `
                                <input type="url" id="prioritized-source-${index + 1}" name="prioritized_sources[]" placeholder="https://example.com" value="${source}" required>
                                <div class="source-buttons">
                                    <button type="button" class="add-source-btn">
                                        <i class="fas fa-plus-circle"></i>
                                    </button>
                                    <button type="button" class="remove-source-btn">
                                        <i class="fas fa-minus-circle"></i>
                                    </button>
                                </div>
                            `;
                            prioritizedSourcesList.appendChild(sourceItem);
                        });
                    } else {
                        // Fügen Sie ein leeres Source-Item hinzu, falls keine vorhanden sind
                        const initialSource = document.createElement('div');
                        initialSource.classList.add('source-item');
                        initialSource.innerHTML = `
                            <input type="url" name="prioritized_sources[]" placeholder="https://example.com" required>
                            <div class="source-buttons">
                                <button type="button" class="add-source-btn">
                                    <i class="fas fa-plus-circle"></i>
                                </button>
                                <button type="button" class="remove-source-btn">
                                    <i class="fas fa-minus-circle"></i>
                                </button>
                            </div>
                        `;
                        prioritizedSourcesList.appendChild(initialSource);
                    }

                    // Laden der zu vernachlässigenden Quellen
                    const neglectedSourcesList = document.getElementById('neglected-sources-list');
                    neglectedSourcesList.innerHTML = '';
                    if (settings.neglectedSources.length > 0) {
                        settings.neglectedSources.forEach((source, index) => {
                            const sourceItem = document.createElement('div');
                            sourceItem.classList.add('source-item');
                            sourceItem.innerHTML = `
                                <input type="url" id="neglected-source-${index + 1}" name="neglected_sources[]" placeholder="https://example.com" value="${source}" required>
                                <div class="source-buttons">
                                    <button type="button" class="add-source-btn">
                                        <i class="fas fa-plus-circle"></i>
                                    </button>
                                    <button type="button" class="remove-source-btn">
                                        <i class="fas fa-minus-circle"></i>
                                    </button>
                                </div>
                            `;
                            neglectedSourcesList.appendChild(sourceItem);
                        });
                    } else {
                        // Fügen Sie ein leeres Source-Item hinzu, falls keine vorhanden sind
                        const initialSource = document.createElement('div');
                        initialSource.classList.add('source-item');
                        initialSource.innerHTML = `
                            <input type="url" name="neglected_sources[]" placeholder="https://example.com" required>
                            <div class="source-buttons">
                                <button type="button" class="add-source-btn">
                                    <i class="fas fa-plus-circle"></i>
                                </button>
                                <button type="button" class="remove-source-btn">
                                    <i class="fas fa-minus-circle"></i>
                                </button>
                            </div>
                        `;
                        neglectedSourcesList.appendChild(initialSource);
                    }
                } else {
                    console.log('Keine gespeicherten Einstellungen gefunden.');
                }
            })
            .catch(error => {
                console.log('Fehler beim Laden der Einstellungen:', error);
            });
    }

    loadSettings();
});
