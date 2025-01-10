document.addEventListener('DOMContentLoaded', () => {
    const checkButton = document.getElementById('checkButton1');
    const videoToggle = document.getElementById('videoToggle');

    // Laden des Slider-Zustands
    const savedToggleState = localStorage.getItem('videoToggle');
    if (savedToggleState === 'true') {
        videoToggle.checked = true;
    }

    // Speichern des Slider-Zustands
    videoToggle.addEventListener('change', () => {
        localStorage.setItem('videoToggle', videoToggle.checked);
    });

    // Bereichsprüfung starten
    checkButton.addEventListener('click', () => {
        console.log('Button geklickt! Versuche Rechteckmarkierung zu starten...');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabs[0].id },
                        func: startSelection, // Funktion, die auf der Seite ausgeführt wird
                    },
                    () => {
                        console.log('Rechteckmarkierung gestartet!');
                    }
                );
            } else {
                console.error('Keine aktive Tab-ID gefunden!');
            }
        });
    });
});

// Rechteckmarkierungsfunktion
function startSelection() {
    console.log('Rechteckmarkierung auf der Seite gestartet!');
    document.body.style.cursor = 'crosshair';

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
            console.log('Rechteck wurde markiert!');
            document.body.removeChild(selectionDiv);
            selectionDiv = null;
        }
        document.body.style.cursor = 'default';

        document.removeEventListener('mousedown', mouseDownHandler);
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
}
