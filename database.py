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
    try:
        # Rollback any existing transaction to start clean
        conn.rollback()
        
        response=initCustomerAuthTable(conn)
        if(response["res"]==0):
            return {"res": 0, "message": "INIT customerAuth Table Failure"}
        response=initMedicineDatabase(conn)
        if(response["res"]==0):
            return {"res": 0, "message": "INIT medicines Table Failure"}
        response=initOrdersDatabase(conn)
        if(response["res"]==0):
            return {"res": 0, "message": "INIT orders Table Failure"}
        response=initUserProfileTable(conn)
        if(response["res"]==0):
            return {"res": 0, "message": "INIT user_profiles Table Failure"}
        response=initRemindersTable(conn)
        if(response["res"]==0):
            return {"res": 0, "message": "INIT medication_reminders Table Failure"}
        response=initRequestsTable(conn)
        if(response["res"]==0):
            return {"res": 0, "message": "INIT medicine_requests Table Failure"}
        return {"res": 1, "message": "INIT Success"}
    except Exception as e:
        # If any unhandled exception occurs, ensure we rollback
        try:
            conn.rollback()
        except:
            pass
        print(f"Error in init_db: {str(e)}")
        return {"res": 0, "message": f"INIT Failure: {str(e)}"}

# Standard Insert Query
def insert(conn, table, data):
    cursor = None
    try:
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))
        values = tuple(data.values())
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
        return {"res": 1, "message": "Insertion Success"}
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Insertion error: {str(e)}")
        return {"res": 0, "message": f"Insertion Failure: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

# Standard Update Query
def update(conn, table, data, condition=None):
    cursor = None
    try:
        set_values = []
        values = []
        for col, val in data.items():
            set_values.append(f"{col}=%s")
            values.append(val)
        
        set_clause = ",".join(set_values)
        query = f"UPDATE {table} SET {set_clause}"
        
        if condition:
            query += f" WHERE {condition}"
        
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
        return {"res": 1, "message": "Update Success"}
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Update error: {str(e)}")
        return {"res": 0, "message": f"Update Failure: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass
    
# Standard Select Query
def select(conn, table, columns=None, condition=None, desc=False, limit=None):
    cursor = None
    try:
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

        print(f"Executing query: {query}")
        cursor = conn.cursor()
        cursor.execute(query)
        result = cursor.fetchall()
        
        if len(result) == 0:
            return {"res": 1, "message": "Selection Success: NULL Result", "result": []}
        else:
            return {"res": 1, "message": "Selection Success: Valid Result", "result": result}
    except Exception as e:
        print(f"Selection error: {str(e)}")
        return {"res": 0, "message": f"Selection Failure: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

# Initialise the Customer Auth Table
def initCustomerAuthTable(conn):
    cursor = None
    try:
        query = '''
        CREATE TABLE IF NOT EXISTS customerAuth 
        (username TEXT PRIMARY KEY, password TEXT);'''
        
        cursor = conn.cursor()
        cursor.execute(query)
        conn.commit()
        return {"res": 1, "message": "Table Creation Successful"}
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Error creating customerAuth table: {str(e)}")
        return {"res": 0, "message": f"Table Creation Unsuccessful: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

# Initialise the Medicine Table
def initMedicineDatabase(conn):
    cursor = None
    try:
        query = '''CREATE TABLE IF NOT EXISTS medicines
          (id SERIAL PRIMARY KEY,
           name TEXT NOT NULL,
           composition TEXT NOT NULL,
           price TEXT NOT NULL,
           manufacturer TEXT,
           description TEXT,
           category TEXT,
           side_effects TEXT);'''
        
        cursor = conn.cursor()
        cursor.execute(query)
        conn.commit()
        
        # Check if table has data
        cursor.execute('''SELECT COUNT(*) FROM medicines;''')
        if(cursor.fetchone()[0] != 0):
            return {"res": 1, "message": "Table Creation Successful"}
            
        # Load data from CSV if table is empty
        medFile = open("extras/medicine_data.csv", mode="r", newline="")
        medFileReader = csv.reader(medFile)
        next(medFileReader)  # Skip header
        
        # Prepare for batch insert
        insert_query = '''
            INSERT INTO medicines
            (category, name, composition, price, manufacturer, description, side_effects)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        '''
        batch_data = []
        
        for row in medFileReader:
            price = row[3] if row[3] else "50"
            batch_data.append((
                row[0],  # category
                row[1],  # name
                row[2],  # composition
                price,   # price
                row[4],  # manufacturer
                row[5],  # description
                row[6],  # side_effects
            ))
        
        # Execute batch insert
        cursor.executemany(insert_query, batch_data)
        conn.commit()
        medFile.close()
        
        return {"res": 1, "message": "Table Creation and Data Load Successful"}
        
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Error initializing medicines table: {str(e)}")
        return {"res": 0, "message": f"Table Creation Unsuccessful: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

# Initialise the Order Table
def initOrdersDatabase(conn):
    cursor = None
    try:
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
        
        cursor = conn.cursor()
        cursor.execute(query)
        conn.commit()
        return {"res": 1, "message": "Table Creation Successful"}
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Error creating orders table: {str(e)}")
        return {"res": 0, "message": f"Table Creation Unsuccessful: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

# Initialise the User Profile Table
def initUserProfileTable(conn):
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_profiles (
                username VARCHAR(50) PRIMARY KEY,
                full_name VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                FOREIGN KEY (username) REFERENCES customerAuth(username)
            )
        ''')
        conn.commit()
        return {"res": 1, "message": "INIT user_profiles Table Success"}
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Error initializing user_profiles table: {str(e)}")
        return {"res": 0, "message": f"INIT user_profiles Table Failure: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

def initRemindersTable(conn):
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS medication_reminders (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                medication_name VARCHAR(100),
                dosage VARCHAR(50),
                time VARCHAR(20),
                frequency VARCHAR(20),
                notes TEXT,
                FOREIGN KEY (username) REFERENCES customerAuth(username)
            )
        ''')
        conn.commit()
        return {"res": 1, "message": "INIT medication_reminders Table Success"}
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Error initializing medication_reminders table: {str(e)}")
        return {"res": 0, "message": f"INIT medication_reminders Table Failure: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass

# Initialize the Medicine Requests Table
def initRequestsTable(conn):
    cursor = None
    try:
        query = '''
        CREATE TABLE IF NOT EXISTS medicine_requests (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            urgency TEXT DEFAULT 'normal',
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP
        );'''
        
        cursor = conn.cursor()
        cursor.execute(query)
        conn.commit()
        return {"res": 1, "message": "Table Creation Successful"}
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Error creating medicine_requests table: {str(e)}")
        return {"res": 0, "message": f"Table Creation Unsuccessful: {str(e)}"}
    finally:
        if cursor:
            try:
                cursor.close()
            except:
                pass