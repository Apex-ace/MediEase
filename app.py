from flask import Flask, request, jsonify, render_template
import bcrypt
from database import connect_to_db
from database import init_db
import database

# INIT the Flask APP
app = Flask(__name__)

# Connect To DB
conn = connect_to_db()

# DB Initializing Route
@app.route("/initdb")
def initdb():
    msg=init_db(conn)
    return msg

# Home Page Route
@app.route("/")
def home():
    return "hello world"

@app.route("/login")
def login():
    return render_template('customer/login.html')

@app.route("/signup")
def signup():
    return render_template('customer/signup.html')

@app.post("/api/signup")
def signupHelper():
    data = request.get_json()
    
    username=data["username"]
    password=data["password"]

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    data = {
            'username': username,
            'password': hashed_password.decode('utf-8')
        }
    
    response=database.insert(conn=conn, table="customerAuth", data=data)
    print(response)
    if response["res"]==1:
        return {"res": 1, "message": "sign up successful", "data": data}
    else:
        return {"res": 0, "message": "sign up unsuccessful", "data": data}
    
@app.post("/api/login")
def loginHelper():
    data = request.get_json()

    username=data["username"]
    password=data["password"]
    # response=database.insert(conn=conn, table="customerAuth", data=data)
    # print(response)
    if response["res"]==1:
        return {"res": 1, "message": "sign up successful", "data": data}
    else:
        return {"res": 0, "message": "sign up unsuccessful", "data": data}

    
if __name__ == '__main__':
    # Run the Flask app
    initdb()
    app.run()
