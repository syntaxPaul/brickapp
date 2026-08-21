// frontend/src/routes.js
//
// One place that knows how to load each page. App.jsx renders from it and the
// prefetcher warms from it, so the two can never drift apart.

export const routeImporters = {
    '/': () => import('./pages/Dashboard'),
    '/products': () => import('./pages/Products'),
    '/orders': () => import('./pages/Orders'),
    '/suppliers': () => import('./pages/Suppliers'),
    '/expenses': () => import('./pages/Expenses'),
    '/wastage': () => import('./pages/Wastage'),
    '/production': () => import('./pages/Production'),
    '/deliveries': () => import('./pages/Deliveries'),
    '/users': () => import('./pages/Users'),
};

// The first data call each page makes. Warming these alongside the chunk means
// a prefetched page often has both its code and its data ready before the click.
export const routeData = {
    '/': ['/api/dashboard/stats', '/api/dashboard/recent-orders'],
    '/products': ['/api/products'],
    '/orders': ['/api/orders'],
    '/suppliers': ['/api/suppliers'],
    '/expenses': ['/api/expenses'],
    '/wastage': ['/api/wastage'],
    '/production': ['/api/production'],
    '/deliveries': ['/api/deliveries'],
    '/users': ['/api/users'],
};
