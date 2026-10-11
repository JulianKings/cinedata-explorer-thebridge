import { API_KEY } from '../config.js';

export class TmdbError extends Error {
    constructor(message, { status = 0, url = '', cause } = {}) {
        super(redact(message));
        this.name = 'The Movie Database API Error';
        this.status = status; // HTTP status, 0 for network or setup problems
        this.url = redact(url);
        if (cause) this.cause = cause;
    }
}

// Asegura que la clave de la API no se exponga en los mensajes de error
function redact(text) {
    const value = String(text ?? '');
    return API_KEY ? value.split(API_KEY).join('***') : value;
}