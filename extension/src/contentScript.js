(() => {
    if (window.uniqueSelectionToolLoaded) {
        console.log('Content-Script wurde bereits geladen.');
        return;
    }
    window.uniqueSelectionToolLoaded = true;

    console.log('Content-Script geladen: JavaScript der Seite wird pausiert.');

    document.body.style.pointerEvents = 'none';

    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        html, body, * {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 24 24"><circle cx="9" cy="9" r="8" stroke="black" stroke-width="2" fill="none"/><line x1="14" y1="14" x2="22" y2="22" stroke="black" stroke-width="2"/></svg>'), auto !important;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-left-color: #000;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .info-container {
            position: absolute;
            top: calc(100% + 10px);
            left: 0;
            background: #fff;
            border: 1px solid #ccc;
            padding: 10px;
            z-index: 10000;
            width: 100%; /* Breite anpassen */
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
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
        }
        .close-btn {
            cursor: pointer;
            background: none;
            border: none;
            font-size: 16px;
        }
    `;
    document.head.appendChild(style);

    let startX, startY, selectionDiv;

    const mouseDownHandler = (e) => {
        console.log('Maus heruntergedrückt');
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

        // Change the mouse icon back to default
        document.body.style.cursor = 'default';
        console.log('Maus losgelassen');

        const spinner = document.createElement('div');
        spinner.classList.add('spinner');
        selectionDiv.appendChild(spinner);

        const rect = selectionDiv.getBoundingClientRect();
        const elements = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        const texts = new Set();

        elements.forEach((el) => {
            if (rect.left <= el.getBoundingClientRect().right &&
                rect.right >= el.getBoundingClientRect().left &&
                rect.top <= el.getBoundingClientRect().bottom &&
                rect.bottom >= el.getBoundingClientRect().top) {
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

                if (selectionDiv.contains(spinner)) {
                    selectionDiv.removeChild(spinner);
                }

                let color;
                switch (data.data.Einschätzung.toLowerCase()) {
                    case 'wahr':
                        color = 'green';
                        break;
                    case 'falsch':
                        color = 'red';
                        break;
                    default:
                        color = 'yellow';
                }
                selectionDiv.style.border = `2px solid ${color}`;
                if (color === 'green') {
                    selectionDiv.style.background = 'rgba(0, 128, 0, 0.2)';
                } else if (color === 'red') {
                    selectionDiv.style.background = 'rgba(255, 0, 0, 0.2)';
                } else {
                    selectionDiv.style.background = 'rgba(255, 255, 0, 0.2)';
                }
                const infoContainer = document.createElement('div');
                infoContainer.classList.add('info-container');
                infoContainer.style.width = `${selectionDiv.offsetWidth}px`;

                const infoHeader = document.createElement('div');
                infoHeader.classList.add('info-header');

                const statusLabel = document.createElement('span');
                statusLabel.textContent = data.data.Einschätzung;
                statusLabel.style.fontWeight = 'bold';
                statusLabel.style.color = color;
                infoHeader.appendChild(statusLabel);

                const closeBtn = document.createElement('button');
                closeBtn.classList.add('close-btn');
                closeBtn.innerHTML = '&times;';
                closeBtn.onclick = () => {
                    if (selectionDiv.parentElement) {
                        selectionDiv.parentElement.removeChild(selectionDiv);
                    }
                    document.body.style.pointerEvents = 'auto';
                    if (style.parentElement) {
                        style.parentElement.removeChild(style);
                    }
                    document.removeEventListener('mousedown', mouseDownHandler);
                    document.removeEventListener('mousemove', mouseMoveHandler);
                    document.removeEventListener('mouseup', mouseUpHandler);
                    delete window.uniqueSelectionToolLoaded;
                    console.log('Auswahlmodus beendet.');
                };
                infoHeader.appendChild(closeBtn);
                infoContainer.appendChild(infoHeader);

                const explanationDropdown = document.createElement('div');
                explanationDropdown.classList.add('dropdown');

                const explanationButton = document.createElement('button');
                explanationButton.textContent = 'Erklärung';
                explanationButton.onclick = () => {
                    explanationDropdown.classList.toggle('active');
                };
                explanationDropdown.appendChild(explanationButton);

                const explanationContent = document.createElement('div');
                explanationContent.classList.add('dropdown-content');
                explanationContent.textContent = data.data.Erklärung;
                explanationDropdown.appendChild(explanationContent);

                infoContainer.appendChild(explanationDropdown);

                const linksDropdown = document.createElement('div');
                linksDropdown.classList.add('dropdown');

                const linksButton = document.createElement('button');
                linksButton.textContent = 'Links';
                linksButton.onclick = () => {
                    linksDropdown.classList.toggle('active');
                };
                linksDropdown.appendChild(linksButton);

                const linksContent = document.createElement('div');
                linksContent.classList.add('dropdown-content');
                if (Array.isArray(data.data.Links)) {
                    data.data.Links.forEach((link) => {
                        const a = document.createElement('a');
                        a.href = link;
                        a.textContent = link;
                        a.target = '_blank';
                        a.style.wordBreak = 'break-all';
                        linksContent.appendChild(a);
                    });
                } else {
                    linksContent.textContent = 'Keine Links verfügbar.';
                }
                linksDropdown.appendChild(linksContent);

                infoContainer.appendChild(linksDropdown);

                selectionDiv.appendChild(infoContainer);

                document.body.style.pointerEvents = 'auto';
            })
            .catch((error) => {
                console.error('Fehler beim Senden an das Backend:', error);
                if (selectionDiv && selectionDiv.contains(spinner)) {
                    selectionDiv.removeChild(spinner);
                }

                const errorMsg = document.createElement('div');
                errorMsg.textContent = 'Fehler bei der Anfrage.';
                errorMsg.style.color = 'red';
                errorMsg.style.position = 'absolute';
                errorMsg.style.top = '100%';
                errorMsg.style.left = '0';
                selectionDiv.appendChild(errorMsg);

                document.body.style.pointerEvents = 'auto';
            });

        document.removeEventListener('mousedown', mouseDownHandler);
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);

        console.log('Auswahlmodus aktiv. Ziehen Sie ein Rechteck.');
    };

    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
})();
