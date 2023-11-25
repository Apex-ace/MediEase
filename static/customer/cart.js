document.addEventListener('DOMContentLoaded', function () {
  var cartData = JSON.parse(localStorage.getItem('cart'));
  var cartList = document.getElementById('cartList');
  if (cartData.length === 0) {
    listItem.textContent = 'Your Cart is Empty';
  }
  else {
    cartData.forEach(function (item) {
      var listItem = document.createElement('li');
      listItem.textContent = 'Product Name: ' + item.name + ', Quantity: ' + item.qty;
      cartList.appendChild(listItem);
    });
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
