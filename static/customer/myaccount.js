const accessToken = localStorage.getItem('accessToken');
console.log(accessToken);
// Fetch the /myaccount route with the JWT token in the Authorization header
fetch(`/myaccount?accessToken=${accessToken}`, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
    },
})
  .then((response) => response.text())
  .then((data) => {
    document.body.innerHTML = data;
  })
  .catch((error) => console.error("Error:", error));