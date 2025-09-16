/**
 * Utilidades de validación para el sistema de casino
 */

/**
 * Valida si un monto está dentro de los límites permitidos
 * @param {number} amount - Monto a validar
 * @param {number} min - Monto mínimo (por defecto 20000)
 * @param {number} max - Monto máximo (por defecto 1000000)
 * @returns {Object} Resultado de la validación
 */
const validateAmount = (amount, min = 20000, max = 1000000) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return { valid: false, error: 'El monto debe ser un número válido' };
    }

    if (amount < min) {
        return { valid: false, error: `El monto mínimo es $${min.toLocaleString()}` };
    }

    if (amount > max) {
        return { valid: false, error: `El monto máximo es $${max.toLocaleString()}` };
    }

    return { valid: true };
};

/**
 * Valida si un usuario tiene saldo suficiente
 * @param {number} balance - Balance actual del usuario
 * @param {number} amount - Monto a descontar
 * @returns {Object} Resultado de la validación
 */
const validateBalance = (balance, amount) => {
    if (balance < amount) {
        return { 
            valid: false, 
            error: `Saldo insuficiente. Balance actual: $${balance.toLocaleString()}` 
        };
    }

    return { valid: true };
};

/**
 * Valida un código promocional
 * @param {string} code - Código a validar
 * @returns {Object} Resultado de la validación
 */
const validatePromoCode = (code) => {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'El código promocional es requerido' };
    }

    const cleanCode = code.trim().toUpperCase();
    
    if (!/^[A-Z]{4}$/.test(cleanCode)) {
        return { valid: false, error: 'El código debe contener exactamente 4 letras mayúsculas (A-Z)' };
    }

    return { valid: true, cleanCode };
};

/**
 * Valida los multiplicadores de una apuesta combinada
 * @param {string} multipliersStr - String de multiplicadores separados por espacios
 * @returns {Object} Resultado de la validación
 */
const validateMultipliers = (multipliersStr) => {
    if (!multipliersStr || typeof multipliersStr !== 'string') {
        return { valid: false, error: 'Los multiplicadores son requeridos' };
    }

    const multipliers = multipliersStr.split(' ').map(num => parseFloat(num));
    
    if (multipliers.some(isNaN)) {
        return { valid: false, error: 'Uno o más multiplicadores no son válidos' };
    }

    if (multipliers.length > 4) {
        return { valid: false, error: 'El máximo de partidos para una combinada es 4' };
    }

    if (multipliers.some(mult => mult < 1.01)) {
        return { valid: false, error: 'Los multiplicadores deben ser mayores a 1.00' };
    }

    return { valid: true, multipliers };
};

/**
 * Valida los permisos de un usuario para comandos administrativos
 * @param {GuildMember} member - Miembro del servidor
 * @param {Array<string>} requiredRoles - Array de IDs de roles requeridos
 * @returns {boolean} True si tiene permisos, false si no
 */
const validateAdminPermissions = (member, requiredRoles) => {
    if (!member || !requiredRoles || !Array.isArray(requiredRoles)) {
        return false;
    }

    return requiredRoles.some(roleId => member.roles.cache.has(roleId));
};

/**
 * Valida si un usuario tiene una cartera registrada
 * @param {Object} wallet - Objeto de cartera de la base de datos
 * @param {string} username - Nombre de usuario para mensajes de error
 * @returns {Object} Resultado de la validación
 */
const validateWallet = (wallet, username = 'Usuario') => {
    if (!wallet) {
        return { valid: false, error: `${username} no tiene una cartera registrada` };
    }

    return { valid: true };
};

module.exports = {
    validateAmount,
    validateBalance,
    validatePromoCode,
    validateMultipliers,
    validateAdminPermissions,
    validateWallet
};
