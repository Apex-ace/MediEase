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
      var listItem = document.createElement('p');
      listItem.textContent = 'Name: ' + item.name + ', Quantity: ' + item.qty;
      cartContainer.appendChild(listItem);
    });
    var button = document.getElementById('buy-now-button');
    button.style.display = 'block';
  }
});

// Function to buy an item to the cart
function buyNow() {
  const accessToken = localStorage.getItem('accessToken');
  if(!accessToken){
    alert("User is logged out. Login Again");
    window.location.href = '/';
  }
  else {
    var cartData = localStorage.getItem('cart');
    if (cartData) {
      cartData = JSON.parse(cartData);
      if (cartData.length === 0) {
        alert("Cart is Empty. Add some medicines to order");
        window.location.href = '/';
      }
      else{
        window.location.href = '/createOrder';
      }
    }
    else {
      alert("Cart is Empty. Add some medicines to order");
      window.location.href = '/';
    }
  }
}
