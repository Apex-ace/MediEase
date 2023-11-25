// Function to add an item to the cart
function addToCart(id, name) {
  var quantitySelector = document.getElementById('quantitySelector');

  // Get the selected value
  var qty = parseInt(quantitySelector.value, 10);
  if(localStorage.getItem('cart') === null){
    var cartData =[];
  }
  else{
    var cartData = JSON.parse(localStorage.getItem('cart'));
  }
  // Check if the product already exists in the cart
  var existingItemIndex = cartData.findIndex(item => item.id === id);

  if (existingItemIndex !== -1) {
    // If the product exists, update the quantity
    cartData[existingItemIndex].qty += qty;
  } else {
    // If the product doesn't exist, add a new item to the cart
    cartData.push({ id: id, name: name, qty: qty });
  }
  alert("Added to Cart");
  // alert(JSON.stringify(cartData));
  // Save the updated cart data back to local storage
  localStorage.setItem('cart', JSON.stringify(cartData));
}


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
              window.location.href = '/';
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