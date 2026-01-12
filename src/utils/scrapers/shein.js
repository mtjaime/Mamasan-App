// SHEIN Cart Scraper - Works on both Desktop and Mobile versions
// Desktop: window.gbCartSsrData
// Mobile: window.ssrData.contextForSSR.originCartInfo OR window.gbCommonInfo.contextForSSR.originCartInfo
export const sheinScraperScript = `
window.scrapeCart = function() {
  try {
    console.log('===== SHEIN SCRAPER START =====');
    const items = [];
    const seenIds = new Set();
    
    // Step 1: Get cart data from the appropriate source
    function getCartData() {
      // Try Desktop version first (gbCartSsrData)
      if (window.gbCartSsrData && window.gbCartSsrData.originCartInfo) {
        console.log('Found desktop data: gbCartSsrData');
        return window.gbCartSsrData.originCartInfo;
      }
      
      // Try Mobile version (gbCommonInfo) - most common on mobile
      if (window.gbCommonInfo && window.gbCommonInfo.contextForSSR && window.gbCommonInfo.contextForSSR.originCartInfo) {
        console.log('Found mobile data: gbCommonInfo.contextForSSR.originCartInfo');
        return window.gbCommonInfo.contextForSSR.originCartInfo;
      }
      
      // Try Mobile version (ssrData)
      if (window.ssrData) {
        if (window.ssrData.contextForSSR && window.ssrData.contextForSSR.originCartInfo) {
          console.log('Found mobile data: ssrData.contextForSSR.originCartInfo');
          return window.ssrData.contextForSSR.originCartInfo;
        }
        if (window.ssrData.originCartInfo) {
          console.log('Found mobile data: ssrData.originCartInfo');
          return window.ssrData.originCartInfo;
        }
      }
      
      // Try cartSsrData (another mobile variant)
      if (window.cartSsrData) {
        try {
          const parsed = typeof window.cartSsrData === 'string' 
            ? JSON.parse(window.cartSsrData) 
            : window.cartSsrData;
          if (parsed.originCartInfo) {
            console.log('Found mobile data: cartSsrData.originCartInfo');
            return parsed.originCartInfo;
          }
        } catch(e) {}
      }
      
      console.log('No cart data found in window objects');
      return null;
    }
    
    // Step 2: Extract color and size from item
    function extractAttributes(item) {
      let color = '';
      let size = '';
      let options = '';
      
      // Method 1: aggregateProductBusiness.goodsAttr (combined string like "Black / US7")
      if (item.aggregateProductBusiness && item.aggregateProductBusiness.goodsAttr) {
        options = item.aggregateProductBusiness.goodsAttr.trim();
        // Try to split color and size
        const parts = options.split('/').map(p => p.trim());
        if (parts.length >= 2) {
          color = parts[0];
          size = parts[1];
        } else if (parts.length === 1) {
          // Could be just color or just size
          color = parts[0];
        }
      }
      
      // Method 2: product.sku_sale_attr (structured array)
      const product = item.product || item;
      if (product.sku_sale_attr && Array.isArray(product.sku_sale_attr)) {
        product.sku_sale_attr.forEach(attr => {
          const attrName = (attr.attr_name || '').toLowerCase();
          const attrValue = attr.attrValue || attr.attr_value || '';
          
          if (attrName.includes('color') || attrName.includes('colour')) {
            color = attrValue;
          } else if (attrName.includes('size') || attrName.includes('tamaño') || attrName.includes('talla')) {
            size = attrValue;
          }
        });
        
        // Build options string if not already set
        if (!options && (color || size)) {
          options = [color, size].filter(Boolean).join(' / ');
        }
      }
      
      // Method 3: Direct fields on item or product
      if (!color) {
        color = item.color || product.color || '';
      }
      if (!size) {
        size = item.size || product.size || item.attr?.attr_value || '';
      }
      
      // Build options if still empty
      if (!options && (color || size)) {
        options = [color, size].filter(Boolean).join(' / ');
      }
      
      return { color, size, options };
    }
    
    // Step 3: Build a map of cartItemId -> product data
    function buildProductMap(cartInfo) {
      const productMap = new Map();
      
      if (!cartInfo || !cartInfo.mallCartInfo) {
        console.log('No mallCartInfo found');
        return productMap;
      }
      
      const mallCarts = cartInfo.mallCartInfo.mallCarts || [];
      console.log('Found', mallCarts.length, 'mall carts');
      
      mallCarts.forEach(mall => {
        const shops = mall.shops || [];
        shops.forEach(shop => {
          const contentData = shop.contentData || [];
          contentData.forEach(content => {
            const productList = content.productLineInfoList || [];
            productList.forEach(item => {
              const product = item.product || item;
              
              // cartItemId matches the DOM class j-cart-item-XXXXX
              const cartItemId = String(item.id || '');
              
              // Real product goodsId 
              const goodsId = String(item.goodsId || product.goods_id || product.goodsId || '');
              
              // Product name
              const goodsName = product.goods_name || product.goodsName || '';
              
              // URL name for building product URL
              const goodsUrlName = product.goods_url_name || '';
              
              // Build product URL
              let productUrl = 'https://us.shein.com/';
              if (goodsUrlName && goodsId) {
                productUrl = 'https://us.shein.com/' + goodsUrlName + '-p-' + goodsId + '.html';
              }
              
              // Image
              let imageUrl = product.goods_thumb || product.goods_img || '';
              if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
              
              // Quantity
              const quantity = parseInt(item.quantity || '1', 10) || 1;
              
              // Is checked
              const isChecked = item.is_checked !== '0' && item.is_checked !== 0;
              
              // Extract color, size, and options
              const { color, size, options } = extractAttributes(item);
              
              if (cartItemId && goodsId) {
                productMap.set(cartItemId, {
                  cartItemId,
                  goodsId,
                  goodsName,
                  productUrl,
                  imageUrl,
                  quantity,
                  isChecked,
                  color,
                  size,
                  options
                });
                console.log('Mapped:', cartItemId, '->', goodsId, ':', goodsName.substring(0, 25), '| attr:', options);
              }
            });
          });
        });
      });
      
      console.log('Built product map with', productMap.size, 'items');
      return productMap;
    }
    
    // Step 4: Get cart data and build map
    const cartInfo = getCartData();
    const productMap = buildProductMap(cartInfo);
    
    // Step 5: Find DOM items and match with JSON
    let domItems = document.querySelectorAll('[class*="j-cart-item-"]');
    console.log('Found', domItems.length, 'DOM items with j-cart-item class');
    
    if (domItems.length === 0) {
      domItems = document.querySelectorAll('.cart-list-item, .cart-table-item');
      console.log('Fallback found', domItems.length, 'cart list items');
    }
    
    domItems.forEach((container, idx) => {
      try {
        // Extract cartItemId from class like "j-cart-item-35501090653"
        let cartItemId = '';
        const classMatch = container.className.match(/j-cart-item-(\\d+)/);
        if (classMatch) {
          cartItemId = classMatch[1];
        }
        
        if (!cartItemId) {
          console.log('No cartItemId for item', idx);
          return;
        }
        
        // Find in product map
        const productData = productMap.get(cartItemId);
        
        if (!productData) {
          console.log('No product data for cartItemId:', cartItemId);
          return;
        }
        
        // Skip unchecked items
        if (!productData.isChecked) {
          console.log('Skipping unchecked item:', cartItemId);
          return;
        }
        
        // Skip duplicates
        if (seenIds.has(productData.goodsId)) {
          console.log('Skipping duplicate goodsId:', productData.goodsId);
          return;
        }
        seenIds.add(productData.goodsId);
        
        // Get live quantity from DOM if available
        let cantidad = productData.quantity;
        const qtyInput = container.querySelector('.bsc-cart-item-goods-qty__input, input[class*="qty"]');
        if (qtyInput && qtyInput.value) {
          const liveQty = parseInt(qtyInput.value, 10);
          if (!isNaN(liveQty) && liveQty > 0 && liveQty < 100) {
            cantidad = liveQty;
          }
        }
        
        // Get price from DOM
        let price = 0;
        const priceEl = container.querySelector('.bsc-cart-item-goods-price-v1__sale-price, [class*="sale-price"]');
        if (priceEl) {
          const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
          price = parseFloat(priceText) || 0;
        }
        
        console.log('Item:', productData.goodsName.substring(0, 25), '| id:', productData.goodsId, '| $' + price, '| qty:', cantidad, '| attr:', productData.options);
        
        if (productData.goodsName && price > 0 && productData.goodsId) {
          items.push({
            id: productData.goodsId,
            product_name: productData.goodsName,
            product_price: price,
            product_image: productData.imageUrl,
            product_url: productData.productUrl,
            asin: productData.goodsId,
            provider: 'Shein',
            cantidad: cantidad,
            color: productData.color,
            talla: productData.size,
            options: productData.options
          });
        }
      } catch (e) {
        console.log('Error processing item', idx, e.message);
      }
    });
    
    console.log('===== SHEIN SCRAPER END: Found', items.length, 'items =====');
    
    if (items.length === 0) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        message: 'No se encontraron productos en el carrito de SHEIN. Verifica que los productos esten marcados.'
      }));
      return;
    }
    
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: items
    }));
    
  } catch (e) {
    console.error('SHEIN Error:', e);
    window.ReactNativeWebView.postMessage(JSON.stringify({ 
      type: 'ERROR', 
      message: 'Error: ' + e.toString() 
    }));
  }
};
window.scrapeCart();
`;
