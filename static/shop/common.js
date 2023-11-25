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

function redirectToOrder(orderid){
    // Construct the redirect URL
    var redirectUrl = '/shop/order/' +  orderid;

    // Redirect to the constructed URL
    window.location.href = redirectUrl;
}

function changeOrderStatus(orderid){
    var quantitySelector = document.getElementById('quantitySelector');
    var status = quantitySelector.value;
    fetch('/api/shop/updateOrder', {
        method: 'POST',
        body: JSON.stringify({ "orderid": orderid, "status": status }),
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
            alert(data["message"]);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error);
    });
    // Construct the redirect URL
    var redirectUrl = '/shop/order/' +  orderid;

    // Redirect to the constructed URL
    window.location.href = redirectUrl;
}