from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    plan = db.Column(db.String(50), nullable=False)
    subscription_id = db.Column(db.String(120), unique=True, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='active')
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<User {self.email}>'

class Settings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    search_worldwide = db.Column(db.Boolean, default=False)
    countries = db.Column(db.Text, nullable=True)
    prioritized_sources = db.Column(db.Text, nullable=True)
    neglected_sources = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'searchWorldwide': self.search_worldwide,
            'countries': json.loads(self.countries) if self.countries else [],
            'prioritizedSources': json.loads(self.prioritized_sources) if self.prioritized_sources else [],
            'neglectedSources': json.loads(self.neglected_sources) if self.neglected_sources else []
        }
