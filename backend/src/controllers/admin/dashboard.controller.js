import { query } from "../../db.js";
import { ok } from "../../utils/http.js";

export async function index(req, res) {
  /*
   * --------------------------------------------------------------------------
   * SUMMARY
   * --------------------------------------------------------------------------
   */

  const customersResult = await query(`
    SELECT COUNT(*) AS count
    FROM users
    WHERE role = 'customer'
  `);

  const activeCustomersResult = await query(`
    SELECT COUNT(*) AS count
    FROM users
    WHERE role = 'customer'
      AND status = 'active'
  `);

  const productsResult = await query(`
    SELECT COUNT(*) AS count
    FROM products
    WHERE status = 'active'
  `);

  const ordersResult = await query(`
    SELECT COUNT(*) AS count
    FROM orders
  `);

  /*
   * Revenue:
   * Only paid orders.
   * Cancelled orders are excluded as well.
   */
  const revenueResult = await query(`
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM orders
    WHERE payment_status = 'paid'
      AND status <> 'cancelled'
  `);

  /*
   * --------------------------------------------------------------------------
   * ORDER STATUS COUNTS
   * --------------------------------------------------------------------------
   */

  const pendingResult = await query(`
    SELECT COUNT(*) AS count
    FROM orders
    WHERE status = 'pending'
  `);

  const processingResult = await query(`
    SELECT COUNT(*) AS count
    FROM orders
    WHERE status = 'processing'
  `);

  const shippedResult = await query(`
    SELECT COUNT(*) AS count
    FROM orders
    WHERE status = 'shipped'
  `);

  const deliveredResult = await query(`
    SELECT COUNT(*) AS count
    FROM orders
    WHERE status = 'delivered'
  `);

  const cancelledResult = await query(`
    SELECT COUNT(*) AS count
    FROM orders
    WHERE status = 'cancelled'
  `);

  /*
   * --------------------------------------------------------------------------
   * TODAY
   * --------------------------------------------------------------------------
   */

  const todayOrdersResult = await query(`
    SELECT COUNT(*) AS count
    FROM orders
    WHERE DATE(created_at) = CURDATE()
  `);

  const todayRevenueResult = await query(`
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM orders
    WHERE DATE(created_at) = CURDATE()
      AND payment_status = 'paid'
      AND status <> 'cancelled'
  `);

  /*
   * --------------------------------------------------------------------------
   * LOW STOCK
   *
   * Available quantity = quantity - reserved_quantity
   * --------------------------------------------------------------------------
   */

  const lowStockItems = await query(`
    SELECT
      i.id AS inventory_id,
      pv.id AS variant_id,
      p.name AS product_name,
      p.slug AS product_slug,
      pi.image,
      pv.sku,
      s.name AS size,
      c.name AS color,
      i.quantity,
      i.reserved_quantity,
      GREATEST(i.quantity - i.reserved_quantity, 0) AS available_quantity,
      i.low_stock_limit
    FROM inventories i

    JOIN product_variants pv
      ON pv.id = i.product_variant_id

    JOIN products p
      ON p.id = pv.product_id

    LEFT JOIN sizes s
      ON s.id = pv.size_id

    LEFT JOIN colors c
      ON c.id = pv.color_id

    LEFT JOIN product_images pi
      ON pi.product_id = p.id
      AND pi.is_primary = 1

    WHERE
      pv.status = 'active'
      AND i.quantity - i.reserved_quantity <= i.low_stock_limit

    ORDER BY
      available_quantity ASC,
      i.id DESC
  `);

  /*
   * --------------------------------------------------------------------------
   * RECENT ORDERS
   * --------------------------------------------------------------------------
   */

  const recentOrders = await query(`
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.payment_method,
      o.payment_status,
      o.total_amount,
      o.created_at,

      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,

      COALESCE(
        (
          SELECT SUM(oi.quantity)
          FROM order_items oi
          WHERE oi.order_id = o.id
        ),
        0
      ) AS items_count

    FROM orders o

    LEFT JOIN users u
      ON u.id = o.user_id

    ORDER BY o.created_at DESC

    LIMIT 10
  `);

  /*
   * Convert the flat user fields into the object
   * expected by the Next.js dashboard.
   */
  const formattedRecentOrders = recentOrders.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    total_amount: order.total_amount,
    items_count: Number(order.items_count || 0),
    created_at: order.created_at,

    user: order.user_id
      ? {
          id: order.user_id,
          name: order.user_name,
          email: order.user_email,
        }
      : null,
  }));

  /*
   * --------------------------------------------------------------------------
   * BEST SELLING PRODUCTS
   *
   * Based on delivered orders.
   * --------------------------------------------------------------------------
   */

  const bestSellingProducts = await query(`
    SELECT
      oi.product_id,
      oi.product_name,

      COALESCE(
        (
          SELECT pi.image
          FROM product_images pi
          WHERE pi.product_id = oi.product_id
            AND pi.is_primary = 1
          LIMIT 1
        ),
        oi.image
      ) AS image,

      SUM(oi.quantity) AS total_quantity,
      SUM(oi.line_total) AS total_sales

    FROM order_items oi

    JOIN orders o
      ON o.id = oi.order_id

    WHERE o.status = 'delivered'

    GROUP BY
      oi.product_id,
      oi.product_name,
      oi.image

    ORDER BY
      total_quantity DESC,
      total_sales DESC

    LIMIT 10
  `);

  /*
   * --------------------------------------------------------------------------
   * SALES CHART — LAST 7 DAYS
   *
   * Paid orders only.
   * --------------------------------------------------------------------------
   */

  const salesRows = await query(`
    SELECT
      DATE(created_at) AS sale_date,
      COALESCE(SUM(total_amount), 0) AS revenue,
      COUNT(*) AS orders
    FROM orders
    WHERE
      created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      AND payment_status = 'paid'
      AND status <> 'cancelled'
    GROUP BY DATE(created_at)
    ORDER BY sale_date ASC
  `);

  /*
   * Create all 7 dates even if there were no orders.
   */

  const salesMap = new Map();

  for (const row of salesRows) {
    const dateKey = formatDateKey(row.sale_date);

    salesMap.set(dateKey, {
      date: dateKey,
      label: formatChartLabel(row.sale_date),
      revenue: Number(row.revenue || 0),
      orders: Number(row.orders || 0),
    });
  }

  const salesChart = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setDate(date.getDate() - i);

    const dateKey = localDateKey(date);

    const existing = salesMap.get(dateKey);

    salesChart.push(
      existing || {
        date: dateKey,
        label: formatChartLabel(date),
        revenue: 0,
        orders: 0,
      }
    );
  }

  /*
   * --------------------------------------------------------------------------
   * FINAL RESPONSE
   * --------------------------------------------------------------------------
   */

  return ok(res, {
    success: true,

    data: {
      summary: {
        total_revenue: Number(
          revenueResult[0]?.total || 0
        ),

        total_orders: Number(
          ordersResult[0]?.count || 0
        ),

        pending_orders: Number(
          pendingResult[0]?.count || 0
        ),

        processing_orders: Number(
          processingResult[0]?.count || 0
        ),

        shipped_orders: Number(
          shippedResult[0]?.count || 0
        ),

        delivered_orders: Number(
          deliveredResult[0]?.count || 0
        ),

        cancelled_orders: Number(
          cancelledResult[0]?.count || 0
        ),

        total_customers: Number(
          customersResult[0]?.count || 0
        ),

        active_customers: Number(
          activeCustomersResult[0]?.count || 0
        ),

        low_stock_count: lowStockItems.length,

        today_orders: Number(
          todayOrdersResult[0]?.count || 0
        ),

        today_revenue: Number(
          todayRevenueResult[0]?.total || 0
        ),
      },

      sales_chart: salesChart,

      recent_orders: formattedRecentOrders,

      low_stock_items: lowStockItems.map((item) => ({
        ...item,
        inventory_id: Number(item.inventory_id),
        variant_id: item.variant_id
          ? Number(item.variant_id)
          : null,
        quantity: Number(item.quantity || 0),
        reserved_quantity: Number(
          item.reserved_quantity || 0
        ),
        available_quantity: Number(
          item.available_quantity || 0
        ),
        low_stock_limit: Number(
          item.low_stock_limit || 0
        ),
      })),

      best_selling_products:
        bestSellingProducts.map((product) => ({
          product_id: product.product_id
            ? Number(product.product_id)
            : null,

          product_name:
            product.product_name || "Product",

          image: product.image || null,

          total_quantity: Number(
            product.total_quantity || 0
          ),

          total_sales: Number(
            product.total_sales || 0
          ),
        })),
    },
  });
}


/*
 * --------------------------------------------------------------------------
 * HELPERS
 * --------------------------------------------------------------------------
 */

function localDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDateKey(value) {
  if (value instanceof Date) {
    return localDateKey(value);
  }

  const text = String(value);

  return text.slice(0, 10);
}


function formatChartLabel(value) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
}