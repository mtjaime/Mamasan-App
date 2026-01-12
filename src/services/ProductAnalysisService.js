// src/services/ProductAnalysisService.js

// List of prohibited keywords (Mock for now, can be replaced by AI or backend config)
const PROHIBITED_KEYWORDS = [
    // Weapons & Ammo
    'gun', 'weapon', 'firearm', 'explosive', 'pistola', 'arma', 'explosivo', 'municion', 'ammo',
    'paintball', 'aire comprimido', 'airsoft', 'bb gun', 'ballesta', 'crossbow', 'mira telescopica', 'scope',
    'gas pimienta', 'pepper spray', 'taser', 'electric weapon', 'cuchillo', 'knife', 'navaja', 'machete', 'hacha', 'axe',
    'resortera', 'tirachinas', 'slingshot',

    // Drugs & Substances
    'drug', 'narcotic', 'tobacco', 'alcohol', 'droga', 'tabaco', 'licor', 'vape', 'cigarillo electronico', 'e-cigarette',
    'quimico', 'chemical', 'aceite de motor', 'motor oil', 'lubricante', 'lubricant', 'aditivo', 'additive', 'refrigerante', 'coolant',

    // Electronics & Tech
    'starlink', 'antena starlink', 'minado bitcoin', 'bitcoin mining', 'asic', 'refurbished', 'reconstruido',
    'drone', 'telefono satelital', 'satellite phone', 'walkie talkie', 'radio 2 vias', '2 way radio',

    // Tactical & Military
    'mascara antigas', 'gas mask', 'casco', 'helmet', 'escudo', 'shield', 'chaleco antibalas', 'bulletproof vest',
    'equipo militar', 'military equipment', 'camuflaje', 'camouflage', 'mascara de esqui', 'ski mask',

    // Sports & Protection
    'pelota de golf', 'golf ball', 'pelota de beisbol', 'baseball ball', 'bate', 'bat',
    'protector de pecho', 'chest protector', 'coraza', 'rodillera', 'knee pad', 'codera', 'elbow pad',

    // Miscellaneous
    'perfume', 'oro', 'gold', 'laboratorio', 'laboratory', 'plomo de pescar', 'fishing lead',
    'bola de rodillo', 'roller ball', 'rodamiento', 'bearing', 'canica', 'marble',
    'binoculares', 'binoculars', 'megafono', 'megaphone'
];

// Heuristic for volume estimation based on keywords (Mock for AI)
const VOLUME_HEURISTICS = [
    { keyword: 'laptop', weight: 2.5, volume: 0.01 },
    { keyword: 'phone', weight: 0.5, volume: 0.001 },
    { keyword: 'tv', weight: 15, volume: 0.2 },
    { keyword: 'shoe', weight: 1.0, volume: 0.015 },
    { keyword: 'zapatos', weight: 1.0, volume: 0.015 },
    { keyword: 'shirt', weight: 0.3, volume: 0.005 },
    { keyword: 'camisa', weight: 0.3, volume: 0.005 },
];

const DEFAULT_WEIGHT = 1.0; // kg
const DEFAULT_VOLUME = 0.01; // m3

export const analyzeProducts = async (items) => {
    const allowed = [];
    const prohibited = [];

    for (const item of items) {
        const titleLower = (item.title || '').toLowerCase();

        // 1. Check for Prohibited Items
        // Use regex with word boundaries to avoid false positives (e.g., "arma" in "armario" or "armable")
        const prohibitedMatch = PROHIBITED_KEYWORDS.find(keyword => {
            // Escape special regex characters if any (though our keywords are mostly simple)
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Allow optional 's' or 'es' at the end for plurals
            const regex = new RegExp(`\\b${escapedKeyword}(s|es)?\\b`, 'i');
            const isMatch = regex.test(titleLower);
            if (isMatch) console.log(`[Analysis] Match found! Item: "${titleLower}" matches keyword: "${keyword}"`);
            return isMatch;
        });

        console.log(`[Analysis] Checking item: "${titleLower}" - Result: ${prohibitedMatch ? 'PROHIBITED' : 'ALLOWED'}`);

        if (prohibitedMatch) {
            prohibited.push({
                ...item,
                reason: `Contiene palabra clave prohibida: "${prohibitedMatch}". Artículos restringidos por regulaciones de envío.`
            });
            continue;
        }

        // 2. Estimate Volume/Weight (AI Placeholder)
        // In a real scenario, this would call an AI endpoint with the image and title
        let estimatedWeight = DEFAULT_WEIGHT;
        let estimatedVolume = DEFAULT_VOLUME;

        const heuristic = VOLUME_HEURISTICS.find(h => titleLower.includes(h.keyword));
        if (heuristic) {
            estimatedWeight = heuristic.weight;
            estimatedVolume = heuristic.volume;
        }

        allowed.push({
            ...item,
            estimatedWeight,
            estimatedVolume,
            aiAnalysis: {
                analyzed: true,
                confidence: 0.85, // Mock confidence
                category: heuristic ? 'Matched Heuristic' : 'General'
            }
        });
    }

    return { allowed, prohibited };
};
