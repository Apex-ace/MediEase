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
  // if invalid
  if (!response.ok) {
    alert("User has beed logged out. Please login again");
    window.location.href = "/";
  }
})
.catch(error => {
  console.error('Error:', error);
  alert(error);
});