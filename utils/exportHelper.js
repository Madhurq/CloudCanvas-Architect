/**
 * Export/Import Helper for AWS Architecture
 */

/**
 * Download architecture as JSON file
 */
export const downloadArchitecture = (architecture) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `aws-architecture-${timestamp}.json`;
    
    const dataStr = JSON.stringify(architecture, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Load architecture from JSON file
 */
export const loadArchitectureFromFile = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        if (!file.name.endsWith('.json')) {
            reject(new Error('Invalid file type. Please select a JSON file.'));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const architecture = JSON.parse(e.target.result);
                
                // Validate architecture structure
                if (!architecture.version) {
                    reject(new Error('Invalid architecture file: missing version'));
                    return;
                }
                
                if (architecture.version !== '1.0') {
                    reject(new Error(`Unsupported architecture version: ${architecture.version}`));
                    return;
                }
                
                resolve(architecture);
            } catch (error) {
                reject(new Error('Invalid JSON file: ' + error.message));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
};

/**
 * Validate architecture structure
 */
export const validateArchitecture = (architecture) => {
    const errors = [];
    
    if (!architecture) {
        errors.push('Architecture is null or undefined');
        return errors;
    }
    
    if (!architecture.version) {
        errors.push('Missing version field');
    }
    
    if (!Array.isArray(architecture.nodes)) {
        errors.push('Nodes must be an array');
    }
    
    if (!Array.isArray(architecture.edges)) {
        errors.push('Edges must be an array');
    }
    
    if (!architecture.region) {
        errors.push('Missing region field');
    }
    
    if (!architecture.pricingModel) {
        errors.push('Missing pricingModel field');
    }
    
    return errors;
};

/**
 * Encode architecture as URL parameters
 * Uses compression to minimize URL length
 */
export const encodeArchitectureToUrl = (architecture) => {
    try {
        // Create a minimal representation
        const minified = {
            v: architecture.version,
            n: architecture.nodes,
            e: architecture.edges,
            r: architecture.region,
            p: architecture.pricingModel,
        };
        
        // Convert to JSON and compress with btoa
        const jsonStr = JSON.stringify(minified);
        const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
        
        // Remove padding for cleaner URLs
        const cleaned = encoded.replace(/={1,2}$/, '');
        
        // Create shareable URL
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?arch=${cleaned}`;
    } catch (error) {
        throw new Error('Failed to encode architecture: ' + error.message);
    }
};

/**
 * Decode architecture from URL parameters
 */
export const decodeArchitectureFromUrl = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('arch');
        
        if (!encoded) {
            return null;
        }
        
        // Add back padding if needed
        const padded = encoded + '=='.slice(0, (4 - encoded.length % 4) % 4);
        
        // Decode from base64
        const jsonStr = decodeURIComponent(escape(atob(padded)));
        const minified = JSON.parse(jsonStr);
        
        // Expand minified keys
        const architecture = {
            version: minified.v,
            nodes: minified.n,
            edges: minified.e,
            region: minified.r,
            pricingModel: minified.p,
        };
        
        // Validate
        const errors = validateArchitecture(architecture);
        if (errors.length > 0) {
            throw new Error('Invalid architecture: ' + errors.join(', '));
        }
        
        return architecture;
    } catch (error) {
        console.error('Failed to decode architecture from URL:', error);
        return null;
    }
};

/**
 * Copy shareable URL to clipboard
 */
export const copyShareableUrlToClipboard = async (architecture) => {
    try {
        const url = encodeArchitectureToUrl(architecture);
        await navigator.clipboard.writeText(url);
        return { success: true, url };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Get share URL without copying
 */
export const getShareableUrl = (architecture) => {
    try {
        return encodeArchitectureToUrl(architecture);
    } catch (error) {
        throw new Error('Failed to generate share URL: ' + error.message);
    }
};
