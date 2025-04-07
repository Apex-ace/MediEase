// On document loaded run this
document.addEventListener('DOMContentLoaded', function () {
  displayCart();
});

/**
 * Display the cart contents on the cart page
 */
function displayCart() {
  var cartData = JSON.parse(localStorage.getItem('cart') || '[]');
  var cartContainer = document.getElementById('cartContainer');
  var buyButton = document.getElementById('buy-now-button');
  
  // Clear existing content
  cartContainer.innerHTML = '<h2>Your Cart</h2>';
  
  // Check if cart is empty
  if (!cartData || cartData.length === 0) {
    var listItem = document.createElement('h5');
    listItem.textContent = 'Your Cart is Empty';
    listItem.className = 'mt-4 text-muted';
    cartContainer.appendChild(listItem);
    
    // Hide buy button
    if (buyButton) buyButton.style.display = 'none';
    return;
  }
  
  // Create cart item list
  var cartList = document.createElement('div');
  cartList.className = 'cart-items';
  
  // Add each item to the cart display
  cartData.forEach(function (item) {
    var listItem = document.createElement('div');
    listItem.classList.add('card', 'mb-2');
    
    // Create card content with item details
    listItem.innerHTML = `
      <div class="card-body d-flex justify-content-between align-items-center">
        <div>
          <h5 class="card-title">${item.name}</h5>
          <div class="quantity-control">
            <button class="btn btn-sm btn-outline-secondary quantity-btn" onclick="updateItemQuantity(${item.id}, ${item.qty - 1})">-</button>
            <span class="mx-2">Qty: ${item.qty}</span>
            <button class="btn btn-sm btn-outline-secondary quantity-btn" onclick="updateItemQuantity(${item.id}, ${item.qty + 1})">+</button>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">
          <i class="fas fa-trash"></i> Remove
        </button>
      </div>
    `;
    
    cartList.appendChild(listItem);
  });
  
  cartContainer.appendChild(cartList);
  
  // Show the total amount
  getTotal(cartData)
    .then(total => {
      var totalItem = document.createElement('div');
      totalItem.classList.add('amount-card', 'mt-3', 'p-3');
      totalItem.innerHTML = `
        <h5>Order Summary</h5>
        <div class="d-flex justify-content-between">
          <span>Items (${cartData.length}):</span>
          <span>₹${total}</span>
        </div>
        <div class="d-flex justify-content-between font-weight-bold mt-2">
          <span>Total Amount:</span>
          <span>₹${total}</span>
        </div>
      `;
      cartContainer.appendChild(totalItem);
      
      // Show the buy now button
      if (buyButton) buyButton.style.display = 'block';
    })
    .catch(error => {
      console.error("Failed to calculate total:", error);
      var errorMsg = document.createElement('div');
      errorMsg.className = 'alert alert-danger mt-3';
      errorMsg.textContent = "Failed to calculate total. Please try again.";
      cartContainer.appendChild(errorMsg);
    });
    
  // Update cart count in the navbar
  updateCartCount();
}

/**
 * Update the cart count in the navbar
 */
function updateCartCount() {
  const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartCountElement = document.getElementById('cart-count');
  
  if (cartCountElement) {
    if (cartData.length > 0) {
      cartCountElement.textContent = cartData.length;
      cartCountElement.style.display = 'inline';
    } else {
      cartCountElement.style.display = 'none';
    }
  }
}

/**
 * Navigate to the order creation page
 */
function buyNow() {
  // Get the access token
  const accessToken = localStorage.getItem('accessToken');
  var cartData = JSON.parse(localStorage.getItem('cart') || '[]');

  // Validate cart has items
  if (!cartData || cartData.length === 0) {
    alert("Your cart is empty. Please add medicines before placing an order.");
    window.location.href = '/';
    return;
  }

  // Check if user is logged in
  fetch('/api/isvalid', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  .then(response => {
    if (!response.ok) {
      // Not logged in - redirect to login
      alert("Please log in before placing an order");
      window.location.href = '/login';
      return;
    }
    
    // User is logged in and cart has items - proceed to checkout
    window.location.href = '/createOrder';
  })
  .catch(error => {
    console.error('Error validating user:', error);
    alert("An error occurred. Please try again.");
  });
}

/**
 * Add an item to the cart
 * @param {number} id - Product ID
 * @param {string} name - Product name
 */
function addToCart(id, name) {
  // Get quantity from selector if available, default to 1
  const quantitySelector = document.getElementById('quantitySelector');
  const quantity = quantitySelector ? parseInt(quantitySelector.value) : 1;
  
  // Get current cart or initialize as empty array
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(item => item.id === id);
  
  if (existingItemIndex !== -1) {
    // Update quantity if item exists
    cart[existingItemIndex].qty += quantity;
  } else {
    // Add new item with consistent structure
    cart.push({
      id: id,
      name: name,
      qty: quantity,
      price: "₹0" // Will be updated by the server during calculation
    });
  }
  
  // Save to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update UI
  updateCartCount();
  
  // Show success message
  alert(`Added ${quantity} ${name} to cart!`);
}

/**
 * Remove an item from the cart
 * @param {number} id - Product ID to remove
 */
function removeFromCart(id) {
  // Get current cart
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  // Remove the item
  cart = cart.filter(item => item.id !== id);
  
  // Save updated cart
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // If on cart page, refresh the display
  if (document.getElementById('cartContainer')) {
    displayCart();
  } else {
    // Otherwise just update the count
    updateCartCount();
  }
}

/**
 * Update the quantity of an item in the cart
 * @param {number} id - Product ID
 * @param {number} newQty - New quantity
 */
function updateItemQuantity(id, newQty) {
  // Don't allow negative quantities
  if (newQty <= 0) {
    removeFromCart(id);
    return;
  }
  
  // Get current cart
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  // Find and update the item
  const itemIndex = cart.findIndex(item => item.id === id);
  if (itemIndex !== -1) {
    cart[itemIndex].qty = newQty;
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Refresh cart display
    displayCart();
  }
}

/**
 * Calculate the total price of items in the cart
 * @param {Array} cart - Cart data
 * @returns {Promise} - Promise resolving to the total amount
 */
function getTotal(cart) {
  return new Promise((resolve, reject) => {
    // Ensure cart has items
    if (!cart || cart.length === 0) {
      resolve(0);
      return;
    }
    
    // Call API to calculate total
    fetch('/api/getCartTotal', {
      method: 'POST',
      body: JSON.stringify({"cart": cart}),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.res === 1) {
        resolve(data.total);
      } else {
        console.error("Error calculating total:", data.message);
        reject(new Error(data.message || "Could not calculate total"));
      }
    })
    .catch(error => {
      console.error('API error:', error);
      reject(error);
    });
  });
}

// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    updateCartCount();
    
    // Add event listener for checkout button if it exists
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }
    
    // Add event listener for clear cart button if it exists
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
});

// Load cart items from localStorage
function loadCart() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartContainer) return; // Exit if not on cart page
    
    // Show or hide elements based on cart contents
    if (cartItems.length === 0) {
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'none';
        cartContainer.innerHTML = '';
        return;
    }
    
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'block';
    
    // Calculate total
    let total = 0;
    
    // Generate cart items HTML
    let cartHTML = '';
    
    cartItems.forEach((item, index) => {
        // Extract numeric value from price string (e.g., "₹250" -> 250)
        const priceValue = parseFloat(item.price.replace(/[^\d.]/g, ''));
        const itemTotal = priceValue * item.qty;
        total += itemTotal;
        
        cartHTML += `
        <div class="card mb-3 cart-item" data-index="${index}">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text text-muted mb-0">Price: ${item.price}/unit</p>
                    </div>
                    <div class="col-md-4">
                        <div class="input-group quantity-control">
                            <button class="btn btn-outline-secondary decrease-qty" type="button">-</button>
                            <input type="text" class="form-control text-center item-qty" value="${item.qty}" readonly>
                            <button class="btn btn-outline-secondary increase-qty" type="button">+</button>
                        </div>
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-sm btn-danger remove-item"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-12 text-end">
                        <strong>Item Total: ₹${itemTotal.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    cartContainer.innerHTML = cartHTML;
    
    // Update total in UI
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
        totalElement.textContent = `₹${total.toFixed(2)}`;
    }
    
    // Add event listeners for quantity controls
    const decreaseBtns = document.querySelectorAll('.decrease-qty');
    const increaseBtns = document.querySelectorAll('.increase-qty');
    const removeBtns = document.querySelectorAll('.remove-item');
    
    decreaseBtns.forEach(btn => {
        btn.addEventListener('click', decreaseQuantity);
    });
    
    increaseBtns.forEach(btn => {
        btn.addEventListener('click', increaseQuantity);
    });
    
    removeBtns.forEach(btn => {
        btn.addEventListener('click', removeItem);
    });
}

// Update cart count in navbar
function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cart-count');
    
    if (cartCount) {
        const totalItems = cartItems.reduce((total, item) => total + item.qty, 0);
        cartCount.textContent = totalItems;
        
        // Show or hide the cart count badge
        if (totalItems > 0) {
            cartCount.style.display = 'inline-block';
        } else {
            cartCount.style.display = 'none';
        }
    }
}

// Add to cart function - used on medicine detail page
function addToCart(id, name, price) {
    // Get existing cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if item already in cart
    const existingItemIndex = cart.findIndex(item => item.id === id);
    
    if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cart[existingItemIndex].qty += 1;
    } else {
        // Add new item
        cart.push({
            id: id,
            name: name,
            price: price,
            qty: 1
        });
    }
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateCartCount();
    
    // Show toast notification
    showToast('Added to cart!', 'success');
}

// Decrease quantity of item
function decreaseQuantity(event) {
    const cartItemElement = event.target.closest('.cart-item');
    const index = cartItemElement.dataset.index;
    const qtyInput = cartItemElement.querySelector('.item-qty');
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart[index].qty > 1) {
        // Decrease quantity
        cart[index].qty -= 1;
        qtyInput.value = cart[index].qty;
    } else {
        // Remove item if quantity would be 0
        cart.splice(index, 1);
    }
    
    // Save and update
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

// Increase quantity of item
function increaseQuantity(event) {
    const cartItemElement = event.target.closest('.cart-item');
    const index = cartItemElement.dataset.index;
    const qtyInput = cartItemElement.querySelector('.item-qty');
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Increase quantity (limit to reasonable amount)
    if (cart[index].qty < 10) {
        cart[index].qty += 1;
        qtyInput.value = cart[index].qty;
    }
    
    // Save and update
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

// Remove item from cart
function removeItem(event) {
    const cartItemElement = event.target.closest('.cart-item');
    const index = cartItemElement.dataset.index;
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Remove item
    cart.splice(index, 1);
    
    // Save and update
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

// Clear entire cart
function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        localStorage.removeItem('cart');
        loadCart();
        updateCartCount();
    }
}

// Proceed to checkout
function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if cart is empty
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    // Check if user is logged in by checking for token
    const token = localStorage.getItem('access_token');
    if (!token) {
        showToast('Please log in to checkout', 'error');
        setTimeout(() => {
            window.location.href = '/login?redirect=cart';
        }, 1500);
        return;
    }
    
    // Redirect to checkout page
    window.location.href = '/checkout';
}

// Toast notification function
function showToast(message, type = 'info') {
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, {
        animation: true,
        autohide: true,
        delay: 3000
    });
    
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}