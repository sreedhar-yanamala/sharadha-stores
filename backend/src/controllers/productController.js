import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Fetch all products with filters, sorting & pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 8;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
      ? {
          $or: [
            { title: { $regex: req.query.keyword, $options: 'i' } },
            { description: { $regex: req.query.keyword, $options: 'i' } },
          ],
        }
      : {};

    const categoryFilter = req.query.category ? { category: req.query.category } : {};
    
    // Price range filters
    let priceFilter = {};
    if (req.query.minPrice || req.query.maxPrice) {
      priceFilter.price = {};
      if (req.query.minPrice) priceFilter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) priceFilter.price.$lte = Number(req.query.maxPrice);
    }

    // Custom flags
    const comboFilter = req.query.isCombo === 'true' ? { isCombo: true } : {};
    const bestSellerFilter = req.query.isBestSeller === 'true' ? { isBestSeller: true } : {};
    const trendingFilter = req.query.isTrending === 'true' ? { isTrending: true } : {};
    const featuredFilter = req.query.isFeatured === 'true' ? { isFeatured: true } : {};

    const query = {
      ...keyword,
      ...categoryFilter,
      ...priceFilter,
      ...comboFilter,
      ...bestSellerFilter,
      ...trendingFilter,
      ...featuredFilter,
    };

    // Sorting
    let sortOption = {};
    if (req.query.sort === 'priceAsc') sortOption = { price: 1 };
    else if (req.query.sort === 'priceDesc') sortOption = { price: -1 };
    else if (req.query.sort === 'ratingDesc') sortOption = { rating: -1 };
    else sortOption = { createdAt: -1 }; // Default newest first

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { title, price, discountPrice, description, images, category, stock, ingredients, shelfLife } = req.body;

    const product = new Product({
      title,
      price,
      discountPrice: discountPrice || 0,
      user: req.user._id,
      images: images || ['/images/placeholder.jpg'],
      category,
      stock,
      ingredients: ingredients || [],
      shelfLife: shelfLife || '30 Days',
      description,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const { title, price, discountPrice, description, images, category, stock, ingredients, shelfLife, isFeatured, isBestSeller, isTrending, isCombo } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.title = title || product.title;
      product.price = price !== undefined ? price : product.price;
      product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
      product.description = description || product.description;
      product.images = images || product.images;
      product.category = category || product.category;
      product.stock = stock !== undefined ? stock : product.stock;
      product.ingredients = ingredients || product.ingredients;
      product.shelfLife = shelfLife || product.shelfLife;
      product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.isBestSeller = isBestSeller !== undefined ? isBestSeller : product.isBestSeller;
      product.isTrending = isTrending !== undefined ? isTrending : product.isTrending;
      product.isCombo = isCombo !== undefined ? isCombo : product.isCombo;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get similar products (based on category or matching ingredients)
// @route   GET /api/products/recommendations/similar/:id
// @access  Public
export const getSimilarProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const similar = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
    }).limit(4);

    res.json(similar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Frequently Bought Together products
// @route   GET /api/products/recommendations/frequently-bought-together/:id
// @access  Public
export const getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const productId = req.params.id;
    // Find orders that contain this product
    const orders = await Order.find({ 'orderItems.product': productId }).limit(20);
    
    // Count occurrences of other products in those orders
    const counts = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const itemProdId = item.product.toString();
        if (itemProdId !== productId) {
          counts[itemProdId] = (counts[itemProdId] || 0) + 1;
        }
      });
    });

    // Sort product IDs by frequency
    const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    // Fetch top 3 products or fallback to products in the same category
    let recommended = [];
    if (sortedIds.length > 0) {
      recommended = await Product.find({ _id: { $in: sortedIds.slice(0, 3) } });
    }

    // Fallback if not enough orders containing this item
    if (recommended.length < 3) {
      const currentProduct = await Product.findById(productId);
      const categoryProducts = await Product.find({
        _id: { $ne: productId, $nin: recommended.map(r => r._id) },
        category: currentProduct ? currentProduct.category : 'Sweets'
      }).limit(3 - recommended.length);
      recommended = [...recommended, ...categoryProducts];
    }

    res.json(recommended);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Personalized recommendations based on user's order history
// @route   GET /api/products/recommendations/personalized
// @access  Private
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).limit(10);
    
    // Find preferred categories
    const categories = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        // Find category by querying the product details (or fallback)
        // For simplicity, we can assume categories bought based on historical orders.
        // We'll query categories of order items
      });
    });

    // Simple personalization algorithm:
    // Gather categories of items already purchased, and recommend new products from those categories.
    // Otherwise fallback to featured products.
    const userOrders = await Order.find({ user: req.user._id }).populate('orderItems.product');
    const userCategoryPrefs = new Set();
    userOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.product && item.product.category) {
          userCategoryPrefs.add(item.product.category);
        }
      });
    });

    let recommended = [];
    if (userCategoryPrefs.size > 0) {
      recommended = await Product.find({
        category: { $in: Array.from(userCategoryPrefs) },
        isFeatured: true
      }).limit(4);
    }

    if (recommended.length < 4) {
      const remaining = 4 - recommended.length;
      const extra = await Product.find({
        _id: { $nin: recommended.map(r => r._id) }
      }).limit(remaining);
      recommended = [...recommended, ...extra];
    }

    res.json(recommended);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
