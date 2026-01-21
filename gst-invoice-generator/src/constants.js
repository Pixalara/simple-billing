export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// NEW: Common HSN Codes with Categories
export const HSN_CODES = [
  // --- ELECTRONICS ---
  { code: '8517', description: 'Mobile Phones', rate: 18, category: 'Electronics' },
  { code: '8471', description: 'Laptops & Computers', rate: 18, category: 'Electronics' },
  { code: '8528', description: 'Monitors & Projectors', rate: 18, category: 'Electronics' },
  { code: '8443', description: 'Printers & Cartridges', rate: 18, category: 'Electronics' },
  { code: '8504', description: 'UPS & Inverters', rate: 18, category: 'Electronics' },
  
  // --- SERVICES (SAC Codes) ---
  { code: '9983', description: 'IT Software Services', rate: 18, category: 'Services' },
  { code: '9983', description: 'Digital Marketing & Consulting', rate: 18, category: 'Services' },
  { code: '9954', description: 'Construction Services', rate: 18, category: 'Services' },
  { code: '9963', description: 'Accommodation/Hotel Services', rate: 12, category: 'Services' },
  { code: '9996', description: 'Event Management', rate: 18, category: 'Services' },

  // --- OFFICE & STATIONERY ---
  { code: '4802', description: 'A4 Paper / Notebooks', rate: 12, category: 'Stationery' },
  { code: '9608', description: 'Pens & Markers', rate: 18, category: 'Stationery' },
  { code: '8305', description: 'Office Files & Folders', rate: 18, category: 'Stationery' },

  // --- FURNITURE ---
  { code: '9403', description: 'Office Desks (Wood/Metal)', rate: 18, category: 'Furniture' },
  { code: '9401', description: 'Chairs & Seating', rate: 18, category: 'Furniture' },

  // --- CLOTHING ---
  { code: '6203', description: 'Readymade Garments (< ₹1000)', rate: 5, category: 'Clothing' },
  { code: '6203', description: 'Readymade Garments (> ₹1000)', rate: 12, category: 'Clothing' },
  { code: '6109', description: 'T-Shirts (Knitted)', rate: 5, category: 'Clothing' },
];