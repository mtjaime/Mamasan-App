import { amazonScraperScript } from './amazon';
import { walmartScraperScript } from './walmart';
import { temuScraperScript } from './temu';
import { sheinScraperScript } from './shein';

export const getScraperForUrl = (url) => {
  if (url.includes('amazon')) {
    return amazonScraperScript;
  } else if (url.includes('nike')) {
    return nikeScraperScript;
  } else if (url.includes('shein')) {
    return sheinScraperScript;
  } else if (url.includes('walmart')) {
    return walmartScraperScript;
  } else if (url.includes('temu')) {
    return temuScraperScript;
  } else if (url.includes('aliexpress')) {
    return aliexpressScraperScript;
  } else if (url.includes('newegg')) {
    return neweggScraperScript;
  }

  return genericScraperScript;
};

export const isCartPage = (url) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('amazon') && (lowerUrl.includes('/cart') || lowerUrl.includes('/gp/cart'))) return true;
  if (lowerUrl.includes('shein') && lowerUrl.includes('/cart')) return true;
  if (lowerUrl.includes('nike') && lowerUrl.includes('/cart')) return true;
  if (lowerUrl.includes('walmart') && lowerUrl.includes('/cart')) return true;
  if (lowerUrl.includes('temu') && (lowerUrl.includes('/cart') || lowerUrl.includes('cart.html'))) return true;
  if (lowerUrl.includes('aliexpress') && (lowerUrl.includes('/shoppingcart') || lowerUrl.includes('/cart'))) return true;
  // Add others as needed
  return false;
};

export const getCartUrl = (currentUrl) => {
  const lowerUrl = currentUrl.toLowerCase();
  if (lowerUrl.includes('amazon')) return 'https://www.amazon.com/gp/cart/view.html';
  if (lowerUrl.includes('shein')) return 'https://us.shein.com/cart'; // Adjust domain dynamically if possible, but hardcoded for now
  if (lowerUrl.includes('nike')) return 'https://www.nike.com/cart';
  if (lowerUrl.includes('walmart')) return 'https://www.walmart.com/cart';
  if (lowerUrl.includes('temu')) return 'https://www.temu.com/cart';
  if (lowerUrl.includes('aliexpress')) return 'https://www.aliexpress.com/p/shoppingcart/index.html';
  return null;
};


// --- Helper for extraction ---
const commonExtractionScript = `
  function extractPrice(text) {
    if (!text) return 0;
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }
  
  function findImage(container) {
    const img = container.querySelector('img');
    return img ? img.src : '';
  }
`;

// --- Store Specific Scripts ---

const nikeScraperScript = `
window.scrapeCart = function() {
  try {
    const items = [];
    // Nike Selectors - Updated for robustness
    // Use more specific selectors to avoid selecting parent containers
    const cartItems = document.querySelectorAll('[data-testid="cart-item"], .cart-item, [data-automation="cart-item"]'); 
    
    // If no specific items found, try to find by class but filter out parents
    if (cartItems.length === 0) {
        const potentialItems = document.querySelectorAll('.css-177n1u3');
        // Filter out elements that contain other potential items
        potentialItems.forEach(item => {
            if (item.querySelectorAll('.css-177n1u3').length === 0) {
                // This is a leaf node (likely an item)
            }
        });
    }

    cartItems.forEach((item, index) => {
      try {
          // Ensure we are not processing a container that contains other cart items
          if (item.querySelectorAll('[data-testid="cart-item"], .cart-item').length > 0) {
              return; // Skip container
          }

          const titleEl = item.querySelector('[data-testid="product-title"], .product-title, h2, h3, [data-automation="product-title"]');
          const priceEl = item.querySelector('[data-testid="product-price"], .product-price, [data-test="product-price"], [data-automation="product-price"], span[class*="price"]');
          const imageEl = item.querySelector('img');
          const linkEl = item.querySelector('a');
          
          // Try to get SKU/Style Code from URL or text
          let sku = 'N/A';
          if (linkEl && linkEl.href) {
              const match = linkEl.href.match(/([A-Z0-9]{6}-[0-9]{3})/);
              if (match) sku = match[1];
          }
          if (sku === 'N/A') {
              // Look for style code in text
              const styleText = item.innerText.match(/Style:?\\s*([A-Z0-9-]+)/i);
              if (styleText) sku = styleText[1];
          }

          // Quantity - Strictly scoped to this item
          let quantity = 1;
          const qtySelect = item.querySelector('select[aria-label*="Quantity"], select');
          if (qtySelect) {
              quantity = parseInt(qtySelect.value, 10) || 1;
          } else {
              const qtyContainer = item.querySelector('[data-testid="quantity-display"], .quantity-display');
              if (qtyContainer) {
                  quantity = parseInt(qtyContainer.innerText, 10) || 1;
              } else {
                  const qtyText = item.innerText.match(/Qty:?\\s*(\\d+)/i);
                  if (qtyText) quantity = parseInt(qtyText[1], 10);
              }
          }

          // Options (Size/Color) - Critical for distinguishing variants
          const options = (function() {
              const opts = [];
              // Try specific selectors first
              const sizeEl = item.querySelector('[data-testid="product-size"], .product-size, [data-automation="product-size"]');
              const colorEl = item.querySelector('[data-testid="product-color"], .product-color, [data-automation="product-color"]');
              
              if (sizeEl) opts.push(sizeEl.innerText.trim());
              if (colorEl) opts.push(colorEl.innerText.trim());
              
              // Fallback: Parse text content for common patterns if selectors fail
              if (opts.length === 0) {
                   const text = item.innerText;
                   const sizeMatch = text.match(/(Size|Talla):\\s*([^\\n]+)/i);
                   const colorMatch = text.match(/(Color):\\s*([^\\n]+)/i);
                   if (sizeMatch) opts.push(sizeMatch[0].trim());
                   if (colorMatch) opts.push(colorMatch[0].trim());
              }
              
              return opts.join(', ');
          })();

          if (titleEl) {
            // Generate a unique ID that includes the SKU AND the options (size/color)
            // This prevents merging different sizes of the same product
            const uniqueId = (sku !== 'N/A' ? sku : 'ITEM') + '-' + options.replace(/[^a-zA-Z0-9]/g, '') + '-' + index;

            items.push({
              id: uniqueId,
              title: titleEl.innerText,
              price: priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 0,
              image: imageEl ? imageEl.src : '',
              url: linkEl ? linkEl.href : window.location.href,
              sku: sku,
              provider: 'Nike',
              quantity: quantity,
              options: options
            });
          }
      } catch (err) {
          // Continue to next item
      }
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: items
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
};
window.scrapeCart();
`;

// sheinScraperScript is now imported from './shein.js'
























const aliexpressScraperScript = `
window.scrapeCart = function () {
  try {
    const items = [];
    const seen = new Set();
    
    // AliExpress 2024/2025 - Find product titles
    const productTitles = document.querySelectorAll('.cart-product-name-title');
    console.log('[AliExpress] Found ' + productTitles.length + ' items');
    
    productTitles.forEach((titleEl, index) => {
      try {
        const title = titleEl.innerText.trim();
        const productUrl = titleEl.href || '';
        
        // Extract product ID from URL
        const idMatch = productUrl.match(/item\\/(\\d+)/);
        const productId = idMatch ? idMatch[1] : ('ali-' + index);
        
        console.log('[AliExpress] Processing #' + index + ': ' + title.substring(0, 35));
        
        // STRATEGY: In AliExpress cart, each item row has:
        // [Checkbox] [Image Container] [Info Container with title, sku, price] [Qty] [Actions]
        // We need to find the row container first, then find the image SIBLING
        
        // Find the row container (grandparent of title that contains the full row)
        let rowContainer = titleEl.parentElement;
        for (let i = 0; i < 10 && rowContainer; i++) {
          // Look for a container that has both image and quantity
          const hasImg = rowContainer.querySelector('img[src*="alicdn"]');
          const hasQty = rowContainer.querySelector('.comet-v2-input-number-input, input[type="number"]');
          if (hasImg && hasQty) {
            break;
          }
          rowContainer = rowContainer.parentElement;
        }
        
        if (!rowContainer) {
          rowContainer = titleEl.parentElement?.parentElement?.parentElement || document.body;
        }
        
        // Get quantity
        let quantity = 1;
        const qtyInput = rowContainer.querySelector('.comet-v2-input-number-input, input[type="number"]');
        if (qtyInput) {
          quantity = parseInt(qtyInput.value, 10) || 1;
        }
        
        // Get price
        let price = 0;
        const priceText = rowContainer.innerText || '';
        // Look for the current/discounted price (usually US $X.XX or $X.XX)
        const priceMatches = priceText.match(/US\\s*\\$\\s*([\\d,.]+)|\\$\\s*([\\d,.]+)/gi) || [];
        if (priceMatches.length > 0) {
          // Take the first match (usually the current price, not original)
          const firstPrice = priceMatches[0];
          const numMatch = firstPrice.match(/([\\d,.]+)/);
          if (numMatch) {
            price = parseFloat(numMatch[1].replace(',', '')) || 0;
          }
        }
        if (price === 0) {
          const anyNum = priceText.match(/(\\d+\\.\\d{2})/);
          if (anyNum) price = parseFloat(anyNum[1]) || 0;
        }
        
        // AliExpress cart does NOT have individual product images in the DOM
        // Only store logos are available. Using AliExpress placeholder instead.
        // The backend can fetch the real image from the product page if needed.
        const image = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Aliexpress_logo.svg/200px-Aliexpress_logo.svg.png'; // AliExpress official logo
        
        // Get color and size from SKU options
        let color = '';
        let size = '';
        let options = '';
        
        // Look for SKU/option elements
        const skuEls = rowContainer.querySelectorAll('.comet-v2-btn-borderless, [class*="sku-property"], [class*="sku-info"], [class*="product-sku"]');
        skuEls.forEach(el => {
          const text = el.innerText.trim();
          if (text) {
            options += (options ? ', ' : '') + text;
            // Try to identify color and size
            const lowerText = text.toLowerCase();
            if (lowerText.includes('color') || lowerText.match(/^(black|white|red|blue|green|pink|yellow|purple|gray|grey|brown|orange)/i)) {
              color = text;
            }
            if (lowerText.includes('size') || lowerText.match(/^(xs|s|m|l|xl|xxl|\\d+)$/i) || lowerText.match(/^(\\d+\\s*(cm|mm|inch|g|kg))/i)) {
              size = text;
            }
          }
        });
        
        // Fallback: parse options text for color/size
        if (!color || !size) {
          const optionParts = options.split(/[,\\/]/);
          optionParts.forEach(part => {
            const p = part.trim();
            if (!color && p.match(/^(black|white|red|blue|green|pink|yellow|purple|gray|grey|brown|orange|gold|silver)/i)) {
              color = p;
            }
            if (!size && p.match(/^(xs|s|m|l|xl|xxl|\\d+)$/i)) {
              size = p;
            }
          });
        }
        
        console.log('[AliExpress] Options: ' + options + ' | Color: ' + color + ' | Size: ' + size);
        
        // Deduplication key
        const uniqueKey = productId + '-' + options.replace(/[^a-zA-Z0-9]/g, '');
        
        if (title && !seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          
          if (price === 0) {
            price = 0.01;
          }
          
          items.push({
            id: productId,
            title: title,
            price: price,
            image: image,
            url: productUrl || window.location.href,
            sku: productId,
            provider: 'AliExpress',
            quantity: quantity,
            options: options,
            color: color,
            talla: size
          });
          console.log('[AliExpress] Added: ' + title.substring(0, 30));
        }
      } catch (err) {
        console.error('[AliExpress] Item error:', err.message);
      }
    });
    
    console.log('[AliExpress] Total: ' + items.length + ' items');
    
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: items
    }));
  } catch (e) {
    console.error('[AliExpress] Error:', e.message);
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
};
window.scrapeCart();
`;

const neweggScraperScript = `
window.scrapeCart = function () {
  try {
    const items = [];
    // Newegg Selectors
    const cartItems = document.querySelectorAll('.row-body, .item-cell, .cart-item');

    cartItems.forEach((item, index) => {
      const titleEl = item.querySelector('.item-title, .title');
      const priceEl = item.querySelector('.price-current, .price');
      const imageEl = item.querySelector('img');

      // Quantity
      let quantity = 1;
      const qtyInput = item.querySelector('input[type="number"], .item-qty-input');
      if (qtyInput) {
        quantity = parseInt(qtyInput.value, 10) || 1;
      }

      if (titleEl) {
        items.push({
          id: Date.now().toString() + index,
          title: titleEl.innerText,
          price: priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 0,
          image: imageEl ? imageEl.src : '',
          url: window.location.href,
          sku: 'N/A',
          provider: 'Newegg',
          quantity: quantity,
          options: ''
        });
      }
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: items
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
};
window.scrapeCart();
`;

const genericScraperScript = `
window.scrapeCart = function () {
  try {
    // Generic fallback: try to find common cart patterns
    const items = [];
    // Look for elements that might be cart items
    const potentialItems = document.querySelectorAll('li, div[class*="item"], div[class*="product"], tr');

    potentialItems.forEach(item => {
      // Heuristic: must have an image, a price-like string, and some text
      const img = item.querySelector('img');
      const priceText = item.innerText.match(/[$€£¥][0-9,.]+/);
      const titleElement = item.querySelector('h2, h3, h4, a');

      if (img && priceText && titleElement && img.width > 50) { // Avoid tiny icons
        items.push({
          id: Date.now().toString() + Math.random(),
          title: titleElement.innerText.substring(0, 50),
          price: parseFloat(priceText[0].replace(/[^0-9.]/g, '')),
          image: img.src,
          url: window.location.href,
          sku: 'Generic',
          provider: 'Unknown',
          quantity: 1,
          options: (function () {
            const text = item.innerText;
            const opts = [];
            const color = text.match(/(Color|Colour|Cor):?\s*([A-Za-z\s\/]+)/i);
            const size = text.match(/(Size|Talla|Tamanho):?\s*([A-Za-z0-9\s\.]+)/i);
            if (color) opts.push(color[0]);
            if (size) opts.push(size[0]);
            return opts.join(', ');
          })()
        });
      }
    });

    // Deduplicate based on title
    const uniqueItems = Array.from(new Map(items.map(item => [item.title, item])).values());

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: uniqueItems.slice(0, 10) // Limit to avoid junk
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
};
window.scrapeCart();
`;
