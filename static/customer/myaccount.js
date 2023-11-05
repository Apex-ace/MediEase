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