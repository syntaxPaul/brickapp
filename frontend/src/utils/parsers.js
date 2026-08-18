//frontend/src/utils/parsers.js

/**
 * Safely parse a value to number
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - Parsed number
 */
export const parseNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safely parse a value to integer
 * @param {any} value - The value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} - Parsed integer
 */
export const parseIntSafe = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Format a number as currency
 * @param {number} value - The number to format
 * @param {string} currency - Currency symbol (default: 'R')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, currency = 'R') => {
  const num = parseNumber(value);
  return `${currency}${num.toFixed(2)}`;
};

/**
 * Format a number with commas
 * @param {number} value - The number to format
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value, defaultValue = 0) => {
  const num = parseNumber(value, defaultValue);
  return num.toLocaleString();
};

/**
 * Parse product data - ensures all numeric fields are numbers
 */
export const parseProduct = (product) => ({
  ...product,
  unit_price: parseNumber(product.unit_price),
  stock_quantity: parseIntSafe(product.stock_quantity),
  min_stock_threshold: parseIntSafe(product.min_stock_threshold),
  unit_cost: parseNumber(product.unit_cost)
});

/**
 * Parse order data - ensures all numeric fields are numbers
 */
export const parseOrder = (order) => ({
  ...order,
  total_amount: parseNumber(order.total_amount),
  paid_amount: parseNumber(order.paid_amount)
});

/**
 * Parse stats data
 */
export const parseStats = (stats) => ({
  ...stats,
  total_orders: parseIntSafe(stats.total_orders),
  total_revenue: parseNumber(stats.total_revenue),
  total_expenses: parseNumber(stats.total_expenses),
  total_wastage_cost: parseNumber(stats.total_wastage_cost),
  stock_alerts: stats.stock_alerts || [],
  delivery_stats: {
    total_trips: parseIntSafe(stats.delivery_stats?.total_trips),
    completed_trips: parseIntSafe(stats.delivery_stats?.completed_trips),
    in_progress_trips: parseIntSafe(stats.delivery_stats?.in_progress_trips),
    scheduled_trips: parseIntSafe(stats.delivery_stats?.scheduled_trips)
  }
});

/**
 * Parse array of items with a parser function
 */
export const parseItems = (items, parser) => 
  items?.map(item => parser(item)) || [];

// Convenience parsers
export const parseProducts = (products) => parseItems(products, parseProduct);
export const parseOrders = (orders) => parseItems(orders, parseOrder);

/**
 * Parse delivery trip data - ensures all numeric fields are numbers
 */
export const parseDeliveryTrip = (trip) => ({
  ...trip,
  distance_km: parseNumber(trip.distance_km),
  fuel_used_liters: parseNumber(trip.fuel_used_liters),
  toll_cost: parseNumber(trip.toll_cost)
});

export const parseDeliveryTrips = (trips) => parseItems(trips, parseDeliveryTrip);

/**
 * Parse expense data - ensures all numeric fields are numbers
 */
export const parseExpense = (expense) => ({
  ...expense,
  amount: parseNumber(expense.amount)
});

export const parseExpenses = (expenses) => parseItems(expenses, parseExpense);

/**
 * Parse wastage data - ensures all numeric fields are numbers
 */
export const parseWastage = (wastage) => ({
  ...wastage,
  quantity: parseIntSafe(wastage.quantity),
  cost_impact: parseNumber(wastage.cost_impact)
});

export const parseWastages = (wastages) => parseItems(wastages, parseWastage);

/**
 * Parse production batch data - ensures all numeric fields are numbers
 */
export const parseProductionBatch = (batch) => ({
  ...batch,
  planned_quantity: parseIntSafe(batch.planned_quantity),
  actual_quantity: parseIntSafe(batch.actual_quantity),
  rejected_quantity: parseIntSafe(batch.rejected_quantity)
});

export const parseProductionBatches = (batches) => parseItems(batches, parseProductionBatch);

/**
 * Parse machine data - ensures all numeric fields are numbers
 */
export const parseMachine = (machine) => ({
  ...machine,
  daily_capacity: parseIntSafe(machine.daily_capacity),
  total_batches: parseIntSafe(machine.total_batches),
  total_produced: parseIntSafe(machine.total_produced),
  total_rejected: parseIntSafe(machine.total_rejected)
});

export const parseMachines = (machines) => parseItems(machines, parseMachine);

/**
 * Parse supplier data
 */
export const parseSupplier = (supplier) => ({
  ...supplier
});

export const parseSuppliers = (suppliers) => parseItems(suppliers, parseSupplier);

/**
 * Parse driver data
 */
export const parseDriver = (driver) => ({
  ...driver,
  total_trips: parseIntSafe(driver.total_trips),
  completed_trips: parseIntSafe(driver.completed_trips)
});

export const parseDrivers = (drivers) => parseItems(drivers, parseDriver);

/**
 * Parse user data
 */
export const parseUser = (user) => ({
  ...user
});

export const parseUsers = (users) => parseItems(users, parseUser);

/**
 * Parse branch data
 */
export const parseBranch = (branch) => ({
  ...branch
});

export const parseBranches = (branches) => parseItems(branches, parseBranch);

/**
 * Parse chart data - ensures all numeric fields are numbers
 */
export const parseChartData = (data) => 
  data?.map(item => ({
    ...item,
    revenue: parseNumber(item.revenue),
    expenses: parseNumber(item.expenses),
    total: parseNumber(item.total),
    total_sold: parseIntSafe(item.total_sold),
    total_revenue: parseNumber(item.total_revenue),
    value: parseNumber(item.value)
  })) || [];

/**
 * Generic API response parser
 * @param {any} data - The data to parse
 * @param {string} type - The type of data (orders, products, etc.)
 * @returns {any} - Parsed data
 */
export const parseApiResponse = (data, type) => {
  const parsers = {
    orders: parseOrders,
    products: parseProducts,
    stats: parseStats,
    expenses: parseExpenses,
    wastages: parseWastages,
    batches: parseProductionBatches,
    machines: parseMachines,
    suppliers: parseSuppliers,
    drivers: parseDrivers,
    users: parseUsers,
    branches: parseBranches,
    trips: parseDeliveryTrips,
    chart: parseChartData
  };

  const parser = parsers[type];
  if (!parser) return data;
  
  if (Array.isArray(data)) {
    return parser(data);
  }
  return parser(data);
};

export default {
  parseNumber,
  parseIntSafe,
  formatCurrency,
  formatNumber,
  parseProduct,
  parseProducts,
  parseOrder,
  parseOrders,
  parseStats,
  parseItems,
  parseDeliveryTrip,
  parseDeliveryTrips,
  parseExpense,
  parseExpenses,
  parseWastage,
  parseWastages,
  parseProductionBatch,
  parseProductionBatches,
  parseMachine,
  parseMachines,
  parseSupplier,
  parseSuppliers,
  parseDriver,
  parseDrivers,
  parseUser,
  parseUsers,
  parseBranch,
  parseBranches,
  parseChartData,
  parseApiResponse
};