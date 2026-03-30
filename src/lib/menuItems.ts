// Base menu items - source of truth for the landing page
export const BASE_MENU_ITEMS = [
  // Coffee
  { id: "c1", name: "Black Coffee", price: 15, category: "Coffee", image: "/assets/indian_black_coffee.png", isBase: true },
  { id: "c2", name: "S.P. Filter Coffee", price: 20, category: "Coffee", image: "/assets/indian_filter_coffee.png", isBase: true },
  { id: "c3", name: "Jaggery Filter Coffee", price: 25, category: "Coffee", image: "/assets/indian_jaggery_filter_coffee.png", isBase: true },

  // Tea
  { id: "t1", name: "Butter Tea", price: 15, category: "Tea", image: "/assets/indian_butter_tea.png", isBase: true },
  { id: "t2", name: "Green Tea", price: 15, category: "Tea", image: "/assets/indian_green_tea.png", isBase: true },
  { id: "t3", name: "Lemon Tea", price: 20, category: "Tea", image: "/assets/indian_lemon_tea.png", isBase: true },
  { id: "t4", name: "Masala Tea", price: 25, category: "Tea", image: "/assets/indian_masala_chai.png", isBase: true },
  { id: "t5", name: "Jaggery Tea", price: 25, category: "Tea", image: "/assets/indian_jaggery_tea.png", isBase: true },
  { id: "t6", name: "Sukku Mani Tea", price: 20, category: "Tea", image: "/assets/indian_sukku_mani_tea.png", isBase: true },

  // Health Drinks
  { id: "h1", name: "Boost", price: 25, category: "Health Drinks", image: "/assets/indian_boost.png", isBase: true },
  { id: "h2", name: "Horlicks", price: 25, category: "Health Drinks", image: "/assets/indian_horlicks.png", isBase: true },

  // Milk Specials
  { id: "m1", name: "Rose Milk", price: 25, category: "Milk Specials", image: "/assets/indian_rose_milk.png", isBase: true },
  { id: "m2", name: "Jaggery Milk", price: 25, category: "Milk Specials", image: "/assets/indian_jaggery_milk.png", isBase: true },
  { id: "m3", name: "Ragi Malt Milk", price: 25, category: "Milk Specials", image: "/assets/indian_ragi_malt.png", isBase: true },

  // Others
  { id: "o1", name: "Citron Fruit Masala", price: 15, category: "Others", image: "/assets/indian_citron_fruit_masala.png", isBase: true },
  { id: "o2", name: "Parcel Extra", price: 5, category: "Others", image: "/assets/indian_takeaway_bag.png", isBase: true },
];

export const BASE_MENU_IDS = new Set(BASE_MENU_ITEMS.map(item => item.id));
