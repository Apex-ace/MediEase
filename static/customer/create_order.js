// Function to submit the order form
function submitOrder(event) {
  event.preventDefault();

  // Get the form
  const form = document.getElementById('order-form');

  // Get the values
  const name = form.querySelector('#name').value;
  const address = form.querySelector('#address').value;
  const contact = form.querySelector('#contact').value;

  // Get the access token
  const accessToken = localStorage.getItem('accessToken');
  const cartData = JSON.parse(localStorage.getItem('cart'));

  // Check for accesstoken validity
  fetch('/api/isvalid', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
    .then(async response => {
      // If invalid (Logged Out)
      if (!response.ok) {
        alert("User is logged out. Login Again");
        window.location.href = '/login';
      }
      // If token valid
      else {
        // If cart is empty
        if (cartData.length === 0) {
          alert('Your cart is empty. Add some medicines');
          window.location.href = '/';
        }
        // Create order if everthing is alright
        // Call create order post api
        fetch('/api/createOrder', {
          method: 'POST',
          body: JSON.stringify({ "name": name, "address": address, "contact": contact, "cart": cartData }),
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          }
        })
          .then(response => response.json())
          .then(data => {
            console.log(data);
            // If there is an error
            if (data["res"] == 0) {
              alert("Your order could not be placed");
              window.location.href = '/';
            }
            // If it's success
            else {
              alert("Your order has been successfully placed");

              // Reset the cart to empty list
              localStorage.setItem('cart', JSON.stringify([]));

              // Redirect to my account page
              var redirectUrl = '/myaccount/' + accessToken;

              // Redirect to the constructed URL
              window.location.href = redirectUrl;
            }
          })
          .catch(error => {
            console.error('Error:', error);
            alert(error);
          });
        form.reset();
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert(error);
    });
}