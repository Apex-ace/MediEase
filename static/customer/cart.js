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

/**
 * Add an item to the cart
 * @param {number} id - Product ID
 * @param {string} name - Product name
 * @param {number} quantity - Quantity to add (defaults to 1)
 */
function addToCart(id, name, quantity = 1) {
    // Get current cart from localStorage or initialize empty array
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Get selected quantity from dropdown if it exists
    const quantitySelector = document.getElementById('quantitySelector');
    if (quantitySelector) {
        quantity = parseInt(quantitySelector.value);
    }
    
    // Check if item is already in cart
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        // Update quantity if item exists
        existingItem.quantity += quantity;
    } else {
        // Add new item if it doesn't exist
        cart.push({
            id: id,
            name: name,
            quantity: quantity
        });
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show success message
    alert(`Added ${quantity} ${name} to cart!`);
    
    // Update cart count in navbar if function exists
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}

/**
 * Remove an item from the cart
 * @param {number} id - Product ID to remove
 */
function removeFromCart(id) {
    // Get current cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Filter out the item to remove
    cart = cart.filter(item => item.id !== id);
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Refresh the cart display if on cart page
    if (typeof displayCart === 'function') {
        displayCart();
    }
    
    // Update cart count in navbar if function exists
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}

/**
 * Update quantity of an item in the cart
 * @param {number} id - Product ID to update
 * @param {number} quantity - New quantity
 */
function updateQuantity(id, quantity) {
    // Get current cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Find the item to update
    const itemToUpdate = cart.find(item => item.id === id);
    
    if (itemToUpdate) {
        // Update quantity if item exists
        itemToUpdate.quantity = quantity;
        
        // Remove item if quantity is 0 or less
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        
        // Save updated cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Refresh the cart display if on cart page
        if (typeof displayCart === 'function') {
            displayCart();
        }
    }
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