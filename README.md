<p align="center">
  <h1 align="center">MediEase</h1>
  <p align="center">
  <i><b>A Full Stack Online Pharmacy Platform with integrated AI chatbot, video consultations, and inventory management</b></i>
  </p>
</p>

### Features
* Customer Interface for browsing and ordering medicines
* Shop Interface for inventory management and order tracking
* AI-powered chatbot for customer support using Mistral AI
* Video consultation feature using Jitsi Meet API
* Real-time inventory management system
* Secure authentication using JWT tokens
* Responsive design with mobile-friendly UI
* Dark mode support

### Technology Stack
* **Backend**: Python (Flask)
* **Frontend**: HTML, CSS, JavaScript
* **Database**: PostgreSQL
* **Authentication**: JWT + bcrypt
* **AI**: Mistral AI API integration
* **Video**: Jitsi Meet API
* **Deployment**: Render-ready

### Requirements/Steps to Run Locally
* Install [*Python*](https://www.python.org/downloads/) (3.10+ recommended)
* Install [*PostgreSQL*](https://www.postgresql.org/download/)
* Clone this repository
* Create a database for the application
* Configure `.env` file in root directory (see Environment Variables below)
* Run `pip install -r requirements.txt`
* Run `python run_app.py` to start both the main app and chatbot server

### Environment Variables
```
PORT=5000
CHATBOT_PORT=5001
POSTGRES_HOST=your_host
POSTGRES_DATABASE=your_db
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432
JWT_SECRET_KEY=your_secret_key
FLASK_ENV=development
MISTRAL_API_KEY=your_mistral_api_key
```

### Deployment to Render
This project is configured for deployment on Render:

1. Create a new Web Service on Render pointing to your repository
2. Select "Python" as the environment
3. Set the build command to `pip install -r requirements.txt`
4. Set the start command to `gunicorn app:app --bind 0.0.0.0:$PORT`
5. Add all the required environment variables
6. Create a separate "Worker" service for the chatbot using the same repository
7. Use `gunicorn chatbot_server:app --bind 0.0.0.0:$CHATBOT_PORT` as the start command for the worker

Alternatively, you can use the included `render.yaml` file for a Blueprint deployment.

### New Features
* **AI Chatbot**: Intelligent customer support using Mistral AI
* **Video Consultations**: Connect with healthcare professionals remotely
* **Real-time Inventory**: View medicine stock and availability
* **Mobile Responsive**: Fully responsive with hamburger menu for mobile devices
* **Enhanced UI**: Modern interface with theme support

### Improvements / Future Work
* Integration with payment gateways
* Prescription upload and verification
* Push notifications for order updates
* Analytics dashboard for shop owners
* Appointment scheduling system
