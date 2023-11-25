document.addEventListener('DOMContentLoaded', function () {
  var cartData = JSON.parse(localStorage.getItem('cart'));
  if (cartData.length === 0) {
    var cartContainer = document.getElementById('cartContainer');
    var listItem = document.createElement('h4');
    listItem.textContent = 'Your Cart is Empty';
    cartContainer.appendChild(listItem);
    var button = document.getElementById('buy-now-button');
    button.style.display = 'none';
  }
  else {
    var cartContainer = document.getElementById('cartContainer');
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
    var button = document.getElementById('buy-now-button');
    button.style.display = 'block';
  }
});

// Function to buy an item to the cart
function buyNow() {
  const accessToken = localStorage.getItem('accessToken');
  var cartData = JSON.parse(localStorage.getItem('cart'));
  fetch('/api/isvalid', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
    .then(async response => {
      if (!response.ok) {
        alert("Please login before placing order");
      }
      else {
        if (cartData.length === 0) {
          alert("Cart is Empty. Add some medicines to order");
          window.location.href = '/';
        }
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


function removeFromCart(id){
  var cartData = JSON.parse(localStorage.getItem('cart'));
  var existingItemIndex = cartData.findIndex(item => item.id === id);

  if (existingItemIndex !== -1) {
    // If the product exists, remove it
    cartData.splice(existingItemIndex, 1);
    alert("Product removed from cart")
  } else {
    // If the product doesn't exist, add a new item to the cart
    alert("Product already removed from cart")
  }
  localStorage.setItem('cart', JSON.stringify(cartData));
  window.location.href = '/cart';
}