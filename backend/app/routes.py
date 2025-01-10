# routes.py
from flask import Blueprint, jsonify

api = Blueprint('api', __name__)

@api.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Hello from the LLM-FaktenChecker Backend!"})
