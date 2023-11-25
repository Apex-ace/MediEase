// Function to submit the login form
function submitLoginForm(event) {
    event.preventDefault();

    const form = document.getElementById('login-form');

    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

    form.reset();

    fetch('/api/shop/login', {
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
                localStorage.setItem('accessToken', data["accessToken"]);
                alert(data["message"]);
                window.location.href = '/shop';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error);
        });
    form.reset();
}

function redirectToMedicineStock(event){

}

function redirectToOrders(event){
    window.location.href = "/shop/orders";
}

function redirectToOrder(event){
    var button = event.target;

    // Get the order ID from the data attribute
    var orderId = button.getAttribute('data-order-id');

    // Construct the redirect URL
    var redirectUrl = '/shop/order/' + '/' +  orderId;

    // Redirect to the constructed URL
    window.location.href = redirectUrl;
}