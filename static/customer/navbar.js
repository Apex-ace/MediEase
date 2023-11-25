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
    // If invalid (Logged Out)
    if (!response.ok) {
        // Show buttons accordingly
        // Don't show my account and logout button
        var button1 = document.getElementById('button1');
        var button5 = document.getElementById('button5');
        button1.style.display = 'none';
        button5.style.display = 'none';
        var button3 = document.getElementById('button3');
        var button4 = document.getElementById('button4');
        button3.style.display = 'block';
        button4.style.display = 'block';
    }
    // If valid
    else{
        // Show buttons accordingly
        // Don't show my login and sign up button
        var button1 = document.getElementById('button1');
        var button5 = document.getElementById('button5');
        button1.style.display = 'block';
        button5.style.display = 'block';
        var button3 = document.getElementById('button3');
        var button4 = document.getElementById('button4');
        button3.style.display = 'none';
        button4.style.display = 'none';
    }
})
.catch(error => {
    console.error('Error:', error);
    alert(error);
});

