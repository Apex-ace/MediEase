// Check for access token validity.
// If not valid, redirect to homepage

// Get the accesstoken from local storage
var accessToken = localStorage.getItem('accessToken');

// Call the isvalid api on page open
fetch('/api/isvalid', {
  method: 'GET',
  headers: {
      'Authorization': `Bearer ${accessToken}`,
  },
})
.then(async response => {
  if (!response.ok) {
    // If invalid (Logged Out)
    alert("User has beed logged out. Please login again");
    window.location.href = "/";
  }
})
.catch(error => {
  console.error('Error:', error);
  alert(error);
});

// Function helping with redirecting order to order page
function redirectToOrder(orderid) {
  var redirectUrl = '/myorder/' + accessToken + '/' +  orderid;
  // Redirect to the constructed URL
  window.location.href = redirectUrl;
}


