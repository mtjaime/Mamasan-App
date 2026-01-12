export const amazonScraperScript = `
(function() {
  try {
    // 1. Target the confirmed container (Active Items only)
    var activeCart = document.querySelector('div[data-name="Active Items"]') || document.querySelector('#sc-active-cart');
    var cartItems = [];
    
    if (activeCart) {
        cartItems = activeCart.querySelectorAll('.sc-list-item');
    } else {
        // Fallback: Try to find all items but exclude saved for later if possible
        cartItems = document.querySelectorAll('.sc-list-item');
    }

    // Filter out hidden items or empty placeholders
    var validItems = [];
    cartItems.forEach(function(item) {
        if (item.offsetHeight > 0 && !item.classList.contains('sc-action-move-to-cart')) {
            validItems.push(item);
        }
    });
    cartItems = validItems;
    
    var items = [];

    cartItems.forEach(function(item, index) {
      try {
        // 2. Extract Fields with multiple selectors
        var titleEl = item.querySelector('.sc-product-title') || 
                      item.querySelector('.a-truncate-cut') ||
                      item.querySelector('.sc-grid-item-product-title') ||
                      item.querySelector('.a-text-normal');
                      
        var priceEl = item.querySelector('.sc-product-price') || 
                      item.querySelector('.a-price .a-offscreen') ||
                      item.querySelector('.sc-grid-item-price .a-price-whole') ||
                      item.querySelector('.a-price');
                      
        var imageEl = item.querySelector('.sc-product-image') || 
                      item.querySelector('img.sc-product-image') ||
                      item.querySelector('img');

        // 3. Process Data
        var title = titleEl ? titleEl.innerText.trim() : 'No Title';
        var priceText = priceEl ? priceEl.innerText : '0';
        var price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        var image = imageEl ? imageEl.src : '';
        
        // Quantity Extraction (Defensive)
        var quantity = 1;
        try {
            var qtyDropdown = item.querySelector('.a-dropdown-prompt');
            var qtySelect = item.querySelector('select[name="quantity"]');
            var qtyInput = item.querySelector('input[name="quantityBox"]');
            var qtyData = item.getAttribute('data-quantity');
            
            if (qtyDropdown) {
                var parsed = parseInt(qtyDropdown.innerText.trim());
                if (!isNaN(parsed)) quantity = parsed;
            } else if (qtySelect) {
                var parsed = parseInt(qtySelect.value);
                if (!isNaN(parsed)) quantity = parsed;
            } else if (qtyInput) {
                var parsed = parseInt(qtyInput.value);
                if (!isNaN(parsed)) quantity = parsed;
            } else if (qtyData) {
                var parsed = parseInt(qtyData);
                if (!isNaN(parsed)) quantity = parsed;
            }
        } catch (e) {
            console.error('Qty Error:', e.message);
        }
        
        // 4. ASIN Extraction
        var asin = item.getAttribute('data-asin');
        if (!asin) {
            var link = item.querySelector('a');
            if (link && link.href) {
                var regex = new RegExp('/dp/([A-Z0-9]{10})');
                var match = link.href.match(regex);
                if (match) asin = match[1];
            }
        }

        // 5. Extract Variations (Size/Color)
        var size = '';
        var color = '';
        var variations = item.querySelectorAll('.sc-product-variation, .a-size-small');
        variations.forEach(function(v) {
            var text = v.innerText.trim();
            if (/^(size|talla):/i.test(text)) {
                size = text.split(':')[1].trim();
            } else if (/^(color):/i.test(text)) {
                color = text.split(':')[1].trim();
            }
        });

        if (title && title !== 'No Title') {
          items.push({
            id: asin || Date.now().toString() + index,
            title: title,
            price: price || 0,
            image: image,
            quantity: quantity,
            provider: 'Amazon',
            url: window.location.href,
            sku: asin || 'N/A',
            size: size,
            color: color
          });
        }
      } catch (err) {
        console.error('Item Error:', err.message);
      }
    });

    // Final Result
    if (items.length > 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CART_EXTRACTED', payload: items }));
    } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'No se encontraron productos en el carrito' }));
    }

  } catch (e) {
    console.error('Global Error:', e);
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
})();
`;
