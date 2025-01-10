# __init__.py
from flask import Flask
from .routes import api

def create_app():
    app = Flask(__name__)

    # Beispiel-Konfiguration
    app.config['SECRET_KEY'] = 'dein-secret-key'
    app.config['JSON_AS_ASCII'] = False

    # Routen registrieren
    app.register_blueprint(api, url_prefix='/api')

    return app
