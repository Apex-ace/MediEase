// Function to submit the signup form
function submitOrder(event) {
  event.preventDefault();

  const form = document.getElementById('order-form');

  const name = form.querySelector('#name').value;
  const address = form.querySelector('#address').value;
  const contact = form.querySelector('#contact').value;

  const accessToken = localStorage.getItem('accessToken');
  const cartData = JSON.parse(localStorage.getItem('cart'));

  fetch('/api/isvalid', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
    .then(async response => {
      if (!response.ok) {
        alert("User is logged out. Login Again");
        window.location.href = '/login';
      }
      else {
        if (cartData.length === 0) {
          alert('Your cart is empty. Add some medicines');
          window.location.href = '/';
        }
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
            if (data["res"] == 0) {
              alert("Your order could not be placed");
              window.location.href = '/';
            }
            else {
              alert("Your order has been successfully placed");
              localStorage.setItem('cart', JSON.stringify([]));
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