from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

MISTRAL_API_KEY = "CkPijiIRkHPREUdjVh4xQ2ORIQV7r1r0"

@app.route('/chat', methods=['POST'])
def chat_with_mistral():
    """
    Handles chatbot requests using Mistral AI API.
    """
    try:
        data = request.json
        user_message = data.get('message', '')
        
        # Add context about being a pharmacy chatbot
        context = """You are MediEase, a helpful assistant for an online pharmacy website. 
        You can help with information about medicines, orders, delivery, and other pharmacy-related questions.
        Keep your answers short, professional and helpful. If asked about specific medicines, indicate that 
        users should consult their doctor for medical advice."""
        
        full_message = f"{context}\n\nUser: {user_message}"
        
        url = "https://api.mistral.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "mistral-medium",  
            "messages": [{"role": "user", "content": full_message}]
        }

        response = requests.post(url, headers=headers, json=payload)
        result = response.json()

        if "choices" in result:
            return jsonify({"response": result["choices"][0]["message"]["content"]})
        else:
            return jsonify({"response": "AI Error: Could not fetch response."})

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"})

# This route is for testing if the server is running
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok", "message": "Chatbot server is running"})

# Only run the app directly if this file is run, not when imported
if __name__ == "__main__":
    # Get port from environment variable
    port = int(os.getenv('CHATBOT_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')