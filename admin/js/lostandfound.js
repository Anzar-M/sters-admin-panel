import { supabase } from "../../util//supabaseClient.js"; 

const reportForm = document.getElementById('reportForm');
const itemsGrid = document.getElementById('itemsGrid');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const itemModal = document.getElementById('itemModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

// State variables
let currentPage = 1;
const itemsPerPage = 6;
let totalItems = 0;
let allItems = [];

document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    setupEventListeners();
});

function setupEventListeners() {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await reportLostItem();
    });

    // Image preview
    const itemImage = document.getElementById('itemImage');
    itemImage.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewImage = document.getElementById('previewImage');
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Filter and search
    statusFilter.addEventListener('change', () => {
        currentPage = 1;
        loadItems();
    });

    searchInput.addEventListener('input', () => {
        currentPage = 1;
        loadItems();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadItems();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            loadItems();
        }
    });

    closeModal.addEventListener('click', () => {
        itemModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === itemModal) {
            itemModal.style.display = 'none';
        }
    });
}

async function loadItems() {
    try {
        itemsGrid.innerHTML = '<p>Loading items...</p>';

        let query = supabase
            .from('lostandfound')
            .select('*', { count: 'exact' })
            .order('date_reported', { ascending: false })
            .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

        // Apply status filter
        const status = statusFilter.value;
        if (status !== 'all') {
            query = query.eq('found', status === 'found');
        }

        // Apply search filter
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            query = query.or(`item_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        allItems = data || [];
        totalItems = count || 0;

        renderItems();
        updatePagination();
    } catch (error) {
        console.error('Error loading items:', error);
        itemsGrid.innerHTML = `<p class="error">Error loading items: ${error.message}</p>`;
    }
}

function renderItems() {
    if (allItems.length === 0) {
        itemsGrid.innerHTML = '<p>No items found matching your criteria.</p>';
        return;
    }

    itemsGrid.innerHTML = '';

    allItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        
        itemCard.innerHTML = `
            <img src="${item.image_path}" alt="${item.item_name}" class="item-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="item-info">
                <h3>${item.item_name}</h3>
                <div class="item-meta">
                    <span>Lost on: ${new Date(item.date_lost).toLocaleDateString()}</span>
                    <span class="item-status ${item.found ? 'status-found' : 'status-lost'}">
                        ${item.found ? 'Found' : 'Lost'}
                    </span>
                </div>
                <p class="item-description">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
                <button class="view-btn" data-id="${item.id}">View Details</button>
            </div>
        `;

        itemsGrid.appendChild(itemCard);
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = e.target.getAttribute('data-id');
            await showItemDetails(itemId);
        });
    });
}

async function showItemDetails(itemId) {
    try {
        modalBody.innerHTML = '<p>Loading item details...</p>';
        itemModal.style.display = 'block';

        const { data, error } = await supabase
            .from('lostandfound')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) throw error;

        modalBody.innerHTML = `
            <div class="modal-image-container">
                <img src="${data.image_path}" alt="${data.item_name}" class="modal-image" onerror="this.src='https://via.placeholder.com/500x300?text=No+Image'">
            </div>
            <div class="modal-details">
                <h2>${data.item_name}</h2>
                <p><strong>Status:</strong> <span class="item-status ${data.found ? 'status-found' : 'status-lost'}">
                    ${data.found ? 'Found' : 'Lost'}
                </span></p>
                <p><strong>Date Lost:</strong> ${new Date(data.date_lost).toLocaleDateString()}</p>
                <p><strong>Location Lost:</strong> ${data.location_lost}</p>
                <p><strong>Description:</strong> ${data.description}</p>
                <p><strong>Reported on:</strong> ${new Date(data.date_reported).toLocaleString()}</p>
            </div>
            <div class="contact-info">
                <h3>Contact Information</h3>
                <p>${data.contact_info}</p>
            </div>
            <div class="modal-actions">
                ${!data.found ? `<button class="mark-found-btn" data-id="${data.id}">Mark as Found</button>` : ''}
                ${data.found ? `<button class="delete-item-btn" data-id="${data.id}">Delete Item</button>` : ''}
            </div>
        `;

        const markFoundBtn = document.querySelector('.mark-found-btn');
        if (markFoundBtn) {
            markFoundBtn.addEventListener('click', async () => {
                await markItemAsFound(data.id);
            });
        }

        const deleteItemBtn = document.querySelector('.delete-item-btn');
        if (deleteItemBtn) {
            deleteItemBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this item?')) {
                    await deleteItem(data.id);
                }
            });
        }
    } catch (error) {
        console.error('Error loading item details:', error);
        modalBody.innerHTML = `<p class="error">Error loading item details: ${error.message}</p>`;
    }
}



async function deleteItem(itemId) {
    try {
        const { data: item, error: fetchError } = await supabase
            .from('lostandfound')
            .select('*')
            .eq('id', itemId)
            .single();

        if (fetchError) throw fetchError;

        if (item.image_path) {
            const url = new URL(item.image_path);
            const filePath = url.pathname.replace('/storage/v1/object/public/lostandfound/', '');
            
            console.log("Deleting file:", filePath);             
            const { error: deleteImageError } = await supabase
                .storage
                .from('lostandfound')  
                .remove([filePath]);

            if (deleteImageError) {
                console.error("Error deleting image from storage:", deleteImageError);
            }
        }

        const { error: deleteError } = await supabase
            .from('lostandfound')
            .delete()
            .eq('id', itemId);

        if (deleteError) throw deleteError;

        itemModal.style.display = 'none';
        loadItems();
        alert('Item deleted successfully!');
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item: ' + error.message);
    }
}


async function reportLostItem() {
    try {
        const formData = new FormData(reportForm);
        const itemImage = document.getElementById('itemImage').files[0];

        const itemName = document.getElementById('itemName').value.trim();
        const description = document.getElementById('description').value.trim();
        const dateLost = document.getElementById('dateLost').value;
        const location = document.getElementById('location').value.trim();
        const contact = document.getElementById('contact').value.trim();

        if (!itemImage) {
            alert('Please upload an image of the item');
            return;
        }
        if (!itemName || !description || !dateLost || !location || !contact) {
            alert('Please fill in all required fields');
            return;
        }

        const imagePath = `item_images/${Date.now()}_${itemImage.name}`;
        const { error: uploadError } = await supabase
            .storage
            .from('lostandfound')
            .upload(imagePath, itemImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase
            .storage
            .from('lostandfound')
            .getPublicUrl(imagePath);

        const { error: insertError } = await supabase
            .from('lostandfound')
            .insert([{
                item_name: itemName,
                description: description,
                date_lost: dateLost,
                location_lost: location,
                contact_info: contact,
                image_path: publicUrl,
                found: false
            }]);

        if (insertError) throw insertError;

        // Reset form and reload items
        reportForm.reset();
        document.getElementById('previewImage').style.display = 'none';
        alert('Item reported successfully!');
        currentPage = 1;
        loadItems();
    } catch (error) {
        console.error('Error reporting lost item:', error);
        alert('Failed to report item: ' + error.message);
    }
}

async function markItemAsFound(itemId) {
    try {
        const { error } = await supabase
            .from('lostandfound')
            .update({ found: true })
            .eq('id', itemId);

        if (error) throw error;

        // Refresh the modal to show the delete button
        await showItemDetails(itemId);
        loadItems();
    } catch (error) {
        console.error('Error marking item as found:', error);
        alert('Failed to mark item as found: ' + error.message);
    }
}
function updatePagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

