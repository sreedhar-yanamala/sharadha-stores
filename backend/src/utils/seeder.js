import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';
import Order from '../models/Order.js';
import Subscription from '../models/Subscription.js';
import SupportTicket from '../models/SupportTicket.js';
import connectDB from '../config/db.js';

dotenv.config();

connectDB();

const seedData = async () => {
  try {
    // Clear existing collections
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Inventory.deleteMany();
    await Order.deleteMany();
    await Subscription.deleteMany();
    await SupportTicket.deleteMany();

    console.log('Collections cleared.');

    // 1. Create Default Users (Admin & Customer)
    const adminUser = await User.create({
      name: 'Sharadha Admin',
      email: 'admin@sharadhastores.com',
      password: 'admin123', // Will be hashed in User pre-save
      role: 'admin',
      addresses: [
        {
          street: '12 Main Kitchen Lane',
          city: 'Mylapore',
          state: 'Tamil Nadu',
          postalCode: '600004',
          country: 'India',
          isDefault: true,
        },
      ],
    });

    const customerUser = await User.create({
      name: 'Ramesh Kumar',
      email: 'ramesh@gmail.com',
      password: 'password123',
      role: 'customer',
      addresses: [
        {
          street: '45, Gandhi Nagar Road',
          city: 'Adyar',
          state: 'Tamil Nadu',
          postalCode: '600020',
          country: 'India',
          isDefault: true,
        },
      ],
    });

    console.log('Users seeded.');

    // 2. Create Categories
    const categoriesData = [
      {
        name: 'Sweets',
        description: 'Authentic traditional sweets made with pure cow ghee and natural sweetening.',
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=90&w=800&auto=format&fit=crop',
      },
      {
        name: 'Snacks',
        description: 'Crispy and savory snacks hand-pressed and fried in high-quality cold-pressed oils.',
        image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=90&w=800&auto=format&fit=crop',
      },
      {
        name: 'Pickles',
        description: 'Sun-dried vegetables cured with spices and cold-pressed sesame oil. Preservative-free.',
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=90&w=800&auto=format&fit=crop',
      },
      {
        name: 'Spice Powders',
        description: 'Freshly roasted spices ground in small batches to lock in natural aromas.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=90&w=800&auto=format&fit=crop',
      },
    ];

    const seededCategories = await Category.insertMany(categoriesData);
    console.log('Categories seeded.');

    // 3. Create Products
    const productsData = [
      {
        user: adminUser._id,
        title: 'Fresh Honey Drizzle Waffles',
        description: 'Deliciously crispy on the outside, fluffy on the inside. Baked fresh to order and served with a generous drizzle of organic raw honey and fresh forest berries.',
        ingredients: ['Wheat Flour', 'Fresh Berries', 'Organic Honey', 'Butter'],
        shelfLife: '15 Days',
        images: ['https://images.unsplash.com/photo-1506084868230-bb9d95c24759?q=90&w=800&auto=format&fit=crop'],
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
            name: 'Suresh Iyer',
            rating: 5,
            comment: 'Absolutely delicious waffles! So light and fluffy, and the honey is top notch.',
            user: customerUser._id,
          },
          {
            name: 'Meena K.',
            rating: 4.6,
            comment: 'Very tasty, not overly sweet. The waffle texture is exceptional.',
            user: customerUser._id,
          }
        ]
      },
      {
        user: adminUser._id,
        title: 'Homemade Glazed Donuts',
        description: 'Melt-in-the-mouth soft glazed donuts, hand-dipped in premium cane sugar glaze and baked fresh in our home kitchen daily.',
        ingredients: ['Wheat Flour', 'Yeast', 'Cane Sugar', 'Butter'],
        shelfLife: '30 Days',
        images: ['https://images.unsplash.com/photo-1551024601-bec78aea704b?q=90&w=800&auto=format&fit=crop'],
        category: 'Sweets',
        price: 200,
        discountPrice: 0,
        stock: 40,
        isFeatured: true,
        isBestSeller: false,
        isTrending: true,
        rating: 4.5,
        numReviews: 8,
      },
      {
        user: adminUser._id,
        title: 'Handmade Crispy Potato Samosas',
        description: 'Golden, flaky pastry pockets stuffed with a spiced potato and green peas mash, fried to perfection in cold-pressed oil.',
        ingredients: ['Potato', 'Green Peas', 'Wheat Flour', 'Spices', 'Cold-Pressed Oil'],
        shelfLife: '45 Days',
        images: ['https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=90&w=800&auto=format&fit=crop'],
        category: 'Snacks',
        price: 120,
        discountPrice: 110,
        stock: 80,
        isFeatured: false,
        isBestSeller: true,
        isTrending: true,
        rating: 4.9,
        numReviews: 24,
      },
      {
        user: adminUser._id,
        title: 'Butter Murukku (Manoharam)',
        description: 'A lighter, melt-in-the-mouth snack flavored with cumin seeds and a heavy hand of farm-fresh butter. Kids and elderly favorites alike.',
        ingredients: ['Rice Flour', 'Gram Flour', 'Cumin Seeds', 'Butter', 'Asafoetida', 'Oil', 'Salt'],
        shelfLife: '45 Days',
        images: ['https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=90&w=800&auto=format&fit=crop'],
        category: 'Snacks',
        price: 130,
        discountPrice: 0,
        stock: 5, // Low stock on purpose to test warnings!
        isFeatured: true,
        isBestSeller: false,
        isTrending: false,
        rating: 4.7,
        numReviews: 15,
      },
      {
        user: adminUser._id,
        title: 'Spicy Pickled Red Chilies',
        description: 'Whole red chilies hand-pickled in premium vinegar, mustard seeds, and cold-pressed oil, providing a hot and tangy kick to any meal.',
        ingredients: ['Red Chilies', 'Mustard Seeds', 'Vinegar', 'Cold-Pressed Oil', 'Salt'],
        shelfLife: '12 Months',
        images: ['https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=90&w=800&auto=format&fit=crop'],
        category: 'Pickles',
        price: 180,
        discountPrice: 160,
        stock: 60,
        isFeatured: true,
        isBestSeller: true,
        isTrending: false,
        rating: 5.0,
        numReviews: 32,
      },
      {
        user: adminUser._id,
        title: 'Aged Pickled Mixed Vegetables',
        description: 'A rustic jar of assorted seasonal vegetables preserved in a brine of local spices, vinegar, and natural sea salt.',
        ingredients: ['Carrots', 'Cucumber', 'Cauliflower', 'Vinegar', 'Spices', 'Salt'],
        shelfLife: '12 Months',
        images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=90&w=800&auto=format&fit=crop'],
        category: 'Pickles',
        price: 150,
        discountPrice: 0,
        stock: 35,
        isFeatured: false,
        isBestSeller: false,
        isTrending: true,
        rating: 4.4,
        numReviews: 9,
      },
      {
        user: adminUser._id,
        title: 'Grandma\'s Sambar Powder',
        description: 'A secret ancestral recipe. 15 spice ingredients including coriander seeds, red chilies, black pepper, and lentils dry-roasted individually to perfect temperatures and milled together.',
        ingredients: ['Coriander Seeds', 'Dry Red Chili', 'Bengal Gram', 'Toor Dal', 'Fenugreek', 'Black Pepper', 'Cumin', 'Turmeric'],
        shelfLife: '6 Months',
        images: ['https://images.unsplash.com/photo-1532336414038-cf19250c5757?q=90&w=800&auto=format&fit=crop'],
        category: 'Spice Powders',
        price: 140,
        discountPrice: 125,
        stock: 70,
        isFeatured: true,
        isBestSeller: true,
        isTrending: true,
        rating: 4.8,
        numReviews: 18,
      },
      {
        user: adminUser._id,
        title: 'Spicy Curry Leaf Gunpowder',
        description: 'Perfect side kick for hot idli, dosa, or mixed with steamed rice and ghee. Packed with nutrients from fresh local curry leaves, roasted dals, and dry chilies.',
        ingredients: ['Curry Leaves', 'Urad Dal', 'Chana Dal', 'Sesame Seeds', 'Red Chili', 'Tamarind', 'Asafoetida', 'Salt'],
        shelfLife: '6 Months',
        images: ['https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=90&w=800&auto=format&fit=crop'],
        category: 'Spice Powders',
        price: 110,
        discountPrice: 0,
        stock: 50,
        isFeatured: false,
        isBestSeller: false,
        isTrending: false,
        rating: 4.6,
        numReviews: 11,
      },
      {
        user: adminUser._id,
        title: 'Family Feast Special Combo Platter',
        description: 'A grand curation of our best home kitchen specialties. Contains fresh honey waffles, glazed donuts, crispy samosas, and dipping sauces. Perfect for family gatherings!',
        ingredients: ['Waffles', 'Donuts', 'Samosas', 'Dips'],
        shelfLife: '30 Days',
        images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=90&w=800&auto=format&fit=crop'],
        category: 'Sweets',
        price: 650,
        discountPrice: 550,
        stock: 25,
        isFeatured: true,
        isBestSeller: true,
        isTrending: true,
        isCombo: true,
        rating: 4.9,
        numReviews: 40,
      }
    ];

    const seededProducts = await Product.insertMany(productsData);
    console.log('Products seeded.');

    // 4. Create Inventory batches
    const today = new Date();
    for (const prod of seededProducts) {
      const expiry = new Date();
      if (prod.shelfLife.includes('Days')) {
        const days = parseInt(prod.shelfLife);
        expiry.setDate(today.getDate() + days);
      } else if (prod.shelfLife.includes('Months')) {
        const months = parseInt(prod.shelfLife);
        expiry.setMonth(today.getMonth() + months);
      } else {
        expiry.setMonth(today.getMonth() + 1);
      }

      // Create an inventory item
      await Inventory.create({
        product: prod._id,
        title: prod.title,
        stockCount: prod.stock,
        batches: [
          {
            batchNumber: `B-${prod.title.slice(0, 3).toUpperCase()}-${today.getFullYear()}`,
            manufactureDate: today,
            expiryDate: expiry,
            quantity: prod.stock,
            isExpired: false
          }
        ],
        lowStockThreshold: 10,
        shelfLifeAlertDays: prod.shelfLife.includes('Days') && parseInt(prod.shelfLife) <= 15 ? 5 : 15
      });
    }

    console.log('Inventory records seeded.');

    // 5. Create some sample orders
    const order1 = new Order({
      user: customerUser._id,
      orderItems: [
        {
          title: seededProducts[0].title,
          quantity: 2,
          images: seededProducts[0].images,
          price: seededProducts[0].discountPrice || seededProducts[0].price,
          product: seededProducts[0]._id,
        },
        {
          title: seededProducts[4].title,
          quantity: 1,
          images: seededProducts[4].images,
          price: seededProducts[4].discountPrice || seededProducts[4].price,
          product: seededProducts[4]._id,
        }
      ],
      shippingAddress: customerUser.addresses[0],
      paymentMethod: 'UPI',
      itemsPrice: 600,
      taxPrice: 30,
      shippingPrice: 50,
      totalPrice: 680,
      isPaid: true,
      paidAt: new Date(today.getTime() - 1000 * 3600 * 24 * 2), // 2 days ago
      orderStatus: 'Shipped',
      trackingNumber: 'SH10294857IN',
    });
    await order1.save();

    const order2 = new Order({
      user: customerUser._id,
      orderItems: [
        {
          title: seededProducts[2].title,
          quantity: 1,
          images: seededProducts[2].images,
          price: seededProducts[2].discountPrice || seededProducts[2].price,
          product: seededProducts[2]._id,
        }
      ],
      shippingAddress: customerUser.addresses[0],
      paymentMethod: 'COD',
      itemsPrice: 110,
      taxPrice: 5,
      shippingPrice: 50,
      totalPrice: 165,
      isPaid: false,
      orderStatus: 'Pending',
    });
    await order2.save();

    console.log('Orders seeded.');

    // 6. Create support ticket
    await SupportTicket.create({
      user: customerUser._id,
      name: customerUser.name,
      email: customerUser.email,
      subject: 'Delay in delivery for order #1',
      message: 'Hello, my order SH10294857IN has been in Shipped status for 2 days. Can you tell me when it will arrive?',
      status: 'Open',
      priority: 'High',
      responses: []
    });

    console.log('Support tickets seeded.');

    // 7. Create subscriptions
    const subDate = new Date();
    subDate.setDate(subDate.getDate() + 4); // Deliver in 4 days
    await Subscription.create({
      user: customerUser._id,
      planType: 'Weekly',
      items: [
        {
          product: seededProducts[2]._id,
          title: seededProducts[2].title,
          quantity: 2,
          price: seededProducts[2].discountPrice || seededProducts[2].price,
        }
      ],
      price: 220,
      status: 'Active',
      deliveryDay: 'Tuesday',
      startDate: new Date(),
      nextDeliveryDate: subDate,
      paymentMethod: 'UPI'
    });

    console.log('Subscriptions seeded.');
    console.log('Database Seeding Completed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error with seeding data: ${error.message}`);
    process.exit(1);
  }
};

seedData();
