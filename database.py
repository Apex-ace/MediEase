from dotenv import load_dotenv
import psycopg2
import os
import csv

# Loads the env file
load_dotenv()

# Make connection to database
def connect_to_db():
    conn = psycopg2.connect(
    host=os.getenv("POSTGRES_HOST"),
    database=os.getenv("POSTGRES_DATABASE"),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'),
    port=os.getenv('POSTGRES_PORT', '5432'),
    sslmode='require')

    return conn

# Initialise the database [ Make tables and populate data]
def init_db(conn):
    response=initCustomerAuthTable(conn)
    if(response["res"]==0):
        return {"res": 0, "message": "INIT customerAuth Table Failure"}
    response=initMedicineDatabase(conn)
    if(response["res"]==0):
        return {"res": 0, "message": "INIT medicines Table Failure"}
    response=initOrdersDatabase(conn)
    if(response["res"]==0):
        return {"res": 0, "message": "INIT orders Table Failure"}
    return {"res": 1, "message": "INIT Success"}

# Standard Insert Query
def insert(conn, table, data):
    columns = ', '.join(data.keys())
    placeholders = ', '.join(['%s'] * len(data))
    values = tuple(data.values())
    query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query, values)
                return {"res": 1, "message": "Insertion Success"}
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Insertion Failure"}

# Standard Update Query
def update(conn, table, data, condition=None):
    set=[]
    for col in data:
        set.append(f"{col}='{data[col]}'")
    set=",".join(set)
    query = f"UPDATE {table} SET {set}"
    if(condition):
        query += f" WHERE {condition}"

    query+=";"
    print(query)
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                return {"res": 1, "message": "Update Success"}
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Update Failure"}
    
# Standard Select Query
def select(conn, table, columns=None, condition=None, desc=False, limit=None):
    if columns:
        columns_str = ', '.join(columns)
    else:
        columns_str = '*'

    query = f"SELECT {columns_str} FROM {table}"
    
    if condition:
        query += f" WHERE {condition}"
    if desc:
        query += f" ORDER BY DESC"
    if limit:
        query += f" LIMIT {limit}"

    query+=";"
    print(query)
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                result = cursor.fetchall()
                if(len(result)==0):
                    return {"res": 1, "message": "Selection Success: NULL Result", "result": []}
                else:
                    return {"res": 1, "message": "Selection Success: Valid Result", "result": result}
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Selection Failure"}

# Initialise the Customer Auth Table
def initCustomerAuthTable(conn):
    query = '''
    CREATE TABLE IF NOT EXISTS customerAuth 
    (username TEXT PRIMARY KEY, password TEXT);'''
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
        return {"res": 1, "message": "Table Creation Successful"}
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Table Creation Unsuccessful"}

# Initialise the Medicine Table
def initMedicineDatabase(conn):
    query = '''CREATE TABLE IF NOT EXISTS medicines
      (id SERIAL PRIMARY KEY,
       name TEXT NOT NULL,
       composition TEXT NOT NULL,
       price TEXT NOT NULL,
       manufacturer TEXT,
       description TEXT,
       category TEXT,
       side_effects TEXT);'''
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Table Creation Unsuccessful"}
    # response=select(conn, table="medicines")

    query = '''SELECT COUNT(*) FROM medicines;'''
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                if(cursor.fetchone()[0]!=0):
                    return {"res": 1, "message": "Table Creation Successful"}
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Table Creation Unsuccessful"}

    medFile=open("extras/medicine_data.csv", mode="r", newline="")
    medFileReader=csv.reader(medFile)
    next(medFileReader)
    for row in medFileReader:
        price=row[3]
        if(price==""):
            price="50"
        data={
            "category":row[0],
            "name":row[1],
            "composition":row[2],
            "price":price,
            "manufacturer":row[4],
            "description":row[5],
            "side_effects":row[6],
        }
        response=insert(conn,"medicines",data)
        if(response["res"]==0):
            query = '''DROP TABLE medicines;'''
            with conn:
                with conn.cursor() as cursor:
                    cursor.execute(query)
            return {"res": 0, "message": "Table Creation Unsuccessful"}
    return {"res": 1, "message": "Table Creation Successful"}

# Initialise the Order Table
def initOrdersDatabase(conn):
    query = '''
    CREATE TABLE IF NOT EXISTS orders 
    (orderid SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    time TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact VARCHAR(20),
    cart TEXT,
    status VARCHAR(20) NOT NULL,
    total FLOAT NOT NULL DEFAULT 0);'''
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
        return {"res": 1, "message": "Table Creation Successful"}
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Table Creation Unsuccessful"}

# Initialise the User Profile Table
def initUserProfileTable(conn):
    query = '''
    CREATE TABLE IF NOT EXISTS user_profiles 
    (username TEXT PRIMARY KEY REFERENCES customerAuth(username),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP);'''
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
        return {"res": 1, "message": "Table Creation Successful"}
    except Exception as e:
        print(e)
        return {"res": 0, "message": "Table Creation Unsuccessful"}