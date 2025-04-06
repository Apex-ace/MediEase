import subprocess
import threading
import time
import webbrowser
import os
import sys

def run_main_app():
    """Run the main MediEase application"""
    print("Starting MediEase main application...")
    
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 5000))
    
    # In production, gunicorn will be used to run the app
    if "RENDER" in os.environ:
        # This won't actually be called in production as we'll use the Procfile
        subprocess.run(["gunicorn", "app:app", "--bind", f"0.0.0.0:{port}"])
    else:
        # For local development
        os.environ["FLASK_APP"] = "app.py"
        subprocess.run(["python", "app.py"])

def run_chatbot_server():
    """Run the chatbot server"""
    print("Starting Chatbot server...")
    
    # Get port from environment variable or use default for chatbot
    chatbot_port = int(os.environ.get("PORT", 5001))
    
    if "RENDER" in os.environ:
        # This won't be used in production as we'll use a web service in gunicorn
        subprocess.run(["gunicorn", "chatbot_server:app", "--bind", f"0.0.0.0:{chatbot_port}"])
    else:
        subprocess.run(["python", "chatbot_server.py"])

def open_browser():
    """Open browser in development mode only"""
    # Don't open browser in production
    if "RENDER" in os.environ:
        return
        
    # Wait for servers to start
    time.sleep(2)
    print("Opening application in browser...")
    webbrowser.open("http://localhost:5000")

if __name__ == "__main__":
    print("===== Starting MediEase with AI Chatbot =====")
    
    # Start the chatbot server in a separate thread
    chatbot_thread = threading.Thread(target=run_chatbot_server)
    chatbot_thread.daemon = True
    chatbot_thread.start()
    
    # Start the browser in a separate thread (development only)
    if "RENDER" not in os.environ:
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
    
    # Run the main app in the main thread
    run_main_app() 