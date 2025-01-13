# backend/app/routes.py

from flask import Blueprint, request, jsonify
from .faktencheck import Faktencheck
from .models import db, User, Settings
import json
import os
from dotenv import load_dotenv, set_key
from flask_cors import CORS
import stripe
from datetime import datetime, timedelta


api = Blueprint('api', __name__)
faktencheck = Faktencheck()

# CORS konfigurieren
CORS(api)

# Pfad zur .env-Datei bestimmen
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '..', '.env')

# Umgebungsvariablen laden
load_dotenv(dotenv_path=ENV_PATH)

# Stripe konfigurieren
STRIPE_API_KEY = os.getenv('STRIPE_API_KEY')
stripe.api_key = STRIPE_API_KEY

# Webhook Secret laden
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

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
        try:
            result = json.loads(result)
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Ungültiges JSON-Format in der Antwort."}), 500

    return jsonify(result)

@api.route('/videoCheck', methods=['POST'])
def checkTitel():
    return jsonify({"message": "Hello from the LLM-FaktenChecker Backend!"})

@api.route('/save-settings', methods=['POST']) 
def saveSettings():
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "message": "Keine Daten erhalten."}), 400
    
    search_worldwide = data.get('searchWorldwide', False)
    countries = data.get('countries', [])
    prioritized_sources = data.get('prioritizedSources', [])
    neglected_sources = data.get('neglectedSources', [])

    # Validierung der Eingabedaten (optional, aber empfohlen)
    if not isinstance(search_worldwide, bool):
        return jsonify({"success": False, "message": "'searchWorldwide' muss ein Boolescher Wert sein."}), 400
    if not isinstance(countries, list):
        return jsonify({"success": False, "message": "'countries' muss eine Liste sein."}), 400
    if not isinstance(prioritized_sources, list) or not all(isinstance(url, str) for url in prioritized_sources):
        return jsonify({"success": False, "message": "'prioritizedSources' muss eine Liste von Strings sein."}), 400
    if not isinstance(neglected_sources, list) or not all(isinstance(url, str) for url in neglected_sources):
        return jsonify({"success": False, "message": "'neglectedSources' muss eine Liste von Strings sein."}), 400
    
    try:
        # Konvertieren der Listen zu JSON-Strings
        countries_json = json.dumps(countries)
        prioritized_sources_json = json.dumps(prioritized_sources)
        neglected_sources_json = json.dumps(neglected_sources)

        # Überprüfen, ob bereits Einstellungen existieren
        settings = Settings.query.first()
        if settings:
            settings.search_worldwide = search_worldwide
            settings.countries = countries_json
            settings.prioritized_sources = prioritized_sources_json
            settings.neglected_sources = neglected_sources_json
        else:
            settings = Settings(
                search_worldwide=search_worldwide,
                countries=countries_json,
                prioritized_sources=prioritized_sources_json,
                neglected_sources=neglected_sources_json
            )
            db.session.add(settings)

        db.session.commit()

        # Optional: Benachrichtigung an bekannte Anfrage senden (Implementieren Sie nach Bedarf)

        return jsonify({"success": True, "message": "Einstellungen wurden erfolgreich gespeichert."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Fehler beim Speichern: {str(e)}"}), 500

@api.route('/api/get-settings', methods=['GET'])
def get_settings():
    settings = Settings.query.first()
    if not settings:
        return jsonify({"success": False, "message": "Keine gespeicherten Einstellungen gefunden."}), 404

    settings_data = settings.to_dict()

    return jsonify({"success": True, "settings": settings_data}), 200

# Neue Route für Abonnement
@api.route('/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json()
    
    if not data or 'plan' not in data:
        return jsonify({"success": False, "message": "Ungültige Anfrage, 'plan' ist erforderlich."}), 400
    
    plan = data['plan']
    email = data.get('email')  # Benutzer-E-Mail muss vom Frontend bereitgestellt werden
    
    if not email:
        return jsonify({"success": False, "message": "E-Mail ist erforderlich."}), 400
    
    # Ersetzen Sie diese Preis-IDs durch die tatsächlichen Preis-IDs aus Ihrem Stripe-Dashboard
    plan_mapping = {
        'trial': 'price_1QgZrG0554h8teFSbgRTsZPK',  # Kostenloses Trial
        'basic': 'price_1QgZt70554h8teFSYqMTZP71',  # Tatsächliche Preis-ID für Basic
        'pro': 'price_1QgZsP0554h8teFSrz52fQFh'     # Tatsächliche Preis-ID für Pro
    }
    
    if plan not in plan_mapping:
        return jsonify({"success": False, "message": "Unbekannter Abonnementplan."}), 400
    
    try:
        if plan == 'trial':
            # Kostenloses Trial: Benutzer in der Datenbank mit 'trial' Status speichern
            user = User.query.filter_by(email=email).first()
            if user:
                return jsonify({"success": False, "message": "Benutzer existiert bereits."}), 400
            
            new_user = User(
                email=email,
                plan='trial',
                start_date=datetime.utcnow(),
                end_date=(datetime.utcnow() + timedelta(days=14)),  # 14 Tage Trial
                status='active'
            )
            db.session.add(new_user)
            db.session.commit()
            
            return jsonify({"success": True, "message": "Trial aktiviert."}), 200
        else:
            # Erstellen einer Stripe Checkout Session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],  # Nur 'card' angeben
                line_items=[{
                    'price': plan_mapping[plan],
                    'quantity': 1,
                }],
                mode='subscription',
                customer_email=email,  # Automatische Erstellung eines Stripe-Kunden
                success_url='https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}',  # Ersetzen Sie dies mit Ihrer tatsächlichen URL
                cancel_url='https://your-domain.com/cancel',  # Ersetzen Sie dies mit Ihrer tatsächlichen URL
            )
            
            return jsonify({"success": True, "redirect_url": session.url}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Fehler beim Erstellen der Checkout-Session: {str(e)}"}), 500

# Webhook-Route zur Verarbeitung von Stripe-Events
@api.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        return jsonify({"message": "Invalid signature"}), 400
    except Exception as e:
        return jsonify({"message": f"Webhook Error: {str(e)}"}), 400

    # Handle different event types
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_session(session)
    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_payment_succeeded(invoice)
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_deleted(subscription)
    # Fügen Sie hier weitere Event-Typen hinzu, die Sie behandeln möchten

    return jsonify({"status": "success"}), 200

def handle_checkout_session(session):
    email = session.get('customer_email')
    subscription_id = session.get('subscription')
    
    # Um die Preis-ID zu erhalten, müssen wir die Line Items abrufen
    line_items = stripe.checkout.Session.list_line_items(session.id)
    if line_items and line_items.data:
        price_id = line_items.data[0].price.id
    else:
        price_id = None
    
    if email and subscription_id and price_id:
        # Benutzer in der Datenbank finden oder erstellen
        user = User.query.filter_by(email=email).first()
        if not user:
            # Erstellen eines neuen Benutzers
            if price_id == 'price_1QgZt70554h8teFSYqMTZP71':
                plan = 'basic'
            elif price_id == 'price_1QgZsP0554h8teFSrz52fQFh':
                plan = 'pro'
            else:
                plan = 'unknown'
            
            user = User(
                email=email,
                plan=plan,
                subscription_id=subscription_id,
                status='active',
                start_date=datetime.utcnow()
            )
            db.session.add(user)
        else:
            # Aktualisieren des bestehenden Benutzers
            if price_id == 'price_1QgZt70554h8teFSYqMTZP71':
                user.plan = 'basic'
            elif price_id == 'price_1QgZsP0554h8teFSrz52fQFh':
                user.plan = 'pro'
            else:
                user.plan = 'unknown'
            user.subscription_id = subscription_id
            user.status = 'active'
            user.start_date = datetime.utcnow()
        
        db.session.commit()
        print(f"Abonnement für {email} wurde aktiviert.")

def handle_payment_succeeded(invoice):
    subscription_id = invoice.get('subscription')
    # Benutzer anhand der Subscription ID finden und Status aktualisieren
    user = User.query.filter_by(subscription_id=subscription_id).first()
    if user:
        user.status = 'active'
        db.session.commit()
        print(f"Zahlung für {user.email} erfolgreich.")

def handle_subscription_deleted(subscription):
    subscription_id = subscription.get('id')
    # Benutzer anhand der Subscription ID finden und Status aktualisieren
    user = User.query.filter_by(subscription_id=subscription_id).first()
    if user:
        user.status = 'canceled'
        db.session.commit()
        print(f"Abonnement für {user.email} wurde gekündigt.")
