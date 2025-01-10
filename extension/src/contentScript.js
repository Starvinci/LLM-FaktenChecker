(() => {
    if (window.uniqueSelectionToolLoaded) {
        console.log('Content-Script wurde bereits geladen.');
        return;
    }
    window.uniqueSelectionToolLoaded = true;

    console.log('Content-Script geladen: JavaScript der Seite wird pausiert.');

    // Blockiere die Seite für Interaktionen
    document.body.style.pointerEvents = 'none';

    // Cursor-Stil sofort anwenden
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        html, body, * {
            cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 24 24"><circle cx="9" cy="9" r="8" stroke="black" stroke-width="2" fill="none"/><line x1="14" y1="14" x2="22" y2="22" stroke="black" stroke-width="2"/></svg>'), auto !important;
        }
    `;
    document.head.appendChild(style);

    let startX, startY, selectionDiv;

    const mouseDownHandler = (e) => {
        startX = e.pageX;
        startY = e.pageY;

        selectionDiv = document.createElement('div');
        selectionDiv.style.position = 'absolute';
        selectionDiv.style.border = '2px dashed #d94e4e';
        selectionDiv.style.background = 'rgba(217, 78, 78, 0.2)';
        selectionDiv.style.zIndex = '9999';
        document.body.appendChild(selectionDiv);
    };

    const mouseMoveHandler = (e) => {
        if (!selectionDiv) return;

        const width = Math.abs(e.pageX - startX);
        const height = Math.abs(e.pageY - startY);
        selectionDiv.style.left = `${Math.min(startX, e.pageX)}px`;
        selectionDiv.style.top = `${Math.min(startY, e.pageY)}px`;
        selectionDiv.style.width = `${width}px`;
        selectionDiv.style.height = `${height}px`;
    };

    const mouseUpHandler = () => {
        if (selectionDiv) {
            document.body.removeChild(selectionDiv);
            selectionDiv = null;
        }

        const placeholderString = "Angela Merkel ist ein Mann";

        fetch('http://localhost:5003/bereich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: placeholderString }),
        })
            .then((response) => response.json())
            .then((data) => console.log('Antwort vom Backend:', data))
            .catch((error) => console.error('Fehler beim Senden an das Backend:', error));

        document.body.style.pointerEvents = 'auto';
        style.remove();

        document.removeEventListener('mousedown', mouseDownHandler);
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);

        delete window.uniqueSelectionToolLoaded;

        console.log('Auswahlmodus beendet.');
    };

    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
})();
