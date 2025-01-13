// subscription.js

document.querySelectorAll('.subscription-card').forEach(card => {
    card.addEventListener('click', () => {
        // Entferne die 'selected' Klasse von allen Karten
        document.querySelectorAll('.subscription-card').forEach(c => c.classList.remove('selected'));
        // Füge die 'selected' Klasse zur geklickten Karte hinzu
        card.classList.add('selected');

        // Deaktivieren aller anderen Klicks während der Animation
        document.querySelectorAll('.subscription-card').forEach(c => c.style.pointerEvents = 'none');

        // Optional: Fügen Sie eine kurze Animation hinzu
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 200);

        // Sammeln der Benutzer-E-Mail-Adresse
        const email = prompt("Bitte geben Sie Ihre E-Mail-Adresse ein:");
        if (!email) {
            alert("E-Mail ist erforderlich.");
            document.querySelectorAll('.subscription-card').forEach(c => c.style.pointerEvents = 'auto');
            return;
        }

        const selectedPlan = card.getAttribute('data-plan');

        // Weiterleitung zum Kaufprozess
        fetch('http://localhost:5003/api/subscribe', {  // Passen Sie die URL entsprechend an
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                plan: selectedPlan,
                email: email 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.redirect_url) {
                    // Weiterleitung zur Stripe Checkout-Seite
                    window.location.href = data.redirect_url;
                } else {
                    // Für den Trial-Plan oder andere plattformbasierte Pläne
                    alert(data.message);
                    // Reaktivieren der Klicks
                    document.querySelectorAll('.subscription-card').forEach(c => c.style.pointerEvents = 'auto');
                }
            } else {
                alert('Fehler: ' + data.message);
                // Reaktivieren der Klicks
                document.querySelectorAll('.subscription-card').forEach(c => c.style.pointerEvents = 'auto');
            }
        })
        .catch(error => {
            alert('Ein Fehler ist aufgetreten: ' + error.message);
            // Reaktivieren der Klicks
            document.querySelectorAll('.subscription-card').forEach(c => c.style.pointerEvents = 'auto');
        });
    });
});
