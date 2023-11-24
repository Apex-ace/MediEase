// Function to add an item to the cart
function addToCart(productId) {
    var quantitySelector = document.getElementById('quantitySelector');

    // Get the selected value
    var quantity = parseInt(quantitySelector.value,10);
    var cartData = JSON.parse(localStorage.getItem('cart'));
    // Check if the product already exists in the cart
    var existingItemIndex = cartData.findIndex(item => item.productId === productId);
  
    if (existingItemIndex !== -1) {
      // If the product exists, update the quantity
      cartData[existingItemIndex].quantity += quantity;
    } else {
      // If the product doesn't exist, add a new item to the cart
      cartData.push({ id: productId, qty: quantity });
    }
    alert("Added to Cart");
    // alert(JSON.stringify(cartData));
    // Save the updated cart data back to local storage
    localStorage.setItem('cart', JSON.stringify(cartData));
  }
  