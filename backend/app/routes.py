# backend/app/routes.py

from flask import Blueprint, request, jsonify
from .faktencheck import Faktencheck
import json

api = Blueprint('api', __name__)
faktencheck = Faktencheck()

@api.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Hello from the LLM-FaktenChecker Backend!"})

@api.route('/bereich', methods=['POST'])
def bereich():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Invalid input, 'message' key is required"}), 400

    statement = data['message']
    print(f"Received statement for check: {statement}")
    # Faktencheck durchführen
    result = faktencheck.check(statement)

    # Überprüfen, ob das Ergebnis bereits ein Dictionary ist
    if isinstance(result, str):
        # Falls die check-Methode eine JSON-Zeichenkette zurückgibt
        try:
            result = json.loads(result)
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Ungültiges JSON-Format in der Antwort."}), 500

    return jsonify(result)
@api.route('/videoCheck', methods=['POST'])
def checkTitel():
    return jsonify({"message": "Hello from the LLM-FaktenChecker Backend!"})
    