// TEMU Cart Scraper - Extracts data from TEMU cart page JSON structure
// Maps: asin=goodsId, product_name=goodsName, product_price=skuPrice/100, color/talla from skuSpec
export const temuScraperScript = `
window.scrapeCart = function() {
  try {
    const items = [];
    console.log('===== TEMU SCRAPER START =====');
    
    // Helper to decode TEMU unicode strings
    function decodeTemuUrl(str) {
      if (!str) return '';
      return str.replace(/\\\\u002F/g, '/').replace(/\\u002F/g, '/');
    }
    
    // Parse a single cart item from TEMU's JSON structure
    function parseCartItem(item) {
      if (!item || !item.baseGoodsInfo) return null;
      
      const base = item.baseGoodsInfo;
      const sku = item.skuInfo || {};
      
      // ASIN = goodsId (product identifier)
      const asin = String(base.goodsId || '');
      
      // Product name from goodsName
      const productName = base.goodsName || '';
      
      // Price from skuPrice (in cents) / 100 - this is the discounted price (rayito)
      // Fallback to base.price if skuPrice not available
      let price = 0;
      if (sku.skuPrice) {
        price = sku.skuPrice / 100;
      } else if (base.price) {
        price = base.price / 100;
      }
      
      // Quantity from skuInfo.amount (the combobox value)
      const cantidad = sku.amount || 1;
      
      // Image URL - decode unicode escapes
      let imageUrl = '';
      if (sku.skuThumbUrl) {
        imageUrl = decodeTemuUrl(sku.skuThumbUrl);
      } else if (base.thumbUrl) {
        imageUrl = decodeTemuUrl(base.thumbUrl);
      }
      
      // Product URL
      let productUrl = 'https://www.temu.com/';
      if (base.linkUrl) {
        productUrl = 'https://www.temu.com/' + decodeTemuUrl(base.linkUrl);
      }
      
      // Color and Size from skuSpec array
      let color = '';
      let talla = '';
      const attributes = {};
      
      if (sku.skuSpec && Array.isArray(sku.skuSpec)) {
        sku.skuSpec.forEach(spec => {
          const key = (spec.specKey || '').toLowerCase();
          const value = spec.specValue || '';
          
          if (key === 'color' || key === 'colour') {
            color = value;
            attributes.color = value;
          } else if (key === 'tamaño' || key === 'size' || key === 'talla') {
            talla = value;
            attributes.size = value;
          } else {
            attributes[spec.specKey] = value;
          }
        });
      }
      
      console.log('Parsed item:', productName.substring(0, 50), '| price:', price, '| qty:', cantidad, '| asin:', asin);
      
      return {
        id: asin || Date.now().toString(),
        product_name: productName,
        product_price: price,
        product_image: imageUrl,
        product_url: productUrl,
        asin: asin,
        color: color,
        talla: talla,
        provider: 'Temu',
        cantidad: cantidad,
        product_attributes: attributes,
        options: [color, talla].filter(Boolean).join(', ')
      };
    }
    
    // Method 1: Search all script tags for JSON with baseGoodsInfo
    function searchScriptTags() {
      console.log('Searching script tags for cart data...');
      const scripts = document.querySelectorAll('script');
      
      for (const script of scripts) {
        const content = script.textContent || script.innerHTML || '';
        
        // Look for patterns that indicate cart data
        if (content.includes('baseGoodsInfo') && content.includes('goodsId')) {
          console.log('Found script with baseGoodsInfo');
          
          try {
            // Try to find JSON objects - search for cart-like structures
            // Pattern: array of objects with baseGoodsInfo
            const cartPatterns = [
              /"goodsVoList"\\s*:\\s*(\\[.*?\\])(?=\\s*[,}])/gs,
              /"cartGoodsList"\\s*:\\s*(\\[.*?\\])(?=\\s*[,}])/gs,
              /"cartList"\\s*:\\s*(\\[.*?\\])(?=\\s*[,}])/gs,
              /"items"\\s*:\\s*(\\[\\s*\\{[^\\[]*"baseGoodsInfo"[^\\]]*\\])/gs
            ];
            
            for (const pattern of cartPatterns) {
              const matches = [...content.matchAll(pattern)];
              for (const match of matches) {
                try {
                  const arrayStr = match[1];
                  const parsed = JSON.parse(arrayStr);
                  if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].baseGoodsInfo) {
                    console.log('Found cart array with', parsed.length, 'items');
                    return parsed;
                  }
                } catch(e) {
                  // Continue trying other matches
                }
              }
            }
            
            // Fallback: Try to find individual cart items
            const itemPattern = /\\{[^{}]*"baseGoodsInfo"\\s*:\\s*\\{[^{}]*"goodsId"[^{}]*\\}[^{}]*"skuInfo"\\s*:\\s*\\{[^}]*\\}[^}]*\\}/g;
            const itemMatches = content.match(itemPattern);
            if (itemMatches) {
              console.log('Found', itemMatches.length, 'individual cart items');
              return itemMatches.map(m => {
                try { return JSON.parse(m); } catch(e) { return null; }
              }).filter(Boolean);
            }
          } catch(e) {
            console.log('Parse error:', e.message);
          }
        }
      }
      return [];
    }
    
    // Method 2: Search window global objects - prioritize rawData.store.originalList
    function searchWindowObjects() {
      console.log('Searching window objects...');
      
      // PRIORITY: Check window.rawData.store.originalList first (confirmed TEMU cart location)
      try {
        if (window.rawData && window.rawData.store && Array.isArray(window.rawData.store.originalList)) {
          const cartItems = window.rawData.store.originalList;
          console.log('Found cart items in window.rawData.store.originalList:', cartItems.length);
          if (cartItems.length > 0 && cartItems[0].baseGoodsInfo) {
            return cartItems;
          }
        }
      } catch(e) {
        console.log('rawData check error:', e.message);
      }
      
      // Also check if rawData is directly an array
      try {
        if (window.rawData && Array.isArray(window.rawData)) {
          if (window.rawData.length > 0 && window.rawData[0].baseGoodsInfo) {
            console.log('Found cart items in window.rawData array');
            return window.rawData;
          }
        }
      } catch(e) {}
      
      // Check other common TEMU data stores
      const sources = [
        'rawData',
        '__PRELOADED_STATE__',
        '__INITIAL_STATE__', 
        '__DATA__',
        'pageData',
        'cartData',
        '__rawServerData',
        'SSR_DATA',
        '_CHUNK_DATA_'
      ];
      
      function findCartItems(obj, depth) {
        if (depth > 15 || !obj) return null;
        
        if (Array.isArray(obj)) {
          if (obj.length > 0 && obj[0] && obj[0].baseGoodsInfo) {
            return obj;
          }
          for (const item of obj) {
            const result = findCartItems(item, depth + 1);
            if (result) return result;
          }
        } else if (typeof obj === 'object') {
          // Check likely property names first - add originalList
          const props = ['originalList', 'goodsVoList', 'cartGoodsList', 'cartList', 'items', 'data', 'goods', 'store'];
          for (const prop of props) {
            if (obj[prop]) {
              const result = findCartItems(obj[prop], depth + 1);
              if (result) return result;
            }
          }
          // Then search all properties
          for (const key in obj) {
            try {
              const result = findCartItems(obj[key], depth + 1);
              if (result) return result;
            } catch(e) {}
          }
        }
        return null;
      }
      
      for (const name of sources) {
        try {
          if (window[name] && typeof window[name] === 'object') {
            console.log('Checking window.' + name);
            const cartItems = findCartItems(window[name], 0);
            if (cartItems && cartItems.length > 0) {
              console.log('Found cart items in window.' + name);
              return cartItems;
            }
          }
        } catch(e) {}
      }
      
      return [];
    }
    
    // Method 3: DOM extraction fallback (simplified)
    function extractFromDOM() {
      console.log('Fallback: DOM extraction...');
      const foundItems = [];
      
      // Find product images
      const images = document.querySelectorAll('img');
      const processedTexts = new Set();
      
      images.forEach((img, idx) => {
        if (img.width < 60 || img.height < 60) return;
        if ((img.src || '').includes('logo')) return;
        
        // Go up to find container with price
        let container = img.parentElement;
        for (let i = 0; i < 8 && container; i++) {
          const text = container.innerText || '';
          const textKey = text.substring(0, 100);
          
          if (processedTexts.has(textKey)) {
            container = container.parentElement;
            continue;
          }
          
          // Look for price pattern
          const priceMatch = text.match(/\\$\\s*([0-9]+(?:\\.[0-9]{1,2})?)/);
          if (priceMatch && text.length > 30 && text.length < 1500) {
            processedTexts.add(textKey);
            
            const price = parseFloat(priceMatch[1]);
            
            // Find title
            let title = '';
            const lines = text.split(/[\\n\\r]+/);
            for (const line of lines) {
              const clean = line.trim();
              if (clean.length > 15 && clean.length < 200 &&
                  !clean.startsWith('$') && !clean.match(/^[0-9]/) &&
                  !clean.includes('http') && !clean.includes('Sign in')) {
                title = clean;
                break;
              }
            }
            
            // Find quantity from select or input
            let qty = 1;
            const select = container.querySelector('select');
            if (select && select.value) {
              qty = parseInt(select.value, 10) || 1;
            }
            const input = container.querySelector('input[type="number"], input[type="text"]');
            if (input && input.value) {
              const val = parseInt(input.value, 10);
              if (val > 0 && val < 100) qty = val;
            }
            
            if (title && price > 0) {
              foundItems.push({
                id: Date.now().toString() + idx,
                product_name: title,
                product_price: price,
                product_image: img.src,
                product_url: window.location.href,
                asin: '',
                color: '',
                talla: '',
                provider: 'Temu',
                cantidad: qty,
                product_attributes: {},
                options: ''
              });
              return; // Don't go further up
            }
          }
          container = container.parentElement;
        }
      });
      
      return foundItems;
    }
    
    // Execute methods in order
    let cartData = searchScriptTags();
    if (!cartData || cartData.length === 0) {
      cartData = searchWindowObjects();
    }
    
    if (cartData && cartData.length > 0) {
      console.log('Processing', cartData.length, 'cart items from JSON');
      cartData.forEach(item => {
        const parsed = parseCartItem(item);
        if (parsed && parsed.product_name && parsed.product_price > 0) {
          items.push(parsed);
        }
      });
    }
    
    // Fallback to DOM if no JSON items found
    if (items.length === 0) {
      console.log('No JSON items, using DOM fallback');
      const domItems = extractFromDOM();
      items.push(...domItems);
    }
    
    console.log('===== TEMU SCRAPER END: Found', items.length, 'total items =====');
    
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: items
    }));
    
  } catch (e) {
    console.error('TEMU Scraper Error:', e);
    window.ReactNativeWebView.postMessage(JSON.stringify({ 
      type: 'ERROR', 
      message: 'TEMU Scraper Error: ' + e.toString() 
    }));
  }
};

window.scrapeCart();
`;
