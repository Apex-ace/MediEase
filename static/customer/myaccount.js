document.addEventListener("DOMContentLoaded", function () {
    // Make a GET request to the API
    const accessToken = localStorage.getItem('accessToken');
    fetch('/api/getOrderList', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(async response => {
        if (!response.ok) {
            alert("User logged out! Please login again");
            window.location.href = '/login';
        }
        else{
            data=(await response.json())["data"]
            const orderListDiv = document.getElementById('order-list');

            const ol = document.createElement('ol');

            // Loop through the list data and create list items (li) for each item
            data.forEach(item => {
                const li = document.createElement('li');
                const ul = document.createElement('ul');
                const li2 = document.createElement('li');
                const li3 = document.createElement('li');
                
                li.textContent = "Order ID: ".concat(item[0]);
                li2.textContent = "Time of Order: ".concat(item[1])
                li3.textContent = "Order Status: ".concat(item[2])
                ul.appendChild(li2);
                ul.appendChild(li3);
                ol.appendChild(li);
                ol.appendChild(ul);
            });

            // Append the unordered list to the container
            orderListDiv.appendChild(ol);
        }
    })
    .catch(error => {
        // Handle errors in the fetch or response
        console.error('Fetch error:', error);
    });
});