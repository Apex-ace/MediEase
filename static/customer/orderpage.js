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