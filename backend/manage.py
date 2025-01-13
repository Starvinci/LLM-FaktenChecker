from flask.cli import FlaskGroup
from app import create_app, db

# Erstellen der Flask-App
app = create_app()

# Flask CLI-Gruppe
cli = FlaskGroup(app)

if __name__ == "__main__":
    cli()
