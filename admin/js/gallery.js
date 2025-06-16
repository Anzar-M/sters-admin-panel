import { supabase } from '../../util//supabaseClient.js';

const galleryContainer = document.getElementById('galleryContainer');
const addImageBtn = document.getElementById('addImageBtn');
const addImageModal = document.getElementById('addImageModal');
const imageViewModal = document.getElementById('imageViewModal');
const uploadForm = document.getElementById('uploadForm');
const imageFileInput = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');
const modalImageView = document.getElementById('modalImageView');
const modalImageTitle = document.getElementById('modalImageTitle');
const modalImageDescription = document.getElementById('modalImageDescription');
const deleteImageBtn = document.getElementById('deleteImageBtn');
const closeModalButtons = document.querySelectorAll('.close-modal');

// State variables
let currentImageId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
    setupEventListeners();
});

function setupEventListeners() {
    addImageBtn.addEventListener('click', () => {
        addImageModal.style.display = 'block';
    });

    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            addImageModal.style.display = 'none';
            imageViewModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === addImageModal) addImageModal.style.display = 'none';
        if (e.target === imageViewModal) imageViewModal.style.display = 'none';
    });

    imageFileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await uploadImage();
    });

    deleteImageBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this image?')) {
            await deleteImage(currentImageId);
            imageViewModal.style.display = 'none';
            loadGallery();
        }
    });
}

async function loadGallery() {
    try {
        galleryContainer.innerHTML = '<p>Loading gallery...</p>';

        const { data: images, error } = await supabase
            .from('gallery_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!images || images.length === 0) {
            galleryContainer.innerHTML = '<p>No images in the gallery yet.</p>';
            return;
        }

        galleryContainer.innerHTML = '';
        images.forEach(image => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `
                <img src="${image.image_path}" alt="${image.title}" class="gallery-image">
                <div class="gallery-info">
                    <h3>${image.title}</h3>
                    <p>${image.description || ''}</p>
                </div>
            `;
            
            galleryItem.addEventListener('click', () => {
                showImageModal(image);
            });
            
            galleryContainer.appendChild(galleryItem);
        });
    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryContainer.innerHTML = `<p class="error">Error loading gallery: ${error.message}</p>`;
    }
}

function showImageModal(image) {
    modalImageView.src = image.image_path;
    modalImageTitle.textContent = image.title;
    modalImageDescription.textContent = image.description || '';
    currentImageId = image.id;
    imageViewModal.style.display = 'block';
}

async function uploadImage() {
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    try {
        const title = document.getElementById('imageTitle').value.trim();
        const description = document.getElementById('imageDescription').value.trim();
        const file = imageFileInput.files[0];
        
        if (!title || !file) {
            alert('Please provide a title and select an image file');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
        
        // Upload image to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
            .from('gallery')
            .upload(filePath, file);
            
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);
        
        // Insert record into database (without user_id)
        const { error: insertError } = await supabase
            .from('gallery_images')
            .insert([{
                title,
                description,
                image_path: publicUrl
            }]);
            
        if (insertError) throw insertError;
        
        // Reset form and reload gallery
        uploadForm.reset();
        imagePreview.style.display = 'none';
        addImageModal.style.display = 'none';
        loadGallery();
        alert('Image uploaded successfully!');
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

async function deleteImage(imageId) {
    try {
        const { data: image, error: fetchError } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('id', imageId)
            .single();
            
        if (fetchError) throw fetchError;
        
        if (image.image_path) {
            const url = new URL(image.image_path);
            const filePath = url.pathname.replace('/storage/v1/object/public/gallery/', '');
            
            const { error: deleteError } = await supabase.storage
                .from('gallery')
                .remove([filePath]);
                
            if (deleteError) throw deleteError;
        }
        
        const { error: dbError } = await supabase
            .from('gallery_images')
            .delete()
            .eq('id', imageId);
            
        if (dbError) throw dbError;
        
        alert('Image deleted successfully!');
    } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image: ' + error.message);
    }
}