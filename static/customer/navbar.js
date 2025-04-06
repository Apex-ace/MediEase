// Check for access token validity.
// If not valid, redirect to homepage

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('index');
    
    if (hamburgerBtn && navMenu) {
        // Toggle menu when hamburger is clicked
        hamburgerBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when a link is clicked
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideMenu = navMenu.contains(event.target);
            const isClickOnHamburger = hamburgerBtn.contains(event.target);
            
            if (!isClickInsideMenu && !isClickOnHamburger && navMenu.classList.contains('active')) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
});

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

