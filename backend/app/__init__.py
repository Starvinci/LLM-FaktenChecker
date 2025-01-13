from flask import Flask
from .models import db, User, Settings
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from .routes import api
from .models import db
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

def create_app():
    app = Flask(__name__)

    # Konfiguration
    app.config['SECRET_KEY'] = 'dein-secret-key'  # Laden Sie dies aus der .env-Datei für mehr Sicherheit
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'  # Nutzen Sie eine Umgebungsvariable für die Produktion
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_AS_ASCII'] = False
    

    # Erweiterungen
    db.init_app(app)
    CORS(app)  # Aktiviert CORS für alle Routen
    migrate = Migrate(app, db)  # Flask-Migrate konfigurieren

    # Routen registrieren
    app.register_blueprint(api, url_prefix='/api')

    # Globale Fehlerbehandlung
    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Route not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {"error": "Internal server error"}, 500
    
        # Flask-Admin Initialisierung
    admin = Admin(app, name='Admin Board', template_mode='bootstrap4')

    # Hinzufügen Ihrer Modelle zum Admin-Dashboard
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Settings, db.session))

    return app
