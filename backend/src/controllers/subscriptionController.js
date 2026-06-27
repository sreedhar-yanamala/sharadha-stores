import Subscription from '../models/Subscription.js';
import Product from '../models/Product.js';

// Helper to calculate next delivery date based on deliveryDay
const calculateNextDeliveryDate = (deliveryDay, planType) => {
  const date = new Date();
  if (planType === 'Weekly') {
    // Weekday map
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = days.indexOf(deliveryDay);
    
    if (targetDayIndex !== -1) {
      const currentDayIndex = date.getDay();
      let daysToAdd = targetDayIndex - currentDayIndex;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week's delivery
      date.setDate(date.getDate() + daysToAdd);
    } else {
      date.setDate(date.getDate() + 7);
    }
  } else if (planType === 'Monthly' || planType === 'Festival_Combo') {
    // Add 1 month
    date.setMonth(date.getMonth() + 1);
  }
  return date;
};

// @desc    Create new subscription
// @route   POST /api/subscriptions
// @access  Private
export const createSubscription = async (req, res) => {
  const { planType, items, deliveryDay, paymentMethod } = req.body;

  if (items && items.length === 0) {
    return res.status(400).json({ message: 'No items selected for subscription' });
  }

  try {
    // Calculate total price
    let totalPrice = 0;
    const subscriptionItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
        totalPrice += itemPrice * item.quantity;
        subscriptionItems.push({
          product: product._id,
          title: product.title,
          quantity: item.quantity,
          price: itemPrice,
        });
      }
    }

    const nextDelivery = calculateNextDeliveryDate(deliveryDay, planType);

    const subscription = new Subscription({
      user: req.user._id,
      planType,
      items: subscriptionItems,
      price: totalPrice,
      deliveryDay,
      nextDeliveryDate: nextDelivery,
      paymentMethod,
    });

    const createdSubscription = await subscription.save();
    res.status(201).json(createdSubscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user subscriptions
// @route   GET /api/subscriptions/mysubscriptions
// @access  Private
export const getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pause/Resume/Cancel subscription
// @route   PUT /api/subscriptions/:id/status
// @access  Private
export const updateSubscriptionStatus = async (req, res) => {
  const { status } = req.body; // Active, Paused, Cancelled

  try {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription) {
      if (subscription.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      subscription.status = status || subscription.status;
      if (status === 'Active') {
        // Recalculate next delivery from today
        subscription.nextDeliveryDate = calculateNextDeliveryDate(
          subscription.deliveryDay,
          subscription.planType
        );
      }

      const updatedSubscription = await subscription.save();
      res.json(updatedSubscription);
    } else {
      res.status(404).json({ message: 'Subscription not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all subscriptions (Admin only)
// @route   GET /api/subscriptions
// @access  Private/Admin
export const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
