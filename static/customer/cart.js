document.addEventListener('DOMContentLoaded', function () {
    var cartData = JSON.parse(localStorage.getItem('cart'));
    var cartList = document.getElementById('cartList');
  
    cartData.forEach(function (item) {
      var listItem = document.createElement('li');
      listItem.textContent = 'Name: ' + item.name + ', Quantity: ' + item.qty;
      cartList.appendChild(listItem);
    });
  });
  