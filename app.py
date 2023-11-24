import requests
from flask import Flask, request, render_template, redirect
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, decode_token,get_jwt_identity
import bcrypt
from database import connect_to_db, init_db
import database, os, json

# INIT the Flask APP
app = Flask(__name__)

'''
JWT INITIALIZATION
'''
# INIT JWT
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  # Replace with a secure secret key
jwt = JWTManager(app)

'''
DATABASE INITIALIZATION
'''
# Connect To DB
conn = connect_to_db()

# DB Initializing Route
@app.route("/initdb")
def initdb():
    msg=init_db(conn)
    return msg

'''
PAGE ROUTE FUNCTIONS
'''
# Home Page Route
@app.route("/")
def home():
    return render_template('customer/homepage.html')

# Login Page Route
@app.route("/login")
def login():
    return render_template('customer/login.html')

# Sign-Up Page Route
@app.route("/signup")
def signup():
    return render_template('customer/signup.html')

# Search Page Route
@app.route("/search/<key>")
def searchPage(key):
    response=searchHelper(key)
    if(response["res"]==1):
        return render_template('customer/search.html', medicines=response["data"])
    return render_template('customer/search.html')

# Medicine Page Route
@app.route("/medicine/<id>")
def medicinePage(id):
    response=medicineDetails(id)
    if(response["res"]==1):
        return render_template('customer/medicine_page.html', medicine=response["data"])
    return render_template('customer/medicine_page.html')

@app.route("/myaccount")
def myaccountPage():
    accessToken=request.args.get('accessToken')
    headers = {
    'Authorization': f'Bearer {accessToken}'
    }
    response = requests.get("http://127.0.0.1:"+os.getenv('APP_PORT')+"/api/getOrderList/", headers=headers)
    if response.status_code == 200:
        orderlist=response.json()['data']
        return render_template('customer/myaccount.html', orderlist=orderlist), 200
    else:
        return render_template('customer/myaccount.html'), 422

@app.route("/myorder/<accessToken>/<id>")
def myOrderPage(accessToken,id):
    headers = {
    'Authorization': f'Bearer {accessToken}'
    }
    response = requests.get("http://127.0.0.1:"+os.getenv('APP_PORT')+"/api/getOrder/"+id, headers=headers)
    if response.status_code == 200:
        order=response.json()['data']
        return render_template('customer/orderpage.html', order=order), 200
    else:
        return render_template('customer/orderpage.html'), 422

@app.route("/createorder")
def createOrderPage():
    return render_template('customer/create_order.html'), 200 

@app.route("/cart")
def cartPage():
    return render_template('customer/cart.html'), 200 

'''
API FUNCTIONS BELOW
'''
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
        return {"res": 1, "message": "Sign Up Successful"}
    else:
        return {"res": 0, "message": "Sign Up Unsuccessful! User Already Exists"}
    
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
        hashed_password=response["result"][0][1]
        
        # Check if its same with input credentials
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
            # Prepare a JWT token
            access_token = create_access_token(identity=username)
            
            # DELETE THIS LINE
            print(access_token)
            return {"res": 1, "message": "User Logged In", "accessToken": access_token}
        else:
            return {"res": 0, "message": "Incorrect Password"}
    else:
        return {"res": 0, "message": "User Does Not Exist"}
    
# Logout API
@app.get("/api/logout")
@jwt_required()
def logoutHelper():
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']
    response=database.select(conn=conn, table="customerAuth", condition=f"username='{username}'")
    response["result"]=response["result"][0]
    print(response)

    # If search successful
    if(response["res"]==1):
        return {"res": 1, "message": "Logged Out Successfully"}
    else:
        return {"res": 0, "message": "Error Logging Out"}

# Search Medicine API
@app.get("/api/search/<key>")
def searchHelper(key):
    response=database.select(conn,"medicines", columns=["id","name","composition","price"], condition=f"name ILIKE '%{key}%' OR composition ILIKE '%{key}%'", limit=20)
    if(response["res"]==0):
        return {"res": 0, "message": "Search Failure"}
    searchedMedicine=[]
    for med in response["result"]:
        data={
            "id":med[0],
            "name":med[1],
            "composition":med[2],
            "price":med[3],
        }
        searchedMedicine.append(data)
    return {"res": 1, "message": "Search Success", "data": searchedMedicine}

# Get medicine details API
@app.get("/api/medicine/<id>")
def medicineDetails(id):
    response=database.select(conn,"medicines", condition=f"id='{id}'")
    if(response["res"]==0):
        return {"res": 0, "message": "Get Medicine Details Failure"}
    data={
            "id":response["result"][0][0],
            "name":response["result"][0][1],
            "composition":response["result"][0][2],
            "price":response["result"][0][3],
            "manufacturer":response["result"][0][4],
            "description":response["result"][0][5],
            "category":response["result"][0][6],
            "side_effects":response["result"][0][7],
        }
    return {"res": 1, "message": "Medicine Details Fetched", "data": data}

# Make order API
@app.post("/api/createOrder")
@jwt_required()
def createOrder():
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']
    data = request.get_json()
    data["time"]="CURRENT_TIMESTAMP(2)"
    data["cart"]=json.dumps(data["cart"])
    data["status"]="Order Received"
    print(data)
    query = f'''INSERT INTO orders 
    (username,time,name,address,contact,cart,status) VALUES (
    '{username}',{data["time"]},'{data["name"]}','{data["address"]}',
    '{data["contact"]}', '{data["cart"]}', '{data["status"]}')'''
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                return {"res": 1, "message": "Insertion Success"}
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Insertion Failure"}

# Get Order API
@app.get("/api/getOrder/<orderid>")
@jwt_required()
def getOrder(orderid):
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']
    response=database.select(conn,"orders",condition=f"orderid={orderid} AND username='{username}'")
    if(response["res"]==1):
        result=response["result"][0]
        data={
            "orderid": result[0],
            "username": result[1],
            "time": result[2],
            "name": result[3],
            "address": result[4],
            "contact": result[5],
            "cart": json.loads(result[6]),
            "status": result[7],
        }
        return {"res": 1, "message": "Order Fetched", "data": data}
    return {"res": 0, "message": "Order Could Not be Fetched"}

@app.get("/api/getOrderList/")
@jwt_required()
def getOrderList():
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']
    print(username)
    response=database.select(conn,"orders", columns=["orderid","time","status"], condition=f"username='{username}'")
    print(response)
    if(response["res"]==1):
        return {"res": 1, "message": "Order List Fetched", "data": response["result"]}
    return {"res": 0, "message": "Order Could Not be Fetched"}


'''
MAIN FUNCTION
'''
if __name__ == '__main__':
    # Run the Flask app
    print(initdb())
    app.run(debug=True, use_reloader=True, port=os.getenv('APP_PORT'))
