// src/videoMonitor.js

(function() {
    console.log('videoMonitor.js wurde geladen'); // Debugging-Log

    let isMonitoring = false;

    // Funktion zum Handhaben des Video-Play-Events
    const handleVideoPlay = function() {
        if (isMonitoring) return;
        isMonitoring = true;

        // Versuchen, den Titel des Videos zu erfassen
        let videoTitle = '';

        // Wenn das Videoelement einen Titel hat
        if (this.title) {
            videoTitle = this.title;
        } else {
            // Fallback: Titel der Seite verwenden
            videoTitle = document.title;
        }

        console.log(`Video wird abgespielt: ${videoTitle}`);

        // Nachricht an das Backend senden (direkt aus dem Content Script)
        // Annahme: Der Backend-Endpunkt ist bekannt und erreichbar
        fetch('http://localhost:5003/api/videoCheck', { // Passen Sie die URL entsprechend an
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: videoTitle })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Antwort vom Server:', data);
            showBadge(data);
        })
        .catch(error => {
            console.error('Fehler bei der Kommunikation mit dem Server:', error);
        });

        // Listener für Pause oder Ende des Videos, um das Monitoring zurückzusetzen
        const handleVideoPause = () => {
            isMonitoring = false;
            this.removeEventListener('pause', handleVideoPause);
            this.removeEventListener('ended', handleVideoPause);
        };

        this.addEventListener('pause', handleVideoPause);
        this.addEventListener('ended', handleVideoPause);
    };

    // Funktion zum Traversieren des Shadow DOMs und Finden aller Videoelemente
    const traverseShadowDOM = (node, callback) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.tagName === 'VIDEO') {
            callback(node);
        }

        // Traversiere Shadow DOM, falls vorhanden
        if (node.shadowRoot) {
            traverseShadowDOM(node.shadowRoot, callback);
        }

        // Traversiere alle Kindknoten
        node.childNodes.forEach(child => {
            traverseShadowDOM(child, callback);
        });
    };

    // Funktion zum Überwachen aller Videoelemente auf der Seite, einschließlich in Shadow DOMs
    const observeVideos = () => {
        traverseShadowDOM(document.body, (video) => {
            if (!video.dataset.videoMonitorAttached) {
                video.addEventListener('play', handleVideoPlay);
                video.dataset.videoMonitorAttached = 'true';
                console.log('Play-Event-Listener hinzugefügt');
            }
        });
    };

    // Initiale Überwachung starten
    observeVideos();

    // MutationObserver zum Überwachen von DOM-Änderungen (neue Videoelemente)
    const observer = new MutationObserver(() => {
        observeVideos();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Funktion zum Anzeigen des Schildes
    const showBadge = (data) => {
        console.log(`Badge anzeigen: ${data.result}`);
        // Alle Videoelemente finden, einschließlich in Shadow DOMs
        const videos = [];
        traverseShadowDOM(document.body, (video) => {
            videos.push(video);
        });

        videos.forEach(video => {
            // Überprüfen, ob bereits ein Schild vorhanden ist
            if (video.querySelector('.fact-check-badge')) return;

            const badge = document.createElement('div');
            badge.classList.add('fact-check-badge');
            badge.style.position = 'absolute';
            badge.style.top = '10px';
            badge.style.left = '10px';
            badge.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            badge.style.padding = '5px';
            badge.style.borderRadius = '4px';
            badge.style.zIndex = '9999';
            badge.style.pointerEvents = 'none';
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '5px';

            // Schild-SVG-Icon erstellen
            const shieldIcon = document.createElement('svg');
            shieldIcon.setAttribute('width', '20');
            shieldIcon.setAttribute('height', '20');
            shieldIcon.setAttribute('viewBox', '0 0 64 64');
            shieldIcon.setAttribute('fill', 'currentColor');
            shieldIcon.innerHTML = `
                <path d="M32 0L0 16v16c0 21.545 13.333 40.471 32 48 18.667-7.529 32-26.455 32-48V16L32 0z"/>
            `;

            // Text oder Ergebnis anzeigen
            const resultText = document.createElement('span');
            resultText.textContent = `Faktencheck: ${data.result}`;
            resultText.style.color = 'black';
            resultText.style.fontSize = '12px';
            resultText.style.fontWeight = 'bold';

            // Hintergrundfarbe basierend auf dem Fakt-Check-Ergebnis anpassen
            switch (data.result.toLowerCase()) {
                case 'wahr':
                    badge.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
                    resultText.textContent = 'Faktencheck: Wahr';
                    break;
                case 'falsch':
                    badge.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                    resultText.textContent = 'Faktencheck: Falsch';
                    break;
                case 'übertrieben':
                case 'unvollständig':
                    badge.style.backgroundColor = 'rgba(255, 165, 0, 0.7)';
                    resultText.textContent = `Faktencheck: ${data.result}`;
                    break;
                default:
                    badge.style.backgroundColor = 'rgba(255, 255, 0, 0.7)';
                    resultText.textContent = `Faktencheck: ${data.result}`;
            }

            badge.appendChild(shieldIcon);
            badge.appendChild(resultText);

            // Sicherstellen, dass das übergeordnete Element positioniert ist
            const videoContainer = video.parentElement;
            if (getComputedStyle(videoContainer).position === 'static') {
                videoContainer.style.position = 'relative';
            }

            videoContainer.appendChild(badge);
        });
    };

    // Listener für Nachrichten vom Popup, um die Überwachung zu stoppen
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'disableVideoCheck') {
            console.log('Video Monitoring deaktiviert');

            // Entfernen aller Event-Listener von Videoelementen
            traverseShadowDOM(document.body, (video) => {
                if (video.dataset.videoMonitorAttached) {
                    video.removeEventListener('play', handleVideoPlay);
                    delete video.dataset.videoMonitorAttached;
                }
            });

            // MutationObserver stoppen
            observer.disconnect();

            // Alle vorhandenen Schilder entfernen
            const badges = document.querySelectorAll('.fact-check-badge');
            badges.forEach(badge => badge.remove());
        }
    });
})();
