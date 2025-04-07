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

// Load user profile data
async function loadUserProfile() {
    try {
        console.log('Loading user profile...');
        const accessToken = localStorage.getItem('accessToken');
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
        
        const accessToken = localStorage.getItem('accessToken');
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
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error('No access token found');
            showAlert('Please log in to view your orders', 'warning');
            return;
        }
        
        const response = await fetch('/api/user/orders', {
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
        
        const orders = await response.json();
        console.log('Orders received:', orders);
        
        const ordersContainer = document.getElementById('orders-container');
        if (!ordersContainer) {
            console.error('Orders container not found in DOM');
            return;
        }
        
        if (!orders || orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-shopping-bag fa-3x mb-3 text-muted"></i>
                    <p>You don't have any orders yet.</p>
                    <p>Start shopping to place your first order!</p>
                </div>
            `;
            return;
        }
        
        // Clear container
        ordersContainer.innerHTML = '';
        
        // Add each order to the container
        orders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersContainer.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlert('Error loading orders: ' + error.message, 'danger');
        
        const ordersContainer = document.getElementById('orders-container');
        if (ordersContainer) {
            ordersContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load orders. Please try again later.
                </div>
            `;
        }
    }
}

// Function to create an order card
function createOrderCard(order) {
    console.log('Creating order card for:', order);
    
    const orderDate = new Date(order.time).toLocaleDateString();
    const orderTime = new Date(order.time).toLocaleTimeString();
    
    // Create a div element for the order card
    const orderCard = document.createElement('div');
    orderCard.className = 'card mb-3 order-card';
    
    // Create status badge with appropriate color
    let statusBadgeClass = 'bg-primary';
    if (order.status === 'cancelled' || order.status === 'Order Cancelled') {
        statusBadgeClass = 'bg-danger';
    } else if (order.status === 'delivered' || order.status === 'Order Delivered') {
        statusBadgeClass = 'bg-success';
    } else if (order.status === 'shipped' || order.status === 'Order Shipped') {
        statusBadgeClass = 'bg-info';
    } else if (order.status === 'packed' || order.status === 'Order Packed') {
        statusBadgeClass = 'bg-warning text-dark';
    }
    
    // Generate cart items summary
    let cartSummary = '';
    if (order.cart && order.cart.length > 0) {
        cartSummary = order.cart.map(item => `${item.name} (${item.qty})`).join(', ');
    } else {
        cartSummary = 'No items';
    }
    
    // Set card content
    orderCard.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Order #${order.orderid}</h5>
            <span class="badge ${statusBadgeClass}">${order.status}</span>
        </div>
        <div class="card-body">
            <p class="card-text"><strong>Date:</strong> ${orderDate} at ${orderTime}</p>
            <p class="card-text"><strong>Items:</strong> ${cartSummary}</p>
            <p class="card-text"><strong>Total:</strong> ₹${order.total}</p>
            <div class="d-flex justify-content-end mt-3">
                <button class="btn btn-outline-primary btn-sm me-2 view-order-btn" data-order-id="${order.orderid}">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${order.status === 'pending' || order.status === 'Order Received' ? 
                    `<button class="btn btn-outline-danger btn-sm cancel-order-btn" data-order-id="${order.orderid}">
                        <i class="fas fa-times"></i> Cancel Order
                    </button>` : ''}
            </div>
        </div>
    `;
    
    // Add event listeners for buttons
    setTimeout(() => {
        const viewBtn = orderCard.querySelector('.view-order-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => viewOrderDetails(order.orderid));
        }
        
        const cancelBtn = orderCard.querySelector('.cancel-order-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => confirmCancelOrder(order.orderid));
        }
    }, 0);
    
    return orderCard;
}

// Function to view order details
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/user/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const order = await response.json();
        
        // Display order details in modal
        const modalContent = document.getElementById('order-details-content');
        
        // Create the HTML for the order details
        // This will vary based on your data structure
        modalContent.innerHTML = `
            <div class="order-details">
                <div class="order-header mb-3">
                    <h6>Order #${order.orderid}</h6>
                    <p class="text-muted">Placed on: ${new Date(order.time).toLocaleString()}</p>
                    <span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
                </div>
                
                <div class="order-items mb-3">
                    <h6 class="mb-2">Items</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.cart.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>₹${item.price}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <h6 class="mb-2">Shipping Information</h6>
                        <p class="mb-1"><strong>Delivery Method:</strong> ${order.delivery_method || 'Standard Delivery'}</p>
                        <p class="mb-1"><strong>Address:</strong> ${order.address}</p>
                        <p class="mb-1"><strong>Contact:</strong> ${order.contact}</p>
                    </div>
                    <div class="col-md-6">
                        <h6 class="mb-2">Order Summary</h6>
                        <p class="mb-1"><strong>Total:</strong> ₹${order.total}</p>
                        <p class="mb-1"><strong>Status:</strong> ${order.status}</p>
                    </div>
                </div>
                
                ${order.status === 'pending' ? `
                    <div class="text-end">
                        <button class="btn btn-danger" onclick="confirmCancelOrder('${order.orderid}')">
                            <i class="fas fa-times"></i> Cancel Order
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Show the modal
        const orderModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        orderModal.show();
    } catch (error) {
        console.error('Error viewing order details:', error);
        showAlert('Error loading order details: ' + error.message, 'danger');
    }
}

// Function to confirm cancellation of an order
function confirmCancelOrder(orderId) {
    // Hide the details modal
    const orderModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    if (orderModal) orderModal.hide();
    
    // Set the order ID for the cancel button
    document.getElementById('confirm-cancel-btn').setAttribute('data-order-id', orderId);
    
    // Show the cancel confirmation modal
    const cancelModal = new bootstrap.Modal(document.getElementById('cancelOrderModal'));
    cancelModal.show();
    
    // Add click event to the confirm button
    document.getElementById('confirm-cancel-btn').onclick = function() {
        cancelOrder(this.getAttribute('data-order-id'));
    };
}

// Function to cancel an order
async function cancelOrder(orderId) {
    try {
        const response = await fetch(`/api/user/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing profile page...');
    loadUserProfile();
    loadUserOrders();
}); 