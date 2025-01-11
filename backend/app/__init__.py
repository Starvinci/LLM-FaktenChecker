from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from .routes import api
from .models import db

def create_app():
    app = Flask(__name__)

    # Konfiguration
    app.config['SECRET_KEY'] = 'dein-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'  # Datenbank
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_AS_ASCII'] = False

    # Erweiterungen
    db.init_app(app)
    CORS(app)  # Aktiviert CORS für alle Routen

    # Routen registrieren
    app.register_blueprint(api, url_prefix='/api')

    # Globale Fehlerbehandlung
    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Route not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {"error": "Internal server error"}, 500

    return app