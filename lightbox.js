// Premium Image Lightbox for Galaxy Restaurant
document.addEventListener('DOMContentLoaded', () => {
    // Create lightbox container elements
    const lightbox = document.createElement('div');
    lightbox.id = 'imageLightbox';
    lightbox.className = 'fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center opacity-0 pointer-events-none transition-all duration-300';
    lightbox.style.cssText = 'z-index: 250;';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute top-6 right-6 text-white hover:text-primary transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center btn-bounce';
    closeBtn.innerHTML = '<span class="material-symbols-outlined text-3xl">close</span>';
    closeBtn.onclick = closeLightbox;

    // Image wrapper
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'relative max-w-[90vw] max-h-[75vh] md:max-w-[70vw] overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center';
    
    // Lightbox Image
    const lightboxImg = document.createElement('img');
    lightboxImg.className = 'max-w-full max-h-full object-contain transform scale-95 opacity-0 transition-all duration-300 delay-75 rounded-xl';
    imgWrapper.appendChild(lightboxImg);

    // Caption/Alt text container
    const caption = document.createElement('div');
    caption.className = 'mt-4 px-6 py-2.5 bg-white/15 dark:bg-black/40 backdrop-blur-sm rounded-full text-white text-sm max-w-[80vw] text-center font-medium shadow-lg border border-white/10';
    
    lightbox.appendChild(closeBtn);
    lightbox.appendChild(imgWrapper);
    lightbox.appendChild(caption);
    document.body.appendChild(lightbox);

    // Add click listener to all page images (excluding nav logos, maps, icons, and small UI images)
    document.querySelectorAll('img').forEach(img => {
        // Exclude specific images
        if (img.closest('nav') || img.closest('footer') || img.closest('#mobileMenu') || img.getAttribute('aria-hidden') === 'true' || img.classList.contains('no-lightbox') || img.src.includes('map') || img.src.includes('logo')) {
            return;
        }

        // Add cursor pointer and hover effects
        img.style.cursor = 'zoom-in';
        img.classList.add('transition-all', 'duration-300');
        
        img.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(img.src, img.getAttribute('alt') || img.getAttribute('data-alt') || 'Galaxy Restaurant Special');
        });
    });

    function openLightbox(src, altText) {
        lightboxImg.src = src;
        caption.textContent = altText.split(',')[0].split('.')[0]; // Clean up long descriptions
        
        // Show lightbox
        lightbox.classList.remove('opacity-0', 'pointer-events-none');
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
        
        // Animate image in
        setTimeout(() => {
            lightboxImg.classList.remove('scale-95', 'opacity-0');
            lightboxImg.classList.add('scale-100', 'opacity-100');
        }, 50);
    }

    function closeLightbox() {
        // Animate image out
        lightboxImg.classList.remove('scale-100', 'opacity-100');
        lightboxImg.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            lightbox.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = '';
        }, 150);
    }

    // Close lightbox on click outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === imgWrapper) {
            closeLightbox();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.classList.contains('opacity-0')) {
            closeLightbox();
        }
    });
});
