// Function to submit the login form
function submitLoginForm(event) {
    event.preventDefault();

    const form = document.getElementById('login-form');
    
    // Clear previous validation errors
    clearValidationErrors();

    // Get the credentials
    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

    // Basic form validation
    if (!username.trim()) {
        showValidationError('username', 'Username is required');
        return;
    }

    if (!password) {
        showValidationError('password', 'Password is required');
        return;
    }

    // Show loader during API call
    showLoader();

    // Call the login api with the credentials
    fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ "username": username, "password": password }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data["res"] == 0) {
                hideLoader();
                showValidationError('password', data["message"]);
            }
            else {
                // Store the returned accesstoken from server
                localStorage.setItem('accessToken', data["accessToken"]);
                
                // Set a success message for smooth visual transition
                showSuccessMessage('Login successful! Redirecting...');
                
                // Delay redirect for smooth transition
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error:', error);
            showValidationError('password', 'An error occurred. Please try again.');
        });
}

// Function to submit the signup form
function submitSignupForm(event) {
    event.preventDefault();

    const form = document.getElementById('signup-form');
    
    // Clear previous validation errors
    clearValidationErrors();

    // Get the credentials
    const username = form.querySelector('#username').value;
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;
    const termsCheck = form.querySelector('#termsCheck').checked;

    // Basic form validation
    if (!username.trim()) {
        showValidationError('username', 'Username is required');
        return;
    }

    if (!email.trim() || !isValidEmail(email)) {
        showValidationError('email', 'Please enter a valid email address');
        return;
    }

    if (!password) {
        showValidationError('password', 'Password is required');
        return;
    }

    if (password !== confirmPassword) {
        showValidationError('confirmPassword', 'Passwords do not match');
        return;
    }

    if (!termsCheck) {
        showValidationError('termsCheck', 'You must agree to the Terms & Conditions');
        return;
    }
    
    // Show loader during API call
    showLoader();

    // Call signup api with credentials as body
    fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify({ "username": username, "password": password }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data["res"] == 0) {
                hideLoader();
                showValidationError('username', data["message"]);
            }
            else {
                // Show success message before redirect
                showSuccessMessage('Account created successfully! Redirecting to login...');
                
                // Delay redirect for smooth transition
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
        })
        .catch(error => {
            hideLoader();
            console.error('Error:', error);
            showValidationError('username', 'An error occurred. Please try again.');
        });
}

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to show validation error
function showValidationError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('error');
        
        // Check if feedback element already exists
        let feedbackEl = field.nextElementSibling;
        if (feedbackEl && !feedbackEl.classList.contains('form-feedback')) {
            // If next element is not feedback, create a new one
            feedbackEl = document.createElement('div');
            feedbackEl.className = 'form-feedback error';
            field.parentNode.insertBefore(feedbackEl, field.nextSibling);
        } else if (!feedbackEl) {
            // If no next element, create a new feedback element
            feedbackEl = document.createElement('div');
            feedbackEl.className = 'form-feedback error';
            field.parentNode.appendChild(feedbackEl);
        }
        
        feedbackEl.textContent = message;
        feedbackEl.classList.add('error');
    }
}

// Function to show success message
function showSuccessMessage(message) {
    // Create a success message element
    const successEl = document.createElement('div');
    successEl.className = 'alert alert-success fade-in mt-3';
    successEl.textContent = message;
    
    // Find the form and append the message
    const form = document.querySelector('#login-form') || document.querySelector('#signup-form');
    if (form) {
        form.insertAdjacentElement('afterend', successEl);
    }
}

// Function to clear all validation errors
function clearValidationErrors() {
    // Remove all error classes
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
    
    // Remove all feedback elements
    const feedbackElements = document.querySelectorAll('.form-feedback');
    feedbackElements.forEach(el => el.remove());
}

// Function to create the loader element
function createLoaderElement() {
    if (!document.querySelector('.loader-overlay')) {
        const loaderOverlay = document.createElement('div');
        loaderOverlay.className = 'loader-overlay';
        
        const loader = document.createElement('div');
        loader.className = 'loader';
        
        // Add loading text
        const loadingText = document.createElement('p');
        loadingText.className = 'mt-3 text-primary fw-bold';
        loadingText.textContent = 'Loading...';
        
        loaderOverlay.appendChild(loader);
        loaderOverlay.appendChild(loadingText);
        document.body.appendChild(loaderOverlay);
    }
}

// Function to show the loader
function showLoader() {
    const loaderOverlay = document.querySelector('.loader-overlay');
    if (loaderOverlay) {
        loaderOverlay.classList.add('show');
    }
}

// Function to hide the loader
function hideLoader() {
    const loaderOverlay = document.querySelector('.loader-overlay');
    if (loaderOverlay) {
        loaderOverlay.classList.remove('show');
    }
}

// Function to logout
function logout(event) {
    event.preventDefault();

    // get the accesstoken from localstorage
    const accessToken = localStorage.getItem('accessToken');

    // Call the log out api with accesstoken
    fetch('/api/logout', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    })
        .then(async response => {
            if (!response.ok) {
                alert("User already logged out");
            }
            else {
                // Remove accesstoken and cart on logout
                alert((await response.json())["message"]);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('cart');
            }
            // Redirect to home
            window.location.href = '/';
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error);
        });
}

// Function to submit the signup form
function submitSearchForm(event) {
    event.preventDefault();

    const form = document.getElementById('search_bar');
    const key = form.querySelector('#content').value;
    window.location.href = '/search/'.concat(key);
    form.reset();
}

// Function to redirect to my account page from navbar
function redirectToMyAccount(event) {
    event.preventDefault();

    // Get the accesstoken
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        alert('Please log in to access your account.');
        window.location.href = '/login';
        return;
    }
    
    // Check if token is valid before redirecting
    try {
        // Check token format first
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
            console.error('Invalid token format');
            alert('Your login session appears to be invalid. Please log in again.');
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            return;
        }
        
        // Check if token might be expired by decoding it
        try {
            const payload = JSON.parse(atob(parts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < currentTime) {
                console.error('Token has expired');
                alert('Your login session has expired. Please log in again.');
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return;
            }
        } catch (error) {
            console.error('Error decoding token payload', error);
            // Continue anyway, server will validate
        }
        
        // Set token as cookie (it will be checked in the route)
        document.cookie = `access_token=${accessToken}; path=/`;
        
        // Redirect to my account page using the new route
        window.location.href = '/myaccount';
    } catch (error) {
        console.error('Error redirecting to account page:', error);
        alert('There was an error accessing your account. Please try logging in again.');
        window.location.href = '/login';
    }
}

// Function to show shop inventory
function showShopInventory(event) {
    event.preventDefault();
    
    // Check if user is logged in
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        // If not logged in, show alert and redirect to login page
        alert('Please log in to browse our shop inventory.');
        window.location.href = '/login';
        return;
    }
    
    // Redirect to shop page
    window.location.href = '/search/medicine';
}

// Dark Mode Toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if dark mode is enabled in localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    
    // Get the mode toggle button if it exists
    const modeToggleBtn = document.getElementById('modeToggleBtn');
    
    // Initialize dark mode if it was previously enabled
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        if (modeToggleBtn) {
            modeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // Add click event to the mode toggle button if it exists
    if (modeToggleBtn) {
        modeToggleBtn.addEventListener('click', function() {
            if (document.body.classList.contains('dark-mode')) {
                // Switch to light mode
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
                this.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                // Switch to dark mode
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
                this.innerHTML = '<i class="fas fa-sun"></i>';
            }
        });
    }
    
    // Initialize the chat bot button if it exists
    const chatBotBtn = document.getElementById('chatBotBtn');
    if (chatBotBtn) {
        chatBotBtn.addEventListener('click', function() {
            openChatBot();
        });
    }

    // Initialize loader
    createLoaderElement();
});

// Function to open the chat bot
function openChatBot() {
    // Create chat bot modal if it doesn't exist
    if (!document.getElementById('chatBotModal')) {
        const modal = document.createElement('div');
        modal.id = 'chatBotModal';
        modal.className = 'chat-bot-modal';
        modal.innerHTML = `
            <div class="chat-bot-content">
                <div class="chat-bot-header">
                    <div class="chat-bot-title">
                        <div class="chat-bot-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <h4>MediEase Assistant</h4>
                    </div>
                    <div class="chat-bot-controls">
                        <button class="minimize-btn" id="minimizeChatBot"><i class="fas fa-minus"></i></button>
                        <button class="close-btn" id="closeChatBot"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div class="chat-bot-body" id="chatBotBody">
                    <div class="bot-message">
                        <div class="message-content">
                            <p>Hello! I'm MediEase's AI assistant. How can I help you today?</p>
                            <div class="suggested-questions">
                                <p class="suggested-title">Try asking me about:</p>
                                <div class="suggested-buttons">
                                    <button class="suggested-btn" data-question="What medicines do you have for fever?">Medicines for fever</button>
                                    <button class="suggested-btn" data-question="How do I track my order?">Track my order</button>
                                    <button class="suggested-btn" data-question="What payment methods do you accept?">Payment methods</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chat-bot-footer">
                    <input type="text" id="chatBotInput" placeholder="Type your message...">
                    <button type="button" id="sendChatMsg" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add styles for the chat bot
        const style = document.createElement('style');
        style.textContent = `
            .chat-bot-modal {
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 380px;
                height: 550px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
                z-index: 1100;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transition: all 0.3s ease;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                opacity: 0;
                transform: translateY(20px);
                animation: fadeInUp 0.3s forwards;
            }
            
            @keyframes fadeInUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .chat-bot-modal.minimized {
                height: 60px;
                width: 200px;
                border-radius: 30px;
                overflow: hidden;
            }
            
            .chat-bot-modal.minimized .chat-bot-content {
                display: none;
            }
            
            .chat-bot-modal.minimized .chat-bot-header {
                height: 60px;
                border-radius: 30px;
                cursor: pointer;
            }
            
            body.dark-mode .chat-bot-modal {
                background: #2d2d2d;
                color: #f8f9fa;
            }
            
            .chat-bot-content {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .chat-bot-header {
                padding: 15px;
                background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
            }
            
            .chat-bot-title {
                display: flex;
                align-items: center;
            }
            
            .chat-bot-avatar {
                width: 36px;
                height: 36px;
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
            }
            
            .chat-bot-avatar i {
                font-size: 18px;
            }
            
            .chat-bot-header h4 {
                margin: 0;
                font-weight: 600;
            }
            
            .chat-bot-controls {
                display: flex;
                gap: 8px;
            }
            
            .chat-bot-controls button {
                background: transparent;
                border: none;
                color: white;
                font-size: 1rem;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            
            .chat-bot-controls button:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            
            .chat-bot-body {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                background-color: #f8f9fa;
                scroll-behavior: smooth;
            }
            
            body.dark-mode .chat-bot-body {
                background-color: #1e1e1e;
            }
            
            .chat-bot-footer {
                padding: 15px;
                display: flex;
                border-top: 1px solid #eee;
                background-color: white;
            }
            
            body.dark-mode .chat-bot-footer {
                border-top: 1px solid #444;
                background-color: #2d2d2d;
            }
            
            .chat-bot-footer input {
                flex: 1;
                padding: 12px 15px;
                border: 1px solid #ddd;
                border-radius: 30px;
                margin-right: 10px;
                font-size: 14px;
                transition: border-color 0.3s;
            }
            
            .chat-bot-footer input:focus {
                outline: none;
                border-color: #4e73df;
            }
            
            body.dark-mode .chat-bot-footer input {
                background: #1e1e1e;
                color: #f8f9fa;
                border: 1px solid #444;
            }
            
            .chat-bot-footer button {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
            }
            
            .chat-message {
                margin-bottom: 15px;
                display: flex;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .chat-message.user {
                justify-content: flex-end;
            }
            
            .message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }
            
            .chat-message.bot .message-content {
                background-color: white;
                border-bottom-left-radius: 5px;
                border: 1px solid #e0e0e0;
            }
            
            body.dark-mode .chat-message.bot .message-content {
                background-color: #3a3a3a;
                border: 1px solid #444;
            }
            
            .chat-message.user .message-content {
                background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                color: white;
                border-bottom-right-radius: 5px;
            }
            
            .message-content p {
                margin: 0;
                line-height: 1.5;
            }
            
            .suggested-questions {
                margin-top: 12px;
                border-top: 1px dashed #ddd;
                padding-top: 12px;
            }
            
            body.dark-mode .suggested-questions {
                border-top: 1px dashed #444;
            }
            
            .suggested-title {
                font-size: 12px;
                color: #777;
                margin-bottom: 8px;
            }
            
            body.dark-mode .suggested-title {
                color: #aaa;
            }
            
            .suggested-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .suggested-btn {
                background-color: #f0f2f5;
                border: none;
                border-radius: 15px;
                padding: 6px 12px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .suggested-btn:hover {
                background-color: #e4e6e9;
            }
            
            body.dark-mode .suggested-btn {
                background-color: #3a3a3a;
                color: #f8f9fa;
            }
            
            body.dark-mode .suggested-btn:hover {
                background-color: #444;
            }
            
            .typing-indicator .message-content {
                padding: 12px;
            }
            
            .typing-dots {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 20px;
            }
            
            .typing-dots .dot {
                width: 8px;
                height: 8px;
                background-color: #777;
                border-radius: 50%;
                margin: 0 3px;
                animation: typing-dot 1.4s infinite ease-in-out;
            }
            
            .typing-dots .dot:nth-child(1) {
                animation-delay: 0s;
            }
            
            .typing-dots .dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .typing-dots .dot:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing-dot {
                0%, 60%, 100% {
                    transform: translateY(0);
                }
                30% {
                    transform: translateY(-5px);
                }
            }
            
            body.dark-mode .typing-dots .dot {
                background-color: #aaa;
            }
            
            /* Rich text formatting */
            .message-content a {
                color: #4e73df;
                text-decoration: underline;
            }
            
            .chat-message.user .message-content a {
                color: white;
                text-decoration: underline;
            }
            
            .message-content ul, .message-content ol {
                margin: 8px 0;
                padding-left: 20px;
            }
            
            .message-content code {
                background-color: #f0f2f5;
                padding: 2px 4px;
                border-radius: 4px;
                font-family: monospace;
            }
            
            body.dark-mode .message-content code {
                background-color: #3a3a3a;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .chat-bot-modal {
                    width: 100%;
                    height: 100%;
                    bottom: 0;
                    right: 0;
                    border-radius: 0;
                }
                
                .chat-bot-modal.minimized {
                    width: 100%;
                    height: 60px;
                    border-radius: 0;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Add event listeners for the chat bot
        document.getElementById('closeChatBot').addEventListener('click', function() {
            const modal = document.getElementById('chatBotModal');
            modal.style.opacity = '0';
            modal.style.transform = 'translateY(20px)';
            document.body.classList.remove('chat-bot-modal-open');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
        
        document.getElementById('minimizeChatBot').addEventListener('click', function() {
            const modal = document.getElementById('chatBotModal');
            modal.classList.toggle('minimized');
            
            // Change icon based on state
            const icon = this.querySelector('i');
            if (modal.classList.contains('minimized')) {
                icon.className = 'fas fa-expand';
            } else {
                icon.className = 'fas fa-minus';
            }
        });
        
        // Add event listener for suggested questions
        document.querySelectorAll('.suggested-btn').forEach(button => {
            button.addEventListener('click', function() {
                const question = this.getAttribute('data-question');
                const input = document.getElementById('chatBotInput');
                input.value = question;
                // Focus the input field
                input.focus();
                // Send the message
                sendChatMessage();
            });
        });
        
        document.getElementById('sendChatMsg').addEventListener('click', sendChatMessage);
        document.getElementById('chatBotInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
        
        // Add class to body to hide chatbot button
        document.body.classList.add('chat-bot-modal-open');
    } else {
        const modal = document.getElementById('chatBotModal');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.transform = 'translateY(0)';
        document.body.classList.add('chat-bot-modal-open');
    }
}

// Function to process the chat message and generate a response
function processChatMessage(message) {
    // Simple responses based on keywords
    message = message.toLowerCase();
    let response = "I'm sorry, I don't understand that. Can you please rephrase?";
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        response = "Hello! How can I help you today?";
    } else if (message.includes('bye') || message.includes('goodbye')) {
        response = "Goodbye! Feel free to come back if you have more questions.";
    } else if (message.includes('thank')) {
        response = "You're welcome! Is there anything else I can help you with?";
    } else if (message.includes('medicine') || message.includes('drug')) {
        response = "We have a wide range of medicines available. You can search for specific medicines using the search bar on the homepage.";
    } else if (message.includes('delivery') || message.includes('shipping')) {
        response = "We offer free delivery on orders above ₹500. Standard delivery takes 24-48 hours.";
    } else if (message.includes('payment')) {
        response = "We accept various payment methods including credit/debit cards, UPI, and cash on delivery.";
    } else if (message.includes('prescription')) {
        response = "For prescription medicines, you can upload your prescription during checkout or email it to prescriptions@mediease.com.";
    } else if (message.includes('return') || message.includes('refund')) {
        response = "Our return policy allows returns within 7 days of delivery. Please contact customer service for assistance.";
    } else if (message.includes('contact') || message.includes('support')) {
        response = "You can contact our customer support at support@mediease.com or call us at +1 234 567 890.";
    } else if (message.includes('order') && (message.includes('track') || message.includes('status'))) {
        response = "To track your order, please visit the 'My Account' section and go to 'My Orders'.";
    }
    
    return response;
}

// Function to send a chat message
function sendChatMessage() {
    const input = document.getElementById('chatBotInput');
    const message = input.value.trim();
    
    if (message) {
        // Add user message to chat
        addChatMessage(message, 'user');
        
        // Clear input
        input.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send message to AI chatbot server
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            // Hide typing indicator
            hideTypingIndicator();
            
            // Add AI response to chat
            addChatMessage(data.response, 'bot');
        })
        .catch(error => {
            // Hide typing indicator
            hideTypingIndicator();
            
            // Generate a local response if the API fails
            const localResponse = processChatMessage(message);
            addChatMessage(localResponse, 'bot');
            
            console.error('Error:', error);
        });
    }
}

// Function to show typing indicator
function showTypingIndicator() {
    const chatBody = document.getElementById('chatBotBody');
    
    // Check if typing indicator already exists
    if (!document.getElementById('typingIndicator')) {
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typingIndicator';
        typingIndicator.className = 'chat-message bot typing-indicator';
        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        `;
        chatBody.appendChild(typingIndicator);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Function to hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Function to add a message to the chat
function addChatMessage(message, sender) {
    const chatBody = document.getElementById('chatBotBody');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Format message for display
    const formattedMessage = formatMessageForDisplay(message);
    contentDiv.innerHTML = formattedMessage;
    
    messageDiv.appendChild(contentDiv);
    chatBody.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Function to format message for display
function formatMessageForDisplay(message) {
    // Convert URLs to links
    message = message.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank">$1</a>'
    );
    
    // Convert email addresses to links
    message = message.replace(
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g, 
        '<a href="mailto:$1">$1</a>'
    );
    
    // Convert phone numbers to links
    message = message.replace(
        /(\+\d{1,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3})/g, 
        '<a href="tel:$1">$1</a>'
    );
    
    // Convert line breaks to <br>
    message = message.replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags
    return `<p>${message}</p>`;
}
