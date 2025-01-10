# utils.py
import requests

def fetch_data_from_api(url):
    """
    Ein einfaches Beispiel zum Abfragen externer APIs.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Fehler beim Abrufen der Daten von {url}: {e}")
        return None
