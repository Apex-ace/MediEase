// Function to submit the login form
function submitLoginForm(event) {
    event.preventDefault();

    const form = document.getElementById('login-form');

    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

    form.reset();

    fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ "username": username, "password": password }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
        .then(response => response.json())
        .then(data => {
            if(data["res"]==0){
                alert(data["message"])
            }
            else{
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

    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

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
            if(data["res"]==0){
                alert(data["message"]);
            }
            else{
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
