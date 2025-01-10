import requests

def fetch_data_from_api(url, params=None):
    """
    Abrufen externer APIs mit Fehlerbehandlung.
    """
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Fehler beim Abrufen der Daten von {url}: {e}")
        return None
