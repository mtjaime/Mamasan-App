// Walmart Cart Scraper with JSON-LD support for SKU extraction
export const walmartScraperScript = `
window.scrapeCart = function() {
  try {
    const uniqueItemsMap = new Map();
    
    // Extract price from text - smart extraction for Walmart's price patterns
    function extractPriceFromText(text) {
      if (!text) return 0;
      
      // First, try to find "Now $X" or "current price $X" pattern (sale prices)
      const nowMatch = text.match(/(?:Now|current price)[:\\s]*\\$([0-9]+(?:\\.[0-9]{1,2})?)/i);
      if (nowMatch) {
        return parseFloat(nowMatch[1]);
      }
      
      // Find all $ prices in the text
      const allPrices = [];
      const regex = /\\$([0-9]+(?:\\.[0-9]{1,2})?)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const num = parseFloat(match[1]);
        const beforeText = text.substring(Math.max(0, match.index - 30), match.index).toLowerCase();
        // Skip prices that are preceded by "was", "save", "shipping", "from"
        const isOldPrice = beforeText.includes('was') || beforeText.includes('save') || 
                          beforeText.includes('shipping') || beforeText.includes('from');
        if (num > 0 && num < 50000 && !isOldPrice) {
          allPrices.push(num);
        }
      }
      
      if (allPrices.length === 0) {
        // If all prices were filtered out, try again without context filtering
        const fallbackRegex = /\\$([0-9]+(?:\\.[0-9]{1,2})?)/g;
        let fallbackMatch;
        while ((fallbackMatch = fallbackRegex.exec(text)) !== null) {
          const num = parseFloat(fallbackMatch[1]);
          if (num > 0 && num < 50000) {
            return num; // Return first valid price
          }
        }
        return 0;
      }
      
      // Return the first valid price found (after filtering out "was", "save", etc.)
      return allPrices[0];
    }
    
    // Extract products from JSON-LD scripts
    function extractFromJsonLd() {
      const products = [];
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          
          // Handle hasVariant structure
          if (data && data.hasVariant && Array.isArray(data.hasVariant)) {
            data.hasVariant.forEach(variant => {
              if (variant['@type'] === 'Product' && variant.sku) {
                products.push({
                  sku: variant.sku || '',
                  name: variant.name || data.name || '',
                  color: variant.color || '',
                  size: variant.size || '',
                  image: variant.image || data.image || '',
                  price: variant.offers && variant.offers[0] ? parseFloat(variant.offers[0].price) : 0,
                  url: variant.offers && variant.offers[0] ? variant.offers[0].url : ''
                });
              }
            });
          }
          
          // Handle single Product
          if (data && data['@type'] === 'Product' && data.sku) {
            let price = 0;
            if (data.offers && Array.isArray(data.offers) && data.offers.length > 0) {
              price = parseFloat(data.offers[0].price) || 0;
            } else if (data.offers && data.offers.price) {
              price = parseFloat(data.offers.price) || 0;
            }
            products.push({
              sku: data.sku,
              name: data.name || '',
              color: data.color || '',
              size: data.size || '',
              image: data.image || '',
              price: price,
              url: data.offers && data.offers[0] ? data.offers[0].url : ''
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });
      
      return products;
    }
    
    // Get JSON-LD products first
    const jsonLdProducts = extractFromJsonLd();
    console.log('JSON-LD products found:', jsonLdProducts.length);
    
    // Find cart items by looking for Remove buttons
    const allElements = document.querySelectorAll('*');
    const removeButtons = [];
    
    allElements.forEach(el => {
      const text = (el.innerText || el.textContent || '').trim();
      if (text === 'Remove' || text === 'Eliminar') {
        removeButtons.push(el);
      }
    });
    
    console.log('Found remove buttons:', removeButtons.length);
    
    if (removeButtons.length > 0) {
      removeButtons.forEach((btn, index) => {
        let container = btn.parentElement;
        let depth = 0;
        
        while (container && depth < 15) {
          const text = container.innerText || '';
          const img = container.querySelector('img');
          
          if (text.includes('$') && img && text.length > 50) {
            const childRemoveButtons = container.querySelectorAll('*');
            let removeCount = 0;
            childRemoveButtons.forEach(el => {
              if ((el.innerText || '').trim() === 'Remove') removeCount++;
            });
            
            if (removeCount <= 1) {
              const price = extractPriceFromText(text);
              
              if (price > 0) {
                // Extract title
                let title = '';
                const links = container.querySelectorAll('a');
                for (let i = 0; i < links.length; i++) {
                  const linkText = (links[i].innerText || '').trim();
                  if (linkText.length > 15 && !linkText.includes('$') && !linkText.includes('Remove') && !linkText.includes('Save')) {
                    title = linkText.split('\\n')[0].trim();
                    break;
                  }
                }
                
                if (!title) {
                  const lines = text.split('\\n');
                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.length > 15 && line.length < 200 && !line.includes('$') && !line.includes('Remove')) {
                      title = line;
                      break;
                    }
                  }
                }
                
                // Extract size
                let size = '';
                const sizeMatch = text.match(/(?:Shoe\\s+)?Size[:\\s]+([^\\n$]+)/i);
                if (sizeMatch) {
                  size = sizeMatch[1].trim().split('\\n')[0].split('$')[0].trim();
                }
                
                // Extract color
                let color = '';
                const colorMatch = text.match(/(?:Actual\\s+)?Color[:\\s]+([^\\n$]+)/i);
                if (colorMatch) {
                  color = colorMatch[1].trim().split('\\n')[0].split('$')[0].trim();
                }
                
                // Extract quantity
                let quantity = 1;
                const qtyMatch = text.match(/Qty[:\\s]*(\\d+)/i);
                if (qtyMatch) {
                  quantity = parseInt(qtyMatch[1], 10) || 1;
                }
                
                // Try to match with JSON-LD product to get SKU
                let sku = '';
                if (jsonLdProducts.length > 0) {
                  // Match by color and size
                  const matchedProduct = jsonLdProducts.find(p => {
                    const colorMatch = color && p.color && p.color.toLowerCase() === color.toLowerCase();
                    const sizeMatch = size && p.size && p.size.toLowerCase() === size.toLowerCase();
                    return colorMatch && sizeMatch;
                  });
                  
                  if (matchedProduct) {
                    sku = matchedProduct.sku;
                    console.log('Matched SKU by color/size:', sku);
                  } else {
                    // Fallback: match by name similarity
                    const titleLower = title.toLowerCase();
                    const nameMatch = jsonLdProducts.find(p => {
                      const nameLower = (p.name || '').toLowerCase();
                      return titleLower.includes(nameLower.substring(0, 20)) || 
                             nameLower.includes(titleLower.substring(0, 20));
                    });
                    if (nameMatch) {
                      sku = nameMatch.sku;
                      console.log('Matched SKU by name:', sku);
                    }
                  }
                }
                
                // If still no SKU, try to extract from URL in container
                if (!sku) {
                  const productLinks = container.querySelectorAll('a[href*="/ip/"]');
                  if (productLinks.length > 0) {
                    const href = productLinks[0].getAttribute('href') || '';
                    const urlMatch = href.match(/\\/ip\\/[^/]+\\/([0-9]+)/);
                    if (urlMatch) {
                      sku = urlMatch[1];
                      console.log('Extracted SKU from URL:', sku);
                    }
                  }
                }
                
                if (title) {
                  const uniqueKey = title.substring(0, 30) + '-' + size + '-' + color;
                  
                  if (!uniqueItemsMap.has(uniqueKey)) {
                    uniqueItemsMap.set(uniqueKey, {
                      id: sku || Date.now().toString() + index,
                      product_name: title,
                      product_price: price,
                      product_image: img.src || '',
                      product_url: window.location.href,
                      asin: sku,
                      color: color,
                      talla: size,
                      provider: 'Walmart',
                      cantidad: quantity,
                      options: [color, size].filter(Boolean).join(', ')
                    });
                  }
                }
                
                break;
              }
            }
          }
          
          container = container.parentElement;
          depth++;
        }
      });
    }
    
    // Fallback: Use JSON-LD products if no DOM items found
    if (uniqueItemsMap.size === 0 && jsonLdProducts.length > 0) {
      console.log('Using JSON-LD fallback');
      jsonLdProducts.forEach((product, index) => {
        if (product.price > 0) {
          uniqueItemsMap.set(product.sku + index, {
            id: product.sku || Date.now().toString() + index,
            product_name: product.name,
            product_price: product.price,
            product_image: product.image,
            product_url: product.url || window.location.href,
            asin: product.sku,
            color: product.color,
            talla: product.size,
            provider: 'Walmart',
            cantidad: 1,
            options: [product.color, product.size].filter(Boolean).join(', ')
          });
        }
      });
    }
    
    // Last fallback: Image traversal
    if (uniqueItemsMap.size === 0) {
      console.log('Trying fallback image method');
      const images = document.querySelectorAll('img');
      
      images.forEach((img, index) => {
        if (img.width < 50 || img.height < 50) return;
        
        let container = img.parentElement;
        let depth = 0;
        
        while (container && depth < 8) {
          const text = container.innerText || '';
          
          if (text.includes('$') && text.length > 30 && text.length < 3000) {
            const price = extractPriceFromText(text);
            
            if (price > 0) {
              const lines = text.split('\\n');
              let title = '';
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.length > 15 && !line.includes('$')) {
                  title = line;
                  break;
                }
              }
              
              if (title) {
                uniqueItemsMap.set(title + index, {
                  id: Date.now().toString() + index,
                  product_name: title,
                  product_price: price,
                  product_image: img.src,
                  product_url: window.location.href,
                  asin: '',
                  color: '',
                  talla: '',
                  provider: 'Walmart',
                  cantidad: 1,
                  options: ''
                });
              }
              break;
            }
          }
          container = container.parentElement;
          depth++;
        }
      });
    }
    
    const items = Array.from(uniqueItemsMap.values());
    console.log('Extracted items:', items.length, JSON.stringify(items, null, 2));
    
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CART_EXTRACTED',
      payload: items
    }));
    
  } catch (e) {
    console.error('Scraper error:', e);
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
  }
};

window.scrapeCart();
`;
