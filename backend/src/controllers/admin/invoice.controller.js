import PDFDocument from "pdfkit";
import { query } from "../../db.js";

/*
|--------------------------------------------------------------------------
| BanglesMart Premium Admin Invoice
|--------------------------------------------------------------------------
*/

const COLORS = {
  maroon: "#85091C",
  darkMaroon: "#4A1118",
  gold: "#B68A35",
  goldLight: "#FBF6EC",
  black: "#1F2937",
  gray: "#6B7280",
  lightGray: "#F8F7F5",
  border: "#E8E1DA",
  white: "#FFFFFF",
  green: "#17803D",
  greenLight: "#EAF7EE",
  orange: "#A15C00",
  orangeLight: "#FFF4DD",
  red: "#B42318",
  redLight: "#FDECEC",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function num(value) {
  const parsed = Number(value || 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

/*
|--------------------------------------------------------------------------
| Money
|--------------------------------------------------------------------------
|
| INR is used instead of ₹ because PDFKit's default Helvetica font
| can render the Rupee symbol incorrectly.
|
|--------------------------------------------------------------------------
*/

function money(value) {
  return `INR ${num(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,

    maximumFractionDigits: 2,
  })}`;
}

/*
|--------------------------------------------------------------------------
| Date
|--------------------------------------------------------------------------
*/

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/*
|--------------------------------------------------------------------------
| Date Time
|--------------------------------------------------------------------------
*/

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/*
|--------------------------------------------------------------------------
| Title Case
|--------------------------------------------------------------------------
*/

function titleCase(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/*
|--------------------------------------------------------------------------
| Parse Address
|--------------------------------------------------------------------------
*/

function parseAddress(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

/*
|--------------------------------------------------------------------------
| Address Lines
|--------------------------------------------------------------------------
*/

function buildAddressLines(address, customer = {}) {
  const data = address || {};

  const lines = [];

  const fullName = data.full_name || data.name || customer.name || "";

  const phone = data.phone || customer.phone || "";

  if (fullName) {
    lines.push(fullName);
  }

  if (data.address_line_1) {
    lines.push(data.address_line_1);
  }

  if (data.address_line_2) {
    lines.push(data.address_line_2);
  }

  if (data.landmark) {
    lines.push(`Landmark: ${data.landmark}`);
  }

  const locationLine = [data.city, data.state, data.postal_code]
    .filter(Boolean)
    .join(", ");

  if (locationLine) {
    lines.push(locationLine);
  }

  if (data.country) {
    lines.push(data.country);
  }

  if (phone) {
    lines.push(`Phone: ${phone}`);
  }

  return lines.length ? lines : ["Address not available"];
}

/*
|--------------------------------------------------------------------------
| Status Colors
|--------------------------------------------------------------------------
*/

function statusColors(status) {
  const value = String(status || "").toLowerCase();

  if (["paid", "delivered", "completed"].includes(value)) {
    return {
      background: COLORS.greenLight,

      foreground: COLORS.green,
    };
  }

  if (["cancelled", "failed", "refunded"].includes(value)) {
    return {
      background: COLORS.redLight,

      foreground: COLORS.red,
    };
  }

  return {
    background: COLORS.orangeLight,

    foreground: COLORS.orange,
  };
}

/*
|--------------------------------------------------------------------------
| Status Pill
|--------------------------------------------------------------------------
*/

function drawStatusPill(doc, status, x, y, width = 88) {
  const colors = statusColors(status);

  doc.roundedRect(x, y, width, 22, 11).fill(colors.background);

  doc
    .fillColor(colors.foreground)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(titleCase(status), x, y + 7, {
      width,
      align: "center",
    });
}

/*
|--------------------------------------------------------------------------
| Header
|--------------------------------------------------------------------------
*/

function drawHeader(doc, order) {
  const left = 42;

  const right = doc.page.width - 42;

  /*
  |--------------------------------------------------------------------------
  | Top Bar
  |--------------------------------------------------------------------------
  */

  doc.rect(0, 0, doc.page.width, 8).fill(COLORS.maroon);

  /*
  |--------------------------------------------------------------------------
  | BM Mark
  |--------------------------------------------------------------------------
  */

  doc
    .circle(left + 24, 56, 23)
    .lineWidth(1.5)
    .strokeColor(COLORS.gold)
    .stroke();

  doc
    .fillColor(COLORS.maroon)
    .font("Times-Bold")
    .fontSize(17)
    .text("BM", left + 6, 46, {
      width: 36,
      align: "center",
    });

  /*
  |--------------------------------------------------------------------------
  | Brand
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Times-Bold")
    .fontSize(22)
    .text("BanglesMart", left + 58, 36);

  doc
    .fillColor(COLORS.gold)
    .font("Helvetica-Bold")
    .fontSize(6.8)
    .text("BEAUTY  •  STYLE  •  TRADITION", left + 59, 65, {
      characterSpacing: 1.1,
    });

  /*
  |--------------------------------------------------------------------------
  | Company Info
  |--------------------------------------------------------------------------
  */

  const companyInfo = [
    process.env.INVOICE_COMPANY_ADDRESS,

    [process.env.INVOICE_COMPANY_PHONE, process.env.INVOICE_COMPANY_EMAIL]
      .filter(Boolean)
      .join("  |  "),

    process.env.INVOICE_GSTIN ? `GSTIN: ${process.env.INVOICE_GSTIN}` : "",
  ].filter(Boolean);

  if (companyInfo.length) {
    doc
      .fillColor(COLORS.gray)
      .font("Helvetica")
      .fontSize(7.3)
      .text(companyInfo.join("\n"), left + 59, 78, {
        width: 245,
        lineGap: 2,
      });
  }

  /*
  |--------------------------------------------------------------------------
  | Invoice
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Helvetica-Bold")
    .fontSize(27)
    .text("INVOICE", right - 190, 33, {
      width: 190,
      align: "right",
    });

  /*
  |--------------------------------------------------------------------------
  | Invoice Number
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica")
    .fontSize(8)
    .text("Invoice No.", right - 190, 75, {
      width: 90,
      align: "right",
    });

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .text(order.order_number || `#${order.id}`, right - 95, 75, {
      width: 95,
      align: "right",
    });

  /*
  |--------------------------------------------------------------------------
  | Invoice Date
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica")
    .text("Invoice Date", right - 190, 93, {
      width: 90,
      align: "right",
    });

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .text(formatDate(order.created_at), right - 95, 93, {
      width: 95,
      align: "right",
    });

  /*
  |--------------------------------------------------------------------------
  | Admin Copy
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gold)
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .text("ADMIN COPY", right - 95, 111, {
      width: 95,
      align: "right",
      characterSpacing: 1,
    });

  /*
  |--------------------------------------------------------------------------
  | Divider
  |--------------------------------------------------------------------------
  */

  doc
    .moveTo(left, 128)
    .lineTo(right, 128)
    .strokeColor(COLORS.border)
    .lineWidth(0.7)
    .stroke();

  return 145;
}

/*
|--------------------------------------------------------------------------
| Order Meta
|--------------------------------------------------------------------------
*/

function drawOrderMeta(doc, order, y) {
  const left = 42;

  const width = doc.page.width - 84;

  doc
    .roundedRect(left, y, width, 58, 8)
    .fillAndStroke(COLORS.lightGray, COLORS.border);

  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("ORDER STATUS", left + 15, y + 11);

  drawStatusPill(doc, order.status || "pending", left + 15, y + 27, 82);

  /*
  |--------------------------------------------------------------------------
  | Payment Method
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("PAYMENT METHOD", left + 125, y + 11);

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(titleCase(order.payment_method || "cod"), left + 125, y + 32);

  /*
  |--------------------------------------------------------------------------
  | Payment Status
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("PAYMENT STATUS", left + 260, y + 11);

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(titleCase(order.payment_status || "pending"), left + 260, y + 32);

  /*
  |--------------------------------------------------------------------------
  | Created
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("ORDERED ON", left + 390, y + 11);

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(formatDateTime(order.created_at), left + 390, y + 30, {
      width: 105,
    });

  return y + 75;
}

/*
|--------------------------------------------------------------------------
| Address Card
|--------------------------------------------------------------------------
*/

function drawAddressCard(doc, x, y, width, title, lines) {
  const height = 116;

  doc
    .roundedRect(x, y, width, height, 8)
    .fillAndStroke(COLORS.white, COLORS.border);

  doc.roundedRect(x, y, 5, height, 2).fill(COLORS.gold);

  doc
    .fillColor(COLORS.gold)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(title.toUpperCase(), x + 17, y + 14, {
      characterSpacing: 1,
    });

  doc
    .fillColor(COLORS.black)
    .font("Helvetica")
    .fontSize(8.5)
    .text(lines.join("\n"), x + 17, y + 34, {
      width: width - 32,

      height: 68,

      lineGap: 2,

      ellipsis: true,
    });

  return height;
}

/*
|--------------------------------------------------------------------------
| Addresses
|--------------------------------------------------------------------------
*/

function drawAddresses(doc, order, y) {
  const shipping = parseAddress(order.shipping_address);

  const billing = order.billing_address
    ? parseAddress(order.billing_address)
    : shipping;

  const customer = {
    name: order.customer_name,

    phone: order.customer_phone,
  };

  const left = 42;

  const gap = 12;

  const totalWidth = doc.page.width - 84;

  const cardWidth = (totalWidth - gap) / 2;

  drawAddressCard(
    doc,
    left,
    y,
    cardWidth,
    "Bill To",
    buildAddressLines(billing, customer),
  );

  drawAddressCard(
    doc,
    left + cardWidth + gap,
    y,
    cardWidth,
    "Ship To",
    buildAddressLines(shipping, customer),
  );

  return y + 136;
}

/*
|--------------------------------------------------------------------------
| Table
|--------------------------------------------------------------------------
*/

const TABLE = {
  productX: 42,
  productWidth: 264,

  qtyX: 306,
  qtyWidth: 48,

  priceX: 354,
  priceWidth: 96,

  amountX: 450,
  amountWidth: 103,
};

/*
|--------------------------------------------------------------------------
| Table Header
|--------------------------------------------------------------------------
*/

function drawTableHeader(doc, y) {
  doc.roundedRect(42, y, 511, 30, 5).fill(COLORS.maroon);

  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(7.5);

  doc.text("PRODUCT DETAILS", TABLE.productX + 10, y + 11, {
    width: TABLE.productWidth - 20,
  });

  doc.text("QTY", TABLE.qtyX, y + 11, {
    width: TABLE.qtyWidth,
    align: "center",
  });

  doc.text("UNIT PRICE", TABLE.priceX, y + 11, {
    width: TABLE.priceWidth - 8,
    align: "right",
  });

  doc.text("AMOUNT", TABLE.amountX, y + 11, {
    width: TABLE.amountWidth - 8,
    align: "right",
  });

  return y + 30;
}

/*
|--------------------------------------------------------------------------
| Product Meta
|--------------------------------------------------------------------------
*/

function productMeta(item) {
  return [
    item.variant_sku ? `SKU: ${item.variant_sku}` : "",

    item.size_name ? `Size: ${item.size_name}` : "",

    item.color_name ? `Color: ${item.color_name}` : "",

    item.design_name ? `Design: ${item.design_name}` : "",
  ]
    .filter(Boolean)
    .join("  |  ");
}

/*
|--------------------------------------------------------------------------
| Row Height
|--------------------------------------------------------------------------
*/

function getRowHeight(doc, item) {
  const titleHeight = doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .heightOfString(item.product_name || "Product", {
      width: TABLE.productWidth - 20,
    });

  const meta = productMeta(item);

  const metaHeight = meta
    ? doc
        .font("Helvetica")
        .fontSize(7.2)
        .heightOfString(meta, {
          width: TABLE.productWidth - 20,
        })
    : 0;

  return Math.max(
    52,

    18 + titleHeight + metaHeight + 10,
  );
}

/*
|--------------------------------------------------------------------------
| Item Row
|--------------------------------------------------------------------------
*/

function drawItemRow(doc, item, y, index) {
  const height = getRowHeight(doc, item);

  /*
  |--------------------------------------------------------------------------
  | Alternate Background
  |--------------------------------------------------------------------------
  */

  if (index % 2 === 1) {
    doc.rect(42, y, 511, height).fill("#FCFBF9");
  }

  /*
  |--------------------------------------------------------------------------
  | Product Name
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(item.product_name || "Product", TABLE.productX + 10, y + 11, {
      width: TABLE.productWidth - 20,
    });

  /*
  |--------------------------------------------------------------------------
  | Meta
  |--------------------------------------------------------------------------
  */

  const meta = productMeta(item);

  if (meta) {
    doc
      .fillColor(COLORS.gray)
      .font("Helvetica")
      .fontSize(7.2)
      .text(meta, TABLE.productX + 10, y + 30, {
        width: TABLE.productWidth - 20,

        lineGap: 2,
      });
  }

  /*
  |--------------------------------------------------------------------------
  | Quantity
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.black)
    .font("Helvetica")
    .fontSize(8.5)
    .text(String(num(item.quantity)), TABLE.qtyX, y + 16, {
      width: TABLE.qtyWidth,
      align: "center",
    });

  /*
  |--------------------------------------------------------------------------
  | Price
  |--------------------------------------------------------------------------
  */

  doc.text(money(item.price), TABLE.priceX, y + 16, {
    width: TABLE.priceWidth - 8,

    align: "right",
  });

  /*
  |--------------------------------------------------------------------------
  | Amount
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Helvetica-Bold")
    .text(money(item.line_total), TABLE.amountX, y + 16, {
      width: TABLE.amountWidth - 8,

      align: "right",
    });

  /*
  |--------------------------------------------------------------------------
  | Border
  |--------------------------------------------------------------------------
  */

  doc
    .moveTo(42, y + height)
    .lineTo(553, y + height)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();

  return y + height;
}

/*
|--------------------------------------------------------------------------
| Continued Page
|--------------------------------------------------------------------------
*/

function drawContinuedHeader(doc, order) {
  doc.rect(0, 0, doc.page.width, 7).fill(COLORS.maroon);

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Times-Bold")
    .fontSize(17)
    .text("BanglesMart", 42, 34);

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica")
    .fontSize(8)
    .text(`Invoice ${order.order_number} - Continued`, 310, 39, {
      width: 243,
      align: "right",
    });

  doc
    .moveTo(42, 67)
    .lineTo(553, 67)
    .strokeColor(COLORS.border)
    .lineWidth(0.6)
    .stroke();

  return drawTableHeader(doc, 84);
}

/*
|--------------------------------------------------------------------------
| Totals
|--------------------------------------------------------------------------
*/

function drawTotals(doc, order, y) {
  const width = 240;

  const x = 553 - width;

  const rows = [
    ["Subtotal", money(order.subtotal)],

    [
      "Shipping",
      num(order.shipping_amount) === 0 ? "FREE" : money(order.shipping_amount),
    ],
  ];

  if (num(order.discount_amount) > 0) {
    rows.push(["Discount", `- ${money(order.discount_amount)}`]);
  }

  if (order.coupon_code) {
    rows.push(["Coupon", order.coupon_code]);
  }

  const height = 74 + rows.length * 23;

  doc
    .roundedRect(x, y, width, height, 9)
    .fillAndStroke(COLORS.goldLight, COLORS.border);

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Order Summary", x + 15, y + 15);

  let rowY = y + 42;

  for (const [label, value] of rows) {
    doc
      .fillColor(COLORS.gray)
      .font("Helvetica")
      .fontSize(8.5)
      .text(label, x + 15, rowY, {
        width: 100,
      });

    doc
      .fillColor(label === "Discount" ? COLORS.green : COLORS.black)
      .font(label === "Coupon" ? "Helvetica-Bold" : "Helvetica")
      .text(value, x + 112, rowY, {
        width: width - 127,
        align: "right",
      });

    rowY += 23;
  }

  doc
    .moveTo(x + 15, rowY + 2)
    .lineTo(x + width - 15, rowY + 2)
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .stroke();

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("GRAND TOTAL", x + 15, rowY + 17);

  doc
    .fillColor(COLORS.maroon)
    .fontSize(12)
    .text(money(order.total_amount), x + 110, rowY + 15, {
      width: width - 125,

      align: "right",
    });

  return y + height;
}

/*
|--------------------------------------------------------------------------
| Internal/Admin Info
|--------------------------------------------------------------------------
*/

function drawAdminInfo(doc, order, y) {
  const left = 42;

  doc
    .fillColor(COLORS.gold)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("ADMIN / ORDER INFORMATION", left, y, {
      characterSpacing: 1,
    });

  const info = [
    `Order ID: ${order.id}`,

    `Customer ID: ${order.user_id}`,

    `Order Status: ${titleCase(order.status)}`,

    `Payment Status: ${titleCase(order.payment_status)}`,

    order.tracking_number ? `Tracking: ${order.tracking_number}` : "",

    order.courier_name ? `Courier: ${order.courier_name}` : "",
  ].filter(Boolean);

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica")
    .fontSize(8)
    .text(info.join("\n"), left, y + 16, {
      width: 245,
      lineGap: 3,
    });

  /*
  |--------------------------------------------------------------------------
  | Customer Note
  |--------------------------------------------------------------------------
  */

  if (order.customer_note) {
    doc
      .fillColor(COLORS.gold)
      .font("Helvetica-Bold")
      .fontSize(7)
      .text("CUSTOMER NOTE", 310, y, {
        width: 243,
        characterSpacing: 1,
      });

    doc
      .fillColor(COLORS.gray)
      .font("Helvetica")
      .fontSize(8)
      .text(order.customer_note, 310, y + 16, {
        width: 243,
        lineGap: 3,
      });
  } else {
    doc
      .fillColor(COLORS.gold)
      .font("Helvetica-Bold")
      .fontSize(7)
      .text("INVOICE NOTE", 310, y, {
        width: 243,
        characterSpacing: 1,
      });

    doc
      .fillColor(COLORS.gray)
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This is a computer-generated administrative invoice.",
        310,
        y + 16,
        {
          width: 243,
        },
      );
  }
}

/*
|--------------------------------------------------------------------------
| Page Footer
|--------------------------------------------------------------------------
|
| Kept safely inside printable area.
| This avoids PDFKit generating extra blank pages.
|
|--------------------------------------------------------------------------
*/

function addPageNumbers(doc, order) {
  const range = doc.bufferedPageRange();

  const totalPages = range.count;

  for (let i = 0; i < totalPages; i += 1) {
    doc.switchToPage(range.start + i);

    const footerY = doc.page.height - doc.page.margins.bottom - 18;

    const dividerY = footerY - 9;

    doc
      .moveTo(42, dividerY)
      .lineTo(553, dividerY)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(COLORS.gray)
      .font("Helvetica")
      .fontSize(6.5)
      .text("BanglesMart Admin Invoice", 42, footerY, {
        width: 250,
        height: 10,
        lineBreak: false,
      });

    doc.text(
      `${order.order_number}  |  Page ${i + 1} of ${totalPages}`,
      310,
      footerY,
      {
        width: 243,
        height: 10,
        align: "right",
        lineBreak: false,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| DOWNLOAD ADMIN INVOICE
|--------------------------------------------------------------------------
|
| Keep export name exactly:
|
| download
|
|--------------------------------------------------------------------------
*/

export async function download(req, res) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Order
    |--------------------------------------------------------------------------
    |
    | Admin is allowed to download any order.
    |
    */

    const o = (
      await query(
        `
          SELECT

            o.*,

            u.name
              AS customer_name,

            u.email
              AS customer_email,

            u.phone
              AS customer_phone


          FROM orders o


          INNER JOIN users u
            ON u.id =
               o.user_id


          WHERE
            o.id = ?


          LIMIT 1
        `,
        [req.params.id],
      )
    )[0];

    /*
    |--------------------------------------------------------------------------
    | Not Found
    |--------------------------------------------------------------------------
    */

    if (!o) {
      return res.status(404).json({
        success: false,

        message: "Order not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Items
    |--------------------------------------------------------------------------
    */

    const items = await query(
      `
          SELECT

            id,

            product_id,

            product_variant_id,

            design_option_id,

            product_name,

            variant_sku,

            size_name,

            color_name,

            design_name,

            image,

            mrp,

            price,

            quantity,

            line_total,

            created_at


          FROM order_items


          WHERE
            order_id = ?


          ORDER BY
            id ASC
        `,
      [o.id],
    );

    /*
    |--------------------------------------------------------------------------
    | Safe Filename
    |--------------------------------------------------------------------------
    */

    const safeName = String(o.order_number || `invoice-${o.id}`).replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="BanglesMart-Admin-${safeName}.pdf"`,
    );

    res.setHeader("Cache-Control", "private, no-store");

    /*
    |--------------------------------------------------------------------------
    | PDF
    |--------------------------------------------------------------------------
    */

    const doc = new PDFDocument({
      size: "A4",

      margins: {
        top: 42,
        right: 42,
        bottom: 42,
        left: 42,
      },

      bufferPages: true,

      info: {
        Title: `Admin Invoice ${o.order_number}`,

        Author: "BanglesMart",

        Subject: `Admin Order Invoice ${o.order_number}`,

        Creator: "BanglesMart Admin",
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Pipe
    |--------------------------------------------------------------------------
    */

    doc.pipe(res);

    /*
    |--------------------------------------------------------------------------
    | Header
    |--------------------------------------------------------------------------
    */

    let y = drawHeader(doc, o);

    /*
    |--------------------------------------------------------------------------
    | Order Meta
    |--------------------------------------------------------------------------
    */

    y = drawOrderMeta(doc, o, y);

    /*
    |--------------------------------------------------------------------------
    | Addresses
    |--------------------------------------------------------------------------
    */

    y = drawAddresses(doc, o, y);

    /*
    |--------------------------------------------------------------------------
    | Order Details Heading
    |--------------------------------------------------------------------------
    */

    doc
      .fillColor(COLORS.darkMaroon)
      .font("Times-Bold")
      .fontSize(14)
      .text("Order Details", 42, y);

    doc
      .fillColor(COLORS.gray)
      .font("Helvetica")
      .fontSize(7.5)
      .text(
        `${items.length} item${items.length === 1 ? "" : "s"}`,
        450,
        y + 3,
        {
          width: 103,
          align: "right",
        },
      );

    y += 24;

    /*
    |--------------------------------------------------------------------------
    | Table Header
    |--------------------------------------------------------------------------
    */

    y = drawTableHeader(doc, y);

    /*
    |--------------------------------------------------------------------------
    | Rows
    |--------------------------------------------------------------------------
    */

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];

      const rowHeight = getRowHeight(doc, item);

      if (y + rowHeight > 735) {
        doc.addPage();

        y = drawContinuedHeader(doc, o);
      }

      y = drawItemRow(doc, item, y, index);
    }

    y += 20;

    /*
    |--------------------------------------------------------------------------
    | Totals Space
    |--------------------------------------------------------------------------
    */

    if (y + 195 > 750) {
      doc.addPage();

      y = drawContinuedHeader(doc, o);

      y += 6;
    }

    /*
    |--------------------------------------------------------------------------
    | Totals
    |--------------------------------------------------------------------------
    */

    y = drawTotals(doc, o, y);

    y += 25;

    /*
    |--------------------------------------------------------------------------
    | Admin Info Space
    |--------------------------------------------------------------------------
    */

    if (y + 85 > 755) {
      doc.addPage();

      y = 90;
    }

    /*
    |--------------------------------------------------------------------------
    | Admin Info
    |--------------------------------------------------------------------------
    */

    drawAdminInfo(doc, o, y);

    /*
    |--------------------------------------------------------------------------
    | Footer
    |--------------------------------------------------------------------------
    */

    addPageNumbers(doc, o);

    /*
    |--------------------------------------------------------------------------
    | Finish
    |--------------------------------------------------------------------------
    */

    doc.end();
  } catch (error) {
    console.error("Admin invoice generation error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,

        message: "Unable to generate invoice.",
      });
    }

    return res.end();
  }
}
