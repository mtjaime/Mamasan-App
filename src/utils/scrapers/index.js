import { amazonScraperScript } from './amazon';

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
    // Nike Selectors - Updated
    // Try multiple potential selectors for robustness
    const cartItems = document.querySelectorAll('[data-testid="cart-item"], .cart-item, .css-177n1u3, [data-automation="cart-item"]'); 
    
    cartItems.forEach(item => {
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

      if (titleEl) {
        items.push({
          id: sku !== 'N/A' ? sku : Date.now().toString() + Math.random(),
          title: titleEl.innerText,
          price: priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 0,
          image: imageEl ? imageEl.src : '',
          url: linkEl ? linkEl.href : window.location.href,
          sku: sku,
          provider: 'Nike',
          quantity: 1, // Quantity logic can be added similar to Walmart if needed
          options: (function() {
              const opts = [];
              const sizeEl = item.querySelector('[data-testid="product-size"], .product-size');
              const colorEl = item.querySelector('[data-testid="product-color"], .product-color');
              if (sizeEl) opts.push(sizeEl.innerText);
              if (colorEl) opts.push(colorEl.innerText);
              
              if (opts.length === 0) {
                  const text = item.innerText;
                  const style = text.match(/(Style|Estilo):?\s*([A-Z0-9-]+)/i);
                  const size = text.match(/(Size|Talla):?\s*([A-Z0-9\.]+)/i);
                  const color = text.match(/(Color):?\s*([A-Za-z\s]+)/i);
                  if (style) opts.push(style[0]);
                  if (size) opts.push(size[0]);
                  if (color) opts.push(color[0]);
              }
              return opts.join(', ');
          })()
        });
      }
    });

    if (items.length === 0) {
        // Fallback to heuristic if specific selectors fail
        const allElements = document.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            if (el.innerText && el.innerText.trim().match(/^\\$[0-9,]+(\\.[0-9]{2})?$/) && el.children.length === 0) {
                let container = el.parentElement;
                let foundImg = null;
                let foundTitle = null;
                for (let k = 0; k < 5; k++) {
                    if (!container) break;
                    const imgs = container.getElementsByTagName('img');
                    for (let j = 0; j < imgs.length; j++) {
                        if (imgs[j].width > 50) { foundImg = imgs[j].src; break; }
                    }
                    const titles = container.querySelectorAll('a, h2, h3');
                    for (let t = 0; t < titles.length; t++) {
                        if (titles[t].innerText.length > 5 && titles[t].innerText !== el.innerText) {
                            foundTitle = titles[t].innerText; break;
                        }
                    }
                    if (foundImg && foundTitle) {
                        items.push({
                            id: Date.now().toString() + Math.random(),
                            title: foundTitle,
                            price: parseFloat(el.innerText.replace(/[^0-9.]/g, '')),
                            image: foundImg,
                            url: window.location.href,
                            sku: 'Nike-Heuristic',
                            provider: 'Nike',
                            quantity: 1
                        });
                        break;
                    }
                    container = container.parentElement;
                }
            }
        }
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: items
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
};
`;

const sheinScraperScript = `
window.scrapeCart = function() {
  try {
    const items = [];
    // Shein Selectors - Updated for Mobile/Web
    // Targeting common container classes for Shein cart items
    const cartItems = document.querySelectorAll('.cart-item-wrap, .j-cart-item, .c-cart-item, .s-bag-item, .cart-goods-item');
    
    cartItems.forEach(item => {
      // Title
      const titleEl = item.querySelector('.goods-name a, .c-cart-item__name a, .s-bag-item__name, .goods-title-link');
      
      // Price - Handle ranges or discounts, take the current price
      const priceEl = item.querySelector('.product-price__current-price, .c-cart-item__price, .s-bag-item__price, .price-current');
      
      // Image
      const imageEl = item.querySelector('.goods-img img, .c-cart-item__img img, .s-bag-item__img, img');
      
      // Link
      const linkEl = item.querySelector('a[href*="/p-"], a[href*=".html"]');
      
      // SKU / Product Code
      // Shein often puts SKU in the URL or hidden input, or as text "SKU: ..."
      let sku = 'N/A';
      if (linkEl && linkEl.href) {
          // Extract ID from URL (e.g., ...-p-123456.html)
          const idMatch = linkEl.href.match(/-p-(\d+)/);
          if (idMatch) sku = idMatch[1];
      }
      if (sku === 'N/A') {
          // Look for SKU in text
          const skuText = item.innerText.match(/SKU:?\\s*([A-Za-z0-9]+)/i);
          if (skuText) sku = skuText[1];
      }

      // Quantity
      let quantity = 1;
      const qtyInput = item.querySelector('input[type="number"], .s-bag-item__quantity input, .quantity-input');
      if (qtyInput) {
          quantity = parseInt(qtyInput.value, 10) || 1;
      } else {
          // Check for dropdown or text
          const qtyText = item.innerText.match(/x\s*(\d+)/);
          if (qtyText) quantity = parseInt(qtyText[1], 10);
      }
      
      // Variants (Color, Size, etc.)
      let options = [];
      const variantEls = item.querySelectorAll('.goods-attr span, .c-cart-item__attr, .s-bag-item__attr, .attr-item');
      variantEls.forEach(v => {
          const text = v.innerText.trim();
          if (text) options.push(text);
      });
      
      // Fallback for variants in text if no specific elements found
      if (options.length === 0) {
          const textContent = item.innerText;
          const colorMatch = textContent.match(/(Color|Color:|Colour):?\s*([A-Za-z\s\/]+)/i);
          const sizeMatch = textContent.match(/(Size|Size:|Talla):?\s*([A-Za-z0-9\s\.]+)/i);
          
          if (colorMatch) options.push(colorMatch[0]);
          if (sizeMatch) options.push(sizeMatch[0]);
      }

      if (titleEl) {
         items.push({
          id: sku !== 'N/A' ? sku : Date.now().toString() + Math.random(),
          title: titleEl.innerText.trim(),
          price: priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 0,
          image: imageEl ? imageEl.src : '',
          url: linkEl ? linkEl.href : window.location.href,
          sku: sku,
          provider: 'Shein',
          quantity: quantity,
          options: options.join(', ') // Store as a comma-separated string
        });
      }
    });

    // Fallback: Heuristic Search if specific selectors fail
    if (items.length === 0) {
        const allElements = document.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            // Look for price-like text
            if (el.innerText && el.innerText.trim().match(/^[$€£¥][0-9,]+(\\.[0-9]{2})?$/) && el.children.length === 0) {
                let container = el.parentElement;
                let foundImg = null;
                let foundTitle = null;
                let foundQty = 1;
                
                for (let k = 0; k < 6; k++) { // Traverse up
                    if (!container) break;
                    
                    // Find Image
                    if (!foundImg) {
                        const imgs = container.getElementsByTagName('img');
                        for (let j = 0; j < imgs.length; j++) {
                            if (imgs[j].width > 50) { foundImg = imgs[j].src; break; }
                        }
                    }
                    
                    // Find Title
                    if (!foundTitle) {
                        const titles = container.querySelectorAll('a, h3, h4, div[class*="name"], div[class*="title"]');
                        for (let t = 0; t < titles.length; t++) {
                            if (titles[t].innerText.length > 10 && titles[t].innerText !== el.innerText) {
                                foundTitle = titles[t].innerText; break;
                            }
                        }
                    }
                    
                    // Find Quantity
                    const qtyInput = container.querySelector('input[type="number"]');
                    if (qtyInput) foundQty = parseInt(qtyInput.value, 10) || 1;
                    
                    if (foundImg && foundTitle) {
                        items.push({
                            id: Date.now().toString() + Math.random(),
                            title: foundTitle,
                            price: parseFloat(el.innerText.replace(/[^0-9.]/g, '')),
                            image: foundImg,
                            url: window.location.href,
                            sku: 'Shein-Heuristic',
                            provider: 'Shein',
                            quantity: foundQty
                        });
                        break;
                    }
                    container = container.parentElement;
                }
            }
        }
    }

    // Deduplicate
    const uniqueItems = [];
    const seenIds = new Set();
    items.forEach(item => {
        const key = item.title + item.price; // Composite key
        if (!seenIds.has(key)) {
            seenIds.add(key);
            uniqueItems.push(item);
        }
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: uniqueItems
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
};
`;

const walmartScraperScript = `
window.scrapeCart = function() {
  try {
    const items = [];
    
    // Strategy 1: Heuristic - Find prices and look around
    // This is more robust against class name changes
    const allElements = document.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        // Check if element has text starting with $ and is visible
        if (el.innerText && el.innerText.trim().match(/^\\$[0-9,]+(\\.[0-9]{2})?$/) && el.children.length === 0) {
            
            // Found a price! Now let's look for a container
            let container = el.parentElement;
            let foundImg = null;
            let foundTitle = null;
            
            // Traverse up 5 levels to find a container that has an image and a title
            for (let k = 0; k < 5; k++) {
                if (!container) break;
                
                // Look for image in this container
                const imgs = container.getElementsByTagName('img');
                for (let j = 0; j < imgs.length; j++) {
                    if (imgs[j].width > 50 && imgs[j].height > 50) { // Filter out tiny icons
                        foundImg = imgs[j].src;
                        break;
                    }
                }
                
                // Look for title (usually a link or heading)
                const titles = container.querySelectorAll('a, h2, h3, span[class*="name"], span[class*="title"]');
                for (let t = 0; t < titles.length; t++) {
                     if (titles[t].innerText.length > 10 && titles[t].innerText !== el.innerText) {
                         foundTitle = titles[t].innerText;
                         // Try to get link
                         if (titles[t].tagName === 'A') {
                             // foundLink = titles[t].href; 
                         }
                         break;
                     }
                }
                
                // Look for quantity
                let foundQty = 1;
                // Try 1: Input or Select with numeric value
                const qtyInput = container.querySelector('input[type="number"], input[inputmode="numeric"], select[aria-label*="Quantity"], select');
                if (qtyInput && qtyInput.value) {
                    foundQty = parseInt(qtyInput.value, 10) || 1;
                } 
                
                // Try 2: specific Walmart quantity data attribute
                if (foundQty === 1) {
                     const qtyData = container.querySelector('[data-automation-id="quantity"]');
                     if (qtyData) {
                         // It might be a div with text or an input
                         foundQty = parseInt(qtyData.innerText || qtyData.value, 10) || 1;
                     }
                }

                // Try 3: Text search for "Qty: X"
                if (foundQty === 1) {
                    const qtyMatch = container.innerText.match(/Qty:?\s*(\d+)/i);
                    if (qtyMatch) {
                        foundQty = parseInt(qtyMatch[1], 10);
                    }
                }
                
                if (foundImg && foundTitle) {
                    // We found a match!
                    items.push({
                        id: Date.now().toString() + Math.random(),
                        title: foundTitle,
                        price: parseFloat(el.innerText.replace(/[^0-9.]/g, '')),
                        image: foundImg,
                        url: window.location.href,
                        sku: 'N/A',
                        provider: 'Walmart',
                        quantity: foundQty,
                        options: (function() {
                            const opts = [];
                            const variantText = container.innerText.match(/(Actual Color|Clothing Size|Size|Color):?\s*([^\n]+)/g);
                            if (variantText) {
                                variantText.forEach(v => opts.push(v));
                            }
                            return opts.join(', ');
                        })()
                    });
                    break; // Stop traversing up for this price
                }
                container = container.parentElement;
            }
        }
    }

    // Deduplicate items based on title
    const uniqueItems = [];
    const titles = new Set();
    items.forEach(item => {
        if (!titles.has(item.title)) {
            titles.add(item.title);
            uniqueItems.push(item);
        }
    });

    if (uniqueItems.length === 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'ERROR', 
            message: 'Walmart Scraper: Found 0 items. Debug: Scanned ' + allElements.length + ' elements.' 
        }));
    } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CART_EXTRACTED',
            payload: uniqueItems
        }));
    }
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Script Error: ' + e.toString() }));
  }
};
`;

const temuScraperScript = `
window.scrapeCart = function() {
  try {
    const items = [];
    // Temu Selectors - Updated
    const cartItems = document.querySelectorAll('.cart-item, .goods-item, [data-type="cart-item"]');
    
    cartItems.forEach(item => {
      const titleEl = item.querySelector('.goods-title, .title');
      const priceEl = item.querySelector('.goods-price, .price');
      const imageEl = item.querySelector('img');
      
      if (titleEl) {
        items.push({
          id: Date.now().toString() + Math.random(),
          title: titleEl.innerText,
          price: priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 0,
          image: imageEl ? imageEl.src : '',
          url: window.location.href,
          sku: 'N/A',
          provider: 'Temu',
          quantity: 1,
          options: (function() {
              const opts = [];
              const skuEls = item.querySelectorAll('.goods-sku, .sku-text');
              skuEls.forEach(el => opts.push(el.innerText));
              return opts.join(', ');
          })()
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
`;

const aliexpressScraperScript = `
window.scrapeCart = function() {
    // Placeholder for AliExpress
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: []
    }));
};
`;

const neweggScraperScript = `
window.scrapeCart = function() {
    // Placeholder for Newegg
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: []
    }));
};
`;

const genericScraperScript = `
window.scrapeCart = function() {
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
                options: (function() {
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
`;
