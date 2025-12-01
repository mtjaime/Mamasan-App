export const amazonScraperScript = `
(function() {
  try {
    // 1. Target the confirmed container
    var cartItems = document.querySelectorAll('.sc-list-item-content');
    if (cartItems.length === 0) cartItems = document.querySelectorAll('.sc-list-item');
    
    var items = [];
    var debugLog = 'Found ' + cartItems.length + ' items.\\n';

    cartItems.forEach(function(item, index) {
      try {
        // 2. Extract Fields with multiple selectors
        var titleEl = item.querySelector('.sc-product-title') || 
                      item.querySelector('.a-truncate-cut') ||
                      item.querySelector('.sc-grid-item-product-title');
                      
        var priceEl = item.querySelector('.sc-product-price') || 
                      item.querySelector('.a-price .a-offscreen') ||
                      item.querySelector('.sc-grid-item-price .a-price-whole');
                      
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
        var qtyDebug = 'Default';
        try {
            var qtyDropdown = item.querySelector('.a-dropdown-prompt');
            var qtySelect = item.querySelector('select[name="quantity"]');
            var qtyInput = item.querySelector('input[name="quantityBox"]');
            
            if (qtyDropdown) {
                qtyDebug = 'Dropdown: ' + qtyDropdown.innerText;
                var parsed = parseInt(qtyDropdown.innerText.trim());
                if (!isNaN(parsed)) quantity = parsed;
            } else if (qtySelect) {
                qtyDebug = 'Select: ' + qtySelect.value;
                var parsed = parseInt(qtySelect.value);
                if (!isNaN(parsed)) quantity = parsed;
            } else if (qtyInput) {
                qtyDebug = 'Input: ' + qtyInput.value;
                var parsed = parseInt(qtyInput.value);
                if (!isNaN(parsed)) quantity = parsed;
            }
        } catch (e) {
            qtyDebug = 'Error: ' + e.message;
        }
        
        // 4. ASIN Extraction (Safer Regex)
        var asin = item.getAttribute('data-asin');
        if (!asin) {
            var link = item.querySelector('a');
            if (link && link.href) {
                // Use new RegExp to avoid escaping hell in template literals
                var regex = new RegExp('/dp/([A-Z0-9]{10})');
                var match = link.href.match(regex);
                if (match) asin = match[1];
            }
        }

        // Debug info for first item
        if (index === 0) {
            debugLog += 'Item 1:\\nTitle: ' + title.substring(0, 15) + '...\\nQtyRaw: ' + qtyDebug + ' -> ' + quantity + '\\nASIN: ' + asin;
        }

        if (title && title !== 'No Title') {
          items.push({
            id: asin || Date.now().toString(),
            title: title,
            price: price || 0,
            image: image,
            quantity: quantity,
            provider: 'Amazon',
            url: window.location.href,
            sku: asin || 'N/A'
          });
        }
      } catch (err) {
        debugLog += '\\nError Item ' + index + ': ' + err.message;
      }
    });

    // 5. Final Result
    if (items.length > 0) {
        alert('Extraction Success!\\n' + debugLog);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CART_EXTRACTED', payload: items }));
    } else {
        alert('Extraction Failed.\\n' + debugLog);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: debugLog }));
    }

  } catch (e) {
    alert('Global Error: ' + e.toString());
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
})();
`;
