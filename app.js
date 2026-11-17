/* UI layer. Cart & form data live only in memory (no storage, no network). */
(function () {
  "use strict";
  var cfg = window.SITE_CONFIG, L = window.MasalaLogic;
  var cart = [];
  var sel = {}; // per-product card selection { weight, qty }
  var lastFocus = null;

  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function icon(id, w, h) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("width", w); s.setAttribute("height", h);
    var u = document.createElementNS("http://www.w3.org/2000/svg", "use");
    u.setAttribute("href", "#" + id); s.appendChild(u); return s;
  }
  function img(src, alt) {
    var i = document.createElement("img");
    i.src = src; i.alt = alt || ""; i.loading = "lazy";
    i.onerror = function () { i.remove(); };
    return i;
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ---------- Product cards ---------- */
  function renderProducts() {
    var grid = $("#product-grid");
    cfg.PRODUCTS.forEach(function (p) {
      sel[p.id] = { weight: cfg.WEIGHTS[0].id, qty: 1 };
      var card = el("article", "card"); card.dataset.id = p.id;

      var top = el("div");
      var im = el("div", "card-img"); im.appendChild(img(p.image, p.name));
      im.appendChild(el("span", "card-tag", p.tag)); top.appendChild(im);
      top.appendChild(el("h3", "", p.name));
      top.appendChild(el("p", "card-desc", p.description));
      card.appendChild(top);

      var bottom = el("div");
      var weights = el("div", "weights"); weights.setAttribute("role", "group"); weights.setAttribute("aria-label", "Weight for " + p.name);
      cfg.WEIGHTS.forEach(function (w) {
        var b = el("button", "weight", w.label); b.type = "button"; b.dataset.weight = w.id;
        b.setAttribute("aria-pressed", w.id === sel[p.id].weight ? "true" : "false");
        b.addEventListener("click", function () { sel[p.id].weight = w.id; refreshCard(card, p); });
        weights.appendChild(b);
      });
      bottom.appendChild(weights);

      var row = el("div", "price-row");
      var pbox = el("div"); pbox.appendChild(el("span", "price-label", "Price")); pbox.appendChild(el("span", "price")); row.appendChild(pbox);
      var st = el("div", "stepper");
      var minus = el("button", "", "\u2212"); minus.type = "button"; minus.setAttribute("aria-label", "Decrease quantity of " + p.name);
      var out = el("output", "", "1"); out.setAttribute("aria-live", "polite");
      var plus = el("button", "", "+"); plus.type = "button"; plus.setAttribute("aria-label", "Increase quantity of " + p.name);
      minus.addEventListener("click", function () { sel[p.id].qty = Math.max(1, sel[p.id].qty - 1); refreshCard(card, p); });
      plus.addEventListener("click", function () { sel[p.id].qty = Math.min(99, sel[p.id].qty + 1); refreshCard(card, p); });
      st.appendChild(minus); st.appendChild(out); st.appendChild(plus); row.appendChild(st);
      bottom.appendChild(row);

      var add = el("button", "add-btn"); add.type = "button";
      add.appendChild(icon("i-bag", 12, 15)); add.appendChild(el("span", "", "Add to Cart"));
      add.addEventListener("click", function () {
        var s = sel[p.id];
        if (L.getUnitPrice(cfg, p.id, s.weight) === null) return;
        cart = L.addItem(cart, p.id, s.weight, s.qty);
        s.qty = 1; refreshCard(card, p); renderCart();
        var label = $("span", add); label.textContent = "Added \u2713"; add.classList.add("added");
        setTimeout(function () { label.textContent = "Add to Cart"; add.classList.remove("added"); }, 1200);
      });
      bottom.appendChild(add); card.appendChild(bottom);
      grid.appendChild(card); refreshCard(card, p);
    });
  }

  function refreshCard(card, p) {
    var s = sel[p.id];
    card.querySelectorAll(".weight").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.weight === s.weight ? "true" : "false"); });
    var price = L.getUnitPrice(cfg, p.id, s.weight);
    var pe = $(".price", card);
    pe.textContent = price === null ? "Price TBA" : L.formatINR(price);
    pe.classList.toggle("tba", price === null);
    $("output", card).textContent = s.qty;
    var btns = card.querySelectorAll(".stepper button");
    btns[0].disabled = s.qty <= 1; btns[1].disabled = s.qty >= 99;
    $(".add-btn", card).disabled = price === null;
  }

  /* ---------- Cart ---------- */
  function renderCart() {
    var bill = L.computeBill(cfg, cart);
    var list = $("#cart-items"); list.textContent = "";

    if (!bill.lines.length) {
      var e = el("div", "empty");
      var ic = el("span", "e-ic"); ic.appendChild(icon("i-cart", 24, 24)); e.appendChild(ic);
      e.appendChild(el("h3", "", "Your cart is empty"));
      e.appendChild(el("p", "", "Add your favourite masalas to see them here."));
      var a = el("a", "btn btn-primary", "Explore Our Masalas"); a.href = "#products"; e.appendChild(a);
      list.appendChild(e);
    }

    bill.lines.forEach(function (l) {
      var row = el("div", "cart-row");
      var prod = el("div", "cart-prod");
      var th = el("div", "cart-thumb"); th.appendChild(img(l.image, l.name)); prod.appendChild(th);
      var info = el("div"); info.appendChild(el("h4", "cart-name", l.name));
      var meta = el("div", "cart-meta"); meta.appendChild(el("span", "chip", l.weightLabel));
      meta.appendChild(el("span", "unit", L.formatINR(l.unitPrice) + " unit")); info.appendChild(meta);
      prod.appendChild(info); row.appendChild(prod);

      var ctrl = el("div", "cart-ctrl");
      var st = el("div", "stepper");
      var m = el("button", "", "\u2212"); m.type = "button"; m.disabled = l.qty <= 1; m.setAttribute("aria-label", "Decrease quantity of " + l.name + " " + l.weightLabel);
      var o = el("output", "", String(l.qty));
      var pl = el("button", "", "+"); pl.type = "button"; pl.disabled = l.qty >= 99; pl.setAttribute("aria-label", "Increase quantity of " + l.name + " " + l.weightLabel);
      m.addEventListener("click", function () { cart = L.setQty(cart, l.productId, l.weightId, l.qty - 1); renderCart(); });
      pl.addEventListener("click", function () { cart = L.setQty(cart, l.productId, l.weightId, l.qty + 1); renderCart(); });
      st.appendChild(m); st.appendChild(o); st.appendChild(pl); ctrl.appendChild(st);
      ctrl.appendChild(el("span", "line-total", L.formatINR(l.subtotal)));
      var rm = el("button", "icon-btn"); rm.type = "button"; rm.setAttribute("aria-label", "Remove " + l.name + " " + l.weightLabel + " from cart");
      rm.appendChild(icon("i-trash", 15, 17));
      rm.addEventListener("click", function () { cart = L.removeItem(cart, l.productId, l.weightId); renderCart(); });
      ctrl.appendChild(rm); row.appendChild(ctrl); list.appendChild(row);
    });

    $("#ship-banner").hidden = !bill.freeDelivery;
    $("#sum-subtotal").textContent = L.formatINR(bill.subtotal);
    var d = $("#sum-delivery"); d.textContent = "";
    if (!bill.lines.length) d.textContent = L.formatINR(0);
    else if (bill.freeDelivery) {
      d.appendChild(el("span", "strike", L.formatINR(cfg.DELIVERY.charge))); d.appendChild(el("span", "free", "FREE"));
    } else d.textContent = L.formatINR(bill.delivery);
    $("#sum-total").textContent = L.formatINR(bill.total);

    var count = L.cartCount(cart);
    $("#header-cart-count").textContent = count;
    $("#fab-count").textContent = count;
    $("#proceed-btn").disabled = !bill.lines.length;
  }

  /* ---------- Order form ---------- */
  var modal = $("#order-modal"), form = $("#order-form");

  function openOrder() {
    if (!cart.length) {
      toast("Your cart is empty \u2013 add a masala first.");
      $("#products").scrollIntoView({ behavior: "smooth" });
      return;
    }
    lastFocus = document.activeElement;
    modal.hidden = false; document.body.classList.add("modal-open");
    clearErrors(); setTimeout(function () { $("#f-name").focus(); }, 0);
  }
  function closeOrder() {
    modal.hidden = true; document.body.classList.remove("modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function clearErrors() {
    ["name", "mobile", "address"].forEach(function (k) {
      $("#e-" + k).textContent = ""; $("#f-" + k).closest(".field").classList.remove("invalid");
    });
    $("#e-form").textContent = "";
  }

  document.querySelectorAll("[data-open-order]").forEach(function (b) { b.addEventListener("click", openOrder); });
  document.querySelectorAll("[data-close-order]").forEach(function (b) { b.addEventListener("click", closeOrder); });
  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") { closeOrder(); return; }
    if (e.key === "Tab") { // keep focus inside the dialog
      var f = modal.querySelectorAll("button, input, textarea, [href]");
      f = Array.prototype.filter.call(f, function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault(); clearErrors();
    var values = { name: $("#f-name").value, mobile: $("#f-mobile").value, address: $("#f-address").value, notes: $("#f-notes").value };
    var res = L.validateOrderForm(values);
    if (!res.valid) {
      var firstBad = null;
      Object.keys(res.errors).forEach(function (k) {
        $("#e-" + k).textContent = res.errors[k]; $("#f-" + k).closest(".field").classList.add("invalid");
        if (!firstBad) firstBad = $("#f-" + k);
      });
      if (firstBad) firstBad.focus();
      return;
    }
    if (!cart.length) { $("#e-form").textContent = "Your cart is empty."; return; }
    var bill = L.computeBill(cfg, cart);
    if (bill.lines.some(function (l) { return l.unitPrice === null; })) {
      $("#e-form").textContent = "Some items have no price yet. Please remove them and try again."; return;
    }
    if (!L.isOwnerNumberConfigured(cfg)) {
      $("#e-form").textContent = "Ordering is not switched on yet: the shop's WhatsApp number has not been set in config.js.";
      return;
    }
    var url = L.buildWhatsAppUrl(cfg, L.buildOrderMessage(cfg, cart, values));
    // Open WhatsApp. The cart and form are left untouched; the customer presses Send in WhatsApp.
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- Mobile menu ---------- */
  var mt = $("#menu-toggle"), nav = $("#main-nav");
  function setMenu(open) {
    nav.classList.toggle("open", open); mt.setAttribute("aria-expanded", open ? "true" : "false");
    mt.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mt.firstElementChild.firstElementChild.setAttribute("href", open ? "#i-close" : "#i-menu");
  }
  mt.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 900) setMenu(false); });

  /* Highlight the current nav link while scrolling */
  var links = Array.prototype.slice.call(document.querySelectorAll(".main-nav a"));
  var targets = links.map(function (a) { return $(a.getAttribute("href")); });
  window.addEventListener("scroll", function () {
    var y = window.scrollY + 120, cur = 0;
    targets.forEach(function (t, i) { if (t && t.offsetTop <= y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
  }, { passive: true });

  renderProducts();
  renderCart();
})();
