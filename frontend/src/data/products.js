const defaultProducts = [
  {
    _id: '1',
    title: 'Fresh Honey Drizzle Waffles',
    description: 'Deliciously crispy on the outside, fluffy on the inside. Baked fresh to order and served with a generous drizzle of organic raw honey and fresh forest berries.',
    ingredients: ['Wheat Flour', 'Fresh Berries', 'Organic Honey', 'Butter'],
    shelfLife: '15 Days',
    images: ['/images/honey-waffles.png'],
    category: 'Sweets',
    price: 250,
    discountPrice: 220,
    stock: 50,
    isFeatured: true,
    isBestSeller: true,
    isTrending: false,
    rating: 4.8,
    numReviews: 12,
    reviews: [
      {
        _id: 'r1',
        name: 'Suresh Iyer',
        rating: 5,
        comment: 'Absolutely delicious waffles! So light and fluffy, and the honey is top notch.',
        createdAt: '2026-06-10T12:00:00Z'
      },
      {
        _id: 'r2',
        name: 'Meena K.',
        rating: 4.6,
        comment: 'Very tasty, not overly sweet. The waffle texture is exceptional.',
        createdAt: '2026-06-11T12:00:00Z'
      }
    ]
  },
  {
    _id: '2',
    title: 'Homemade Glazed Donuts',
    description: 'Melt-in-the-mouth soft glazed donuts, hand-dipped in premium cane sugar glaze and baked fresh in our home kitchen daily.',
    ingredients: ['Wheat Flour', 'Yeast', 'Cane Sugar', 'Butter'],
    shelfLife: '30 Days',
    images: ['/images/glazed-donuts.png'],
    category: 'Sweets',
    price: 200,
    discountPrice: 0,
    stock: 40,
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    rating: 4.5,
    numReviews: 8,
    reviews: []
  },
  {
    _id: '3',
    title: 'Handmade Crispy Potato Samosas',
    description: 'Golden, flaky pastry pockets stuffed with a spiced potato and green peas mash, fried to perfection in cold-pressed oil.',
    ingredients: ['Potato', 'Green Peas', 'Wheat Flour', 'Spices', 'Cold-Pressed Oil'],
    shelfLife: '45 Days',
    images: ['/images/samosa.png'],
    category: 'Snacks',
    price: 120,
    discountPrice: 110,
    stock: 80,
    isFeatured: false,
    isBestSeller: true,
    isTrending: true,
    rating: 4.9,
    numReviews: 24,
    reviews: []
  },
  {
    _id: '4',
    title: 'Butter Murukku (Manoharam)',
    description: 'A lighter, melt-in-the-mouth snack flavored with cumin seeds and a heavy hand of farm-fresh butter. Kids and elderly favorites alike.',
    ingredients: ['Rice Flour', 'Gram Flour', 'Cumin Seeds', 'Butter', 'Asafoetida', 'Oil', 'Salt'],
    shelfLife: '45 Days',
    images: ['/images/murukku.png'],
    category: 'Snacks',
    price: 130,
    discountPrice: 0,
    stock: 5,
    isFeatured: true,
    isBestSeller: false,
    isTrending: false,
    rating: 4.7,
    numReviews: 15,
    reviews: []
  },
  {
    _id: '5',
    title: 'Spicy Pickled Red Chilies',
    description: 'Whole red chilies hand-pickled in premium vinegar, mustard seeds, and cold-pressed oil, providing a hot and tangy kick to any meal.',
    ingredients: ['Red Chilies', 'Mustard Seeds', 'Vinegar', 'Cold-Pressed Oil', 'Salt'],
    shelfLife: '12 Months',
    images: ['/images/red-chilies-pickle.png'],
    category: 'Pickles',
    price: 180,
    discountPrice: 160,
    stock: 60,
    isFeatured: true,
    isBestSeller: true,
    isTrending: false,
    rating: 5.0,
    numReviews: 32,
    reviews: []
  },
  {
    _id: '6',
    title: 'Aged Pickled Mixed Vegetables',
    description: 'A rustic jar of assorted seasonal vegetables preserved in a brine of local spices, vinegar, and natural sea salt.',
    ingredients: ['Carrots', 'Cucumber', 'Cauliflower', 'Vinegar', 'Spices', 'Salt'],
    shelfLife: '12 Months',
    images: ['/images/mixed-vegetables-pickle.png'],
    category: 'Pickles',
    price: 150,
    discountPrice: 0,
    stock: 35,
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    rating: 4.4,
    numReviews: 9,
    reviews: []
  },
  {
    _id: '7',
    title: "Grandma's Sambar Powder",
    description: 'A secret ancestral recipe. 15 spice ingredients including coriander seeds, red chilies, black pepper, and lentils dry-roasted individually to perfect temperatures and milled together.',
    ingredients: ['Coriander Seeds', 'Dry Red Chili', 'Bengal Gram', 'Toor Dal', 'Fenugreek', 'Black Pepper', 'Cumin', 'Turmeric'],
    shelfLife: '6 Months',
    images: ['/images/sambar-podi.png'],
    category: 'Spice Powders',
    price: 140,
    discountPrice: 125,
    stock: 70,
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    rating: 4.8,
    numReviews: 18,
    reviews: []
  },
  {
    _id: '8',
    title: 'Spicy Curry Leaf Gunpowder',
    description: 'Perfect side kick for hot idli, dosa, or mixed with steamed rice and ghee. Packed with nutrients from fresh local curry leaves, roasted dals, and dry chilies.',
    ingredients: ['Curry Leaves', 'Urad Dal', 'Chana Dal', 'Sesame Seeds', 'Red Chili', 'Tamarind', 'Asafoetida', 'Salt'],
    shelfLife: '6 Months',
    images: ['/images/curry-leaf-podi.png'],
    category: 'Spice Powders',
    price: 110,
    discountPrice: 0,
    stock: 50,
    isFeatured: false,
    isBestSeller: false,
    isTrending: false,
    rating: 4.6,
    numReviews: 11,
    reviews: []
  },
  {
    _id: '10',
    title: 'Traditional Kaju Katli',
    description: 'Creamy and delectable diamond-shaped cashew sweets, prepared with premium cashews and pure farm-fresh cow ghee.',
    ingredients: ['Cashews', 'Sugar', 'Ghee', 'Cardamom'],
    shelfLife: '20 Days',
    images: ['/images/kaju-katli.png'],
    category: 'Sweets',
    price: 350,
    discountPrice: 320,
    stock: 30,
    isFeatured: true,
    isBestSeller: true,
    isTrending: false,
    rating: 4.9,
    numReviews: 14,
    reviews: []
  },
  {
    _id: '11',
    title: 'Pure Ghee Mysore Pak',
    description: 'A traditional royal sweet from South India that melts in your mouth, made with gram flour, premium cow ghee, and sugar.',
    ingredients: ['Gram Flour', 'Pure Ghee', 'Sugar'],
    shelfLife: '25 Days',
    images: ['/images/mysore-pak.png'],
    category: 'Sweets',
    price: 300,
    discountPrice: 280,
    stock: 25,
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    rating: 4.8,
    numReviews: 22,
    reviews: []
  },
  {
    _id: '12',
    title: 'Spicy Kara Sev',
    description: 'Crispy and crunchy chickpea flour noodles seasoned with freshly ground black pepper and ajwain.',
    ingredients: ['Gram Flour', 'Black Pepper', 'Ajwain', 'Salt', 'Cold-Pressed Oil'],
    shelfLife: '60 Days',
    images: ['/images/kara-sev.png'],
    category: 'Snacks',
    price: 100,
    discountPrice: 0,
    stock: 60,
    isFeatured: false,
    isBestSeller: true,
    isTrending: false,
    rating: 4.6,
    numReviews: 11,
    reviews: []
  },
  {
    _id: '13',
    title: 'Ribbon Pakoda (Ola Sev)',
    description: 'Flat, ribbon-like crispy snack made from a blend of rice flour, gram flour, and warm spices.',
    ingredients: ['Rice Flour', 'Gram Flour', 'Chili Powder', 'Butter', 'Asafoetida', 'Salt', 'Cold-Pressed Oil'],
    shelfLife: '45 Days',
    images: ['/images/ribbon-pakoda.png'],
    category: 'Snacks',
    price: 110,
    discountPrice: 95,
    stock: 45,
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    rating: 4.7,
    numReviews: 19,
    reviews: []
  },
  {
    _id: '14',
    title: 'Andhra Avakaya Mango Pickle',
    description: 'Fiery Andhra-style cut mango pickle cured with red chilies, mustard powder, and cold-pressed sesame oil.',
    ingredients: ['Raw Mango', 'Red Chili Powder', 'Mustard Powder', 'Sesame Oil', 'Salt', 'Fenugreek Seeds'],
    shelfLife: '12 Months',
    images: ['/images/mango-pickle-public.jpg'],
    category: 'Pickles',
    price: 160,
    discountPrice: 145,
    stock: 55,
    isFeatured: true,
    isBestSeller: true,
    isTrending: false,
    rating: 4.9,
    numReviews: 38,
    reviews: []
  },
  {
    _id: '15',
    title: 'Tangy Sun-Cured Lemon Pickle',
    description: 'Sour and spicy lemon pickle prepared using traditional oil-free sun-curing methods.',
    ingredients: ['Lemons', 'Salt', 'Chili Powder', 'Asafoetida', 'Turmeric'],
    shelfLife: '12 Months',
    images: ['/images/lemon-pickle.png'],
    category: 'Pickles',
    price: 140,
    discountPrice: 0,
    stock: 40,
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    rating: 4.5,
    numReviews: 16,
    reviews: []
  },
  {
    _id: '16',
    title: 'Authentic Rasam Powder',
    description: 'A traditional spice blend of coriander, cumin, black pepper, and lentils for making soothing Rasam soup.',
    ingredients: ['Coriander Seeds', 'Cumin Seeds', 'Black Pepper', 'Toor Dal', 'Red Chili', 'Asafoetida'],
    shelfLife: '6 Months',
    images: ['/images/rasam-podi.png'],
    category: 'Spice Powders',
    price: 120,
    discountPrice: 100,
    stock: 80,
    isFeatured: false,
    isBestSeller: true,
    isTrending: false,
    rating: 4.7,
    numReviews: 14,
    reviews: []
  },
  {
    _id: '17',
    title: 'Garlic Paruppu Podi',
    description: 'Flavorful lentil powder dry-roasted with red chilies, garlic cloves, and curry leaves. Tastes heavenly with hot rice and ghee.',
    ingredients: ['Toor Dal', 'Chana Dal', 'Garlic', 'Dry Red Chili', 'Salt', 'Asafoetida'],
    shelfLife: '6 Months',
    images: ['/images/garlic-podi.png'],
    category: 'Spice Powders',
    price: 130,
    discountPrice: 115,
    stock: 75,
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    rating: 4.8,
    numReviews: 26,
    reviews: []
  },

  /* ── CHIPS ─────────────────────────────────────────────────── */
  {
    _id: '18',
    title: 'Banana Chips (Original)',
    description: 'Thin-sliced raw banana chips fried in cold-pressed coconut oil with a light salted finish. Crispy, light, and utterly addictive.',
    ingredients: ['Raw Banana', 'Coconut Oil', 'Salt', 'Turmeric'],
    shelfLife: '45 Days',
    images: ['/images/chips-banana.jpg'],
    category: 'Chips',
    price: 120,
    discountPrice: 99,
    stock: 60,
    weight: '250g',
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    rating: 4.8,
    numReviews: 24,
  },
  {
    _id: '19',
    title: 'Tapioca Chips (Spicy)',
    description: 'Crispy tapioca (kappa) chips with a bold red chilli and salt seasoning. A Kerala classic made fresh with zero preservatives.',
    ingredients: ['Tapioca', 'Red Chilli', 'Coconut Oil', 'Salt'],
    shelfLife: '45 Days',
    images: ['/images/chips-potato-spicy.jpg'],
    category: 'Chips',
    price: 110,
    discountPrice: 89,
    stock: 50,
    weight: '250g',
    isFeatured: false,
    isBestSeller: true,
    isTrending: false,
    rating: 4.6,
    numReviews: 18,
  },
  {
    _id: '20',
    title: 'Sweet Potato Chips',
    description: 'Naturally sweet and lightly salted sweet potato chips fried in sunflower oil. A nutritious, guilt-free snack for all ages.',
    ingredients: ['Sweet Potato', 'Sunflower Oil', 'Salt'],
    shelfLife: '30 Days',
    images: ['/images/chips-potato-salted.jpg'],
    category: 'Chips',
    price: 130,
    discountPrice: 0,
    stock: 40,
    weight: '200g',
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    rating: 4.4,
    numReviews: 10,
  },
  {
    _id: '21',
    title: 'Jackfruit Chips',
    description: 'Unripe jackfruit sliced paper-thin and fried in pure coconut oil. A rare traditional snack from the Kerala coast.',
    ingredients: ['Unripe Jackfruit', 'Coconut Oil', 'Salt'],
    shelfLife: '45 Days',
    images: ['/images/chips-jackfruit.jpg'],
    category: 'Chips',
    price: 150,
    discountPrice: 125,
    stock: 35,
    weight: '200g',
    isFeatured: true,
    isBestSeller: false,
    isTrending: false,
    rating: 4.7,
    numReviews: 14,
  },
  {
    _id: '22',
    title: 'Nendran Banana Chips (Coconut Oil)',
    description: 'Premium Nendran variety banana chips, stone-salt seasoned, and fried in fresh coconut oil. Our bestselling variety — order early!',
    ingredients: ['Nendran Banana', 'Coconut Oil', 'Stone Salt'],
    shelfLife: '60 Days',
    images: ['/images/chips-potato-salted.jpg'],
    category: 'Chips',
    price: 160,
    discountPrice: 139,
    stock: 70,
    weight: '300g',
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    rating: 4.9,
    numReviews: 38,
  },
  {
    _id: '23',
    title: 'Masala Banana Chips',
    description: 'Banana chips tossed in a special blend of chaat masala, chilli powder, and lemon zest. A spicy twist on a classic favourite.',
    ingredients: ['Banana', 'Coconut Oil', 'Chaat Masala', 'Chilli Powder', 'Lemon Zest'],
    shelfLife: '45 Days',
    images: ['/images/chips-potato-spicy.png'],
    category: 'Chips',
    price: 130,
    discountPrice: 0,
    stock: 45,
    weight: '250g',
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    rating: 4.5,
    numReviews: 9,
  },

  /* ── APPALAMS ─────────────────────────────────────────────── */
  {

    _id: '24',
    title: 'Sharadha Special Appalam (Medium)',
    description: 'Our signature appalam made from premium urad dal flour, sun-dried for 3 days and hand-pressed to a perfect thin disc. Fries crispy golden in seconds.',
    ingredients: ['Urad Dal Flour', 'Rice Flour', 'Cumin Seeds', 'Black Pepper', 'Asafoetida', 'Salt', 'Cold-Pressed Oil'],
    shelfLife: '6 Months',
    images: ['/images/appalam-special.png'],
    category: 'Appalams',
    price: 120,
    discountPrice: 99,
    stock: 80,
    weight: '200g (25 pieces)',
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    rating: 4.9,
    numReviews: 38,
    reviews: [
      { _id: 'ra1', name: 'Anitha Rajan', rating: 5, comment: 'Perfectly thin and crispy! Just like the ones my grandmother made. Best appalam I have ever had.', createdAt: '2026-05-15T10:00:00Z' },
      { _id: 'ra2', name: 'Siva Prasad', rating: 4.8, comment: 'Great quality. Fries up in under 30 seconds and puffs up beautifully. Genuine homemade taste.', createdAt: '2026-05-20T10:00:00Z' }
    ]
  },
  {
    _id: '25',
    title: 'Traditional Rice Appalam',
    description: 'Classic South Indian rice papads made with fine-milled raw rice flour and seasoned with rock salt. Ideal for frying or roasting on a direct flame.',
    ingredients: ['Raw Rice Flour', 'Rock Salt', 'Sesame Seeds', 'Water'],
    shelfLife: '6 Months',
    images: ['/images/appalam-rice.png'],
    category: 'Appalams',
    price: 100,
    discountPrice: 0,
    stock: 100,
    weight: '200g (20 pieces)',
    isFeatured: true,
    isBestSeller: true,
    isTrending: false,
    rating: 4.7,
    numReviews: 22,
    reviews: [
      { _id: 'ra3', name: 'Lalitha Subramaniam', rating: 5, comment: 'My kids love these! Light, crispy and very tasty. No artificial taste at all.', createdAt: '2026-06-01T10:00:00Z' }
    ]
  },
  {
    _id: '26',
    title: 'Pepper Appalam',
    description: 'Spice-lovers favourite! Generously coated with coarsely crushed black peppercorns and coriander seeds, these appalams deliver a bold, peppery punch in every bite.',
    ingredients: ['Urad Dal Flour', 'Black Pepper', 'Coriander Seeds', 'Cumin', 'Salt', 'Asafoetida'],
    shelfLife: '6 Months',
    images: ['/images/appalam-pepper.png'],
    category: 'Appalams',
    price: 130,
    discountPrice: 110,
    stock: 60,
    weight: '200g (22 pieces)',
    isFeatured: false,
    isBestSeller: true,
    isTrending: true,
    rating: 4.8,
    numReviews: 31,
    reviews: [
      { _id: 'ra4', name: 'Karthik Varma', rating: 5, comment: 'The pepper hit is amazing! Pairs beautifully with curd rice and dal.', createdAt: '2026-05-25T10:00:00Z' }
    ]
  },
  {
    _id: '27',
    title: 'Tapioca Appalam',
    description: 'A light and delicate appalam made from cassava (tapioca) starch — gluten-free and extremely crispy when fried. Melts in the mouth with zero oiliness.',
    ingredients: ['Tapioca Starch', 'Rock Salt', 'Cumin Seeds', 'Water'],
    shelfLife: '8 Months',
    images: ['/images/appalam-tapioca.png'],
    category: 'Appalams',
    price: 110,
    discountPrice: 0,
    stock: 45,
    weight: '150g (20 pieces)',
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    rating: 4.6,
    numReviews: 15,
    reviews: []
  },
  {
    _id: '28',
    title: 'Kerala Papadam',
    description: 'Authentic Kerala-style papadam made with black gram dal, hand-rolled wafer thin and sun-dried under slow Kerala summer heat. Roasts perfectly on a flame.',
    ingredients: ['Black Gram Dal', 'Dried Ginger', 'Black Pepper', 'Asafoetida', 'Salt'],
    shelfLife: '12 Months',
    images: ['/images/appalam-kerala.png'],
    category: 'Appalams',
    price: 150,
    discountPrice: 130,
    stock: 70,
    weight: '250g (30 pieces)',
    isFeatured: true,
    isBestSeller: true,
    isTrending: false,
    rating: 4.9,
    numReviews: 44,
    reviews: [
      { _id: 'ra5', name: 'Meera Nair', rating: 5, comment: 'Exactly the papadam I grew up eating in Kerala. Thin, crispy and beautifully roasted.', createdAt: '2026-04-10T10:00:00Z' },
      { _id: 'ra6', name: 'George Thomas', rating: 4.9, comment: 'Best papadam you can get online. Authentic Kerala taste guaranteed.', createdAt: '2026-05-01T10:00:00Z' }
    ]
  },
  {
    _id: '29',
    title: 'Homemade Appalam',
    description: 'Traditional homemade appalam crafted using time-honoured methods — hand-kneaded dough, rolled individually, and air-dried for 48 hours. No machine processing.',
    ingredients: ['Urad Dal Flour', 'Cumin Seeds', 'Black Pepper', 'Asafoetida', 'Rock Salt', 'Cold-Pressed Sesame Oil'],
    shelfLife: '6 Months',
    images: ['/images/appalam-homemade.png'],
    category: 'Appalams',
    price: 140,
    discountPrice: 0,
    stock: 55,
    weight: '200g (20 pieces)',
    isFeatured: true,
    isBestSeller: false,
    isTrending: true,
    rating: 4.7,
    numReviews: 19,
    reviews: []
  },
  {
    _id: '30',
    title: 'Special Family Pack Appalam',
    description: 'Our best-selling value pack for families — contains a mixed assortment of plain, pepper, and sesame appalams packed in a large airtight container for sustained freshness.',
    ingredients: ['Urad Dal Flour', 'Rice Flour', 'Black Pepper', 'Sesame Seeds', 'Cumin', 'Salt'],
    shelfLife: '6 Months',
    images: ['/images/appalam-family-pack.png'],
    category: 'Appalams',
    price: 350,
    discountPrice: 299,
    stock: 30,
    weight: '500g (~60 pieces)',
    isFeatured: true,
    isBestSeller: true,
    isTrending: true,
    isCombo: true,
    rating: 4.9,
    numReviews: 57,
    reviews: [
      { _id: 'ra7', name: 'Radha Krishnamurthy', rating: 5, comment: 'Perfect family pack! Great variety and great price. Everyone in my family loved them.', createdAt: '2026-06-05T10:00:00Z' }
    ]
  },
  {
    _id: '31',
    title: 'Sesame Seed Appalam',
    description: 'Delicate appalams studded with whole white sesame seeds, lending a nutty aroma and subtle crunch. Light, oil-free when roasted on a flame.',
    ingredients: ['Urad Dal Flour', 'White Sesame Seeds', 'Rock Salt', 'Cumin', 'Asafoetida'],
    shelfLife: '6 Months',
    images: ['/images/appalam-sesame.png'],
    category: 'Appalams',
    price: 125,
    discountPrice: 0,
    stock: 65,
    weight: '200g (22 pieces)',
    isFeatured: false,
    isBestSeller: false,
    isTrending: true,
    rating: 4.6,
    numReviews: 11,
    reviews: []
  },
];

export const getLocalProducts = () => {
  const local = localStorage.getItem('sharadha_products_v26');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing local storage products:', e);
    }
  }
  localStorage.setItem('sharadha_products_v26', JSON.stringify(defaultProducts));
  return defaultProducts;
};

export const saveLocalProducts = (updated) => {
  localStorage.setItem('sharadha_products_v26', JSON.stringify(updated));
};


export const getProducts = ({
  page = 1,
  pageSize = 6,
  category = '',
  keyword = '',
  minPrice = '',
  maxPrice = '',
  sort = '',
  isBestSeller = null,
  isTrending = null,
  isCombo = null
} = {}) => {
  let filtered = getLocalProducts();

  if (category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (keyword) {
    const results = searchProducts(getLocalProducts(), keyword);
    filtered = filtered.filter(p => results.some(r => r._id === p._id));
  }

  if (minPrice !== '') {
    const min = parseFloat(minPrice);
    filtered = filtered.filter(p => {
      const price = p.discountPrice > 0 ? p.discountPrice : p.price;
      return price >= min;
    });
  }

  if (maxPrice !== '') {
    const max = parseFloat(maxPrice);
    filtered = filtered.filter(p => {
      const price = p.discountPrice > 0 ? p.discountPrice : p.price;
      return price <= max;
    });
  }

  if (isBestSeller !== null) {
    filtered = filtered.filter(p => p.isBestSeller === isBestSeller);
  }

  if (isTrending !== null) {
    filtered = filtered.filter(p => p.isTrending === isTrending);
  }

  if (isCombo !== null) {
    filtered = filtered.filter(p => p.isCombo === isCombo);
  }

  // Sorting
  if (sort === 'priceAsc') {
    filtered.sort((a, b) => {
      const pa = a.discountPrice > 0 ? a.discountPrice : a.price;
      const pb = b.discountPrice > 0 ? b.discountPrice : b.price;
      return pa - pb;
    });
  } else if (sort === 'priceDesc') {
    filtered.sort((a, b) => {
      const pa = a.discountPrice > 0 ? a.discountPrice : a.price;
      const pb = b.discountPrice > 0 ? b.discountPrice : b.price;
      return pb - pa;
    });
  } else if (sort === 'ratingDesc') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else {
    filtered.sort((a, b) => parseInt(b._id) - parseInt(a._id));
  }

  // Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    products: paginated,
    page,
    pages: totalPages,
    total: totalItems
  };
};

/* ================================================================
   SMART SEARCH ENGINE
   ================================================================ */

// Synonym / alias map — maps a search term to related categories/keywords
const SEARCH_SYNONYMS = {
  // Categories
  sweet:       ['sweets', 'sweet', 'mithai', 'dessert', 'desserts', 'candy', 'candies', 'laddu', 'halwa', 'barfi', 'burfi'],
  sweets:      ['sweets', 'sweet', 'mithai', 'dessert', 'desserts', 'candy', 'candies', 'laddu', 'halwa', 'barfi', 'burfi'],
  snack:       ['snacks', 'snack', 'namkeen', 'farsan', 'chakli', 'murukku', 'mixture', 'chekkalu', 'sev', 'pakoda', 'samosa', 'bhujia'],
  snacks:      ['snacks', 'snack', 'namkeen', 'farsan', 'chakli', 'murukku', 'mixture', 'chekkalu', 'sev', 'pakoda', 'samosa', 'bhujia'],
  pickle:      ['pickles', 'pickle', 'achar', 'achaar', 'avakaya', 'mango', 'lemon', 'gongura', 'chilli', 'chili', 'mixed'],
  pickles:     ['pickles', 'pickle', 'achar', 'achaar', 'avakaya', 'mango', 'lemon', 'gongura', 'chilli', 'chili', 'mixed'],
  spice:       ['spice powders', 'spice', 'powder', 'podi', 'masala', 'sambar', 'rasam', 'curry', 'chutney', 'gunpowder', 'paruppu'],
  spices:      ['spice powders', 'spice', 'powder', 'podi', 'masala', 'sambar', 'rasam', 'curry', 'chutney', 'gunpowder', 'paruppu'],
  // Ingredient / product keywords
  ghee:        ['ghee', 'cow ghee', 'pure ghee', 'clarified butter'],
  homemade:    ['homemade', 'home made', 'handmade', 'hand made', 'artisan', 'traditional', 'authentic'],
  traditional: ['traditional', 'authentic', 'ancestral', 'homemade', 'handmade'],
  organic:     ['organic', 'natural', 'cold-pressed', 'pure', 'fresh'],
  mango:       ['mango', 'avakaya', 'aam', 'raw mango'],
  lemon:       ['lemon', 'nimbu', 'lime', 'citrus'],
  sambar:      ['sambar', 'sambar powder', 'sambar podi'],
  rasam:       ['rasam', 'rasam powder', 'rasam podi'],
  curry:       ['curry', 'curry leaf', 'curry powder', 'kari'],
  garlic:      ['garlic', 'garlic podi', 'lehsun', 'lahsun'],
  cashew:      ['cashew', 'kaju', 'kaju katli', 'cashew nut'],
  laddu:       ['laddu', 'laddoo', 'ladu'],
  mysore:      ['mysore pak', 'mysore', 'besan burfi'],
  donut:       ['donut', 'doughnut', 'glazed', 'baked'],
  waffle:      ['waffle', 'waffles', 'honey waffle'],
  murukku:     ['murukku', 'chakli', 'butter murukku', 'manoharam'],
  mixture:     ['mixture', 'namkeen', 'trail mix'],
  sev:         ['sev', 'kara sev', 'boondi', 'gathiya'],
  pakoda:      ['pakoda', 'pakora', 'ribbon pakoda', 'ola sev'],
  ariselu:     ['ariselu', 'arisa', 'arisala'],
  jangri:      ['jangri', 'jalebi', 'imarti'],
  // Appalam / Papad synonyms
  appalam:     ['appalam', 'appalams', 'papad', 'papads', 'papadam', 'pappadam', 'pappadum', 'papadum', 'crispy', 'urad dal', 'rice papad', 'fryums'],
  papad:       ['papad', 'papads', 'appalam', 'appalams', 'papadam', 'pappadam', 'pappadum', 'rice appalam', 'pepper papad'],
  papadam:     ['papadam', 'pappadam', 'kerala papadam', 'appalam', 'papad'],
  pappadum:    ['pappadum', 'papadum', 'papadam', 'appalam'],
  crispy:      ['crispy', 'crunchy', 'fried', 'roasted', 'appalam', 'murukku', 'ribbon pakoda'],
  rice:        ['rice', 'rice appalam', 'rice flour', 'rice papad'],
  pepper:      ['pepper', 'black pepper', 'pepper appalam', 'pepper papad', 'peppercorn'],
  kerala:      ['kerala', 'kerala papadam', 'keralite', 'malabari'],
  tapioca:     ['tapioca', 'cassava', 'sabudana', 'tapioca appalam', 'gluten free'],
};

/**
 * Expand a raw query into a set of lowercase search tokens,
 * including all synonyms for any matching alias key.
 */
function expandQuery(query) {
  const q = query.toLowerCase().trim();
  const tokens = new Set([q]);

  // Add all individual words from the query
  q.split(/\s+/).forEach(word => tokens.add(word));

  // Add synonyms for any matching key
  Object.entries(SEARCH_SYNONYMS).forEach(([key, aliases]) => {
    if (q.includes(key) || key.includes(q)) {
      aliases.forEach(alias => tokens.add(alias.toLowerCase()));
    }
  });

  return tokens;
}

/**
 * Score a single product against a set of expanded query tokens.
 * Higher score = better match.
 */
function scoreProduct(product, tokens) {
  let score = 0;
  const title       = product.title.toLowerCase();
  const description = product.description.toLowerCase();
  const category    = product.category.toLowerCase();
  const ingredients = product.ingredients.map(i => i.toLowerCase()).join(' ');

  for (const token of tokens) {
    if (!token) continue;
    // Exact title match → highest weight
    if (title === token)               score += 100;
    else if (title.includes(token))    score += 40;
    // Category match
    if (category === token)            score += 60;
    else if (category.includes(token)) score += 25;
    // Description match
    if (description.includes(token))   score += 10;
    // Ingredients match
    if (ingredients.includes(token))   score += 8;
  }

  return score;
}

/**
 * searchProducts – smart, fuzzy, synonym-aware search.
 * Returns products sorted by relevance score (highest first),
 * filtering out anything with score === 0.
 *
 * @param {Array}  products   - full product array to search in
 * @param {string} query      - raw user query
 * @returns {Array}           - matched products, sorted by relevance
 */
export const searchProducts = (products, query) => {
  if (!query || !query.trim()) return products;
  const tokens = expandQuery(query);

  const scored = products
    .map(p => ({ product: p, score: scoreProduct(p, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ product }) => product);
};

/**
 * highlightText – wraps all occurrences of `query` (case-insensitive)
 * in the `text` string with <mark> tags.
 *
 * @param {string} text
 * @param {string} query
 * @returns {string}  HTML string
 */
export const highlightText = (text, query) => {
  if (!query || !query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/* ================================================================
   FUZZY / TYPO-CORRECTION ENGINE
   ================================================================ */

/**
 * Levenshtein edit-distance between two strings (case-insensitive).
 * Used to detect typos like "snaks" → "snacks" (distance = 1).
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Known correct words the user might be looking for
const KNOWN_TERMS = [
  'sweets', 'snacks', 'pickles', 'spice powders',
  'ghee', 'sambar', 'rasam', 'murukku', 'pickle',
  'laddu', 'halwa', 'barfi', 'kaju', 'cashew',
  'waffles', 'donuts', 'samosa', 'pakoda', 'sev',
  'mixture', 'mango', 'lemon', 'garlic', 'curry',
  'homemade', 'traditional', 'organic', 'spice',
];

/**
 * getSpellingSuggestion – returns the closest known term if the
 * user's query is likely a typo (edit distance ≤ 2 and short).
 * Returns null if no good correction found.
 *
 * @param {string} query
 * @returns {{ corrected: string, distance: number } | null}
 */
export const getSpellingSuggestion = (query) => {
  if (!query || query.trim().length < 3) return null;
  const q = query.toLowerCase().trim();

  // Don't suggest if query already matches something exactly
  if (KNOWN_TERMS.includes(q)) return null;

  let best = null;
  let bestDist = Infinity;

  for (const term of KNOWN_TERMS) {
    const dist = levenshtein(q, term);
    // Allow distance proportional to term length
    const threshold = Math.max(2, Math.floor(term.length / 4));
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist;
      best = { corrected: term, distance: dist };
    }
  }
  return best;
};

/**
 * getFuzzyFallbackProducts – when the primary search yields nothing,
 * this returns related products using:
 *  1. Spelling correction → re-run smart search with corrected term
 *  2. Category fuzzy match
 *  3. Best sellers as last resort
 *
 * @param {Array}  allProducts
 * @param {string} query
 * @returns {{ products: Array, reason: string, correction: string|null }}
 */
export const getFuzzyFallbackProducts = (allProducts, query) => {
  const q = query.toLowerCase().trim();

  // 1. Try spelling correction
  const suggestion = getSpellingSuggestion(q);
  if (suggestion) {
    const corrected = searchProducts(allProducts, suggestion.corrected);
    if (corrected.length > 0) {
      return {
        products: corrected,
        reason: 'correction',
        correction: suggestion.corrected,
      };
    }
  }

  // 2. Try category fuzzy match (partial word overlap)
  const categories = ['Sweets', 'Snacks', 'Pickles', 'Spice Powders'];
  for (const cat of categories) {
    const catLower = cat.toLowerCase();
    // Check if query is contained in or contains the category name
    if (catLower.includes(q) || q.includes(catLower.split(' ')[0])) {
      const catProducts = allProducts.filter(
        p => p.category.toLowerCase() === catLower
      );
      if (catProducts.length > 0) {
        return { products: catProducts, reason: 'category', correction: cat };
      }
    }
  }

  // 3. Best sellers fallback
  const bestSellers = allProducts.filter(p => p.isBestSeller || p.isTrending);
  return {
    products: bestSellers.length > 0 ? bestSellers : allProducts.slice(0, 6),
    reason: 'popular',
    correction: null,
  };
};

export const getProductById = (id) => {
  const all = getLocalProducts();
  return all.find(p => p._id === id || String(p._id) === String(id)) || null;
};

export const getSimilarProducts = (id) => {
  const current = getProductById(id);
  if (!current) return [];
  const all = getLocalProducts();
  return all.filter(p => p._id !== current._id && p.category === current.category).slice(0, 4);
};

export const getFrequentlyBoughtTogether = (id) => {
  const current = getProductById(id);
  if (!current) return [];
  const all = getLocalProducts();
  return all.filter(p => p._id !== current._id && p.category !== current.category).slice(0, 2);
};

const defaultCategories = [
  { _id: 'c1', name: 'Sweets', description: 'Authentic traditional sweets made with pure cow ghee and natural sweetening.' },
  { _id: 'c2', name: 'Snacks', description: 'Crispy and savory snacks hand-pressed and fried in high-quality cold-pressed oils.' },
  { _id: 'c3', name: 'Pickles', description: 'Sun-dried vegetables cured with spices and cold-pressed sesame oil. Preservative-free.' },
  { _id: 'c4', name: 'Spice Powders', description: 'Freshly roasted spices ground in small batches to lock in natural aromas.' },
  { _id: 'c5', name: 'Appalams', description: 'Authentic sun-dried appalams and papads handcrafted from traditional family recipes. Crispy, preservative-free, and delicious.' },
  { _id: 'c6', name: 'Chips', description: 'Homemade crispy chips — Potato, Banana, Jackfruit and more — fried in fresh cold-pressed oil with no preservatives.' },
];

export const getLocalCategories = () => {
  const local = localStorage.getItem('sharadha_categories_v3');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing categories:', e);
    }
  }
  localStorage.setItem('sharadha_categories_v3', JSON.stringify(defaultCategories));
  return defaultCategories;
};

export const saveLocalCategories = (updated) => {
  localStorage.setItem('sharadha_categories_v2', JSON.stringify(updated));
};



