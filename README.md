# LLM-FaktenChecker

### Übersicht
Der **LLM-FaktenChecker** ist ein Werkzeug, das Nutzern hilft, Informationen im Internet auf ihre Richtigkeit zu überprüfen. Die Anwendung kombiniert Ergebnisse aus verschiedenen Large Language Model (LLMs) Anfragen mit Echtzeitsuchen, um validierte Antworten hinsichtlich bereits im Internet veröffentlichter Referenzen bereitzustellen. Ziel ist es, die Herkunft und Zuverlässigkeit von Informationen klar darzustellen und eine Grundlage zur Abschätzung von Wahrheit und Falschinformation im Internet zu bieten.

### Demo
Derzeit ist noch kein Demo-Video verfügbar. Sobald ein Video vorliegt, wird es hier verlinkt.

### Tech-Stack
- **Backend**: Flask 
- **Frontend**: React  
- **LLM-Dienste**: OpenAI, Google, Microsoft
- **Containerisierung**: Docker, Docker Compose  
- **Testing**: Pytest (Backend), Jest (Frontend)

# Installation
### Voraussetzungen
- **Git**
- **Python**: Version 3.8 oder höher 
- **Node.js** und **npm**
- **Docker** und **Docker Compose**: Für Containerisierung und Deployment (Optional) 
- Ein unterstützter Browser (Chrome oder Firefox) für die Extension  
### Schritte
1. **Repository klonen**  
   ```bash
   git clone https://github.com/Starvinci/LLM-FaktenChecker.git
   cd LLM-FaktenChecker
   ```
2. **Backend einrichten**  
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Frontend einrichten**  
   ```bash
   cd ../frontend
   npm install
   ```

   2-3 **Optional: Mit Docker starten**  
   Wenn Docker installiert ist, kann die gesamte Anwendung alternativ mit diesem Befehl gestartet werden:  
   ```bash
   docker-compose up --build
   ```

4. **Extension Laden**  
   Stelle sicher, dass der Ordner `extension/` alle erforderlichen Dateien enthält. Zum Laden der Extension siehe Abschnitt Verwendung.

   
# Verwendung

# Verzeichnisstruktur
```
LLM-FaktenChecker/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── models.py
│   │   └── utils.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── Dockerfile
│
├── extension/
│   ├── src/
│   │   ├── background.js
│   │   ├── contentScript.js
│   │   └── popup/
│   │       ├── popup.html
│   │       ├── popup.js
│   │       └── popup.css
│   ├── icons/
│   ├── manifest.json
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── api_documentation.md
│   └── user_guide.md
│
├── scripts/
│   ├── setup.sh
│   └── deploy.sh
│
├── tests/
│   └── integration/
│       └── test_end_to_end.py
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── cd.yml
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── docker-compose.yml
└── README.md
```
# LLM-FaktenChecker
