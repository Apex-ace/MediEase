import requests
from flask import Flask, request, render_template, redirect, url_for, session, flash, jsonify
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, decode_token,get_jwt_identity
import bcrypt
from database import connect_to_db, init_db, initUserProfileTable, initRemindersTable
import database, os, json
import random
import time
import jwt

# INIT the Flask APP
app = Flask(__name__)


'''
JWT INITIALIZATION
'''
# INIT JWT
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  
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
PAGE ROUTE FUNCTIONS FOR SHOP
'''
# Shop Login Page Route
@app.route("/shop/login")
def shopLogin():
    return render_template('shop/login.html')

# Shop Home Page Route
@app.route("/shop")
def shop():
    return render_template('shop/shop.html')

# Shop Orders Page Route
@app.route("/shop/orders")
def shopOrders():
    # Request to get the list of orders
    response = requests.get("http://127.0.0.1:"+os.getenv('APP_PORT')+"/api/shop/getOrderList")
    if response.status_code == 200:
        # Return the orderlist as list with 200 status
        orderlist=response.json()['data']
        return render_template('shop/orders.html', orderlist=orderlist), 200
    else:
        return render_template('shop/orders.html'), 422

# Shop Order ID Page Route
@app.route("/shop/order/<orderid>")
def shopOrderPage(orderid):
    # Request to get the order for that order id
    response = requests.get("http://127.0.0.1:"+os.getenv('APP_PORT')+"/api/shop/getOrder/"+orderid)
    if response.status_code == 200:
        # Return the order as dict
        order=response.json()['data']
        return render_template('shop/orderpage.html', order=order), 200
    else:
        return render_template('shop/orderpage.html'), 422

'''
PAGE ROUTE FUNCTIONS FOR CUSTOMER
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

# Account Page Route
@app.route("/myaccount/<accessToken>")
def myAccountPage(accessToken):
    try:
        # Check if token has proper structure first
        if not accessToken or accessToken.count('.') != 2:
            print(f"Invalid token format: {accessToken}")
            # Render template with error flag
            return render_template('customer/myaccount.html', invalid_token=True), 200
            
        try:
            # Try to decode token
            payload = decode_token(accessToken)
            username = payload['sub']
            
            print(f"Successfully decoded token for user: {username}")
            
            # Just render the page - API calls will happen from client side JavaScript
            return render_template('customer/myaccount.html', username=username), 200
        except jwt.exceptions.ExpiredSignatureError:
            # Handle expired token specifically
            print("Token has expired")
            return render_template('customer/myaccount.html', invalid_token=True, 
                                error_message="Your session has expired. Please log in again."), 200
        except Exception as e:
            # Handle other token-related errors
            print(f"Token validation error: {str(e)}")
            return render_template('customer/myaccount.html', invalid_token=True, 
                                error_message="Invalid authentication token. Please log in again."), 200
            
    except Exception as e:
        print(f"Error in myAccountPage: {str(e)}")
        import traceback
        traceback.print_exc()
        # In case of any error, still render the page with error flag
        # The client-side JavaScript will handle showing error messages
        return render_template('customer/myaccount.html', error_message="An unexpected error occurred. Please try again."), 200

# Order Page Route
@app.route("/myorder/<accessToken>/<id>")
def myOrderPage(accessToken,id):
    # Add AccessToken as header
    headers = {
    'Authorization': f'Bearer {accessToken}'
    }
    # Use relative URL instead of hard-coded localhost
    response = requests.get(request.host_url.rstrip('/') + f"/api/getOrder/{id}", headers=headers)
    if response.status_code == 200:
        # Return the order as dict
        order=response.json()['data']
        return render_template('customer/orderpage.html', order=order), 200
    else:
        return render_template('customer/orderpage.html'), 422

# Create Order Page Route
@app.route("/createOrder")
def createOrderPage():
    return render_template('customer/create_order.html'), 200 

# Cart Page Route
@app.route("/cart")
def cartPage():
    return render_template('customer/cart.html'), 200 

# Video Call Route
@app.route("/video-call")
def video_call():
    # Generate a random room ID using current timestamp and a random number
    room_id = f"{int(time.time())}-{random.randint(1000, 9999)}"
    return render_template('customer/video-call.html', room_id=room_id)

'''
API FUNCTIONS BELOW FOR CUSTOMER
'''
# Signup API
@app.post("/api/signup")
def signupHelper():
    data = request.get_json()

    # Get the username and password from post
    username=data["username"]
    password=data["password"]

    # Hash Password with bcrypt library
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Store user details in customerAuth table
    data = {
            'username': username,
            'password': hashed_password.decode('utf-8')
        }
    response=database.insert(conn=conn, table="customerAuth", data=data)
    print(response)

    # Return the response
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

    # Search in database if user exists
    response=database.select(conn=conn, table="customerAuth", condition=f"username='{username}'")
    
    print(response)

    # If search successful
    if(response["res"]==1 and len(response["result"])!=0):
        # Get the hashed db password
        hashed_password=response["result"][0][1]
        
        # Check if its same with input credentials
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
            # Prepare a JWT token
            access_token = create_access_token(identity=username)
            
            # DELETE THIS LINE
            # print(access_token)

            # Return the accesstoken (JWT) for that user
            return {"res": 1, "message": "User Logged In", "accessToken": access_token}
        else:
            return {"res": 0, "message": "Incorrect Password"}
    else:
        return {"res": 0, "message": "User Does Not Exist"}
    
# Logout API
@app.get("/api/logout")
@jwt_required()
def logoutHelper():
    # Get user details from accesstoken
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']

    # Check if user exists
    response=database.select(conn=conn, table="customerAuth", condition=f"username='{username}'")
    response["result"]=response["result"][0]
    print(response)

    # If search successful
    if(response["res"]==1):
        return {"res": 1, "message": "Logged Out Successfully"}
    else:
        return {"res": 0, "message": "Error Logging Out"}

# Check Log In
@app.get("/api/isvalid")
@jwt_required()
def isValid():
    # Get user details from accesstoken
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']

    # Check if user exists
    response=database.select(conn=conn, table="customerAuth", condition=f"username='{username}'")
    response["result"]=response["result"][0]
    print(response)

    # If search successful
    if(response["res"]==1):
        return {"res": 1, "message": "User is Valid"}
    else:
        return {"res": 0, "message": "User Invalid"}

# Search Medicine API
@app.get("/api/search/<key>")
def searchHelper(key):
    # Search using the key in medicine table
    response=database.select(conn,"medicines", columns=["id","name","composition","price"], condition=f"name ILIKE '%{key}%' OR composition ILIKE '%{key}%'", limit=20)
    if(response["res"]==0):
        return {"res": 0, "message": "Search Failure"}
    
    # Get the matched medicine with the key
    searchedMedicine=[]
    for med in response["result"]:
        data={
            "id":med[0],
            "name":med[1],
            "composition":med[2],
            "price":med[3],
        }
        searchedMedicine.append(data)
    
    # Return the result
    return {"res": 1, "message": "Search Success", "data": searchedMedicine}

# Get medicine details API
@app.get("/api/medicine/<id>")
def medicineDetails(id):
    # Get the medicine with that id
    response=database.select(conn,"medicines", condition=f"id='{id}'")
    if(response["res"]==0):
        return {"res": 0, "message": "Get Medicine Details Failure"}
    
    # Prepare a JSON/dict before sending
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

    # Return the response
    return {"res": 1, "message": "Medicine Details Fetched", "data": data}

# Create Order API
@app.post("/api/createOrder")
@jwt_required()
def createOrder():
    # Get the user details from accesstoken
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']

    # Get the order details from post body
    data = request.get_json()

    # Calculate the total amount
    response=calculateTotal(data["cart"])
    if(response['res']==0):
        return response
    
    # Insert the order in DB
    total=response['total']
    print(total)
    data["time"]="CURRENT_TIMESTAMP(2)"
    data["cart"]=json.dumps(data["cart"])
    data["status"]="Order Received"
    
    # Get payment details
    payment_method = data.get("payment_method", "cod")
    upi_id = data.get("upi_id", None)
    
    # Include payment information in the DB query
    query = f'''INSERT INTO orders 
    (username, time, name, address, contact, cart, status, total, payment_method, upi_id) VALUES (
    '{username}', {data["time"]}, '{data["name"]}', '{data["address"]}',
    '{data["contact"]}', '{data["cart"]}', '{data["status"]}', {total},
    '{payment_method}', '{upi_id if upi_id else ""}')'''
    
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
    # Get the user details from accesstoken
    current_user = decode_token(request.headers['Authorization'][7:])  # Extract the token from the "Bearer" header
    username = current_user['sub']

    # Search for that order id
    response=database.select(conn,"orders",condition=f"orderid={orderid} AND username='{username}'")
    
    # Prepare a JSON/dict before sending
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
            "total": result[8]
        }
        return {"res": 1, "message": "Order Fetched", "data": data}
    return {"res": 0, "message": "Order Could Not be Fetched"}

# Get Order List API
@app.get("/api/getOrderList")
@jwt_required()
def getOrderList():
    # Get the user details from accesstoken
    current_user = decode_token(request.headers['Authorization'][7:])  
    username = current_user['sub']
    print(username)

    # Search for orders for that user
    response=database.select(conn,"orders", columns=["orderid","time","total","status"], condition=f"username='{username}'")
    print(response)

    # return the response
    if(response["res"]==1):
        return {"res": 1, "message": "Order List Fetched", "username":username, "data": response["result"]}
    return {"res": 0, "message": "Order Could Not be Fetched"}

# Get the cart total
@app.post("/api/getCartTotal")
def getCartTotal():
    data = request.get_json()
    cart=data["cart"]
    return calculateTotal(cart)

'''
API FUNCTIONS BELOW FOR SHOP
'''
# Shop Login API
@app.post("/api/shop/login")
def shopLoginHelper():
    data = request.get_json()

    # Get the credentials
    username=data["username"]
    password=data["password"]

    # Check if it matches
    if(username=="admin" and password=="admin"):
        return {"res": 1, "message": "Admin Logged In"}
    return {"res": 0, "message": "Admin Login Failure"}

# Shop Order List API
@app.get("/api/shop/getOrderList")
def shopGetOrderList():
    # Get the orders from db
    response=database.select(conn, table="orders", columns=["orderid","username","time","total","status"])
    print(response)
    # Return the response
    if(response["res"]==1):
        return {"res": 1, "message": "Order List Fetched", "data": response["result"]}
    return {"res": 0, "message": "Order Could Not be Fetched"}

# Shop Get Order API
@app.get("/api/shop/getOrder/<orderid>")
def shopGetOrder(orderid):
    # Get the order based on order id
    response=database.select(conn,"orders",condition=f"orderid={orderid}")
    
    # Return the response
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
            "total": result[8]
        }
        return {"res": 1, "message": "Order Fetched", "data": data}
    return {"res": 0, "message": "Order Could Not be Fetched"}

# Shop Update Order API
@app.post("/api/shop/updateOrder")
def shopUpdateOrder():
    data = request.get_json()

    print(data)

    # Get the credentials
    orderid=data["orderid"]
    status=data["status"]

    # Update the status of that orderid
    response=database.update(conn,"orders",{"status":status},condition=f"orderid={orderid}")
    print(response)
    if response["res"]==1:
        return {"res": 1, "message": "Update Successful"}
    else:
        return {"res": 0, "message": "Update Unsuccessful!"}
    
'''
NORMAL FUNCTIONS
'''
# Calculates the total amount based on cart using DB
def calculateTotal(cart):
    total=0
    for item in cart:
        response=database.select(conn, table="medicines", columns=["price"], condition=f"id={item['id']}")
        if(response['res']==0):
            return {"res": 0, "message": "Selection Failure", "total": total}
        total+=float(response["result"][0][0][1:])*int(item['qty'])
    total=round(total,2)
    return {"res": 1, "message": "Selection Success", "total": total}

# Inventory API endpoint
@app.get("/api/inventory")
def getInventory():
    # Get medicines from the database
    response = database.select(conn, "medicines", columns=["id", "name", "composition", "price", "manufacturer", "category"])
    
    if response["res"] == 0:
        return {"res": 0, "message": "Failed to fetch inventory"}
    
    # Format the data for the frontend
    inventory = []
    for med in response["result"]:
        data = {
            "id": med[0],
            "name": med[1],
            "composition": med[2],
            "price": med[3],
            "manufacturer": med[4],
            "category": med[5]
        }
        inventory.append(data)
    
    return {"res": 1, "message": "Inventory fetched successfully", "data": inventory}

# Chatbot proxy route
@app.route('/api/chat', methods=['POST'])
def chatbot_proxy():
    """
    Proxy route to forward chatbot requests to the chatbot worker service
    """
    try:
        # Get the chatbot service URL from environment or use default for Render
        chatbot_url = os.environ.get('CHATBOT_URL', 'https://mediease-chatbot-tnd1.onrender.com')
        
        app.logger.info(f"Chatbot proxy: Forwarding request to {chatbot_url}/chat")
        
        # Forward the request to the chatbot service
        response = requests.post(
            f"{chatbot_url}/chat", 
            json=request.json,
            headers={'Content-Type': 'application/json'},
            timeout=10  # Add timeout to prevent hanging
        )
        
        app.logger.info(f"Chatbot proxy: Received response with status {response.status_code}")
        
        # Check for non-200 status code
        if response.status_code != 200:
            app.logger.error(f"Chatbot service error: {response.status_code} - {response.text}")
            return jsonify({"response": f"Chatbot service error (HTTP {response.status_code}). Please try again later."})
        
        # Return the response from the chatbot service
        return jsonify(response.json())
    except requests.exceptions.ConnectionError as e:
        app.logger.error(f"Chatbot connection error: {str(e)}")
        return jsonify({"response": "Cannot connect to the chatbot service. Please check if the chatbot worker is running."})
    except requests.exceptions.Timeout as e:
        app.logger.error(f"Chatbot timeout error: {str(e)}")
        return jsonify({"response": "The chatbot service timed out. Please try again later."})
    except Exception as e:
        app.logger.error(f"Chatbot proxy error: {str(e)}")
        return jsonify({"response": "Sorry, I'm having trouble connecting to my brain right now. Please try again later."})

# User Profile API Endpoints
@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def getUserProfile():
    conn = None
    try:
        current_user = get_jwt_identity()
        print(f"Loading profile for user: {current_user}")
        
        # Get a database connection
        conn = connect_to_db()
        if not conn:
            print("Failed to connect to database")
            return jsonify({"error": "Database connection error"}), 500
            
        cursor = conn.cursor()
        
        # Check if user profile table exists
        cursor.execute("SELECT to_regclass('public.user_profiles')")
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print("Table user_profiles does not exist, initializing...")
            # Close the cursor before initializing the table
            cursor.close()
            init_result = initUserProfileTable(conn)
            if init_result["res"] != 1:
                print(f"Failed to initialize user_profiles table: {init_result['message']}")
                return jsonify({"error": "Could not initialize user profile table"}), 500
            # Create a new cursor
            cursor = conn.cursor()
        
        # Get user profile
        cursor.execute('SELECT * FROM user_profiles WHERE username = %s', (current_user,))
        profile = cursor.fetchone()
        
        if profile is None:
            print(f"No profile found for {current_user}, creating a new one")
            # Create a new profile if it doesn't exist
            try:
                cursor.execute('''
                    INSERT INTO user_profiles (username)
                    VALUES (%s)
                ''', (current_user,))
                conn.commit()
                
                # Return basic profile
                return jsonify({
                    "username": current_user,
                    "full_name": None,
                    "email": None,
                    "phone": None,
                    "address": None
                })
            except Exception as e:
                conn.rollback()
                print(f"Error creating new profile: {str(e)}")
                import traceback
                traceback.print_exc()
                return jsonify({"error": f"Failed to create profile: {str(e)}"}), 500
        
        print(f"Profile found for {current_user}: {profile}")
        return jsonify({
            "username": profile[0],
            "full_name": profile[1],
            "email": profile[2],
            "phone": profile[3],
            "address": profile[4]
        })
        
    except Exception as e:
        print(f"Error getting user profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            try:
                # Close the connection in the finally block to ensure it's always closed
                if 'cursor' in locals() and cursor:
                    cursor.close()
                conn.close()
                print("Database connection closed")
            except Exception as e:
                print(f"Error closing database connection: {str(e)}")

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def updateUserProfile():
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Update user profile
        cursor.execute('''
            UPDATE user_profiles
            SET full_name = %s,
                email = %s,
                phone = %s,
                address = %s
            WHERE username = %s
        ''', (
            data.get('full_name'),
            data.get('email'),
            data.get('phone'),
            data.get('address'),
            current_user
        ))
        
        conn.commit()
        return jsonify({"message": "Profile updated successfully"})
        
    except Exception as e:
        print(f"Error updating user profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/user/orders', methods=['GET'])
@jwt_required()
def getUserOrders():
    conn = None
    cursor = None
    try:
        current_user = get_jwt_identity()
        print(f"Loading orders for user: {current_user}")
        
        # Get a database connection
        conn = connect_to_db()
        if not conn:
            print("Failed to connect to database")
            return jsonify({"error": "Database connection error"}), 500
        
        cursor = conn.cursor()
        
        # Check if orders table exists
        cursor.execute("SELECT to_regclass('public.orders')")
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print("Table orders does not exist")
            return jsonify([])
        
        # Get user orders
        try:
            query = '''
                SELECT orderid, time, cart, status, total, payment_method
                FROM orders
                WHERE username = %s
                ORDER BY time DESC
            '''
            cursor.execute(query, (current_user,))
            orders = cursor.fetchall()
            
            if not orders:
                print(f"No orders found for user: {current_user}")
                return jsonify([])
            
            result = []
            for order in orders:
                try:
                    # Handle potential JSON parsing errors
                    cart = json.loads(order[2])
                except:
                    # If cart can't be parsed, use empty list
                    print(f"Error parsing cart JSON for order {order[0]}")
                    cart = []
                
                # Use None for missing fields to avoid KeyError
                order_dict = {
                    "orderid": order[0],
                    "time": order[1].isoformat() if order[1] else None,
                    "cart": cart,
                    "status": order[3] or "Unknown",
                    "total": order[4] or 0
                }
                
                # Add payment_method only if it exists in the query results
                if len(order) > 5 and order[5]:
                    order_dict["payment_method"] = order[5]
                
                result.append(order_dict)
            
            return jsonify(result)
            
        except Exception as e:
            print(f"Error executing orders query: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Error retrieving orders: {str(e)}"}), 500
        
    except Exception as e:
        print(f"Error getting user orders: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if conn:
            try:
                conn.close()
                print("Database connection closed")
            except Exception as e:
                print(f"Error closing database connection: {str(e)}")

@app.route('/api/user/orders/<order_id>', methods=['GET'])
@jwt_required()
def getOrderDetails(order_id):
    try:
        current_user = get_jwt_identity()
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Get order details
        cursor.execute('''
            SELECT orderid, time, cart, status, total, delivery_method, address, contact
            FROM orders
            WHERE orderid = %s AND username = %s
        ''', (order_id, current_user))
        
        order = cursor.fetchone()
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
            
        return jsonify({
            "orderid": order[0],
            "time": order[1],
            "cart": json.loads(order[2]),
            "status": order[3],
            "total": order[4],
            "delivery_method": order[5],
            "address": order[6],
            "contact": order[7]
        })
        
    except Exception as e:
        print(f"Error getting order details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/user/orders/<order_id>/cancel', methods=['POST'])
@jwt_required()
def cancelOrder(order_id):
    try:
        current_user = get_jwt_identity()
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Check if order exists and belongs to user
        cursor.execute('''
            SELECT status
            FROM orders
            WHERE orderid = %s AND username = %s
        ''', (order_id, current_user))
        
        order = cursor.fetchone()
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
            
        if order[0] != 'pending':
            return jsonify({"error": "Only pending orders can be cancelled"}), 400
            
        # Cancel order
        cursor.execute('''
            UPDATE orders
            SET status = 'cancelled'
            WHERE orderid = %s AND username = %s
        ''', (order_id, current_user))
        
        conn.commit()
        return jsonify({"message": "Order cancelled successfully"})
        
    except Exception as e:
        print(f"Error cancelling order: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/user/reminders', methods=['GET'])
@jwt_required()
def getUserReminders():
    try:
        current_user = get_jwt_identity()
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Check if reminders table exists
        cursor.execute("SELECT to_regclass('public.medication_reminders')")
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print("Table medication_reminders does not exist, initializing...")
            initRemindersTable(conn)
        
        # Get user reminders
        cursor.execute('''
            SELECT id, medication_name, dosage, time, frequency, notes
            FROM medication_reminders
            WHERE username = %s
            ORDER BY time
        ''', (current_user,))
        
        reminders = cursor.fetchall()
        
        if not reminders:
            return jsonify([])
            
        return jsonify([{
            "id": reminder[0],
            "medication_name": reminder[1],
            "dosage": reminder[2],
            "time": reminder[3],
            "frequency": reminder[4],
            "notes": reminder[5]
        } for reminder in reminders])
        
    except Exception as e:
        print(f"Error getting user reminders: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/user/reminders', methods=['POST'])
@jwt_required()
def createReminder():
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        required_fields = ['medication_name', 'dosage', 'time', 'frequency']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
                
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Create reminder
        cursor.execute('''
            INSERT INTO medication_reminders (username, medication_name, dosage, time, frequency, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (
            current_user,
            data['medication_name'],
            data['dosage'],
            data['time'],
            data['frequency'],
            data.get('notes')
        ))
        
        conn.commit()
        return jsonify({"message": "Reminder created successfully"})
        
    except Exception as e:
        print(f"Error creating reminder: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/user/reminders/<reminder_id>', methods=['DELETE'])
@jwt_required()
def deleteReminder(reminder_id):
    try:
        current_user = get_jwt_identity()
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Delete reminder
        cursor.execute('''
            DELETE FROM medication_reminders
            WHERE id = %s AND username = %s
        ''', (reminder_id, current_user))
        
        conn.commit()
        return jsonify({"message": "Reminder deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting reminder: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/user/password', methods=['PUT'])
@jwt_required()
def changePassword():
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        required_fields = ['current_password', 'new_password']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
                
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Verify current password
        cursor.execute('SELECT password FROM customerAuth WHERE username = %s', (current_user,))
        user = cursor.fetchone()
        
        if not user or not bcrypt.check_password_hash(user[0], data['current_password']):
            return jsonify({"error": "Current password is incorrect"}), 400
            
        # Update password
        hashed_password = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
        cursor.execute('''
            UPDATE customerAuth
            SET password = %s
            WHERE username = %s
        ''', (hashed_password, current_user))
        
        conn.commit()
        return jsonify({"message": "Password changed successfully"})
        
    except Exception as e:
        print(f"Error changing password: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

'''
MAIN FUNCTION
'''
if __name__ == "__main__":
    # Get port from environment variable
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
