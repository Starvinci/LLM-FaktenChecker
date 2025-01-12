(() => {
    if (window.uniqueSelectionToolLoaded) {
        console.log('Content-Script wurde bereits geladen.');
        return;
    }
    window.uniqueSelectionToolLoaded = true;

    console.log('Content-Script geladen: JavaScript der Seite wird pausiert.');

    // Deaktivieren der Zeiger-Ereignisse
    document.body.style.pointerEvents = 'none';

    // Separater Style-Block für den benutzerdefinierten, größeren Cursor
    const cursorStyle = document.createElement('style');
    cursorStyle.id = 'unique-selection-tool-cursor-style';
    cursorStyle.type = 'text/css';
    cursorStyle.innerHTML = `
        html, body, * {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="16" y1="0" x2="16" y2="32" stroke="black" stroke-width="2"/><line x1="0" y1="16" x2="32" y2="16" stroke="black" stroke-width="2"/></svg>') 16 16, crosshair !important;
        }
    `;
    document.head.appendChild(cursorStyle);

    // Separater Style-Block für UI-Elemente
    const uiStyle = document.createElement('style');
    uiStyle.type = 'text/css';
    uiStyle.id = 'unique-selection-tool-ui-style'; // Für spätere Referenz
    uiStyle.innerHTML = `
        /* Stil für die rote Lupe */
        .magnifier {
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" stroke="red" stroke-width="2" fill="none"/><line x1="15" y1="15" x2="22" y2="22" stroke="red" stroke-width="2"/></svg>') no-repeat center center;
            background-size: contain;
            position: absolute;
            /* Die Animation wird dynamisch per JavaScript hinzugefügt */
        }
        .info-container {
            position: absolute;
            background: #fff;
            border: 1px solid #ccc;
            padding: 10px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-radius: 8px; /* Ecken abrunden */
        }
        .info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .left-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .dropdown-content {
            display: none;
            flex-direction: column;
            gap: 5px;
            margin-top: 5px;
        }
        .dropdown.active .dropdown-content {
            display: flex;
        }
        .dropdown button {
            padding: 5px 10px;
            cursor: pointer;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 4px;
            transition: background-color 0.3s;
            color: black; /* Button Texte in schwarz */
        }
        .dropdown button:hover {
            background-color: #ddd;
        }
        .dropdown button:active {
            background-color: #ccc;
        }
        .close-btn {
            cursor: pointer;
            background: none;
            border: none;
            font-size: 24px; /* Vergrößertes Kreuz */
            line-height: 1; /* Optimale Vertikale Ausrichtung */
            padding: 0;
            margin: 0;
            font-weight: bold; /* Optional: Fett für bessere Sichtbarkeit */
            color: black; /* Kreuz in schwarz */
        }
        /* Neue Styles für horizontale Anordnung der Buttons */
        .actions-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .status-label {
            font-weight: bold;
        }
        .actions-buttons {
            display: flex;
            gap: 10px;
        }
        .actions-buttons button {
            padding: 5px 10px;
            cursor: pointer;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 4px;
            transition: background-color 0.3s;
            color: black; /* Button Texte in schwarz */
        }
        .actions-buttons button:hover {
            background-color: #ddd;
        }
        .actions-buttons button:active {
            background-color: #ccc;
        }
        /* Styles für den angezeigten Inhalt */
        .content-display {
            margin-top: 10px;
            color: black; /* Erklärung in schwarz */
        }
        /* Styles für Links mit Abständen */
        .content-display a {
            display: block;
            margin-bottom: 5px;
            color: blue;
            text-decoration: underline;
        }
    `;
    document.head.appendChild(uiStyle);

    let startX, startY, selectionDiv;

    const mouseDownHandler = (e) => {
        console.log('Maus heruntergedrückt');

        document.body.style.userSelect = 'none';

        startX = e.pageX;
        startY = e.pageY;

        selectionDiv = document.createElement('div');
        selectionDiv.style.position = 'absolute';
        selectionDiv.style.border = '2px dashed gray';
        selectionDiv.style.background = 'rgba(128, 128, 128, 0.2)';
        selectionDiv.style.zIndex = '9999';
        selectionDiv.style.left = `${startX}px`;
        selectionDiv.style.top = `${startY}px`;
        selectionDiv.style.width = `0px`;
        selectionDiv.style.height = `0px`;
        document.body.appendChild(selectionDiv);
    };

    const mouseMoveHandler = (e) => {
        if (!selectionDiv) return;

        const currentX = e.pageX;
        const currentY = e.pageY;

        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        selectionDiv.style.left = `${Math.min(startX, currentX)}px`;
        selectionDiv.style.top = `${Math.min(startY, currentY)}px`;
        selectionDiv.style.width = `${width}px`;
        selectionDiv.style.height = `${height}px`;
    };

    const mouseUpHandler = () => {
        if (!selectionDiv) return;

        // Reset des Mauszeigers
        // Entfernen des Cursor-Style-Blocks
        document.body.style.userSelect = 'auto';
        if (cursorStyle.parentElement) {
            cursorStyle.parentElement.removeChild(cursorStyle);
        }

        // Aktivieren der Zeiger-Ereignisse wieder
        document.body.style.pointerEvents = 'auto';

        console.log('Maus losgelassen');

        // Neue rote Lupe hinzufügen
        const magnifier = document.createElement('div');
        magnifier.classList.add('magnifier');
        selectionDiv.appendChild(magnifier);

        const rect = selectionDiv.getBoundingClientRect();

        // Berechnung der Diagonalen des Rechtecks
        const diagonal = Math.sqrt(rect.width ** 2 + rect.height ** 2);
        // Anpassung der Größe der Lupe proportional zur Diagonale
        const magnifierSize = Math.min(48, diagonal / 10); // Beispiel: maximale Größe 48px, anpassbar
        magnifier.style.width = `${magnifierSize}px`;
        magnifier.style.height = `${magnifierSize}px`;

        // Dynamische Erstellung einer Kreuz-Animation basierend auf Rechteckgröße
        const animationName = `cross-animation-${Date.now()}`; // Eindeutiger Name
        const animationDuration = 4; // Dauer in Sekunden, anpassbar

        // Definiere das Kreuz-Muster
        const keyframes = `
            @keyframes ${animationName} {
                0% { top: 50%; left: 50%; transform: translate(-50%, -50%); }
                12.5% { top: 35%; left: 65%; transform: translate(-50%, -50%); }
                25% { top: 50%; left: 75%; transform: translate(-50%, -50%); }
                37.5% { top: 65%; left: 65%; transform: translate(-50%, -50%); }
                50% { top: 50%; left: 50%; transform: translate(-50%, -50%); }
                62.5% { top: 65%; left: 35%; transform: translate(-50%, -50%); }
                75% { top: 50%; left: 25%; transform: translate(-50%, -50%); }
                87.5% { top: 35%; left: 35%; transform: translate(-50%, -50%); }
                100% { top: 50%; left: 50%; transform: translate(-50%, -50%); }
            }
        `;

        // Hinzufügen der dynamischen Keyframes zum UI-Style
        const dynamicKeyframesStyle = document.createElement('style');
        dynamicKeyframesStyle.type = 'text/css';
        dynamicKeyframesStyle.innerHTML = keyframes;
        document.head.appendChild(dynamicKeyframesStyle);

        // Anwenden der Animation auf die Lupe
        magnifier.style.animation = `${animationName} ${animationDuration}s linear infinite`;

        // Extrahieren des Textes innerhalb des Rechtecks
        const elements = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        const texts = new Set();

        elements.forEach((el) => {
            const elRect = el.getBoundingClientRect();
            if (
                rect.left <= elRect.right &&
                rect.right >= elRect.left &&
                rect.top <= elRect.bottom &&
                rect.bottom >= elRect.top
            ) {
                const text = el.innerText || el.textContent;
                if (text.trim()) {
                    texts.add(text.trim());
                }
            }
        });

        const extractedText = Array.from(texts).join(' ');
        console.log('Extrahierter Text:', extractedText);

        const placeholderString = "Angela Merkel ist ein Mann";

        fetch('http://localhost:5003/api/bereich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: extractedText || placeholderString })
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log('Antwort vom Backend:', data);

                if (!data || !data.data || !data.data.Einschätzung) {
                    throw new Error("Ungültige Antwort vom Backend: 'Einschätzung' fehlt.");
                }

                if (selectionDiv.contains(magnifier)) {
                    selectionDiv.removeChild(magnifier);
                }

                // Entfernen der dynamischen Keyframes
                if (dynamicKeyframesStyle.parentElement) {
                    dynamicKeyframesStyle.parentElement.removeChild(dynamicKeyframesStyle);
                }

                let color;
                switch (data.data.Einschätzung.toLowerCase()) {
                    case 'belegbar':
                        color = 'green';
                        break;
                    case 'faktisch falsch':
                        color = 'red';
                        break;
                    case 'übertrieben':
                        color = 'orange';
                        break;
                    case 'unvollständig':
                        color = 'orange';
                        break;
                    default:
                        color = 'yellow';
                }
                selectionDiv.style.border = `2px solid ${color}`;
                if (color === 'green') {
                    selectionDiv.style.background = 'rgba(0, 128, 0, 0.2)';
                } else if (color === 'unvollständig' || color === 'übertrieben') {
                    selectionDiv.style.background = 'rgba(255, 85, 0, 0.2)';
                } else if (color === 'red') {
                    selectionDiv.style.background = 'rgba(255, 0, 0, 0.2)';
                } else {
                    selectionDiv.style.background = 'rgba(255, 255, 0, 0.2)';
                }

                // Erstellen und Befüllen des Info-Containers nach Erhalt der Serverantwort
                const infoContainer = document.createElement('div');
                infoContainer.classList.add('info-container');
                infoContainer.style.width = `${rect.width}px`; // Gleiche Breite wie das Auswahlrechteck
                infoContainer.style.left = `${rect.left + window.scrollX}px`;
                infoContainer.style.top = `${rect.bottom + window.scrollY + 5}px`; // Minimaler Abstand von 5px

                const infoHeader = document.createElement('div');
                infoHeader.classList.add('info-header');

                // Container für Statuslabel und Aktionen
                const leftContainer = document.createElement('div');
                leftContainer.classList.add('left-container');

                const statusLabel = document.createElement('span');
                statusLabel.textContent = data.data.Einschätzung;
                statusLabel.classList.add('status-label');
                //black
                statusLabel.style.color = "black"; 
                leftContainer.appendChild(statusLabel);
                const actionsButtons = document.createElement('div');
                actionsButtons.classList.add('actions-buttons');

                // Erklärung Button
                const explanationButton = document.createElement('button');
                explanationButton.textContent = 'Begründung';
                explanationButton.onclick = () => {
                    if (explanationContent.style.display === 'block') {
                        explanationContent.style.display = 'none';
                    } else {
                        explanationContent.style.display = 'block';
                        // Keine Änderung an linksContent
                    }
                };
                actionsButtons.appendChild(explanationButton);

                // Links Button
                const linksButton = document.createElement('button');
                linksButton.textContent = 'Quellen';
                linksButton.onclick = () => {
                    if (linksContent.style.display === 'block') {
                        linksContent.style.display = 'none';
                    } else {
                        linksContent.style.display = 'block';
                        // Keine Änderung an explanationContent
                    }
                };
                actionsButtons.appendChild(linksButton);

                leftContainer.appendChild(actionsButtons);
                infoHeader.appendChild(leftContainer);

                const closeBtn = document.createElement('button');
                closeBtn.classList.add('close-btn');
                closeBtn.innerHTML = '&times;';
                closeBtn.style.color = 'black';
                closeBtn.onclick = () => {
                    if (selectionDiv.parentElement) {
                        selectionDiv.parentElement.removeChild(selectionDiv);
                    }
                    if (infoContainer.parentElement) {
                        infoContainer.parentElement.removeChild(infoContainer);
                    }
                    if (uiStyle.parentElement) {
                        uiStyle.parentElement.removeChild(uiStyle);
                    }
                    document.removeEventListener('mousedown', mouseDownHandler);
                    document.removeEventListener('mousemove', mouseMoveHandler);
                    document.removeEventListener('mouseup', mouseUpHandler);
                    delete window.uniqueSelectionToolLoaded;
                    console.log('Auswahlmodus beendet.');
                };
                infoHeader.appendChild(closeBtn);
                infoContainer.appendChild(infoHeader);

                // Erklärung Inhalt
                const explanationContent = document.createElement('div');
                explanationContent.classList.add('content-display');
                explanationContent.style.display = 'none';
                explanationContent.textContent = data.data.Erklärung;
                infoContainer.appendChild(explanationContent);

                // Links Inhalt
                const linksContent = document.createElement('div');
                linksContent.classList.add('content-display');
                linksContent.style.display = 'none';
                if (Array.isArray(data.data.Links)) {
                    data.data.Links.forEach((link) => {
                        const a = document.createElement('a');
                        a.href = link;
                        a.textContent = link;
                        a.target = '_blank';
                        // Hinzufügen von Abständen zwischen den Links
                        a.style.marginBottom = '5px';
                        a.style.color = 'blue';
                        a.style.textDecoration = 'underline';
                        linksContent.appendChild(a);
                    });
                } else {
                    linksContent.textContent = 'Keine Links verfügbar.';
                }
                infoContainer.appendChild(linksContent);

                document.body.appendChild(infoContainer);

                // Entfernen der Flagge nach erfolgreichem Abschluss
                delete window.uniqueSelectionToolLoaded;
            })
            .catch((error) => {
                console.error('Fehler beim Senden an das Backend:', error);
                if (selectionDiv && selectionDiv.contains(magnifier)) {
                    selectionDiv.removeChild(magnifier);
                }

                // Entfernen der dynamischen Keyframes
                if (dynamicKeyframesStyle.parentElement) {
                    dynamicKeyframesStyle.parentElement.removeChild(dynamicKeyframesStyle);
                }

                const errorMsg = document.createElement('div');
                errorMsg.textContent = 'Fehler bei der Anfrage.';
                errorMsg.style.color = 'red';
                errorMsg.style.position = 'absolute';
                errorMsg.style.top = '100%';
                errorMsg.style.left = '0';
                selectionDiv.appendChild(errorMsg);

                // Entfernen des Cursor-Style-Blocks bei Fehler
                if (cursorStyle.parentElement) {
                    cursorStyle.parentElement.removeChild(cursorStyle);
                }

                // Aktivieren der Zeiger-Ereignisse wieder
                document.body.style.pointerEvents = 'auto';

                // Entferne die Lupe und setze `user-select` zurück
                document.body.style.userSelect = 'auto';

                // Entfernen der Flagge im Fehlerfall
                delete window.uniqueSelectionToolLoaded;
            });

        // Entfernen der Event-Listener nach dem Maus loslassen
        document.removeEventListener('mousedown', mouseDownHandler);
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);

        console.log('Auswahlmodus aktiv. Ziehen Sie ein Rechteck.');
    };

    // Füge Event-Listener hinzu, um den Auswahlmodus zu starten
    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
})();
