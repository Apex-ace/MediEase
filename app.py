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
        return {"res": 1, "message": "Sign Up Successful"}
    else:
        return {"res": 0, "message": "Sign Up Unsuccessful"}
    
@app.post("/api/login")
def loginHelper():
    data = request.get_json()

    username=data["username"]
    password=data["password"]

    response=database.select(conn=conn, table="customerAuth", condition=f"username='{username}'")
    print(response)

    if(response["res"]==1):
        hashed_password=response["result"][1]
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
            return {"res": 1, "message": "User Logged In"}
        else:
            return {"res": 0, "message": "Incorrect Password"}
    else:
        return {"res": 0, "message": "User Does Not Exist"}
    
if __name__ == '__main__':
    # Run the Flask app
    initdb()
    app.run()
