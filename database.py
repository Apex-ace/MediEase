from dotenv import load_dotenv
import psycopg2
import os 

load_dotenv()

def connect_to_db():
    conn = psycopg2.connect(
    host=os.getenv("POSTGRES_HOST"),
    database=os.getenv("POSTGRES_DATABASE"),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'))

    return conn

def init_db(conn):
    CREATE_CUSTOMER_AUTH_TABLE = "CREATE TABLE IF NOT EXISTS customerAuth (username TEXT PRIMARY KEY, password TEXT);"
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(CREATE_CUSTOMER_AUTH_TABLE)
        return {"res": 1, "message": "Table Creation Successful"}
    except:
        return {"res": 0, "message": "Table Creation Unsuccessful"}

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
    except:
        return {"res": 0, "message": "Insertion Failure"}
    

def select(conn, table, columns=None, condition=None, desc=False):
    if columns:
        columns_str = ', '.join(columns)
    else:
        columns_str = '*'

    query = f"SELECT {columns_str} FROM {table}"
    
    if condition:
        query += f" WHERE {condition}"
    if desc:
        query += f" ORDER BY DESC"

    query+=";"
    print(query)
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                result = cursor.fetchall()
                if(len(result)!=1):
                    return {"res": 0, "message": "Selection Success: NULL Result"}
                else:
                    return {"res": 1, "message": "Selection Success: Valid Result", "result": result[0]}
    except:
        return {"res": 0, "message": "Selection Failure"}