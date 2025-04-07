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

// Load user profile data
async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        const data = await response.json();
        
        if (data.res === 1 && data.data) {
            // Update profile information in the UI
            document.getElementById('profile-full-name').textContent = data.data.full_name;
            document.getElementById('profile-email').textContent = data.data.email;
            document.getElementById('profile-phone').textContent = data.data.phone || 'Not provided';
            document.getElementById('profile-address').textContent = data.data.address || 'Not provided';
            
            // Update form fields
            document.getElementById('edit-full-name').value = data.data.full_name;
            document.getElementById('edit-email').value = data.data.email;
            document.getElementById('edit-phone').value = data.data.phone || '';
            document.getElementById('edit-address').value = data.data.address || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile data', 'danger');
    }
}

// Save profile information
async function saveProfileInfo() {
    const fullName = document.getElementById('edit-full-name').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    const address = document.getElementById('edit-address').value;
    
    if (!fullName || !email) {
        showAlert('Full name and email are required', 'danger');
        return;
    }
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
                full_name: fullName,
                email: email,
                phone: phone,
                address: address
            })
        });
        
        const data = await response.json();
        if (data.res === 1) {
            showAlert('Profile updated successfully', 'success');
            $('#editProfileModal').modal('hide');
            loadUserProfile();
        } else {
            showAlert(data.message || 'Error updating profile', 'danger');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showAlert('Error saving profile data', 'danger');
    }
}

// Load user orders
async function loadUserOrders() {
    try {
        const response = await fetch('/api/user/orders', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        const data = await response.json();
        
        if (data.res === 1 && data.data) {
            const ordersContainer = document.getElementById('orders-container');
            ordersContainer.innerHTML = '';
            
            data.data.forEach(order => {
                const orderCard = createOrderCard(order);
                ordersContainer.appendChild(orderCard);
            });
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlert('Error loading orders', 'danger');
    }
}

// Create order card element
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
        <div class="order-header">
            <h3>Order #${order.orderid}</h3>
            <span class="status ${order.status.toLowerCase()}">${order.status}</span>
        </div>
        <div class="order-details">
            <p><strong>Date:</strong> ${new Date(order.time).toLocaleDateString()}</p>
            <p><strong>Total:</strong> $${order.total}</p>
            <p><strong>Items:</strong> ${order.cart}</p>
        </div>
        <div class="order-actions">
            <button class="btn btn-primary" onclick="viewOrderDetails(${order.orderid})">View Details</button>
            ${order.status === 'pending' ? `
                <button class="btn btn-danger" onclick="confirmCancelOrder(${order.orderid})">Cancel Order</button>
            ` : ''}
        </div>
    `;
    return card;
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/user/order/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        const data = await response.json();
        
        if (data.res === 1 && data.data) {
            const order = data.data[0];
            // Implement order details view logic here
            // This could open a modal with detailed order information
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showAlert('Error loading order details', 'danger');
    }
}

// Cancel order
async function cancelOrder(orderId) {
    try {
        const response = await fetch(`/api/user/order/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        const data = await response.json();
        
        if (data.res === 1) {
            showAlert('Order cancelled successfully', 'success');
            loadUserOrders();
        } else {
            showAlert(data.message || 'Error cancelling order', 'danger');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showAlert('Error cancelling order', 'danger');
    }
}

// Show alert message
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadUserOrders();
}); 