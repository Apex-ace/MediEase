# import os 
# import psycopg2
# from dotenv import load_dotenv
from flask import Flask, request, jsonify

# load_dotenv()

app = Flask(__name__)
# url = os.getenv("DATABASE_URL")
# connection = psycopg2.connect(url)


@app.get("/")
def home():
    return "hello world"
    
if __name__ == '__main__':
    # Run the Flask app
    app.run()
