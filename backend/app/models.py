# models.py
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Model(db.Model):
    #platzhalter
    __tablename__ = 'NOCH LEER'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    def __init__(self, name):
        self.name = name
