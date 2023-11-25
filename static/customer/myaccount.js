var accessToken = localStorage.getItem('accessToken');
fetch('/api/isvalid', {
  method: 'GET',
  headers: {
      'Authorization': `Bearer ${accessToken}`,
  },
})
.then(async response => {
  if (!response.ok) {
    alert("User has beed logged out. Please login again");
    window.location.href = "/";
  }
})
.catch(error => {
  console.error('Error:', error);
  alert(error);
});

function redirectToOrder(orderid) {
  const accessToken = localStorage.getItem('accessToken');

  // Check if the access token exists
  if (accessToken) {

    // Construct the redirect URL
    var redirectUrl = '/myorder/' + accessToken + '/' +  orderid;

    // Redirect to the constructed URL
    window.location.href = redirectUrl;
  } else {
    console.error('Access token not found in local storage');
  }
}


