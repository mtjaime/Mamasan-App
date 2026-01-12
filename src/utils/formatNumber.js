/**
 * Format numbers using US locale (1,234.56)
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0.00';
    }

    const num = parseFloat(value);

    // Format with US locale (comma for thousands, period for decimals)
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Format currency with symbol
 * @param {number} value - The number to format
 * @param {string} currency - 'bs' or 'usd'
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'usd') => {
    const formatted = formatNumber(value, 2);

    if (currency === 'bs' || currency === 'BS') {
        return `Bs. ${formatted}`;
    }

    return `$${formatted}`;
};
