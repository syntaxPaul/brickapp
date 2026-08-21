// frontend/src/lib/authEvents.js
//
// A tiny event bus so the HTTP layer can signal auth failures without importing
// AuthContext (which would create a circular dependency: context -> http -> context).

const listeners = {
    unauthorized: new Set(),
    offline: new Set(),
    online: new Set(),
};

export function on(event, handler) {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(handler);
    return () => listeners[event].delete(handler);
}

export function emit(event, payload) {
    if (!listeners[event]) return;
    listeners[event].forEach((handler) => {
        try {
            handler(payload);
        } catch (err) {
            // A broken listener must never break the emitter.
            console.error(`authEvents listener for "${event}" threw:`, err);
        }
    });
}
