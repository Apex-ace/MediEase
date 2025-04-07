// Check for access token validity.
// If not valid, redirect to homepage

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get navigation buttons
    const myAccountBtn = document.getElementById('button1');
    const cartBtn = document.getElementById('button2');
    const shopBtn = document.getElementById('shop-inventory-btn');
    const consultBtn = document.getElementById('video-call-btn');
    const loginBtn = document.getElementById('button3');
    const signupBtn = document.getElementById('button4');
    const logoutBtn = document.getElementById('button5');
    
    // Check if user is logged in
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
        // User is logged in - show logged in buttons, hide login/signup
        if (myAccountBtn) myAccountBtn.style.display = 'inline-block';
        if (cartBtn) cartBtn.style.display = 'inline-block';
        if (shopBtn) shopBtn.style.display = 'inline-block';
        if (consultBtn) consultBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        // User is not logged in - hide logged in buttons, show login/signup
        if (myAccountBtn) myAccountBtn.style.display = 'none';
        if (cartBtn) cartBtn.style.display = 'none';  
        if (shopBtn) shopBtn.style.display = 'inline-block'; // Always show Shop button
        if (consultBtn) consultBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
    
    // Hamburger menu functionality
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });
    }
    
    // Close mobile menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        });
    });
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

