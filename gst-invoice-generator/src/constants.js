export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// COMPREHENSIVE HSN/SAC CODES LIBRARY
export const HSN_CODES = [
  // --- ELECTRICAL CONTROL & DISTRIBUTION (NEW) ---
  { code: '8537', description: 'Control Panels, Switchboards & Consoles', rate: 18, category: 'Electrical' },
  { code: '8537', description: 'Distribution Boards (DBs) & Meter Panels', rate: 18, category: 'Electrical' },
  { code: '8536', description: 'Switches, Relays, Fuses (< 1000V)', rate: 18, category: 'Electrical' },
  { code: '8536', description: 'MCB (Miniature Circuit Breakers)', rate: 18, category: 'Electrical' },
  { code: '8536', description: 'Sockets, Plugs & Connectors', rate: 18, category: 'Electrical' },
  { code: '8535', description: 'Circuit Breakers & Switches (> 1000V)', rate: 18, category: 'Electrical' },
  { code: '8538', description: 'Parts for Panels & Switchboards', rate: 18, category: 'Electrical' },
  { code: '8544', description: 'Insulated Wire & Electric Cables', rate: 18, category: 'Electrical' },
  
  // --- ELECTRONICS ---
  { code: '8517', description: 'Mobile Phones & Accessories', rate: 18, category: 'Electronics' },
  { code: '8471', description: 'Laptops, Computers & Peripherals', rate: 18, category: 'Electronics' },
  { code: '8528', description: 'Monitors, Projectors & TVs (< 32 inch)', rate: 18, category: 'Electronics' },
  { code: '8528', description: 'Monitors & TVs (> 32 inch)', rate: 28, category: 'Electronics' },
  { code: '8443', description: 'Printers & Cartridges', rate: 18, category: 'Electronics' },
  { code: '8504', description: 'UPS, Inverters & Transformers', rate: 18, category: 'Electronics' },
  { code: '8507', description: 'Batteries & Accumulators', rate: 18, category: 'Electronics' },
  { code: '8415', description: 'Air Conditioners (AC)', rate: 28, category: 'Electronics' },
  { code: '8418', description: 'Refrigerators', rate: 18, category: 'Electronics' },
  { code: '8516', description: 'Water Heaters / Geysers', rate: 18, category: 'Electronics' },
  { code: '8539', description: 'LED Bulbs & Lights', rate: 12, category: 'Electronics' },

  // --- SERVICES (SAC Codes) ---
  { code: '9983', description: 'IT & Software Services', rate: 18, category: 'Services' },
  { code: '9983', description: 'Digital Marketing & Consulting', rate: 18, category: 'Services' },
  { code: '9954', description: 'Construction Services', rate: 18, category: 'Services' },
  { code: '9963', description: 'Hotel Accommodation (< ₹7500/night)', rate: 12, category: 'Services' },
  { code: '9963', description: 'Restaurant Services', rate: 5, category: 'Services' },
  { code: '9996', description: 'Event Management Services', rate: 18, category: 'Services' },
  { code: '9973', description: 'Rent / Leasing Services', rate: 18, category: 'Services' },
  { code: '9967', description: 'Transport of Goods (GTA)', rate: 5, category: 'Services' },
  { code: '9982', description: 'Legal Services', rate: 18, category: 'Services' },
  { code: '9987', description: 'Maintenance & Repair Services', rate: 18, category: 'Services' },

  // --- FOOD & AGRICULTURE ---
  { code: '1006', description: 'Rice (Non-branded)', rate: 0, category: 'Food' },
  { code: '1006', description: 'Rice (Branded & Packed)', rate: 5, category: 'Food' },
  { code: '1001', description: 'Wheat (Non-branded)', rate: 0, category: 'Food' },
  { code: '0401', description: 'Fresh Milk', rate: 0, category: 'Food' },
  { code: '0402', description: 'Milk Powder', rate: 5, category: 'Food' },
  { code: '0405', description: 'Butter & Ghee', rate: 12, category: 'Food' },
  { code: '0406', description: 'Cheese', rate: 12, category: 'Food' },
  { code: '0701', description: 'Fresh Vegetables', rate: 0, category: 'Food' },
  { code: '2106', description: 'Food Supplements', rate: 18, category: 'Food' },
  { code: '1806', description: 'Chocolates & Cocoa Products', rate: 18, category: 'Food' },
  { code: '1905', description: 'Biscuits / Bread / Cakes', rate: 18, category: 'Food' },
  { code: '0901', description: 'Coffee Beans', rate: 5, category: 'Food' },
  { code: '0902', description: 'Tea', rate: 5, category: 'Food' },
  { code: '2202', description: 'Soft Drinks / Aerated Water', rate: 28, category: 'Food' },

  // --- CONSTRUCTION & HARDWARE ---
  { code: '2523', description: 'Cement', rate: 28, category: 'Construction' },
  { code: '6907', description: 'Ceramic Tiles', rate: 18, category: 'Construction' },
  { code: '6802', description: 'Granite & Marble Blocks', rate: 18, category: 'Construction' },
  { code: '3208', description: 'Paints & Varnishes', rate: 18, category: 'Construction' },
  { code: '7214', description: 'Iron & Steel Bars (TMT)', rate: 18, category: 'Construction' },
  { code: '7306', description: 'Steel Pipes', rate: 18, category: 'Construction' },
  { code: '4407', description: 'Wood / Timber', rate: 18, category: 'Construction' },
  { code: '7318', description: 'Screws, Bolts, Nuts', rate: 18, category: 'Hardware' },
  { code: '8481', description: 'Taps, Cocks & Valves', rate: 18, category: 'Hardware' },
  { code: '3925', description: 'PVC Pipes & Fittings', rate: 18, category: 'Construction' },

  // --- CLOTHING & TEXTILES ---
  { code: '5201', description: 'Raw Cotton', rate: 5, category: 'Clothing' },
  { code: '6109', description: 'T-Shirts (Knitted)', rate: 5, category: 'Clothing' },
  { code: '6203', description: 'Readymade Garments (< ₹1000)', rate: 5, category: 'Clothing' },
  { code: '6203', description: 'Readymade Garments (> ₹1000)', rate: 12, category: 'Clothing' },
  { code: '6302', description: 'Bed Linen & Curtains', rate: 12, category: 'Clothing' },
  { code: '6403', description: 'Footwear (< ₹1000)', rate: 5, category: 'Clothing' },
  { code: '6403', description: 'Footwear (> ₹1000)', rate: 12, category: 'Clothing' },
  { code: '4202', description: 'Handbags & Luggage', rate: 18, category: 'Accessories' },

  // --- FURNITURE & DECOR ---
  { code: '9403', description: 'Furniture (Wood/Metal)', rate: 18, category: 'Furniture' },
  { code: '9401', description: 'Office Chairs & Seating', rate: 18, category: 'Furniture' },
  { code: '9404', description: 'Mattresses', rate: 18, category: 'Furniture' },
  { code: '9405', description: 'Lamps & Lighting Fittings', rate: 18, category: 'Decor' },
  { code: '7009', description: 'Glass Mirrors', rate: 18, category: 'Decor' },

  // --- AUTOMOBILE & PARTS ---
  { code: '8703', description: 'Motor Cars', rate: 28, category: 'Automobile' },
  { code: '8711', description: 'Motorcycles', rate: 28, category: 'Automobile' },
  { code: '8708', description: 'Spare Parts & Accessories', rate: 28, category: 'Automobile' },
  { code: '4011', description: 'Tyres', rate: 28, category: 'Automobile' },
  { code: '2710', description: 'Engine Oil / Lubricants', rate: 18, category: 'Automobile' },

  // --- OFFICE STATIONERY ---
  { code: '4802', description: 'Paper (A4/Printing)', rate: 12, category: 'Stationery' },
  { code: '4901', description: 'Printed Books', rate: 0, category: 'Stationery' },
  { code: '9608', description: 'Pens & Markers', rate: 18, category: 'Stationery' },
  { code: '8305', description: 'Files & Folders', rate: 18, category: 'Stationery' },
  { code: '4819', description: 'Cartons & Packaging Boxes', rate: 18, category: 'Stationery' },

  // --- MEDICAL & PHARMA ---
  { code: '3004', description: 'Medicines / Medicaments', rate: 12, category: 'Medical' },
  { code: '3006', description: 'Pharmaceutical Goods', rate: 12, category: 'Medical' },
  { code: '9018', description: 'Medical Instruments', rate: 12, category: 'Medical' },
  { code: '4015', description: 'Surgical Gloves', rate: 12, category: 'Medical' },
  { code: '3002', description: 'Vaccines', rate: 5, category: 'Medical' },

  // --- MACHINERY & TOOLS ---
  { code: '8205', description: 'Hand Tools', rate: 18, category: 'Tools' },
  { code: '8413', description: 'Water Pumps', rate: 18, category: 'Machinery' },
  { code: '8421', description: 'Water Purifiers', rate: 18, category: 'Machinery' },
  { code: '8501', description: 'Electric Motors', rate: 18, category: 'Machinery' }
];