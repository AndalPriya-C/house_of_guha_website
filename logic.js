/* Pure business logic (no DOM) – cart maths, validation, WhatsApp message. */
(function (root) {
  "use strict";

  function weightLabel(cfg, weightId) {
    var w = cfg.WEIGHTS.filter(function (x) { return x.id === weightId; })[0];
    return w ? w.label : weightId;
  }

  function findProduct(cfg, productId) {
    return cfg.PRODUCTS.filter(function (p) { return p.id === productId; })[0] || null;
  }

  /* Returns a whole-rupee number, or null when the price is not configured. */
  function getUnitPrice(cfg, productId, weightId) {
    var p = findProduct(cfg, productId);
    if (!p || !p.prices) return null;
    var v = p.prices[weightId];
    return typeof v === "number" && isFinite(v) && v >= 0 ? Math.round(v) : null;
  }

  function formatINR(n) {
    return "\u20B9" + Math.round(n).toLocaleString("en-IN");
  }

  function lineKey(productId, weightId) { return productId + "|" + weightId; }

  /* Different weights of the same product are separate lines. */
  function addItem(cart, productId, weightId, qty) {
    qty = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
    var key = lineKey(productId, weightId);
    var next = cart.map(function (l) { return { productId: l.productId, weightId: l.weightId, qty: l.qty }; });
    var existing = next.filter(function (l) { return lineKey(l.productId, l.weightId) === key; })[0];
    if (existing) existing.qty = Math.min(99, existing.qty + qty);
    else next.push({ productId: productId, weightId: weightId, qty: qty });
    return next;
  }

  function setQty(cart, productId, weightId, qty) {
    var key = lineKey(productId, weightId);
    qty = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
    return cart.map(function (l) {
      return lineKey(l.productId, l.weightId) === key ? { productId: l.productId, weightId: l.weightId, qty: qty } : l;
    });
  }

  function removeItem(cart, productId, weightId) {
    var key = lineKey(productId, weightId);
    return cart.filter(function (l) { return lineKey(l.productId, l.weightId) !== key; });
  }

  function cartCount(cart) {
    return cart.reduce(function (n, l) { return n + l.qty; }, 0);
  }

  /* Detailed lines + bill. Lines whose price is missing are skipped from maths. */
  function computeBill(cfg, cart) {
    var lines = cart.map(function (l) {
      var p = findProduct(cfg, l.productId);
      var unit = getUnitPrice(cfg, l.productId, l.weightId);
      return {
        productId: l.productId, weightId: l.weightId, qty: l.qty,
        name: p ? p.name : l.productId, image: p ? p.image : "",
        weightLabel: weightLabel(cfg, l.weightId),
        unitPrice: unit,
        subtotal: unit === null ? 0 : unit * l.qty
      };
    });
    var subtotal = lines.reduce(function (s, l) { return s + l.subtotal; }, 0);
    var hasItems = lines.length > 0;
    var freeDelivery = hasItems && subtotal > cfg.DELIVERY.freeAbove;
    var delivery = !hasItems ? 0 : (freeDelivery ? 0 : cfg.DELIVERY.charge);
    return { lines: lines, subtotal: subtotal, delivery: delivery, freeDelivery: freeDelivery, total: subtotal + delivery };
  }

  /* Accepts 9876543210, +91 98765 43210, 91-9876543210, 09876543210. */
  function normalizeMobile(raw) {
    var d = String(raw || "").replace(/[\s\-().]/g, "");
    if (/^\+91/.test(d)) d = d.slice(3);
    else if (/^91\d{10}$/.test(d)) d = d.slice(2);
    else if (/^0\d{10}$/.test(d)) d = d.slice(1);
    return d;
  }

  function isValidIndianMobile(raw) {
    return /^[6-9]\d{9}$/.test(normalizeMobile(raw));
  }

  function validateOrderForm(v) {
    var errors = {};
    var name = (v.name || "").trim();
    var mobile = (v.mobile || "").trim();
    var address = (v.address || "").trim();
    if (!name) errors.name = "Please enter your full name.";
    else if (name.length < 2) errors.name = "Name looks too short.";
    if (!mobile) errors.mobile = "Please enter your mobile number.";
    else if (!isValidIndianMobile(mobile)) errors.mobile = "Enter a valid 10-digit Indian mobile number (starting with 6\u20139).";
    if (!address) errors.address = "Please enter your delivery address.";
    else if (address.length < 10) errors.address = "Please enter your complete delivery address.";
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function buildOrderMessage(cfg, cart, form) {
    var bill = computeBill(cfg, cart);
    var out = [];
    out.push("*New Order \u2013 " + cfg.BUSINESS_NAME + "*", "");
    out.push("*Customer Details*");
    out.push("Name: " + form.name.trim());
    out.push("Mobile Number: +91 " + normalizeMobile(form.mobile));
    out.push("Delivery Address: " + form.address.trim());
    out.push("Additional Instructions: " + ((form.notes || "").trim() || "None"), "");
    out.push("*Order Details*");
    bill.lines.forEach(function (l, i) {
      out.push((i + 1) + ". " + l.name);
      out.push("   Weight: " + l.weightLabel);
      out.push("   Quantity: " + l.qty);
      out.push("   Unit Price: " + formatINR(l.unitPrice));
      out.push("   Item Subtotal: " + formatINR(l.subtotal));
    });
    out.push("", "*Bill Summary*");
    out.push("Subtotal: " + formatINR(bill.subtotal));
    out.push("Delivery Charges: " + (bill.freeDelivery ? "FREE" : formatINR(bill.delivery)));
    out.push("*Final Total: " + formatINR(bill.total) + "*");
    return out.join("\n");
  }

  function isOwnerNumberConfigured(cfg) {
    return /^\d{10,15}$/.test(String(cfg.OWNER_WHATSAPP_NUMBER || ""));
  }

  function buildWhatsAppUrl(cfg, message) {
    return "https://wa.me/" + cfg.OWNER_WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  var api = {
    weightLabel: weightLabel, findProduct: findProduct, getUnitPrice: getUnitPrice, formatINR: formatINR,
    addItem: addItem, setQty: setQty, removeItem: removeItem, cartCount: cartCount, computeBill: computeBill,
    normalizeMobile: normalizeMobile, isValidIndianMobile: isValidIndianMobile, validateOrderForm: validateOrderForm,
    buildOrderMessage: buildOrderMessage, isOwnerNumberConfigured: isOwnerNumberConfigured, buildWhatsAppUrl: buildWhatsAppUrl
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MasalaLogic = api;
})(typeof window !== "undefined" ? window : this);
