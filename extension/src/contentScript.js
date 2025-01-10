let startX, startY, selectionDiv;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startSelection') {
        document.body.style.cursor = 'crosshair';

        const mouseDownHandler = (e) => {
            startX = e.pageX;
            startY = e.pageY;
            selectionDiv = document.createElement('div');
            selectionDiv.style.position = 'absolute';
            selectionDiv.style.border = '2px dashed #d94e4e';
            selectionDiv.style.background = 'rgba(217, 78, 78, 0.2)';
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

        const mouseUpHandler = async () => {
            if (selectionDiv) {
                const rect = selectionDiv.getBoundingClientRect();
                document.body.removeChild(selectionDiv);
                selectionDiv = null;

                // Simulate screenshot
                console.log('Screenshot aufgenommen:', rect);

                chrome.runtime.sendMessage({ action: 'showLoading' });

                setTimeout(() => {
                    chrome.runtime.sendMessage({ action: 'hideLoading' });
                }, 3000);
            }

            document.removeEventListener('mousedown', mouseDownHandler);
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousedown', mouseDownHandler);
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }
});
