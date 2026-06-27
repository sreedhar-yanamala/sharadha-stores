import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';

// @desc    Get all inventory listings (Admin only)
// @route   GET /api/inventory
// @access  Private/Admin
export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({});
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory by Product ID (Admin only)
// @route   GET /api/inventory/:productId
// @access  Private/Admin
export const getInventoryByProductId = async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ product: req.params.productId });
    if (inventory) {
      res.json(inventory);
    } else {
      res.status(404).json({ message: 'Inventory for product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a batch to a product's inventory (Admin only)
// @route   POST /api/inventory/:productId/batches
// @access  Private/Admin
export const addBatch = async (req, res) => {
  const { batchNumber, manufactureDate, expiryDate, quantity } = req.body;

  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let inventory = await Inventory.findOne({ product: req.params.productId });

    if (!inventory) {
      inventory = new Inventory({
        product: product._id,
        title: product.title,
        stockCount: 0,
        batches: [],
      });
    }

    inventory.batches.push({
      batchNumber,
      manufactureDate: new Date(manufactureDate),
      expiryDate: new Date(expiryDate),
      quantity: Number(quantity),
    });

    // Recalculate stock count from active (non-expired) batches
    inventory.stockCount = inventory.batches
      .filter((b) => !b.isExpired)
      .reduce((acc, b) => acc + b.quantity, 0);

    // Save inventory
    await inventory.save();

    // Update main product stock count as well
    product.stock = inventory.stockCount;
    await product.save();

    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory expiry & low stock alerts (Admin only)
// @route   GET /api/inventory/alerts/warnings
// @access  Private/Admin
export const getInventoryAlerts = async (req, res) => {
  try {
    const inventory = await Inventory.find({});
    const lowStockAlerts = [];
    const expiryAlerts = [];

    const today = new Date();

    inventory.forEach((item) => {
      // Check low stock
      if (item.stockCount <= item.lowStockThreshold) {
        lowStockAlerts.push({
          productId: item.product,
          title: item.title,
          stockCount: item.stockCount,
          threshold: item.lowStockThreshold,
        });
      }

      // Check expiring batches
      item.batches.forEach((batch) => {
        if (!batch.isExpired) {
          const timeDiff = new Date(batch.expiryDate).getTime() - today.getTime();
          const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

          if (daysToExpiry <= item.shelfLifeAlertDays) {
            expiryAlerts.push({
              productId: item.product,
              title: item.title,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              daysToExpiry: daysToExpiry > 0 ? daysToExpiry : 0,
              isExpired: daysToExpiry <= 0,
            });
          }
        }
      });
    });

    res.json({
      lowStockAlerts,
      expiryAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
