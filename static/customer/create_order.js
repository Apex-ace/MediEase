// Function to add an item to the cart
function addToCart(id, name) {
    var quantitySelector = document.getElementById('quantitySelector');

    // Get the selected value
    var qty = parseInt(quantitySelector.value,10);
    var cartData = JSON.parse(localStorage.getItem('cart') || []);
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
    alert(JSON.stringify(cartData));
    // Save the updated cart data back to local storage
    localStorage.setItem('cart', JSON.stringify(cartData));
  }
  