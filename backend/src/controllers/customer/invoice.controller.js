import PDFDocument from "pdfkit";
import { query } from "../../db.js";

/*
|--------------------------------------------------------------------------
| BanglesMart Invoice Theme
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
| Using INR instead of ₹ because PDFKit's built-in Helvetica font may render
| the Rupee symbol incorrectly on some systems.
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
| Format Date
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
| Format Date + Time
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
| Build Address Lines
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
| Draw Status Pill
|--------------------------------------------------------------------------
*/

function drawStatusPill(doc, status, x, y, width = 90) {
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
| Brand Header
|--------------------------------------------------------------------------
*/

function drawBrandHeader(doc, order) {
  const left = 42;

  const right = doc.page.width - 42;

  /*
  |--------------------------------------------------------------------------
  | Top Premium Bar
  |--------------------------------------------------------------------------
  */

  doc.rect(0, 0, doc.page.width, 8).fill(COLORS.maroon);

  /*
  |--------------------------------------------------------------------------
  | Monogram
  |--------------------------------------------------------------------------
  */

  doc
    .circle(left + 24, 57, 23)
    .lineWidth(1.5)
    .strokeColor(COLORS.gold)
    .stroke();

  doc
    .fillColor(COLORS.maroon)
    .font("Times-Bold")
    .fontSize(17)
    .text("BM", left + 6, 47, {
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
    .text("BanglesMart", left + 58, 37, {
      width: 220,
    });

  doc
    .fillColor(COLORS.gold)
    .font("Helvetica-Bold")
    .fontSize(6.8)
    .text("BEAUTY  •  STYLE  •  TRADITION", left + 59, 66, {
      characterSpacing: 1.1,
    });

  /*
  |--------------------------------------------------------------------------
  | Optional Company Information
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
      .fontSize(7.5)
      .text(companyInfo.join("\n"), left + 59, 79, {
        width: 240,
        lineGap: 2,
      });
  }

  /*
  |--------------------------------------------------------------------------
  | INVOICE Title
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Helvetica-Bold")
    .fontSize(27)
    .text("INVOICE", right - 190, 34, {
      width: 190,
      align: "right",
    });

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica")
    .fontSize(8)
    .text("Order Number", right - 190, 76, {
      width: 90,
      align: "right",
    });

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .text(order.order_number || `#${order.id}`, right - 94, 76, {
      width: 94,
      align: "right",
    });

  /*
  |--------------------------------------------------------------------------
  | Date
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica")
    .text("Invoice Date", right - 190, 94, {
      width: 90,
      align: "right",
    });

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .text(formatDate(order.created_at), right - 94, 94, {
      width: 94,
      align: "right",
    });

  /*
  |--------------------------------------------------------------------------
  | Divider
  |--------------------------------------------------------------------------
  */

  doc
    .moveTo(left, 126)
    .lineTo(right, 126)
    .lineWidth(0.7)
    .strokeColor(COLORS.border)
    .stroke();

  return 143;
}

/*
|--------------------------------------------------------------------------
| Draw Order Information
|--------------------------------------------------------------------------
*/

function drawOrderInformation(doc, order, y) {
  const left = 42;

  const width = doc.page.width - 84;

  /*
  |--------------------------------------------------------------------------
  | Background
  |--------------------------------------------------------------------------
  */

  doc
    .roundedRect(left, y, width, 55, 8)
    .fillAndStroke(COLORS.lightGray, COLORS.border);

  /*
  |--------------------------------------------------------------------------
  | Order Status
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("ORDER STATUS", left + 15, y + 12);

  drawStatusPill(doc, order.status || "pending", left + 15, y + 26, 82);

  /*
  |--------------------------------------------------------------------------
  | Payment
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("PAYMENT", left + 126, y + 12);

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(titleCase(order.payment_method || "cod"), left + 126, y + 31);

  /*
  |--------------------------------------------------------------------------
  | Payment Status
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("PAYMENT STATUS", left + 250, y + 12);

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(titleCase(order.payment_status || "pending"), left + 250, y + 31);

  /*
  |--------------------------------------------------------------------------
  | Order Date
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("ORDERED ON", left + 380, y + 12);

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(formatDateTime(order.created_at), left + 380, y + 31, {
      width: 120,
    });

  return y + 72;
}

/*
|--------------------------------------------------------------------------
| Draw Address Card
|--------------------------------------------------------------------------
*/

function drawAddressCard(doc, x, y, width, title, addressLines) {
  const height = 118;

  doc
    .roundedRect(x, y, width, height, 8)
    .fillAndStroke(COLORS.white, COLORS.border);

  /*
  |--------------------------------------------------------------------------
  | Accent
  |--------------------------------------------------------------------------
  */

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
    .text(addressLines.join("\n"), x + 17, y + 34, {
      width: width - 32,

      height: 72,

      lineGap: 2,

      ellipsis: true,
    });

  return height;
}

/*
|--------------------------------------------------------------------------
| Draw Addresses
|--------------------------------------------------------------------------
*/

function drawAddresses(doc, order, y) {
  const shippingAddress = parseAddress(order.shipping_address);

  const billingAddress = order.billing_address
    ? parseAddress(order.billing_address)
    : shippingAddress;

  const customer = {
    name: order.customer_name || "",

    phone: order.customer_phone || "",
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
    buildAddressLines(billingAddress, customer),
  );

  drawAddressCard(
    doc,
    left + cardWidth + gap,
    y,
    cardWidth,
    "Ship To",
    buildAddressLines(shippingAddress, customer),
  );

  return y + 138;
}

/*
|--------------------------------------------------------------------------
| Table Configuration
|--------------------------------------------------------------------------
*/

const TABLE = {
  productX: 42,
  productWidth: 265,

  qtyX: 307,
  qtyWidth: 48,

  priceX: 355,
  priceWidth: 95,

  amountX: 450,
  amountWidth: 103,
};

/*
|--------------------------------------------------------------------------
| Draw Table Header
|--------------------------------------------------------------------------
*/

function drawTableHeader(doc, y) {
  doc.roundedRect(42, y, 511, 30, 5).fill(COLORS.maroon);

  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(7.5);

  doc.text("PRODUCT", TABLE.productX + 10, y + 11, {
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
| Product Details
|--------------------------------------------------------------------------
*/

function productMeta(item) {
  const values = [];

  if (item.variant_sku) {
    values.push(`SKU: ${item.variant_sku}`);
  }

  if (item.size_name) {
    values.push(`Size: ${item.size_name}`);
  }

  if (item.color_name) {
    values.push(`Color: ${item.color_name}`);
  }

  if (item.design_name) {
    values.push(`Design: ${item.design_name}`);
  }

  return values.join("  |  ");
}

/*
|--------------------------------------------------------------------------
| Row Height
|--------------------------------------------------------------------------
*/

function getRowHeight(doc, item) {
  const productName = String(item.product_name || "Product");

  const meta = productMeta(item);

  const titleHeight = doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .heightOfString(productName, {
      width: TABLE.productWidth - 20,
    });

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
| Draw Item Row
|--------------------------------------------------------------------------
*/

function drawItemRow(doc, item, y, index) {
  const height = getRowHeight(doc, item);

  /*
  |--------------------------------------------------------------------------
  | Alternate Row
  |--------------------------------------------------------------------------
  */

  if (index % 2 === 1) {
    doc.rect(42, y, 511, height).fill("#FCFBF9");
  }

  /*
  |--------------------------------------------------------------------------
  | Product
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.black)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(item.product_name || "Product", TABLE.productX + 10, y + 11, {
      width: TABLE.productWidth - 20,
    });

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
  | Unit Price
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.black)
    .font("Helvetica")
    .fontSize(8.5)
    .text(money(item.price), TABLE.priceX, y + 16, {
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
    .fontSize(8.5)
    .text(money(item.line_total), TABLE.amountX, y + 16, {
      width: TABLE.amountWidth - 8,

      align: "right",
    });

  /*
  |--------------------------------------------------------------------------
  | Bottom Border
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
| Continued Page Header
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
    .text(`Invoice ${order.order_number} - Continued`, 315, 39, {
      width: 238,
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
| Totals Card
|--------------------------------------------------------------------------
*/

function drawTotals(doc, order, y) {
  const width = 240;

  const x = 553 - width;

  const hasDiscount = num(order.discount_amount) > 0;

  const hasCoupon = Boolean(order.coupon_code);

  let height = 130;

  if (hasDiscount) {
    height += 23;
  }

  if (hasCoupon) {
    height += 23;
  }

  /*
  |--------------------------------------------------------------------------
  | Card
  |--------------------------------------------------------------------------
  */

  doc
    .roundedRect(x, y, width, height, 9)
    .fillAndStroke(COLORS.goldLight, COLORS.border);

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Order Summary", x + 15, y + 15);

  let rowY = y + 42;

  function totalRow(label, value, options = {}) {
    doc
      .fillColor(options.labelColor || COLORS.gray)
      .font("Helvetica")
      .fontSize(8.5)
      .text(label, x + 15, rowY, {
        width: 100,
      });

    doc
      .fillColor(options.valueColor || COLORS.black)
      .font(options.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(8.5)
      .text(value, x + 112, rowY, {
        width: width - 127,

        align: "right",
      });

    rowY += 23;
  }

  /*
  |--------------------------------------------------------------------------
  | Subtotal
  |--------------------------------------------------------------------------
  */

  totalRow("Subtotal", money(order.subtotal));

  /*
  |--------------------------------------------------------------------------
  | Shipping
  |--------------------------------------------------------------------------
  */

  totalRow(
    "Shipping",
    num(order.shipping_amount) === 0 ? "FREE" : money(order.shipping_amount),
    {
      valueColor:
        num(order.shipping_amount) === 0 ? COLORS.green : COLORS.black,
    },
  );

  /*
  |--------------------------------------------------------------------------
  | Discount
  |--------------------------------------------------------------------------
  */

  if (hasDiscount) {
    totalRow("Discount", `- ${money(order.discount_amount)}`, {
      valueColor: COLORS.green,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Coupon
  |--------------------------------------------------------------------------
  */

  if (hasCoupon) {
    totalRow(`Coupon`, order.coupon_code, {
      valueColor: COLORS.maroon,
      bold: true,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Divider
  |--------------------------------------------------------------------------
  */

  doc
    .moveTo(x + 15, rowY + 2)
    .lineTo(x + width - 15, rowY + 2)
    .lineWidth(0.8)
    .strokeColor(COLORS.border)
    .stroke();

  /*
  |--------------------------------------------------------------------------
  | Grand Total
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("GRAND TOTAL", x + 15, rowY + 17, {
      width: 100,
    });

  doc
    .fillColor(COLORS.maroon)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(money(order.total_amount), x + 110, rowY + 15, {
      width: width - 125,

      align: "right",
    });

  return y + height;
}

/*
|--------------------------------------------------------------------------
| Footer / Thank You
|--------------------------------------------------------------------------
*/

function drawThankYou(doc, order, y) {
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
      .text("CUSTOMER NOTE", 42, y, {
        characterSpacing: 1,
      });

    doc
      .fillColor(COLORS.gray)
      .font("Helvetica")
      .fontSize(8)
      .text(order.customer_note, 42, y + 16, {
        width: 250,
        lineGap: 2,
      });
  }

  /*
  |--------------------------------------------------------------------------
  | Thank You
  |--------------------------------------------------------------------------
  */

  doc
    .fillColor(COLORS.gold)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("THANK YOU", 310, y, {
      width: 243,

      characterSpacing: 1,
    });

  doc
    .fillColor(COLORS.darkMaroon)
    .font("Times-Bold")
    .fontSize(12)
    .text("Thank you for shopping with BanglesMart.", 310, y + 16, {
      width: 243,
    });

  doc
    .fillColor(COLORS.gray)
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      "We hope your purchase adds a little more beauty to every celebration.",
      310,
      y + 36,
      {
        width: 243,
        lineGap: 2,
      },
    );
}

/*
|--------------------------------------------------------------------------
| Add Page Numbers
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Add Page Numbers
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Footer stays INSIDE the printable area.
| This prevents PDFKit from automatically creating blank pages.
|
|--------------------------------------------------------------------------
*/

function addPageNumbers(
  doc,
  order,
) {
  const range =
    doc.bufferedPageRange();

  const totalPages =
    range.count;

  for (
    let i = 0;
    i < totalPages;
    i += 1
  ) {
    doc.switchToPage(
      range.start + i,
    );

    /*
    |--------------------------------------------------------------------------
    | Safe Footer Position
    |--------------------------------------------------------------------------
    |
    | A4 height ≈ 842
    |
    | With bottom margin = 42,
    | printable content ends around 800.
    |
    | Footer is kept safely ABOVE that.
    |
    */

    const footerY =
      doc.page.height -
      doc.page.margins.bottom -
      18;

    const dividerY =
      footerY - 9;

    /*
    |--------------------------------------------------------------------------
    | Divider
    |--------------------------------------------------------------------------
    */

    doc
      .moveTo(
        42,
        dividerY,
      )
      .lineTo(
        553,
        dividerY,
      )
      .lineWidth(0.5)
      .strokeColor(
        COLORS.border,
      )
      .stroke();

    /*
    |--------------------------------------------------------------------------
    | Left Footer
    |--------------------------------------------------------------------------
    */

    doc
      .fillColor(
        COLORS.gray,
      )
      .font(
        "Helvetica",
      )
      .fontSize(6.5)
      .text(
        "This is a computer-generated invoice.",
        42,
        footerY,
        {
          width: 270,

          height: 10,

          lineBreak: false,
        },
      );

    /*
    |--------------------------------------------------------------------------
    | Page Number
    |--------------------------------------------------------------------------
    */

    doc
      .fillColor(
        COLORS.gray,
      )
      .font(
        "Helvetica",
      )
      .fontSize(6.5)
      .text(
        `${order.order_number}  |  Page ${
          i + 1
        } of ${totalPages}`,
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
| DOWNLOAD INVOICE
|--------------------------------------------------------------------------
|
| Keep export name exactly:
|
| download
|
| So your existing customer.routes.js does not need to change.
|
|--------------------------------------------------------------------------
*/

export async function download(req, res) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Order
    |--------------------------------------------------------------------------
    */

    const order = (
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


          LEFT JOIN users u
            ON u.id =
               o.user_id


          WHERE
            o.id = ?

            AND
            o.user_id = ?


          LIMIT 1
        `,
        [req.params.id, req.user.id],
      )
    )[0];

    /*
    |--------------------------------------------------------------------------
    | Not Found
    |--------------------------------------------------------------------------
    */

    if (!order) {
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
      [order.id],
    );

    /*
    |--------------------------------------------------------------------------
    | Safe File Name
    |--------------------------------------------------------------------------
    */

    const filename = String(
      order.order_number || `invoice-${order.id}`,
    ).replace(/[^a-zA-Z0-9-_]/g, "-");

    /*
    |--------------------------------------------------------------------------
    | Headers
    |--------------------------------------------------------------------------
    */

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="BanglesMart-${filename}.pdf"`,
    );

    res.setHeader("Cache-Control", "private, no-store");

    /*
    |--------------------------------------------------------------------------
    | PDF
    |--------------------------------------------------------------------------
    */

    const doc =
  new PDFDocument({
    size: "A4",

    margins: {
      top: 42,
      right: 42,
      bottom: 42,
      left: 42,
    },

    bufferPages: true,

    autoFirstPage: true,

    info: {
      Title:
        `Invoice ${order.order_number}`,

      Author:
        "BanglesMart",

      Subject:
        `Order ${order.order_number}`,

      Creator:
        "BanglesMart",
    },
  });

    /*
    |--------------------------------------------------------------------------
    | Stream PDF
    |--------------------------------------------------------------------------
    */

    doc.pipe(res);

    /*
    |--------------------------------------------------------------------------
    | Header
    |--------------------------------------------------------------------------
    */

    let y = drawBrandHeader(doc, order);

    /*
    |--------------------------------------------------------------------------
    | Order Information
    |--------------------------------------------------------------------------
    */

    y = drawOrderInformation(doc, order, y);

    /*
    |--------------------------------------------------------------------------
    | Address
    |--------------------------------------------------------------------------
    */

    y = drawAddresses(doc, order, y);

    /*
    |--------------------------------------------------------------------------
    | Items Heading
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
    | Product Rows
    |--------------------------------------------------------------------------
    */

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];

      const rowHeight = getRowHeight(doc, item);

      /*
      |--------------------------------------------------------------------------
      | Page Break
      |--------------------------------------------------------------------------
      */

      if (y + rowHeight > 735) {
        doc.addPage();

        y = drawContinuedHeader(doc, order);
      }

      y = drawItemRow(doc, item, y, index);
    }

    y += 20;

    /*
    |--------------------------------------------------------------------------
    | Totals Space
    |--------------------------------------------------------------------------
    */

    if (y + 205 > 750) {
      doc.addPage();

      y = drawContinuedHeader(doc, order);

      y += 5;
    }

    /*
    |--------------------------------------------------------------------------
    | Totals
    |--------------------------------------------------------------------------
    */

    y = drawTotals(doc, order, y);

    y += 26;

    /*
    |--------------------------------------------------------------------------
    | Thank You Space
    |--------------------------------------------------------------------------
    */

    if (y + 80 > 755) {
      doc.addPage();

      y = 90;
    }

    /*
    |--------------------------------------------------------------------------
    | Thank You / Notes
    |--------------------------------------------------------------------------
    */

    drawThankYou(doc, order, y);

    /*
    |--------------------------------------------------------------------------
    | Page Numbers
    |--------------------------------------------------------------------------
    */

    addPageNumbers(doc, order);

    /*
    |--------------------------------------------------------------------------
    | Finish
    |--------------------------------------------------------------------------
    */

    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,

        message: "Unable to generate invoice.",
      });
    }

    return res.end();
  }
}
