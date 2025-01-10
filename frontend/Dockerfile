# Verwende ein offizielles Node.js-Image als Basis
FROM node:18-alpine

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die package.json und package-lock.json
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Anwendungscodes
COPY . .

# Baue die React-App für die Produktion
RUN npm run build

# Installiere ein leichtes Webserver-Image für die Bereitstellung
FROM nginx:alpine

# Kopiere die gebaute React-App in das Nginx-Verzeichnis
COPY --from=0 /app/build /usr/share/nginx/html

# Exponiere den Port, auf dem Nginx läuft
EXPOSE 80

# Starte Nginx im Vordergrund
CMD ["nginx", "-g", "daemon off;"]
