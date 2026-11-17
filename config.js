/* ==========================================================================
   House of Guha – central site configuration
   Edit prices, delivery rules and the owner's WhatsApp number HERE only.
   ========================================================================== */
window.SITE_CONFIG = {
  /* Owner's WhatsApp number: digits only, with country code, no "+" or spaces.
     Example for India: "919876543210".  Replace the placeholder below. */
  OWNER_WHATSAPP_NUMBER: "919344350052",

  BUSINESS_NAME: "House of Guha",

  /* Delivery rule shown in the Figma design:
     ₹50 delivery, free when the items subtotal is ABOVE ₹999. */
  DELIVERY: { charge: 50, freeAbove: 999 },

  WEIGHTS: [
    { id: "250g", label: "250 g" },
    { id: "500g", label: "500 g" },
    { id: "1kg",  label: "1 kg"  }
  ],

  /* Prices are whole rupees per pack.
     Only prices that appear in the Figma design are filled in.
     `null` = price not provided yet: the product shows "Price TBA" for that weight
     and cannot be added to the cart until you enter a number. */
  PRODUCTS: [
    { id: "kashmiri-chilli-powder", name: "Kashmiri Chilli Powder", tag: "Mild Heat \u2022 Deep Crimson",
      description: "Adds a beautiful natural red colour and a mild, balanced heat",
      image: "assets/kashmiri-chilli-powder.png",
      prices: { "250g": 240, "500g": 450, "1kg": null } },
    { id: "sambar-masala-powder", name: "Sambar Masala Powder", tag: "Authentic Heritage",
      description: "A traditional blend of aromatic spices that gives your\u2026",
      image: "assets/sambar-masala-powder.png",
      prices: { "250g": 210, "500g": null, "1kg": null } },
    { id: "rasam-powder", name: "Rasam Powder", tag: "Tangy & Peppery",
      description: "Brings together the perfect aroma and traditional flavour for",
      image: "assets/rasam-powder.png",
      prices: { "250g": 190, "500g": null, "1kg": null } },
    { id: "non-veg-masala", name: "Non-Veg Masala", tag: "Robust & Zesty",
      description: "A flavour-packed spice blend that adds depth, aroma, and\u2026",
      image: "assets/non-veg-masala.png",
      prices: { "250g": 260, "500g": null, "1kg": null } },
    { id: "mutton-masala", name: "Mutton Masala", tag: "Slow-Cook Special",
      description: "Specially blended to bring out rich, bold flavours in your\u2026",
      image: "assets/mutton-masala.png",
      prices: { "250g": 280, "500g": null, "1kg": null } },
    { id: "chicken-masala", name: "Chicken Masala", tag: "Fragrant Curry Blend",
      description: "A delicious combination of traditional spices that makes\u2026",
      image: "assets/chicken-masala.png",
      prices: { "250g": 250, "500g": null, "1kg": null } },
    { id: "biriyani-masala", name: "Biriyani Masala", tag: "Royal Dum Fragrance",
      description: "A fragrant blend of handpicked spices that fills your biriyani with\u2026",
      image: "assets/biriyani-masala.png",
      prices: { "250g": 295, "500g": null, "1kg": null } },
    { id: "coriander-powder", name: "Coriander Powder (Malli Powder)", tag: "Single-Origin Coriander",
      description: "Freshly prepared from coriander seeds to add a warm, earthy\u2026",
      image: "assets/coriander-powder.png",
      prices: { "250g": 180, "500g": null, "1kg": null } }
  ]
};
