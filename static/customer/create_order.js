// Order submission functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the form
    const checkoutForm = document.getElementById('checkout-form');
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', submitOrder);
        
        // Toggle UPI details based on payment method selection
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        const upiDetails = document.getElementById('upiDetails');
        
        paymentMethods.forEach(method => {
            method.addEventListener('change', function() {
                toggleUpiDetails(this.value);
            });
        });
        
        // Load user profile data if available
        loadUserProfile();
    }
});

// Toggle UPI details visibility
function toggleUpiDetails(paymentMethod) {
    const upiDetails = document.getElementById('upiDetails');
    if (upiDetails) {
        upiDetails.style.display = paymentMethod === 'upi' ? 'block' : 'none';
    }
}

// Load user profile data from the server
function loadUserProfile() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    fetch('/api/getUserProfile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.profile) {
            // Pre-fill form with user data
            document.getElementById('fullName').value = data.profile.name || '';
            document.getElementById('contactNumber').value = data.profile.contact || '';
            document.getElementById('address').value = data.profile.address || '';
        }
    })
    .catch(error => {
        console.error('Error loading user profile:', error);
    });
}

// Submit order form
function submitOrder(event) {
    event.preventDefault();
    
    // Get form elements
    const fullName = document.getElementById('fullName').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();
    const address = document.getElementById('address').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const upiId = document.getElementById('upiId')?.value.trim() || '';
    const upiReference = document.getElementById('upiReference')?.value.trim() || '';
    
    // Form validation
    if (!fullName) {
        showAlert('Please enter your full name', 'danger');
        return;
    }
    
    if (!contactNumber) {
        showAlert('Please enter your contact number', 'danger');
        return;
    }
    
    // Simple contact number validation (10 digits)
    if (!/^\d{10}$/.test(contactNumber)) {
        showAlert('Please enter a valid 10-digit contact number', 'danger');
        return;
    }
    
    if (!address) {
        showAlert('Please enter your delivery address', 'danger');
        return;
    }
    
    // Validate UPI ID if UPI payment is selected
    if (paymentMethod === 'upi' && !upiId) {
        showAlert('Please enter your UPI ID', 'danger');
        return;
    }
    
    // Validate UPI reference if UPI payment is selected
    if (paymentMethod === 'upi' && !upiReference) {
        showAlert('Please enter the UPI payment reference number', 'danger');
        return;
    }
    
    // UPI ID validation (basic pattern)
    if (paymentMethod === 'upi' && !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+$/.test(upiId)) {
        showAlert('Please enter a valid UPI ID (e.g., yourname@upi)', 'danger');
        return;
    }
    
    // Get the access token
    const token = localStorage.getItem('access_token');
    if (!token) {
        showAlert('You need to be logged in to place an order', 'danger');
        setTimeout(() => {
            window.location.href = '/login?redirect=checkout';
        }, 1500);
        return;
    }
    
    // Get cart items
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showAlert('Your cart is empty', 'danger');
        setTimeout(() => {
            window.location.href = '/cart';
        }, 1500);
        return;
    }
    
    // Calculate total
    let total = 0;
    cart.forEach(item => {
        const priceValue = parseFloat(item.price.replace(/[^\d.]/g, ''));
        total += priceValue * item.qty;
    });
    
    // Disable submit button and show loading state
    const submitButton = document.getElementById('place-order-btn');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // Prepare data for API
    const orderData = {
        name: fullName,
        address: address,
        contact: contactNumber,
        cart: cart,
        payment_method: paymentMethod,
        upi_id: upiId,
        upi_reference: upiReference,
        total: total
    };
    
    // Send order to server
    fetch('/api/createOrder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Show success message
            let successMessage = 'Order placed successfully!';
            
            // Add payment method specific details
            if (paymentMethod === 'cod') {
                successMessage += ' Your order will be delivered with cash on delivery option.';
            } else if (paymentMethod === 'upi') {
                successMessage += ' Your payment has been recorded with reference ID: ' + upiReference;
            }
            
            showAlert(successMessage, 'success');
            
            // Clear cart
            localStorage.removeItem('cart');
            
            // Redirect to order details or my account
            setTimeout(() => {
                window.location.href = data.orderid ? 
                    `/myorder/${data.orderid}` : 
                    '/myaccount';
            }, 2000);
        } else {
            // Show error message
            showAlert(data.message || 'Failed to place order. Please try again.', 'danger');
            resetSubmitButton(submitButton, originalButtonText);
        }
    })
    .catch(error => {
        console.error('Error placing order:', error);
        showAlert('An error occurred while placing your order. Please try again.', 'danger');
        resetSubmitButton(submitButton, originalButtonText);
    });
}

// Show alert message
function showAlert(message, type) {
    const alertsContainer = document.getElementById('alerts-container') || createAlertsContainer();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertsContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
}

// Create alerts container if it doesn't exist
function createAlertsContainer() {
    const container = document.createElement('div');
    container.id = 'alerts-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '5000';
    document.body.appendChild(container);
    return container;
}

// Reset submit button to original state
function resetSubmitButton(button, originalHTML) {
    button.disabled = false;
    button.innerHTML = originalHTML;
}