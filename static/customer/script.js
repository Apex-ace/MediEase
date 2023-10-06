// Function to submit the login form
function submitLoginForm(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Get form data
    const form = document.getElementById('login-form');
    const formData = new FormData(form);

    // Make an API request (replace with your actual API endpoint)
    fetch('/api/login', {
        method: 'POST', // or 'GET' if it's a GET request
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            // Handle API response here
            console.log(data);
            // You can redirect to another page or display a success message
        })
        .catch(error => {
            console.error('Error:', error);
            // Handle error, e.g., display an error message to the user
        });
}

// Function to submit the signup form
function submitSignupForm(event) {
    event.preventDefault();

    const form = document.getElementById('signup-form');

    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

    console.log(username)

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
                alert("Sign Up Failure")
            }
            else{
                alert("Sign Up Successful")
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error);
        });


}
