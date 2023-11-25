// Function to submit the login form
function submitLoginForm(event) {
    event.preventDefault();

    const form = document.getElementById('login-form');

    // Get the credentials
    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

    form.reset();

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
                alert(data["message"])
            }
            else {
                // Store the returned accesstoken from server
                localStorage.setItem('accessToken', data["accessToken"]);
                alert(data["message"]);
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error);
        });
    form.reset();
}

// Function to submit the signup form
function submitSignupForm(event) {
    event.preventDefault();

    const form = document.getElementById('signup-form');

    // Get the credentials
    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

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
                alert(data["message"]);
            }
            else {
                // Redirect to login upon successful sign up
                alert(data["message"]);
                window.location.href = '/login';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error);
        });
    form.reset();
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
    
    var redirectUrl = '/myaccount/' + accessToken;

    // Redirect to the constructed URL
    window.location.href = redirectUrl;
}
