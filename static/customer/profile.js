// Global variables
let currentOrderId = null;

// Function to handle saving medication reminders
function saveReminder() {
    const medicationName = document.getElementById('medication-name').value;
    const dosage = document.getElementById('dosage').value;
    const time = document.getElementById('time').value;
    const notes = document.getElementById('notes').value;
    
    // Get selected frequency
    let frequency = document.querySelector('input[name="frequency"]:checked').value;
    
    if (!medicationName || !time) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Create reminder object
    const reminder = {
        id: Date.now(), // Using timestamp as a simple ID
        medication: medicationName,
        dosage: dosage || '1 tablet',
        time: time,
        frequency: frequency,
        notes: notes || '',
        createdAt: new Date().toISOString()
    };
    
    // Get existing reminders or initialize empty array
    let reminders = JSON.parse(localStorage.getItem('medicationReminders')) || [];
    
    // Add new reminder
    reminders.push(reminder);
    
    // Save to localStorage
    localStorage.setItem('medicationReminders', JSON.stringify(reminders));
    
    // Update UI and close modal
    loadReminders();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addReminderModal'));
    modal.hide();
    
    // Clear form
    document.getElementById('add-reminder-form').reset();
}

// Function to load reminders from localStorage
function loadReminders() {
    const remindersContainer = document.getElementById('reminders-container');
    const reminders = JSON.parse(localStorage.getItem('medicationReminders')) || [];
    
    if (reminders.length === 0) {
        remindersContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-pills fa-3x mb-3 text-muted"></i>
                <p>You don't have any medication reminders yet.</p>
                <p>Click "Add Reminder" to create one.</p>
            </div>
        `;
        return;
    }
    
    // Clear container
    remindersContainer.innerHTML = '';
    
    // Add each reminder to the container
    reminders.forEach(reminder => {
        const reminderElement = document.createElement('div');
        reminderElement.className = 'reminder-card p-3 mb-3';
        reminderElement.innerHTML = `
            <div class="d-flex justify-content-between">
                <h5>${reminder.medication}</h5>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-2 edit-reminder-btn" data-reminder-id="${reminder.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-reminder-btn" data-reminder-id="${reminder.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="mb-1"><i class="fas fa-clock me-2"></i>${formatTime(reminder.time)}</p>
            <p class="mb-1"><i class="fas fa-calendar-alt me-2"></i>${formatFrequency(reminder.frequency)}</p>
            <p class="mb-0"><i class="fas fa-pills me-2"></i>${reminder.dosage} ${reminder.notes ? `(${reminder.notes})` : ''}</p>
        `;
        
        remindersContainer.appendChild(reminderElement);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-reminder-btn').forEach(button => {
        button.addEventListener('click', function() {
            const reminderId = this.getAttribute('data-reminder-id');
            editReminder(reminderId);
        });
    });
    
    document.querySelectorAll('.delete-reminder-btn').forEach(button => {
        button.addEventListener('click', function() {
            const reminderId = this.getAttribute('data-reminder-id');
            deleteReminder(reminderId);
        });
    });
}

// Function to delete a reminder
function deleteReminder(id) {
    if (confirm('Are you sure you want to delete this reminder?')) {
        let reminders = JSON.parse(localStorage.getItem('medicationReminders')) || [];
        reminders = reminders.filter(reminder => reminder.id != id);
        localStorage.setItem('medicationReminders', JSON.stringify(reminders));
        loadReminders();
    }
}

// Function to edit a reminder
function editReminder(id) {
    const reminders = JSON.parse(localStorage.getItem('medicationReminders')) || [];
    const reminder = reminders.find(r => r.id == id);
    
    if (!reminder) return;
    
    // Populate form fields
    document.getElementById('medication-name').value = reminder.medication;
    document.getElementById('dosage').value = reminder.dosage;
    document.getElementById('time').value = reminder.time;
    document.getElementById('notes').value = reminder.notes;
    
    // Set frequency radio button
    document.querySelector(`input[name="frequency"][value="${reminder.frequency}"]`).checked = true;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addReminderModal'));
    modal.show();
    
    // Change save button to update mode
    const saveButton = document.getElementById('saveReminderBtn');
    saveButton.textContent = 'Update Reminder';
    saveButton.setAttribute('data-reminder-id', id);
    
    // Change modal title
    document.getElementById('addReminderModalLabel').textContent = 'Edit Medication Reminder';
}

// Helper function to format time
function formatTime(timeString) {
    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return timeString;
    }
}

// Helper function to format frequency
function formatFrequency(frequency) {
    switch (frequency) {
        case 'daily':
            return 'Daily';
        case 'weekly':
            return 'Weekly';
        case 'custom':
            return 'Custom Schedule';
        default:
            return frequency;
    }
}

// Function to initialize event listeners once DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load reminders on page load
    if (document.getElementById('reminders-container')) {
        loadReminders();
    }
    
    // Add event listener for save reminder button
    const saveReminderBtn = document.getElementById('saveReminderBtn');
    if (saveReminderBtn) {
        saveReminderBtn.addEventListener('click', function() {
            const reminderId = this.getAttribute('data-reminder-id');
            
            if (reminderId) {
                // Update existing reminder
                updateReminder(reminderId);
                // Reset button
                this.textContent = 'Save Reminder';
                this.removeAttribute('data-reminder-id');
                // Reset modal title
                document.getElementById('addReminderModalLabel').textContent = 'Add Medication Reminder';
            } else {
                // Save new reminder
                saveReminder();
            }
        });
    }
    
    // Account settings form submit handler
    const accountSettingsForm = document.getElementById('account-settings-form');
    if (accountSettingsForm) {
        accountSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAccountSettings();
        });
    }
    
    // Save profile button handler
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            saveProfile();
        });
    }
    
    // Load user profile when the page loads
    loadUserProfile();
    loadUserOrders();
});

// Function to update an existing reminder
function updateReminder(id) {
    const medicationName = document.getElementById('medication-name').value;
    const dosage = document.getElementById('dosage').value;
    const time = document.getElementById('time').value;
    const notes = document.getElementById('notes').value;
    let frequency = document.querySelector('input[name="frequency"]:checked').value;
    
    if (!medicationName || !time) {
        alert('Please fill in all required fields');
        return;
    }
    
    let reminders = JSON.parse(localStorage.getItem('medicationReminders')) || [];
    const index = reminders.findIndex(r => r.id == id);
    
    if (index !== -1) {
        reminders[index] = {
            ...reminders[index],
            medication: medicationName,
            dosage: dosage || '1 tablet',
            time: time,
            frequency: frequency,
            notes: notes || '',
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('medicationReminders', JSON.stringify(reminders));
        loadReminders();
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addReminderModal'));
    modal.hide();
    document.getElementById('add-reminder-form').reset();
}

// Function to save account settings
function saveAccountSettings() {
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Simple validation
    if (!email) {
        alert('Email is required');
        return;
    }
    
    // Password validation
    if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
            alert('Current password is required to change password');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters long');
            return;
        }
        
        // Here you would typically make an API call to verify the current password
        // and update to the new password on the server
        
        // Reset password fields
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    }
    
    // Save user settings to localStorage (in a real app, you'd save to the server)
    const userSettings = {
        email: email,
        phone: phone,
        address: address,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    alert('Account settings saved successfully');
}

// Function to save profile information
function saveProfile() {
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const phone = document.getElementById('profile-phone').value;
    
    // Validation
    if (!name || !email) {
        alert('Name and email are required');
        return;
    }
    
    // Save profile info to localStorage (in a real app, you'd save to the server)
    const profileInfo = {
        name: name,
        email: email,
        phone: phone,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('profileInfo', JSON.stringify(profileInfo));
    
    // Update display name
    document.getElementById('username-display').textContent = name;
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
    modal.hide();
    
    alert('Profile updated successfully');
}

// Function to show alerts for user feedback
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Function to get access token, first from cookies, then localStorage as fallback
function getAccessToken() {
    // Try to get from cookie first
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('access_token=')) {
            return cookie.substring('access_token='.length, cookie.length);
        }
    }
    
    // Fallback to localStorage
    return localStorage.getItem('accessToken');
}

// Load user profile data
async function loadUserProfile() {
    try {
        console.log('Loading user profile...');
        const accessToken = getAccessToken();
        if (!accessToken) {
            console.error('No access token found');
            showAlert('Please log in to view your profile', 'warning');
            return;
        }

        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Response is not JSON:', contentType);
            throw new Error('Response is not valid JSON');
        }
        
        const data = await response.json();
        console.log('Profile data received:', data);
        
        // Update profile information in the UI
        const profileElements = {
            'profile-full-name': data.full_name || 'Not provided',
            'profile-email': data.email || 'Not provided',
            'profile-phone': data.phone || 'Not provided',
            'profile-address': data.address || 'Not provided'
        };
        
        // Update form fields
        const formElements = {
            'edit-full-name': data.full_name || '',
            'edit-email': data.email || '',
            'edit-phone': data.phone || '',
            'edit-address': data.address || ''
        };
        
        // Update UI elements
        Object.entries(profileElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update form fields
        Object.entries(formElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile data: ' + error.message, 'danger');
    }
}

// Save profile information
async function saveProfileInfo() {
    try {
        console.log('Saving profile information...');
        const fullName = document.getElementById('edit-full-name').value;
        const email = document.getElementById('edit-email').value;
        const phone = document.getElementById('edit-phone').value;
        const address = document.getElementById('edit-address').value;
        
        if (!fullName || !email) {
            showAlert('Full name and email are required', 'danger');
            return;
        }
        
        const accessToken = getAccessToken();
        if (!accessToken) {
            console.error('No access token found');
            showAlert('Please log in to update your profile', 'warning');
            return;
        }
        
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                full_name: fullName,
                email: email,
                phone: phone,
                address: address
            })
        });
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Profile update response:', data);
        showAlert(data.message || 'Profile updated successfully', 'success');
        
        // Close modal and reload profile
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        if (modal) modal.hide();
        loadUserProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        showAlert('Error saving profile data: ' + error.message, 'danger');
    }
}

// Load user orders
async function loadUserOrders() {
    try {
        console.log('Loading user orders...');
        const accessToken = getAccessToken();
        if (!accessToken) {
            console.error('No access token found');
            showAlert('Please log in to view your orders', 'warning');
            return;
        }
        
        // First show loading indicator
        const ordersContainer = document.getElementById('orders-container');
        if (!ordersContainer) {
            console.error('Orders container not found in DOM');
            return;
        }
        
        ordersContainer.innerHTML = `
            <div class="d-flex justify-content-center p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        
        // Make API call with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
            const response = await fetch('/api/user/orders', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.status === 401) {
                showAlert('Your session has expired. Please log in again.', 'warning');
                ordersContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <p>Your session has expired. Please log in again.</p>
                    </div>
                `;
                return;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Response is not JSON:', contentType);
                throw new Error('Response is not valid JSON');
            }
            
            const data = await response.json();
            console.log('Orders received:', data);
            
            if (!Array.isArray(data)) {
                console.error('Expected orders to be an array but got:', typeof data);
                ordersContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <p>Invalid order data received. Please try again later.</p>
                    </div>
                `;
                return;
            }
            
            if (data.length === 0) {
                ordersContainer.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-shopping-bag fa-3x mb-3 text-muted"></i>
                        <p>You don't have any orders yet.</p>
                        <p>Start shopping to place your first order!</p>
                        <a href="/" class="btn btn-primary mt-3">Shop Now</a>
                    </div>
                `;
                return;
            }
            
            // Clear container
            ordersContainer.innerHTML = '';
            
            // Add each order to the container
            data.forEach(order => {
                try {
                    const orderCard = createOrderCard(order);
                    if (orderCard) {
                        ordersContainer.appendChild(orderCard);
                    }
                } catch (error) {
                    console.error('Error creating order card:', error, order);
                    // Continue with next order
                }
            });
            
            // Setup event listeners for the order cards
            setupOrderCardListeners();
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.error('Request timed out');
                ordersContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <p>Request timed out. The server is taking too long to respond.</p>
                        <button class="btn btn-outline-primary btn-sm mt-2" onclick="loadUserOrders()">
                            <i class="fas fa-sync-alt"></i> Try Again
                        </button>
                    </div>
                `;
            } else {
                throw error; // Re-throw for the outer catch block
            }
        }
        
    } catch (error) {
        console.error('Error loading orders:', error);
        
        const ordersContainer = document.getElementById('orders-container');
        if (ordersContainer) {
            ordersContainer.innerHTML = `
                <div class="alert alert-danger">
                    <p><strong>Failed to load orders.</strong> Please try again later.</p>
                    <p class="small text-muted">Error details: ${error.message}</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="loadUserOrders()">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            `;
        }
        
        showAlert('Error loading orders: ' + error.message, 'danger');
    }
}

// Function to confirm cancellation of an order
function confirmCancelOrder(orderId) {
    console.log(`Confirming cancellation of order ${orderId}`);
    currentOrderId = orderId;
    
    // Hide any existing modals
    const orderModal = document.getElementById('orderDetailsModal');
    if (orderModal && bootstrap.Modal.getInstance(orderModal)) {
        bootstrap.Modal.getInstance(orderModal).hide();
    }
    
    // Check if the cancel modal exists
    let cancelModal = document.getElementById('cancelOrderModal');
    
    if (!cancelModal) {
        // Create the modal if it doesn't exist
        cancelModal = document.createElement('div');
        cancelModal.className = 'modal fade';
        cancelModal.id = 'cancelOrderModal';
        cancelModal.setAttribute('tabindex', '-1');
        cancelModal.setAttribute('aria-labelledby', 'cancelOrderModalLabel');
        cancelModal.setAttribute('aria-hidden', 'true');
        
        cancelModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="cancelOrderModalLabel">Cancel Order</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to cancel Order #${orderId}?</p>
                        <p>This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Keep Order</button>
                        <button type="button" class="btn btn-danger" id="confirm-cancel-btn" data-order-id="${orderId}">
                            Yes, Cancel Order
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(cancelModal);
    } else {
        // Update the order ID in the modal
        const modalBody = cancelModal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <p>Are you sure you want to cancel Order #${orderId}?</p>
                <p>This action cannot be undone.</p>
            `;
        }
        
        const confirmBtn = cancelModal.querySelector('#confirm-cancel-btn');
        if (confirmBtn) {
            confirmBtn.setAttribute('data-order-id', orderId);
        }
    }
    
    // Show the cancel confirmation modal
    const bsModal = new bootstrap.Modal(cancelModal);
    bsModal.show();
    
    // Add click event to the confirm button
    const confirmBtn = document.getElementById('confirm-cancel-btn');
    if (confirmBtn) {
        // Remove any existing event listeners by cloning and replacing
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        
        // Add the new event listener
        newBtn.addEventListener('click', function() {
            const id = this.getAttribute('data-order-id');
            cancelOrder(id);
        });
    }
}

// Function to cancel an order
async function cancelOrder(orderId) {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            showAlert('Please log in to cancel your order', 'warning');
            return;
        }

        console.log(`Cancelling order ${orderId}`);
        const response = await fetch(`/api/user/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide the modal
        const cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelOrderModal'));
        if (cancelModal) cancelModal.hide();
        
        // Show success message
        showAlert(data.message || 'Order cancelled successfully', 'success');
        
        // Reload orders to reflect the change
        loadUserOrders();
    } catch (error) {
        console.error('Error cancelling order:', error);
        showAlert('Error cancelling order: ' + error.message, 'danger');
        const cancelModal = bootstrap.Modal.getInstance(document.getElementById('cancelOrderModal'));
        if (cancelModal) cancelModal.hide();
    }
}

// Get status badge class
function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'bg-warning';
        case 'shipped':
            return 'bg-info';
        case 'delivered':
            return 'bg-success';
        case 'cancelled':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Update event listeners for buttons in order cards
function setupOrderCardListeners() {
    // Add listeners for view buttons
    document.querySelectorAll('.view-order-btn').forEach(button => {
        // Clone and replace to remove old listeners
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        
        newBtn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            viewOrderDetails(orderId);
        });
    });
    
    // Add listeners for cancel buttons
    document.querySelectorAll('.cancel-order-btn').forEach(button => {
        // Clone and replace to remove old listeners
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        
        newBtn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            confirmCancelOrder(orderId);
        });
    });
}

// Update the createOrderCard function to use the setupOrderCardListeners function
function createOrderCard(order) {
    console.log('Creating order card for:', order);
    
    if (!order || typeof order !== 'object') {
        console.error('Invalid order object:', order);
        throw new Error('Invalid order data');
    }
    
    if (!order.orderid) {
        console.error('Order missing orderid:', order);
        throw new Error('Order missing ID');
    }
    
    let orderDate = 'Unknown';
    let orderTime = '';
    
    try {
        if (order.time) {
            const date = new Date(order.time);
            if (!isNaN(date)) {
                orderDate = date.toLocaleDateString();
                orderTime = date.toLocaleTimeString();
            }
        }
    } catch (error) {
        console.error('Error formatting date:', error, order.time);
    }
    
    // Create a div element for the order card
    const orderCard = document.createElement('div');
    orderCard.className = 'card mb-3 order-card';
    
    // Create status badge with appropriate color
    let statusBadgeClass = 'bg-primary';
    const status = order.status || 'Unknown';
    
    if (status.toLowerCase().includes('cancel')) {
        statusBadgeClass = 'bg-danger';
    } else if (status.toLowerCase().includes('deliver')) {
        statusBadgeClass = 'bg-success';
    } else if (status.toLowerCase().includes('ship')) {
        statusBadgeClass = 'bg-info';
    } else if (status.toLowerCase().includes('pack')) {
        statusBadgeClass = 'bg-warning text-dark';
    } else if (status.toLowerCase().includes('receiv')) {
        statusBadgeClass = 'bg-secondary';
    }
    
    // Generate cart items summary
    let cartSummary = 'No items';
    try {
        if (order.cart && Array.isArray(order.cart) && order.cart.length > 0) {
            cartSummary = order.cart.map(item => {
                const name = item.name || 'Unknown item';
                const qty = item.qty || 1;
                return `${name} (${qty})`;
            }).join(', ');
        }
    } catch (error) {
        console.error('Error generating cart summary:', error);
    }
    
    // Set card content
    const totalPrice = order.total ? `₹${order.total}` : 'Not specified';
    
    orderCard.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Order #${order.orderid}</h5>
            <span class="badge ${statusBadgeClass}">${status}</span>
        </div>
        <div class="card-body">
            <p class="card-text"><strong>Date:</strong> ${orderDate}${orderTime ? ` at ${orderTime}` : ''}</p>
            <p class="card-text"><strong>Items:</strong> ${cartSummary}</p>
            <p class="card-text"><strong>Total:</strong> ${totalPrice}</p>
            <div class="d-flex justify-content-end mt-3">
                <button class="btn btn-outline-primary btn-sm me-2 view-order-btn" data-order-id="${order.orderid}">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${status.toLowerCase().includes('pending') || status.toLowerCase().includes('receiv') ? 
                    `<button class="btn btn-outline-danger btn-sm cancel-order-btn" data-order-id="${order.orderid}">
                        <i class="fas fa-times"></i> Cancel Order
                    </button>` : ''}
            </div>
        </div>
    `;
    
    return orderCard;
}

// Function to view order details
async function viewOrderDetails(orderId) {
    try {
        console.log(`Viewing details for order ${orderId}`);
        const accessToken = getAccessToken();
        if (!accessToken) {
            showAlert('Please log in to view order details', 'warning');
            return;
        }

        // Show a loading indicator
        const modalContent = document.getElementById('order-details-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="d-flex justify-content-center p-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            
            // Show the modal while loading
            const orderModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
            orderModal.show();
        }

        const response = await fetch(`/api/user/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.status === 401) {
            if (modalContent) {
                modalContent.innerHTML = `
                    <div class="alert alert-warning">
                        <p>Your session has expired. Please log in again.</p>
                    </div>
                `;
            }
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const order = await response.json();
        console.log('Order details:', order);
        
        // Display order details in modal
        if (!modalContent) {
            console.error('Modal content element not found');
            return;
        }
        
        // Format date
        let formattedDate = 'N/A';
        if (order.time) {
            try {
                const orderDate = new Date(order.time);
                formattedDate = orderDate.toLocaleString();
            } catch (e) {
                console.error('Error formatting date:', e);
                formattedDate = order.time;
            }
        }
        
        // Get status badge
        let statusBadgeClass = 'bg-primary';
        const status = (order.status || '').toLowerCase();
        if (status.includes('cancel')) {
            statusBadgeClass = 'bg-danger';
        } else if (status.includes('deliver')) {
            statusBadgeClass = 'bg-success';
        } else if (status.includes('ship')) {
            statusBadgeClass = 'bg-info';
        } else if (status.includes('pending') || status.includes('receiv')) {
            statusBadgeClass = 'bg-warning text-dark';
        }
        
        // Create the HTML for the order details
        modalContent.innerHTML = `
            <div class="order-details">
                <div class="order-header mb-3">
                    <h5>Order #${order.orderid}</h5>
                    <p class="text-muted mb-1">Placed on: ${formattedDate}</p>
                    <span class="badge ${statusBadgeClass}">${order.status || 'Unknown'}</span>
                </div>
                
                <div class="order-items mb-3">
                    <h6 class="mb-2">Items</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead class="table-light">
                                <tr>
                                    <th>Item</th>
                                    <th class="text-center">Quantity</th>
                                    <th class="text-end">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.cart && Array.isArray(order.cart) && order.cart.length > 0 ? 
                                    order.cart.map(item => `
                                        <tr>
                                            <td>${item.name || 'Unknown'}</td>
                                            <td class="text-center">${item.qty || item.quantity || 1}</td>
                                            <td class="text-end">${item.price ? ('₹' + item.price) : 'N/A'}</td>
                                        </tr>
                                    `).join('') : 
                                    '<tr><td colspan="3" class="text-center">No items found</td></tr>'
                                }
                            </tbody>
                            <tfoot class="table-light">
                                <tr>
                                    <th colspan="2" class="text-end">Total:</th>
                                    <th class="text-end">₹${order.total || '0'}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">Shipping Information</h6>
                            </div>
                            <div class="card-body">
                                <p class="mb-1"><strong>Name:</strong> ${order.name || 'Not provided'}</p>
                                <p class="mb-1"><strong>Address:</strong> ${order.address || 'Not provided'}</p>
                                <p class="mb-1"><strong>Contact:</strong> ${order.contact || 'Not provided'}</p>
                                <p class="mb-0">
                                    <strong>Delivery Method:</strong> 
                                    ${order.delivery_method || 'Standard Delivery'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">Payment Information</h6>
                            </div>
                            <div class="card-body">
                                <p class="mb-1">
                                    <strong>Payment Method:</strong> 
                                    ${order.payment_method || 'Not specified'}
                                </p>
                                <p class="mb-1"><strong>Total Amount:</strong> ₹${order.total || '0'}</p>
                                <p class="mb-0">
                                    <strong>Status:</strong> 
                                    <span class="badge ${statusBadgeClass}">${order.status || 'Unknown'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${(status === 'pending' || status.includes('receiv')) ? `
                    <div class="text-end">
                        <button class="btn btn-danger" onclick="confirmCancelOrder('${order.orderid}')">
                            <i class="fas fa-times me-1"></i> Cancel Order
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error('Error viewing order details:', error);
        
        const modalContent = document.getElementById('order-details-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="alert alert-danger">
                    <p><strong>Failed to load order details.</strong> Please try again later.</p>
                    <p class="small text-muted">Error details: ${error.message}</p>
                    <button class="btn btn-outline-primary btn-sm mt-2" onclick="viewOrderDetails('${currentOrderId}')">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            `;
        }
        
        showAlert('Error loading order details: ' + error.message, 'danger');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing profile page...');
    loadUserProfile();
    loadUserOrders();
}); 