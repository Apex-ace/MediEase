<p align="center">
  <a href="https://https://github.com/DebRC/Mediko">
    <img src="static/customer/mediko_logo.png" alt="Logo" width="120" height="150">
  </a>
  <p align="center">
  <i><b>A Full Stack Online Medicine Shop web platform with two interfaces for searching and buying for customers, accepting and tracking orders for shop owners.<br>
  </b></i>
  </p>
</p>

### Functionalities
* JWT is used for customer-side authentication and to distinguish users.
* Python (Flask) is used in the backend as the primary language.
* HTML/CSS is used as the primary front-end language. Javascript is used for API calls and rendering dynamic data.
* Postgres is used as the database.
* Cart is stored in the browser cache using localStorage of Javascript.
* Bcrypt hashing algorithm is used to store the password in the database.
* Customer can sign-up, login, logout, place and track orders.
* Shop owners can track orders and update their status.

### How JWT Works? 
![image](https://github.com/DebRC/Mediko/assets/63597606/fd2ee2b2-8817-47ac-b3cd-a9ce3842dd83)

### Requirements/Steps to run 
  * Install [*Python*](https://www.python.org/downloads/)
  * Install [*Postgres*](https://www.postgresql.org/download/)
  * Create a database "mediko"
  * Configure .env file in root directory of project
  * Run 'pip install -r requirements.txt'
  * Run python3 app.py

### Improvements / Future Work
* Adding inventory management from the shop interface. Owners can add, delete or update the stock of medicines in the shop.
* Customers can request cancellation from the customer's end.
* Categorize medicines based on it's composition. Provide a better interface for medicine search.
