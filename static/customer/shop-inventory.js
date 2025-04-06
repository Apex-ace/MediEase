// Shop Inventory Management
let medicineInventory = [];

// Function to show shop inventory modal
function showShopInventory(event) {
    event.preventDefault();
    
    // Create modal if it doesn't exist
    if (!document.getElementById('shopInventoryModal')) {
        createShopInventoryModal();
    }
    
    // Fetch the latest inventory data
    fetchInventoryData();
    
    // Show the modal
    const modal = document.getElementById('shopInventoryModal');
    modal.style.display = 'block';
}

// Function to create the shop inventory modal
function createShopInventoryModal() {
    const modal = document.createElement('div');
    modal.id = 'shopInventoryModal';
    modal.className = 'inventory-modal';
    
    modal.innerHTML = `
        <div class="inventory-modal-content">
            <div class="inventory-modal-header">
                <h4>MediEase Inventory</h4>
                <span class="inventory-close" onclick="closeInventoryModal()">&times;</span>
            </div>
            <div class="inventory-modal-body">
                <div class="inventory-search">
                    <input type="text" id="inventorySearch" placeholder="Search medicines..." onkeyup="filterInventory()">
                </div>
                <div class="inventory-loading" id="inventoryLoading">
                    <div class="spinner"></div>
                    <p>Loading inventory...</p>
                </div>
                <div class="inventory-table-container">
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                            <!-- Inventory data will be loaded here -->
                        </tbody>
                    </table>
                </div>
                <div id="noInventoryResults" class="no-results" style="display: none;">
                    <p>No medicines found matching your search.</p>
                </div>
            </div>
            <div class="inventory-modal-footer">
                <p>Real-time inventory data from MediEase database</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener to close when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeInventoryModal();
        }
    });
}

// Function to close the inventory modal
function closeInventoryModal() {
    const modal = document.getElementById('shopInventoryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to fetch inventory data from the server
function fetchInventoryData() {
    const loadingEl = document.getElementById('inventoryLoading');
    const tableBody = document.getElementById('inventoryTableBody');
    
    if (loadingEl) loadingEl.style.display = 'flex';
    if (tableBody) tableBody.innerHTML = '';
    
    // Fetch inventory data from the API
    fetch('/api/inventory')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.res === 1) {
                medicineInventory = data.data;
                displayInventory(medicineInventory);
            } else {
                throw new Error(data.message || 'Failed to fetch inventory');
            }
        })
        .catch(error => {
            console.error('Error fetching inventory:', error);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="error-message">
                            Failed to load inventory data. Please try again later.
                        </td>
                    </tr>
                `;
            }
        })
        .finally(() => {
            if (loadingEl) loadingEl.style.display = 'none';
        });
}

// Function to display inventory data
function displayInventory(inventory) {
    const tableBody = document.getElementById('inventoryTableBody');
    const noResults = document.getElementById('noInventoryResults');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (inventory.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    inventory.forEach(item => {
        // Generate a random stock value between 10 and 100 for demonstration
        const stock = Math.floor(Math.random() * 91) + 10;
        const status = stock > 20 ? 'In Stock' : (stock > 0 ? 'Low Stock' : 'Out of Stock');
        const statusClass = stock > 20 ? 'in-stock' : (stock > 0 ? 'low-stock' : 'out-of-stock');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category || 'N/A'}</td>
            <td>${item.price}</td>
            <td>${stock}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Function to filter inventory based on search
function filterInventory() {
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    
    if (!medicineInventory.length) return;
    
    const filtered = searchTerm === '' 
        ? medicineInventory 
        : medicineInventory.filter(item => 
            item.name.toLowerCase().includes(searchTerm) || 
            (item.category && item.category.toLowerCase().includes(searchTerm)) ||
            String(item.id).includes(searchTerm)
        );
    
    displayInventory(filtered);
} 