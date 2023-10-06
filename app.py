from flask import Flask, request, jsonify, render_template, redirect
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, decode_token
import bcrypt
from database import connect_to_db, init_db
import database, os

# INIT the Flask APP
app = Flask(__name__)

# Connect To DB
conn = connect_to_db()

# INIT JWT
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  # Replace with a secure secret key
jwt = JWTManager(app)

# DB Initializing Route
@app.route("/initdb")
def initdb():
    msg=init_db(conn)
    return msg

# Home Page Route
@app.route("/")
def home():
    return render_template('customer/index.html')

# Login Page Route
@app.route("/login")
def login():
    return render_template('customer/login.html')

# Sign-Up Page Route
@app.route("/signup")
def signup():
    return render_template('customer/signup.html')

# Signup API
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
        return jsonify({"res": 1, "message": "Sign Up Successful"})
    else:
        return jsonify({"res": 0, "message": "Sign Up Unsuccessful! User Already Exists"})
    
# Login API
@app.post("/api/login")
def loginHelper():
    data = request.get_json()

    # Get the credentials
    username=data["username"]
    password=data["password"]

    # search in database
    response=database.select(conn=conn, table="customerAuth", condition=f"username='{username}'")
    print(response)

    # If search successful
    if(response["res"]==1):
        # Get the hashed db password
        hashed_password=response["result"][1]
        # Check if its same with input credentials
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
            # Prepare a JWT token
            access_token = create_access_token(identity=username)
            return jsonify({"res": 1, "message": "User Logged In", "accessToken": access_token})
        else:
            return jsonify({"res": 0, "message": "Incorrect Password"})
    else:
        return jsonify({"res": 0, "message": "User Does Not Exist"})
    
# Sign-Up Page Route
@app.post("/api/logout")
@jwt_required()
def logoutHelper():
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']
    response=database.select(conn=conn, table="customerAuth", condition=f"username='{username}'")
    print(response)

    # If search successful
    if(response["res"]==1):
        return jsonify({"res": 1, "message": "Logged Out Successfully"})
    else:
        return jsonify({"res": 0, "message": "Error Logging Out"})



if __name__ == '__main__':
    # Run the Flask app
    initdb()
    app.run()
