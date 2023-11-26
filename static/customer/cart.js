// On document loaded run this
document.addEventListener('DOMContentLoaded', function () {
  var cartData = JSON.parse(localStorage.getItem('cart'));
  // alert(cartData)
  if (cartData === null || cartData.length === 0) {
    var cartContainer = document.getElementById('cartContainer');
    var listItem = document.createElement('h5');
    listItem.textContent = 'Your Cart is Empty';
    cartContainer.appendChild(listItem);
    var button = document.getElementById('buy-now-button');
    button.style.display = 'none';
  }
  else {
    var cartContainer = document.getElementById('cartContainer');

    // Make card for each of the cart item
    cartData.forEach(function (item) {
        var listItem = document.createElement('div');
        listItem.classList.add('card'); 
        
        // Display item details
        var itemDetails = document.createElement('h6');
        itemDetails.textContent = 'Name: ' + item.name;
        listItem.appendChild(itemDetails);
        itemDetails = document.createElement('h6');
        itemDetails.textContent = 'Quantity: ' + item.qty;
        listItem.appendChild(itemDetails);
        var removeButton = document.createElement('button');
        removeButton.classList.add('card-button'); 
        removeButton.textContent = 'Remove';
        removeButton.onclick = function () {
            // Call a function to handle item removal, passing the index of the item
            removeFromCart(item.id);
        };
        listItem.appendChild(removeButton);
        // Append the complete item container to the cartContainer
        cartContainer.appendChild(listItem);
    });

    // Show the total amount
    getTotal(cartData)
    .then(total => {
      var totalItem = document.createElement('div');
      totalItem.classList.add('amount-card')
      var totalItemDetails = document.createElement('h6');
      totalItemDetails.textContent = "Total Amount: ₹"+total;
      totalItem.appendChild(totalItemDetails);
      cartContainer.appendChild(totalItem);
    })
    .catch(error => {
      alert("Failed to calculate total");
      console.log(error);
    });

    // Show the buy now button
    var button = document.getElementById('buy-now-button');
    button.style.display = 'block';
  }
});

// Function to redirect to create order page
function buyNow() {

  // Get the accesstoken
  const accessToken = localStorage.getItem('accessToken');
  var cartData = JSON.parse(localStorage.getItem('cart'));

  // Check if accesstoken valid
  fetch('/api/isvalid', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
    .then(async response => {
      if (!response.ok) {
        // Not valid(Logged out)
        alert("Please login before placing order");
      }
      // valid
      else {
        if (cartData.length === 0) {
          alert("Cart is Empty. Add some medicines to order");
          window.location.href = '/';
        }
        // Redirect to create order page
        else{
          window.location.href = '/createOrder';
        }

      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert(error);
    });
}

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

// FUnction to remove an item from the cart
function removeFromCart(id){
  
  // get the cart from the localstorafe
  var cartData = JSON.parse(localStorage.getItem('cart'));

  // find the medicine id in the cart
  var existingItemIndex = cartData.findIndex(item => item.id === id);

  // remove it
  if (existingItemIndex !== -1) {
    // If the product exists, remove it
    cartData.splice(existingItemIndex, 1);
    alert("Product removed from cart")
  } else {
    // If the product doesn't exist, add a new item to the cart
    alert("Product already removed from cart")
  }

  // update the cart item in localstorage
  localStorage.setItem('cart', JSON.stringify(cartData));
  window.location.href = '/cart';
}

// Function which calculates the total of the cart
function getTotal(cart) {

  // Call the getcarttotal api
  return new Promise((resolve, reject) => {
    fetch('/api/getCartTotal', {
      method: 'POST',
      body: JSON.stringify({"cart": cart}),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data["res"] == 0) {
          alert("Total Could Not be Calculated");
          resolve(0); // Resolve with 0 if total couldn't be calculated
        } else {
          resolve(data['total']); // Resolve with the actual total value
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert(error);
        reject(error); // Reject the promise if there's an error
      });
  });
}