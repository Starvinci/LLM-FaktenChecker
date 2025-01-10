# Verwende ein offizielles Python-Image als Basis
FROM python:3.9-slim

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die Anforderungen und installiere sie
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere den Rest des Anwendungscodes
COPY . .

# Setze die Umgebungsvariablen für Flask
ENV FLASK_APP=app
ENV FLASK_RUN_HOST=0.0.0.0

# Exponiere den Port, auf dem die Flask-App läuft
EXPOSE 5000

# Definiere den Befehl zum Starten der Flask-App
CMD ["flask", "run"]
