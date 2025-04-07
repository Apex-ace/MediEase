// Check for access token validity.
// If not valid, redirect to homepage

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get access token from cookies or localStorage
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
    
    const accessToken = getAccessToken();
    
    // Check if access token exists
    if (!accessToken) {
        showAuthError("No authentication token found. Please log in.");
        return;
    }
    
    // Verify access token validity
    fetch('/api/isvalid', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Invalid authentication token');
        }
        return response.json();
    })
    .then(data => {
        if (data.res !== 1) {
            throw new Error(data.message || 'Invalid authentication token');
        }
        
        // Load user data
        loadUserProfile();
        loadUserOrders();
        loadUserReminders();
        
        // Setup event listeners
        setupEventListeners();
    })
    .catch(error => {
        console.error('Authentication error:', error);
        showAuthError("Your session has expired. Please log in again.");
    });
    
    // Function to display authentication errors
    function showAuthError(message) {
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    }
    
    // Function to load user profile data
    function loadUserProfile() {
        fetch('/api/user/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => response.json())
        .then(profile => {
            // Update profile card
            document.getElementById('profile-full-name').textContent = profile.full_name || 'Welcome User';
            document.getElementById('profile-email').textContent = profile.email || 'Not set';
            document.getElementById('profile-phone').textContent = profile.phone || 'Not set';
            document.getElementById('profile-address').textContent = profile.address || 'Not set';
            
            // Fill form fields for editing
            document.getElementById('edit-full-name').value = profile.full_name || '';
            document.getElementById('edit-email').value = profile.email || '';
            document.getElementById('edit-phone').value = profile.phone || '';
            document.getElementById('edit-address').value = profile.address || '';
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            showAlert('danger', 'Failed to load profile information.');
        });
    }
    
    // Function to load user orders
    function loadUserOrders() {
        const ordersContainer = document.getElementById('orders-container');
        
        fetch('/api/user/orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => response.json())
        .then(orders => {
            if (orders.length === 0) {
                ordersContainer.innerHTML = `
                    <div class="text-center py-5">
                        <img src="/static/customer/empty-orders.png" alt="No Orders" style="width: 120px; opacity: 0.5;" class="mb-3">
                        <h5 class="text-muted">You haven't placed any orders yet</h5>
                        <a href="/" class="btn btn-primary mt-3">Browse Medicines</a>
                    </div>
                `;
                return;
            }
            
            let tableHtml = `
                <div class="table-responsive">
                    <table class="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            orders.forEach(order => {
                // Format date
                const orderDate = new Date(order.time);
                const formattedDate = orderDate.toLocaleDateString() + ' ' + orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Format total with currency symbol
                let total = order.total;
                if (typeof total === 'number') {
                    total = '₹' + total.toFixed(2);
                } else if (typeof total === 'string' && !total.startsWith('₹')) {
                    total = '₹' + total;
                }
                
                // Get status class
                let statusClass = 'status-pending';
                if (order.status) {
                    const status = order.status.toLowerCase();
                    if (status.includes('cancel')) {
                        statusClass = 'status-cancelled';
                    } else if (status.includes('deliver')) {
                        statusClass = 'status-delivered';
                    } else if (status.includes('ship')) {
                        statusClass = 'status-shipped';
                    }
                }
                
                // Count items in cart
                const itemCount = order.cart ? order.cart.length : 0;
                
                tableHtml += `
                    <tr>
                        <td>#${order.orderid}</td>
                        <td>${formattedDate}</td>
                        <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                        <td>${total}</td>
                        <td><span class="order-status ${statusClass}">${order.status || 'Pending'}</span></td>
                        <td>
                            <a href="/myorder/${order.orderid}" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-eye"></i> View
                            </a>
                        </td>
                    </tr>
                `;
            });
            
            tableHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            
            ordersContainer.innerHTML = tableHtml;
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    Failed to load your orders. Please try again later.
                </div>
            `;
        });
    }
    
    // Function to load user medication reminders
    function loadUserReminders() {
        const remindersContainer = document.getElementById('reminders-container');
        
        fetch('/api/user/reminders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => response.json())
        .then(reminders => {
            if (!Array.isArray(reminders) || reminders.length === 0) {
                remindersContainer.innerHTML = `
                    <div class="text-center py-5">
                        <img src="/static/customer/empty-reminders.png" alt="No Reminders" style="width: 120px; opacity: 0.5;" class="mb-3">
                        <h5 class="text-muted">You don't have any medication reminders yet</h5>
                        <button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#addReminderModal">
                            <i class="fas fa-plus"></i> Add Your First Reminder
                        </button>
                    </div>
                `;
                return;
            }
            
            let remindersHtml = '';
            
            reminders.forEach(reminder => {
                // Format time
                const time = reminder.time || '00:00';
                
                remindersHtml += `
                    <div class="reminder-card" data-id="${reminder.id}">
                        <div class="reminder-info">
                            <h5 class="mb-1">${reminder.medication_name}</h5>
                            <p class="mb-1 text-muted">${reminder.dosage || 'No dosage specified'}</p>
                            <div>
                                <span class="reminder-time">
                                    <i class="far fa-clock"></i> ${time}
                                </span>
                                <span class="reminder-frequency">${reminder.frequency}</span>
                            </div>
                            <p class="small text-muted mt-1 mb-0">${reminder.notes || ''}</p>
                        </div>
                        <div class="reminder-actions">
                            <button class="btn btn-sm btn-outline-primary edit-reminder-btn" data-id="${reminder.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-reminder-btn" data-id="${reminder.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            remindersContainer.innerHTML = remindersHtml;
            
            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-reminder-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const reminderId = this.getAttribute('data-id');
                    // Implement edit functionality
                    alert('Edit feature coming soon!');
                });
            });
            
            document.querySelectorAll('.delete-reminder-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const reminderId = this.getAttribute('data-id');
                    deleteReminder(reminderId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading reminders:', error);
            remindersContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    Failed to load your medication reminders. Please try again later.
                </div>
            `;
        });
    }
    
    // Function to delete a reminder
    function deleteReminder(reminderId) {
        if (confirm('Are you sure you want to delete this reminder?')) {
            fetch(`/api/user/reminders/${reminderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete reminder');
                }
                return response.json();
            })
            .then(data => {
                showAlert('success', 'Reminder deleted successfully');
                loadUserReminders(); // Reload the reminders list
            })
            .catch(error => {
                console.error('Error deleting reminder:', error);
                showAlert('danger', 'Failed to delete reminder');
            });
        }
    }
    
    // Function to save profile info
    window.saveProfileInfo = function() {
        const profileData = {
            full_name: document.getElementById('edit-full-name').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            address: document.getElementById('edit-address').value
        };
        
        fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(profileData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            return response.json();
        })
        .then(data => {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
            
            // Reload profile data
            loadUserProfile();
            
            // Show success message
            showAlert('success', 'Profile updated successfully');
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            showAlert('danger', 'Failed to update profile information');
        });
    };
    
    // Setup event listeners
    function setupEventListeners() {
        // Add reminder form submission
        document.getElementById('saveReminderBtn').addEventListener('click', function() {
            const reminderData = {
                medication_name: document.getElementById('medication-name').value,
                dosage: document.getElementById('dosage').value,
                time: document.getElementById('time').value,
                frequency: document.querySelector('input[name="frequency"]:checked').value,
                notes: document.getElementById('notes').value
            };
            
            fetch('/api/user/reminders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(reminderData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create reminder');
                }
                return response.json();
            })
            .then(data => {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addReminderModal'));
                modal.hide();
                
                // Reset form
                document.getElementById('add-reminder-form').reset();
                
                // Reload reminders
                loadUserReminders();
                
                // Show success message
                showAlert('success', 'Medication reminder added successfully');
            })
            .catch(error => {
                console.error('Error creating reminder:', error);
                showAlert('danger', 'Failed to create medication reminder');
            });
        });
        
        // Change password form submission
        document.getElementById('change-password-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                showAlert('danger', 'New passwords do not match');
                return;
            }
            
            fetch('/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to change password');
                }
                return response.json();
            })
            .then(data => {
                // Reset form
                document.getElementById('change-password-form').reset();
                
                // Show success message
                showAlert('success', 'Password changed successfully');
            })
            .catch(error => {
                console.error('Error changing password:', error);
                showAlert('danger', 'Failed to change password. Please ensure your current password is correct.');
            });
        });
    }
    
    // Helper function to show alerts
    function showAlert(type, message) {
        const alertContainer = document.getElementById('alert-container');
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 500);
        }, 5000);
    }
    
    // Helper function to redirect to order details
    window.redirectToOrder = function(orderId) {
        window.location.href = `/myorder/${orderId}`;
    };
});


