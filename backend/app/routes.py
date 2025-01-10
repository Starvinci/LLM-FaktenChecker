from flask import Blueprint, request, jsonify
from flask_cors import CORS

api = Blueprint('api', __name__)
CORS(api)  # Aktiviert CORS nur für diesen Blueprint

@api.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Hello from the LLM-FaktenChecker Backend!"})

#geht noch nicht
@api.route('/bereich', methods=['POST'])
def bereich():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Invalid input, 'message' key is required"}), 400

    received_message = data['message']
    print(f"Received message: {received_message}")

    return jsonify({"status": "success", "received_message": received_message})
