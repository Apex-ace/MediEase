const accessToken = localStorage.getItem('accessToken');
console.log(accessToken);
// Fetch the /myaccount route with the JWT token in the Authorization header
fetch(`/myaccount?accessToken=${accessToken}`, {
    method: 'GET',
})
.then((response) => {
    if (!response.ok) {
        alert("User logged out");
        window.location.href = '/';
    }
    return response.text();
  })
  .then((data) => {
    document.body.innerHTML = data;
  })
  .catch((error) => {
    console.error("Error:", error);
    alert("Failed to fetch data. Please try again.");
  });

function redirectToOrder(event) {
  // Check if the access token exists
  if (accessToken) {
    // Get the clicked anchor tag
    var anchorTag = event.target;

    // Get the order ID from the data attribute
    var orderId = anchorTag.getAttribute('data-order-id');

    // Construct the redirect URL
    var redirectUrl = '/myorder/' + accessToken + '/' +  orderId;

    // Redirect to the constructed URL
    window.location.href = redirectUrl;
  } else {
    console.error('Access token not found in local storage');
  }
}
