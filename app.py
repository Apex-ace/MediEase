import requests
from flask import Flask, request, render_template, redirect, url_for, session, flash, jsonify, make_response, g
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, decode_token, get_jwt_identity
import bcrypt
from database import connect_to_db, init_db, initUserProfileTable, initRemindersTable
import database, os, json
import random
import time
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import datetime
from functools import wraps

# JWT Secret Key
JWT_SECRET_KEY = "your-secret-key"  # This should be in an environment variable in production

# Add token validation decorator - makes token optional
def validate_token_api(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Initialize g.user as None (unauthenticated)
        g.user = None
        
        # Check for Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                # Decode and validate token
                payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
                # Store user info in Flask's g object for use in the route
                g.user = payload
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
                # Token is invalid but we'll proceed without authentication
                print(f"Token validation error: {str(e)}")
                pass
        
        # Always proceed (with or without valid authentication)
        return f(*args, **kwargs)
    
    return decorated

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
# Function to ensure the orders table exists
def ensure_orders_table_exists(conn):
    cursor = None
    try:
        cursor = conn.cursor()
        
        # Check if we're using SQLite or PostgreSQL
        is_sqlite_db = False
        try:
            cursor.execute("SELECT sqlite_version()")
            is_sqlite_db = True
        except:
            # Assume PostgreSQL if not SQLite
            pass
        
        if is_sqlite_db:
            # SQLite version of the table creation
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    name TEXT,
                    address TEXT,
                    contact TEXT,
                    cart TEXT,
                    status TEXT DEFAULT 'pending',
                    total REAL,
                    payment_method TEXT DEFAULT 'cod',
                    delivery_method TEXT DEFAULT 'standard',
                    upi_id TEXT,
                    upi_reference TEXT
                )
            """)
        else:
            # PostgreSQL version of the table creation
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    username TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    name TEXT,
                    address TEXT,
                    contact TEXT,
                    cart TEXT,
                    status TEXT DEFAULT 'pending',
                    total REAL,
                    payment_method TEXT DEFAULT 'cod',
                    delivery_method TEXT DEFAULT 'standard',
                    upi_id TEXT,
                    upi_reference TEXT
                )
            """)
        
        conn.commit()
        print("Orders table created or verified successfully")
        return {"res": 1, "message": "Orders table created or verified successfully"}
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Error creating orders table: {str(e)}")
        return {"res": 0, "message": f"Error creating orders table: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

# Helper function to check if database is SQLite
def is_sqlite(conn):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT sqlite_version()")
        return True
    except:
        return False

# Connect To DB
conn = connect_to_db()

# Initialize necessary tables on startup
with app.app_context():
    try:
        # Start a new transaction
        conn.rollback()  # Rollback any failed transaction
        
        # Initialize tables one by one with proper error handling
        init_result = init_db(conn)
        if init_result["res"] != 1:
            print(f"Warning: {init_result['message']}")
        
        orders_result = ensure_orders_table_exists(conn)
        if orders_result["res"] != 1:
            print(f"Warning: {orders_result['message']}")
        
        profile_result = initUserProfileTable(conn)
        if profile_result["res"] != 1:
            print(f"Warning: {profile_result['message']}")
        
        reminders_result = initRemindersTable(conn)
        if reminders_result["res"] != 1:
            print(f"Warning: {reminders_result['message']}")
        
        # Add a default test order for demo if no orders exist
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM orders")
            count = cursor.fetchone()[0]
            
            if count == 0:
                # Add a sample order for testing
                sample_cart = json.dumps([
                    {"id": 1, "name": "Sample Medicine", "qty": 2, "price": "₹250"}
                ])
                
                # Use PostgreSQL parameter style
                if is_sqlite(conn):
                    # SQLite uses ? placeholders
                    cursor.execute("""
                        INSERT INTO orders (username, name, address, contact, cart, status, total, payment_method)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        "test_user", 
                        "Test User", 
                        "123 Test Street, Test City", 
                        "9876543210", 
                        sample_cart, 
                        "pending", 
                        500.00, 
                        "cod"
                    ))
                else:
                    # PostgreSQL uses $1, $2, etc.
                    cursor.execute("""
                        INSERT INTO orders (username, name, address, contact, cart, status, total, payment_method)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    """, (
                        "test_user", 
                        "Test User", 
                        "123 Test Street, Test City", 
                        "9876543210", 
                        sample_cart, 
                        "pending", 
                        500.00, 
                        "cod"
                    ))
                conn.commit()
                print("Added sample order for testing")
        except Exception as e:
            conn.rollback()  # Rollback on error
            print(f"Error adding sample data: {str(e)}")
            # Don't raise exception, just log it
        
        # Commit the transaction if everything succeeded
        conn.commit()
        print("Database initialization completed successfully")
    except Exception as e:
        conn.rollback()  # Rollback on any error
        print(f"Error during database initialization: {str(e)}")
        # Continue with the application even if initialization fails

# DB Initializing Route
@app.route("/initdb")
def initdb():
    msg = init_db(conn)
    ensure_orders_table_exists(conn)
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

# Shop Search Page Route
@app.route('/shop/search')
def shopSearchPage():
    return render_template('shop/search.html')

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

# Account Page Route (New version, more secure)
@app.route("/myaccount")
def myAccountPage():
    try:
        # Check for Authorization cookie or query param
        access_token = request.cookies.get('access_token')
        
        if not access_token:
            # Try to get from Authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                access_token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        if not access_token:
            # Render the page with login required message
            print("No access token found in cookies or headers")
            return render_template('customer/myaccount.html', invalid_token=True, 
                                  error_message="Please log in to view your account"), 200
        
        try:
            # Try to decode token
            # First try using PyJWT
            try:
                payload = jwt.decode(access_token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
                username = payload['sub']
            except:
                # Fall back to flask-jwt-extended
                payload = decode_token(access_token)
                username = payload['sub']
            
            print(f"Successfully decoded token for user: {username}")
            
            # Just render the page - API calls will happen from client side JavaScript
            return render_template('customer/myaccount.html', username=username), 200
        except ExpiredSignatureError:
            # Handle expired token specifically
            print("Token has expired")
            return render_template('customer/myaccount.html', invalid_token=True, 
                                error_message="Your session has expired. Please log in again."), 200
        except InvalidTokenError:
            # Handle invalid token
            print("Invalid token")
            return render_template('customer/myaccount.html', invalid_token=True, 
                                error_message="Invalid authentication token. Please log in again."), 200
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
        return render_template('customer/myaccount.html', error_message="An unexpected error occurred. Please try again."), 200

# Keep the old route for backward compatibility
@app.route("/myaccount/<accessToken>")
def myAccountPageOld(accessToken):
    try:
        # Set the token as a cookie and redirect to the main myaccount route
        response = make_response(redirect('/myaccount'))
        response.set_cookie('access_token', accessToken)
        return response
    except Exception as e:
        print(f"Error in old myAccountPage route: {str(e)}")
        return redirect('/myaccount')

# Order Page Route
@app.route("/myorder/<id>")
def myOrderPage(id):
    try:
        print(f"Loading order page for order ID: {id}")
        # Get access token either from URL parameter or from cookies
        token = request.cookies.get('access_token')
        
        if not token:
            print("No access token provided for order page")
            return render_template('customer/login.html', error_message="Please log in to view your order")
            
        try:
            # Decode the JWT token
            decoded = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            username = decoded.get('username')
            
            # Fetch order details via API
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f"{request.url_root}api/user/orders/{id}", headers=headers)
            
            if response.status_code != 200:
                error_data = response.json()
                print(f"API error: {error_data.get('error')}")
                return render_template('customer/orderpage.html', error_message=error_data.get('message', 'Error fetching order details'))
                
            order = response.json()
            print(f"Rendering order page for Order ID: {id}")
            return render_template('customer/orderpage.html', order=order)
            
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
            print(f"Token error in myOrderPage: {str(e)}")
            return render_template('customer/login.html', error_message="Your session has expired. Please log in again.")
            
    except Exception as e:
        print(f"Error in myOrderPage: {str(e)}")
        traceback.print_exc()
        return render_template('customer/orderpage.html', error_message="An unexpected error occurred")

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

# Search Medicine API - Improved
@app.get("/api/search/<key>")
def searchHelper(key):
    try:
        if not key or len(key) < 2:
            return {"res": 0, "message": "Search query too short"}
            
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Check if medicines table exists
        if is_sqlite(conn):
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='medicines'
            """)
        else:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'medicines'
                )
            """)
        
        table_exists = cursor.fetchone()
        if not table_exists or not table_exists[0]:
            return {"res": 0, "message": "Medicines database not available"}
        
        # Improved search with better SQL query and error handling
        try:
            cursor.execute("""
                SELECT id, name, composition, price, category, manufacturer 
                FROM medicines 
                WHERE name LIKE ? OR composition LIKE ? OR category LIKE ?
                ORDER BY 
                    CASE 
                        WHEN name LIKE ? THEN 1
                        WHEN name LIKE ? THEN 2
                        WHEN composition LIKE ? THEN 3
                        ELSE 4
                    END,
                    name ASC
                LIMIT 20
            """, (
                f'%{key}%', f'%{key}%', f'%{key}%', 
                f'{key}%', f'%{key}', f'%{key}%'
            ))
        except Exception as e:
            # Fallback to simpler query if the more complex one fails
            cursor.execute("""
                SELECT id, name, composition, price, category, manufacturer 
                FROM medicines 
                WHERE name LIKE ? OR composition LIKE ?
                ORDER BY name ASC
                LIMIT 20
            """, (f'%{key}%', f'%{key}%'))
        
        medicines = cursor.fetchall()
        
        if not medicines:
            return {"res": 0, "message": "No medicines found"}
        
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        # Process results with better formatting
        searchedMedicine = []
        for medicine in medicines:
            data = {}
            for i, value in enumerate(medicine):
                column_name = column_names[i]
                # Format price with currency symbol
                if column_name == 'price':
                    data[column_name] = f"₹{value:.2f}" if value else "₹0.00"
                else:
                    data[column_name] = value if value else ""
            searchedMedicine.append(data)
        
        return {"res": 1, "message": "Search Success", "data": searchedMedicine}
        
    except Exception as e:
        app.logger.error(f"Error in medicine search: {str(e)}")
        return {"res": 0, "message": f"Search Error: {str(e)}"}
        
    finally:
        if conn:
            conn.close()

# Get medicine details API - Improved
@app.get("/api/medicine/<id>")
def medicineDetails(id):
    try:
        if not id:
            return {"res": 0, "message": "Invalid medicine ID"}
            
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Check if medicines table exists
        if is_sqlite(conn):
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='medicines'
            """)
        else:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'medicines'
                )
            """)
        
        table_exists = cursor.fetchone()
        if not table_exists or not table_exists[0]:
            return {"res": 0, "message": "Medicines database not available"}
        
        # Get medicine details with better query and error handling
        cursor.execute("SELECT * FROM medicines WHERE id = ?", (id,))
        medicine = cursor.fetchone()
        
        if not medicine:
            return {"res": 0, "message": "Medicine not found"}
        
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        # Create medicine data dictionary with proper formatting
        medicine_data = {}
        for i, value in enumerate(medicine):
            column_name = column_names[i]
            # Format price with currency symbol
            if column_name == 'price':
                medicine_data[column_name] = f"₹{value:.2f}" if value else "₹0.00"
            else:
                medicine_data[column_name] = value if value else ""
        
        return {"res": 1, "message": "Get Medicine Details Success", "data": medicine_data}
        
    except Exception as e:
        app.logger.error(f"Error getting medicine details: {str(e)}")
        return {"res": 0, "message": f"Error: {str(e)}"}
        
    finally:
        if conn:
            conn.close()

# Create Order API
@app.post("/api/createOrder")
@jwt_required()
def createOrder():
    try:
        # Get the user details from accesstoken
        current_user = get_jwt_identity()
        print(f"Creating order for user: {current_user}")

        # Get the order details from post body
        data = request.get_json()
        
        if not data:
            return {"res": 0, "message": "No data provided"}, 400
            
        required_fields = ['cart', 'name', 'address', 'contact']
        for field in required_fields:
            if field not in data:
                return {"res": 0, "message": f"Missing required field: {field}"}, 400
        
        # Calculate the total amount
        total = 0
        cart = data["cart"]
        
        if not cart or not isinstance(cart, list) or len(cart) == 0:
            return {"res": 0, "message": "Cart cannot be empty"}, 400
            
        # Connect to the database
        conn = connect_to_db()
        
        # Ensure the tables exist
        ensure_orders_table_exists(conn)
        
        # Calculate total by fetching product prices
        for item in cart:
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT price FROM medicines WHERE id = ?", (item['id'],))
                result = cursor.fetchone()
                
                if not result:
                    return {"res": 0, "message": f"Product with ID {item['id']} not found"}, 404
                    
                price_str = result[0]
                # Remove currency symbol if present
                if price_str.startswith('₹'):
                    price_str = price_str[1:]
                    
                price = float(price_str)
                qty = int(item.get('qty', 1))
                total += price * qty
                
            except Exception as e:
                print(f"Error calculating item price: {str(e)}")
                return {"res": 0, "message": f"Error calculating price: {str(e)}"}, 500
        
        # Round total to 2 decimal places
        total = round(total, 2)
        print(f"Total order amount: {total}")
        
        # Get other order details
        payment_method = data.get("payment_method", "cod")
        upi_id = data.get("upi_id", "")
        upi_reference = data.get("upi_reference", "")
        
        # Prepare cart data for storage
        cart_json = json.dumps(cart)
        
        # Status is always "pending" for new orders
        status = "pending"
        
        # Get current timestamp (SQLite and PostgreSQL compatible)
        current_time = datetime.datetime.now().isoformat()
        
        try:
            cursor = conn.cursor()
            
            # Check if we're using SQLite or PostgreSQL
            if hasattr(conn, 'server_version'):  # PostgreSQL
                # Use PostgreSQL syntax
                query = """
                    INSERT INTO orders 
                    (username, time, name, address, contact, cart, status, total, payment_method, upi_id, upi_reference) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING orderid
                """
                cursor.execute(query, (
                    current_user, current_time, data["name"], data["address"],
                    data["contact"], cart_json, status, total, payment_method, upi_id, upi_reference
                ))
                new_order_id = cursor.fetchone()[0]
            else:  # SQLite
                # Use SQLite syntax
                query = """
                    INSERT INTO orders 
                    (username, time, name, address, contact, cart, status, total, payment_method, upi_id, upi_reference) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                cursor.execute(query, (
                    current_user, current_time, data["name"], data["address"],
                    data["contact"], cart_json, status, total, payment_method, upi_id, upi_reference
                ))
                new_order_id = cursor.lastrowid
                
            conn.commit()
            
            print(f"Order created successfully with ID: {new_order_id}")
            return {"res": 1, "message": "Order created successfully", "orderid": new_order_id, "total": total}
            
        except Exception as e:
            conn.rollback()
            print(f"Error inserting order: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"res": 0, "message": f"Error creating order: {str(e)}"}, 500
            
    except Exception as e:
        print(f"Error in createOrder: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"res": 0, "message": f"Unexpected error: {str(e)}"}, 500

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
    conn = None
    cursor = None
    try:
        print(f"Shop fetching order ID: {orderid}")
        
        # Connect to the database
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Ensure the orders table exists
        ensure_orders_table_exists(conn)
        
        # Get the column information from the orders table
        if hasattr(conn, 'server_version'):  # PostgreSQL
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'orders'
            """)
            columns = [column[0] for column in cursor.fetchall()]
        else:  # SQLite
            cursor.execute("PRAGMA table_info(orders)")
            columns = [column[1] for column in cursor.fetchall()]
        
        # Construct the query based on available columns
        select_columns = ["orderid", "username", "time"]
        
        # Add required columns if they exist
        required_fields = ["name", "address", "contact", "cart", "total", "status"]
        for field in required_fields:
            if field in columns:
                select_columns.append(field)
        
        # Add optional columns if they exist
        for optional_field in ["payment_method", "delivery_method", "upi_id"]:
            if optional_field in columns:
                select_columns.append(optional_field)
                
        columns_str = ", ".join(select_columns)
        
        # Query the database for the order
        if hasattr(conn, 'server_version'):  # PostgreSQL
            query = f"""
                SELECT {columns_str} 
                FROM orders 
                WHERE orderid = %s
            """
            cursor.execute(query, (orderid,))
        else:  # SQLite
            query = f"""
                SELECT {columns_str} 
                FROM orders 
                WHERE orderid = ?
            """
            cursor.execute(query, (orderid,))
            
        order = cursor.fetchone()
        
        if not order:
            print(f"No order found with ID: {orderid}")
            return jsonify({"res": 0, "message": "Order not found"}), 404
            
        # Prepare the order data for JSON response
        column_names = [desc[0] for desc in cursor.description]
        order_dict = dict(zip(column_names, order))
        
        # Handle JSON parsing for cart
        try:
            if 'cart' in order_dict and order_dict['cart']:
                order_dict['cart'] = json.loads(order_dict['cart'])
            else:
                order_dict['cart'] = []
        except Exception as e:
            print(f"Error parsing cart JSON for order {orderid}. Raw cart data: {order_dict.get('cart')}")
            print(f"Error details: {str(e)}")
            order_dict['cart'] = []
            
        # Handle datetime objects
        if 'time' in order_dict and order_dict['time'] and hasattr(order_dict['time'], 'isoformat'):
            order_dict['time'] = order_dict['time'].isoformat()
            
        print(f"Successfully retrieved order details for Order ID: {orderid}")
        return jsonify({"res": 1, "message": "Order Fetched", "data": order_dict})
        
    except Exception as e:
        print(f"Error in shopGetOrder: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"res": 0, "message": f"Error fetching order: {str(e)}"}), 500
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
            except:
                pass

# Shop Update Order API
@app.post("/api/shop/updateOrder")
def shopUpdateOrder():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"res": 0, "message": "No data provided"}), 400
            
        required_fields = ['orderid', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({"res": 0, "message": f"Missing required field: {field}"}), 400

        print(f"Updating order {data['orderid']} status to: {data['status']}")

        # Get the data
        orderid = data["orderid"]
        status = data["status"]
        
        # Validate status
        valid_statuses = [
            "Order Received", 
            "Order Packed", 
            "Order Shipped", 
            "Order Delivered", 
            "Order Cancelled"
        ]
        
        if status not in valid_statuses:
            return jsonify({"res": 0, "message": f"Invalid status value: {status}"}), 400

        # Connect to database
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Ensure orders table exists
        ensure_orders_table_exists(conn)
        
        # Update the status of that orderid
        try:
            if hasattr(conn, 'server_version'):  # PostgreSQL
                cursor.execute("""
                    UPDATE orders 
                    SET status = %s 
                    WHERE orderid = %s
                """, (status, orderid))
            else:  # SQLite
                cursor.execute("""
                    UPDATE orders 
                    SET status = ? 
                    WHERE orderid = ?
                """, (status, orderid))
                
            conn.commit()
            print(f"Successfully updated order {orderid} status to {status}")
            return jsonify({"res": 1, "message": "Order status updated successfully"})
            
        except Exception as e:
            conn.rollback()
            print(f"Error updating order status: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"res": 0, "message": f"Error updating order: {str(e)}"}), 500
            
    except Exception as e:
        print(f"Error in shopUpdateOrder: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"res": 0, "message": f"Unexpected error: {str(e)}"}), 500
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
            except:
                pass

# Shop Dashboard Stats API
@app.route('/api/shop/dashboard-stats')
def shopDashboardStats():
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        
        stats = {}
        
        # Total orders
        cursor.execute("SELECT COUNT(*) FROM orders")
        stats['total_orders'] = cursor.fetchone()[0]
        
        # Pending orders
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered', 'cancelled')")
        stats['pending_orders'] = cursor.fetchone()[0]
        
        # Completed orders
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'delivered'")
        stats['completed_orders'] = cursor.fetchone()[0]
        
        # Total medicines
        try:
            cursor.execute("SELECT COUNT(*) FROM medicines")
            stats['total_medicines'] = cursor.fetchone()[0]
        except:
            # If medicines table doesn't exist
            stats['total_medicines'] = 0
        
        # Recent orders (last 5)
        cursor.execute("""
            SELECT id, username, name, total, status, created_at 
            FROM orders 
            ORDER BY created_at DESC LIMIT 5
        """)
        
        recent_orders = []
        orders = cursor.fetchall()
        
        for order in orders:
            recent_orders.append({
                'id': order[0],
                'username': order[1],
                'customer': order[2],
                'amount': f"₹{order[3]}",
                'status': order[4],
                'date': order[5]
            })
        
        stats['recent_orders'] = recent_orders
        
        # Today's orders count
        cursor.execute("""
            SELECT COUNT(*) FROM orders 
            WHERE DATE(created_at) = DATE('now')
        """)
        stats['today_orders'] = cursor.fetchone()[0]
        
        # Today's revenue
        cursor.execute("""
            SELECT SUM(total) FROM orders 
            WHERE DATE(created_at) = DATE('now')
        """)
        result = cursor.fetchone()[0]
        stats['today_revenue'] = f"₹{result}" if result else "₹0"
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    
    except Exception as e:
        app.logger.error(f"Error fetching shop stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if conn:
            conn.close()

# Create an inventory page route and API endpoints
@app.route("/shop/inventory")
def inventoryPage():
    return render_template('shop/inventory.html')

# API to get inventory data
@app.route('/api/shop/inventory', methods=['GET'])
def getInventory():
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Check if medicines table exists
        if is_sqlite(conn):
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='medicines'
            """)
        else:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'medicines'
                )
            """)
        
        table_exists = cursor.fetchone()
        if not table_exists or not table_exists[0]:
            # Create medicines table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS medicines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    composition TEXT,
                    price REAL NOT NULL,
                    category TEXT,
                    manufacturer TEXT,
                    description TEXT,
                    prescription_required BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            
            # Add sample data
            sample_medicines = [
                ('Paracetamol', 'Acetaminophen 500mg', 35.00, 'Painkillers', 'MediTech', 'For fever and pain relief', 0),
                ('Amoxicillin', 'Amoxicillin trihydrate 250mg', 120.00, 'Antibiotics', 'PharmaCare', 'For bacterial infections', 1),
                ('Vitamin D3', 'Cholecalciferol 60,000 IU', 150.00, 'Vitamins', 'HealthPlus', 'Weekly vitamin supplement', 0),
                ('Omeprazole', 'Omeprazole 20mg', 90.00, 'Antacids', 'DigestCare', 'For acidity and heartburn', 0),
                ('Cetirizine', 'Cetirizine HCl 10mg', 45.00, 'Antihistamines', 'AllergyMed', 'For allergies and cold', 0)
            ]
            
            cursor.executemany("""
                INSERT INTO medicines (name, composition, price, category, manufacturer, description, prescription_required)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, sample_medicines)
            conn.commit()
        
        # Fetch all medicines
        cursor.execute("SELECT * FROM medicines ORDER BY name")
        medicines = cursor.fetchall()
        
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        # Convert to dictionary list
        medicines_list = []
        for medicine in medicines:
            medicine_dict = {}
            for i, value in enumerate(medicine):
                column_name = column_names[i]
                # Format price with currency symbol
                if column_name == 'price':
                    medicine_dict[column_name] = f"₹{value:.2f}"
                else:
                    medicine_dict[column_name] = value
            medicines_list.append(medicine_dict)
        
        return jsonify({
            'success': True,
            'medicines': medicines_list
        })
    
    except Exception as e:
        app.logger.error(f"Error fetching inventory: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/shop/inventory/<int:medicine_id>', methods=['GET'])
def getMedicine(medicine_id):
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM medicines WHERE id = ?", (medicine_id,))
        medicine = cursor.fetchone()
        
        if not medicine:
            return jsonify({
                'success': False,
                'error': 'Medicine not found'
            }), 404
        
        # Get column names
        column_names = [description[0] for description in cursor.description]
        
        # Convert to dictionary
        medicine_dict = {}
        for i, value in enumerate(medicine):
            column_name = column_names[i]
            # Format price with currency symbol
            if column_name == 'price':
                medicine_dict[column_name] = f"₹{value:.2f}"
            else:
                medicine_dict[column_name] = value
        
        return jsonify({
            'success': True,
            'medicine': medicine_dict
        })
    
    except Exception as e:
        app.logger.error(f"Error fetching medicine: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/shop/inventory', methods=['POST'])
def addMedicine():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'price']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Extract data
        name = data.get('name')
        composition = data.get('composition', '')
        price = float(data.get('price', 0))
        category = data.get('category', '')
        manufacturer = data.get('manufacturer', '')
        description = data.get('description', '')
        prescription_required = 1 if data.get('prescription_required') == 'Yes' else 0
        
        # Insert medicine
        cursor.execute("""
            INSERT INTO medicines (name, composition, price, category, manufacturer, description, prescription_required)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, composition, price, category, manufacturer, description, prescription_required))
        
        conn.commit()
        medicine_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Medicine added successfully',
            'medicine_id': medicine_id
        })
    
    except Exception as e:
        app.logger.error(f"Error adding medicine: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/shop/inventory/<int:medicine_id>', methods=['PUT'])
def updateMedicine(medicine_id):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'price']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Check if medicine exists
        cursor.execute("SELECT id FROM medicines WHERE id = ?", (medicine_id,))
        medicine = cursor.fetchone()
        
        if not medicine:
            return jsonify({
                'success': False,
                'error': 'Medicine not found'
            }), 404
        
        # Extract data
        name = data.get('name')
        composition = data.get('composition', '')
        price = float(data.get('price', 0))
        category = data.get('category', '')
        manufacturer = data.get('manufacturer', '')
        description = data.get('description', '')
        prescription_required = 1 if data.get('prescription_required') == 'Yes' else 0
        
        # Update medicine
        cursor.execute("""
            UPDATE medicines SET
                name = ?,
                composition = ?,
                price = ?,
                category = ?,
                manufacturer = ?,
                description = ?,
                prescription_required = ?
            WHERE id = ?
        """, (name, composition, price, category, manufacturer, description, prescription_required, medicine_id))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Medicine updated successfully'
        })
    
    except Exception as e:
        app.logger.error(f"Error updating medicine: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if conn:
            conn.close()

@app.route('/api/shop/inventory/<int:medicine_id>', methods=['DELETE'])
def deleteMedicine(medicine_id):
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Check if medicine exists
        cursor.execute("SELECT id FROM medicines WHERE id = ?", (medicine_id,))
        medicine = cursor.fetchone()
        
        if not medicine:
            return jsonify({
                'success': False,
                'error': 'Medicine not found'
            }), 404
        
        # Delete medicine
        cursor.execute("DELETE FROM medicines WHERE id = ?", (medicine_id,))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Medicine deleted successfully'
        })
    
    except Exception as e:
        app.logger.error(f"Error deleting medicine: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if conn:
            conn.close()

# Shop API search for orders and medicines
@app.route('/api/shop/search')
def shopSearch():
    conn = None
    cursor = None
    try:
        query = request.args.get('q', '').strip()
        search_type = request.args.get('type', 'all')  # all, orders, medicines
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Search query is required'
            }), 400
        
        conn = connect_to_db()
        cursor = conn.cursor()
        
        results = {
            'orders': [],
            'medicines': []
        }
        
        # Search orders if type is 'all' or 'orders'
        if search_type in ['all', 'orders']:
            try:
                # Search by order ID, customer name, or username
                cursor.execute("""
                    SELECT id, username, name, total, status, created_at 
                    FROM orders 
                    WHERE id LIKE ? OR username LIKE ? OR name LIKE ? OR contact LIKE ?
                    ORDER BY created_at DESC
                    LIMIT 10
                """, (f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%'))
                
                orders = cursor.fetchall()
                
                for order in orders:
                    results['orders'].append({
                        'id': order[0],
                        'username': order[1],
                        'customer': order[2],
                        'amount': f"₹{order[3]}",
                        'status': order[4],
                        'date': order[5]
                    })
            except Exception as e:
                app.logger.error(f"Error searching orders: {str(e)}")
                # Continue with medicines search even if orders search fails
        
        # Search medicines if type is 'all' or 'medicines'
        if search_type in ['all', 'medicines']:
            try:
                # Check if medicines table exists
                if is_sqlite(conn):
                    cursor.execute("""
                        SELECT name FROM sqlite_master 
                        WHERE type='table' AND name='medicines'
                    """)
                else:
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = 'medicines'
                        )
                    """)
                
                table_exists = cursor.fetchone()
                if table_exists and table_exists[0]:
                    # Search by medicine name, composition, or category
                    cursor.execute("""
                        SELECT id, name, composition, price, category, manufacturer 
                        FROM medicines 
                        WHERE name LIKE ? OR composition LIKE ? OR category LIKE ?
                        ORDER BY name ASC
                        LIMIT 10
                    """, (f'%{query}%', f'%{query}%', f'%{query}%'))
                    
                    medicines = cursor.fetchall()
                    
                    for medicine in medicines:
                        results['medicines'].append({
                            'id': medicine[0],
                            'name': medicine[1],
                            'composition': medicine[2] or '-',
                            'price': f"₹{medicine[3]:.2f}",
                            'category': medicine[4] or '-'
                        })
            except Exception as e:
                app.logger.error(f"Error searching medicines: {str(e)}")
        
        return jsonify({
            'success': True,
            'results': results
        })
    
    except Exception as e:
        app.logger.error(f"Error in shop search: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
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
            except:
                pass

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
def getInventoryAPI():
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

# Rename this function to avoid duplicate route
@app.get("/api/customer/inventory")
def getCustomerInventory():
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
        
        # Check what database system we're using (SQLite or PostgreSQL)
        try:
            # Try PostgreSQL syntax first
            cursor.execute("SELECT to_regclass('public.orders')")
            result = cursor.fetchone()
            if not result or not result[0]:
                # If PostgreSQL query fails or returns null, try SQLite approach
                raise Exception("Table not found or PostgreSQL query failed")
        except Exception as e:
            print(f"PostgreSQL check failed: {str(e)}, trying SQLite approach")
            try:
                # Check if the orders table exists using SQLite syntax
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'")
                if not cursor.fetchone():
                    print("Orders table doesn't exist")
                    # Return empty array for no orders instead of error
                    return jsonify([])
            except Exception as sqlite_error:
                print(f"SQLite check failed: {str(sqlite_error)}")
                # If both checks fail, return a generic response
                return jsonify([])
        
        try:
            # Get column names safely for any database
            try:
                cursor.execute("PRAGMA table_info(orders)")
                columns = [column[1] for column in cursor.fetchall()]
                print(f"SQLite columns: {columns}")
            except:
                # PostgreSQL approach
                cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'")
                columns = [column[0] for column in cursor.fetchall()]
                print(f"PostgreSQL columns: {columns}")
            
            # Default minimum columns that must exist
            basic_columns = ["orderid", "username", "time", "cart", "status", "total"]
            
            # Safely build query based on available columns
            select_columns = []
            for col in basic_columns:
                if col in columns:
                    select_columns.append(col)
                    
            # Add optional columns if they exist
            for extra_col in ["payment_method", "delivery_method", "name", "address", "contact"]:
                if extra_col in columns:
                    select_columns.append(extra_col)
            
            # If we couldn't determine columns, use a safe default set
            if not select_columns:
                select_columns = ["orderid", "username", "time", "cart", "status", "total"]
                
            columns_str = ", ".join(select_columns)
            
            # For Postgres, we need $1 style parameters
            if hasattr(conn, 'server_version'):  # Check if PostgreSQL
                query = f"""
                    SELECT {columns_str}
                    FROM orders
                    WHERE username = $1
                    ORDER BY time DESC
                """
                cursor.execute(query, (current_user,))
            else:  # SQLite
                query = f"""
                    SELECT {columns_str}
                    FROM orders
                    WHERE username = ?
                    ORDER BY time DESC
                """
                cursor.execute(query, (current_user,))
                
            orders = cursor.fetchall()
            
            if not orders:
                print(f"No orders found for user: {current_user}")
                return jsonify([])
            
            # Get column names from cursor description
            column_names = [desc[0] for desc in cursor.description]
            
            result = []
            for order in orders:
                # Create order dict based on column names
                order_dict = dict(zip(column_names, order))
                
                # Handle JSON parsing for cart
                try:
                    if 'cart' in order_dict and order_dict['cart']:
                        order_dict['cart'] = json.loads(order_dict['cart'])
                    else:
                        order_dict['cart'] = []
                except Exception as e:
                    print(f"Error parsing cart JSON for order {order_dict.get('orderid')}: {str(e)}")
                    order_dict['cart'] = []
                
                # Handle datetime objects
                if 'time' in order_dict and order_dict['time'] and hasattr(order_dict['time'], 'isoformat'):
                    order_dict['time'] = order_dict['time'].isoformat()
                
                result.append(order_dict)
            
            print(f"Successfully retrieved {len(result)} orders for user {current_user}")
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

@app.route('/api/user/orders/<orderid>', methods=['GET'])
@jwt_required()
def getOrderDetails(orderid):
    conn = None
    cursor = None
    try:
        print(f"Loading order details for order ID: {orderid}")
        current_user = get_jwt_identity()
        
        print(f"Fetching order details for User: {current_user}, Order ID: {orderid}")
        
        # Connect to the database
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Ensure the orders table exists
        ensure_orders_table_exists(conn)
        
        # Get the column information from the orders table
        if hasattr(conn, 'server_version'):  # PostgreSQL
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'orders'
            """)
            columns = [column[0] for column in cursor.fetchall()]
        else:  # SQLite
            cursor.execute("PRAGMA table_info(orders)")
            columns = [column[1] for column in cursor.fetchall()]
        
        # Construct the query based on available columns
        select_columns = ["orderid", "username", "time"]
        
        # Add required columns if they exist
        required_fields = ["name", "address", "contact", "cart", "total", "status"]
        for field in required_fields:
            if field in columns:
                select_columns.append(field)
        
        # Add optional columns if they exist
        for optional_field in ["payment_method", "delivery_method", "upi_id"]:
            if optional_field in columns:
                select_columns.append(optional_field)
                
        columns_str = ", ".join(select_columns)
        
        # Query the database for the order
        if hasattr(conn, 'server_version'):  # PostgreSQL
            query = f"""
                SELECT {columns_str} 
                FROM orders 
                WHERE orderid = %s AND username = %s
            """
            cursor.execute(query, (orderid, current_user))
        else:  # SQLite
            query = f"""
                SELECT {columns_str} 
                FROM orders 
                WHERE orderid = ? AND username = ?
            """
            cursor.execute(query, (orderid, current_user))
            
        order = cursor.fetchone()
        
        if not order:
            print(f"No order found with ID: {orderid} for user: {current_user}")
            return jsonify({"error": "Order not found"}), 404
            
        # Prepare the order data for JSON response
        column_names = [desc[0] for desc in cursor.description]
        order_dict = dict(zip(column_names, order))
        
        # Handle JSON parsing for cart
        try:
            if 'cart' in order_dict and order_dict['cart']:
                order_dict['cart'] = json.loads(order_dict['cart'])
            else:
                order_dict['cart'] = []
        except Exception as e:
            print(f"Error parsing cart JSON for order {orderid}. Raw cart data: {order_dict.get('cart')}")
            print(f"Error details: {str(e)}")
            order_dict['cart'] = []
            
        # Handle datetime objects
        if 'time' in order_dict and order_dict['time'] and hasattr(order_dict['time'], 'isoformat'):
            order_dict['time'] = order_dict['time'].isoformat()
            
        print(f"Successfully retrieved order details for Order ID: {orderid}")
        return jsonify(order_dict)
        
    except Exception as e:
        print(f"Error in getOrderDetails: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An unexpected error occurred while fetching order details"}), 500
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
            except:
                pass

@app.route('/api/user/orders/<orderid>/cancel', methods=['POST'])
@jwt_required()
def cancelOrder(orderid):
    conn = None
    cursor = None
    try:
        print(f"Processing cancellation request for order ID: {orderid}")
        current_user = get_jwt_identity()
            
        print(f"User {current_user} is attempting to cancel order {orderid}")
        
        # Connect to database
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Ensure orders table exists
        ensure_orders_table_exists(conn)
        
        # Query the database to check if the order exists and belongs to the user
        if hasattr(conn, 'server_version'):  # PostgreSQL
            cursor.execute("SELECT status FROM orders WHERE orderid = %s AND username = %s", 
                          (orderid, current_user))
        else:  # SQLite
            cursor.execute("SELECT status FROM orders WHERE orderid = ? AND username = ?", 
                          (orderid, current_user))
            
        order = cursor.fetchone()
        
        if not order:
            print(f"No order found with ID: {orderid} for user: {current_user}")
            return jsonify({"error": "Order not found", "success": False}), 404
            
        current_status = order[0]
        print(f"Current order status: {current_status}")
        
        # Check if the order can be cancelled (only pending orders can be cancelled)
        if current_status.lower() not in ['pending', 'order received', 'processing']:
            msg = f"Cannot cancel order with status: {current_status}"
            print(msg)
            return jsonify({"error": msg, "success": False}), 400
            
        # Update the order status to cancelled
        try:
            if hasattr(conn, 'server_version'):  # PostgreSQL
                cursor.execute("UPDATE orders SET status = %s WHERE orderid = %s AND username = %s", 
                              ('Order Cancelled', orderid, current_user))
            else:  # SQLite
                cursor.execute("UPDATE orders SET status = ? WHERE orderid = ? AND username = ?", 
                              ('Order Cancelled', orderid, current_user))
                
            conn.commit()
            print(f"Order {orderid} successfully cancelled")
            return jsonify({"message": "Order cancelled successfully", "success": True})
        except Exception as e:
            conn.rollback()
            print(f"Error cancelling order: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Database error while cancelling order: {str(e)}", "success": False}), 500
            
    except Exception as e:
        print(f"Error in cancelOrder: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An unexpected error occurred: {str(e)}", "success": False}), 500
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
            except:
                pass

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

# API endpoint to handle medicine requests
@app.route('/api/requests', methods=['POST'])
@validate_token_api
def create_medicine_request():
    try:
        # Get request data
        request_data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'name', 'phone', 'email']
        for field in required_fields:
            if field not in request_data or not request_data[field]:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        # Get user ID if authenticated
        user_id = None
        if g.user and 'username' in g.user:
            user_id = g.user['username']
        
        # Connect to database
        conn = connect_to_db()
        
        # Add to database
        data = {
            'title': request_data['title'],
            'description': request_data['description'],
            'name': request_data['name'],
            'phone': request_data['phone'],
            'email': request_data['email'],
            'urgency': request_data.get('urgency', 'normal'),
            'status': 'pending',
            'created_at': request_data.get('created_at', None)
        }
        
        result = insert(conn, 'medicine_requests', data)
        conn.close()
        
        if result['res'] == 0:
            return jsonify({'success': False, 'message': 'Failed to save request'}), 500
        
        # Send email notification
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Set up the email details
            sender_email = os.getenv('EMAIL_SENDER', 'noreply@mediease.com')
            receiver_email = "ayushmishra.pi@gmail.com"  # Admin email for notifications
            
            # Create the email
            message = MIMEMultipart()
            message["From"] = sender_email
            message["To"] = receiver_email
            message["Subject"] = f"New Medicine Request: {request_data['title']} ({request_data.get('urgency', 'normal')})"
            
            # Email body
            body = f"""
            <html>
            <body>
                <h2>New Medicine Request</h2>
                <p><strong>Title:</strong> {request_data['title']}</p>
                <p><strong>Description:</strong> {request_data['description']}</p>
                <p><strong>From:</strong> {request_data['name']}</p>
                <p><strong>Contact:</strong> {request_data['phone']}</p>
                <p><strong>Email:</strong> {request_data['email']}</p>
                <p><strong>Urgency:</strong> {request_data.get('urgency', 'normal')}</p>
                <p><strong>Submitted:</strong> {request_data.get('created_at', 'now')}</p>
            </body>
            </html>
            """
            
            # Attach the body to the email
            message.attach(MIMEText(body, "html"))
            
            # Send the email
            try:
                # Connect to the SMTP server
                server = smtplib.SMTP(os.getenv('SMTP_SERVER', 'smtp.gmail.com'), os.getenv('SMTP_PORT', 587))
                server.starttls()  # Secure the connection
                server.login(os.getenv('EMAIL_USER', ''), os.getenv('EMAIL_PASSWORD', ''))
                
                # Send the email
                server.send_message(message)
                server.quit()
                print("Email notification sent successfully")
            except Exception as email_error:
                print(f"Failed to send email notification: {str(email_error)}")
                # Don't fail the request if email fails, just log it
                pass
                
        except Exception as email_error:
            print(f"Error setting up email: {str(email_error)}")
            # Continue even if email fails
        
        return jsonify({'success': True, 'message': 'Request submitted successfully'}), 201
    
    except Exception as e:
        print(f"Error creating medicine request: {str(e)}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

# API endpoint to handle prescription uploads
@app.route('/api/prescriptions/upload', methods=['POST'])
@jwt_required()
def upload_prescription():
    try:
        # Get user details from access token
        user_id = get_jwt_identity()
        
        # Check if the post request has the file part
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part in the request'}), 400
            
        file = request.files['file']
        
        # If user does not select a file, browser also submits an empty part without filename
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected for upload'}), 400
            
        # Get other form data
        notes = request.form.get('notes', '')
        address = request.form.get('address', '')
        contact = request.form.get('contact', '')
        priority = request.form.get('priority', 'normal')
        
        # Check if required fields are present
        if not address or not contact:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
            
        # Make sure the filename is secure
        import os
        from werkzeug.utils import secure_filename
        
        # Define allowed extensions
        ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
        
        # Check if the file extension is allowed
        if not '.' in file.filename or file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
            return jsonify({'success': False, 'message': 'File type not allowed. Please upload PDF, PNG, or JPG.'}), 400
            
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join('static', 'uploads', 'prescriptions')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate a unique filename
        import uuid
        secure_name = secure_filename(file.filename)
        file_extension = secure_name.rsplit('.', 1)[1].lower()
        unique_filename = f"{user_id}_{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Save to database
        conn = connect_to_db()
        
        # Add to database
        data = {
            'username': user_id,
            'file_path': file_path,
            'notes': notes,
            'address': address,
            'contact': contact,
            'priority': priority,
            'status': 'pending'
        }
        
        result = insert(conn, 'prescriptions', data)
        conn.close()
        
        if result['res'] == 0:
            return jsonify({'success': False, 'message': 'Failed to save prescription data'}), 500
            
        # Send email notification
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Set up the email details
            sender_email = os.getenv('EMAIL_SENDER', 'noreply@mediease.com')
            receiver_email = "ayushmishra.pi@gmail.com"  # Admin email for notifications
            
            # Create the email
            message = MIMEMultipart()
            message["From"] = sender_email
            message["To"] = receiver_email
            message["Subject"] = f"New Prescription Upload ({priority.capitalize()} Priority)"
            
            # Email body
            body = f"""
            <html>
            <body>
                <h2>New Prescription Upload</h2>
                <p><strong>User:</strong> {user_id}</p>
                <p><strong>Delivery Address:</strong> {address}</p>
                <p><strong>Contact:</strong> {contact}</p>
                <p><strong>Priority:</strong> {priority}</p>
                <p><strong>Notes:</strong> {notes}</p>
                <p><strong>File Path:</strong> {file_path}</p>
                <p><strong>Submitted:</strong> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </body>
            </html>
            """
            
            # Attach the body to the email
            message.attach(MIMEText(body, "html"))
            
            # Send the email
            try:
                # Connect to the SMTP server
                server = smtplib.SMTP(os.getenv('SMTP_SERVER', 'smtp.gmail.com'), int(os.getenv('SMTP_PORT', 587)))
                server.starttls()  # Secure the connection
                server.login(os.getenv('EMAIL_USER', ''), os.getenv('EMAIL_PASSWORD', ''))
                
                # Send the email
                server.send_message(message)
                server.quit()
                print("Email notification sent successfully")
            except Exception as email_error:
                print(f"Failed to send email notification: {str(email_error)}")
                # Don't fail the request if email fails, just log it
                pass
                
        except Exception as email_error:
            print(f"Error setting up email: {str(email_error)}")
            # Continue even if email fails
        
        return jsonify({
            'success': True, 
            'message': 'Prescription uploaded successfully!',
            'file_path': file_path
        }), 201
        
    except Exception as e:
        print(f"Error uploading prescription: {str(e)}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

'''
MAIN FUNCTION
'''
if __name__ == "__main__":
    # Get port from environment variable
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
