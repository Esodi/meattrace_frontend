/**
 * Translation service for converting backend terminology to frontend display terms.
 * This allows the backend to use "Farmer" while the UI displays "Abattoir".
 */

// Mapping of backend terms to frontend display terms
const termTranslations: Record<string, string> = {
    'Farmer': 'Abattoir',
    'farmer': 'abattoir',
    'FARMER': 'ABATTOIR',
};

/**
 * Translates a backend term to its frontend display equivalent.
 * If no translation exists, returns the original term.
 */
export function translateTerm(term: string | null | undefined): string {
    if (!term) return '';
    return termTranslations[term] ?? term;
}

/**
 * Translates a role string from backend to frontend display.
 * Handles common role formats and preserves formatting.
 */
export function translateRole(role: string | null | undefined): string {
    if (!role) return 'Unknown';

    // Check for exact match first
    if (termTranslations[role]) {
        return termTranslations[role];
    }

    // Handle case-insensitive matching while preserving original case style
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'farmer') {
        // Preserve the original case style
        if (role === role.toUpperCase()) return 'ABATTOIR';
        if (role[0] === role[0].toUpperCase()) return 'Abattoir';
        return 'abattoir';
    }

    return role;
}
