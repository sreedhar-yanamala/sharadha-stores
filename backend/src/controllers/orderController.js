import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import SupportTicket from '../models/SupportTicket.js';
import { sendEmail } from '../utils/emailService.js';
import { orderConfirmationTemplate } from '../utils/emailTemplates.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  } else {
    try {
      // Create order
      const order = new Order({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        // If COD, we can mark isPaid: false by default. If UPI/Card, we mock isPaid: true.
        isPaid: paymentMethod !== 'COD',
        paidAt: paymentMethod !== 'COD' ? new Date() : undefined,
      });

      // Deduct stock
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
          await product.save();
        }
      }

      const createdOrder = await order.save();

      // ── Send order confirmation email (non-blocking) ─────────────────────
      try {
        const customer = await User.findById(req.user._id).select('name email');
        if (customer) {
          const emailItems = orderItems.map((item) => ({
            name: item.title || item.name || 'Unknown Item',
            quantity: item.quantity,
            price: item.price,
          }));
          sendEmail(
            customer.email,
            `✅ Order Confirmed – #${createdOrder._id}`,
            orderConfirmationTemplate(
              customer.name,
              createdOrder._id,
              emailItems,
              totalPrice,
              shippingAddress
            )
          ).then((result) => {
            if (result.success) {
              console.log(`[Orders] ✅ Confirmation email sent to ${customer.email}`);
            } else {
              console.warn(`[Orders] ⚠️  Email failed for order ${createdOrder._id}: ${result.error}`);
            }
          });
        }
      } catch (emailErr) {
        console.error('[Orders] Email error (non-fatal):', emailErr.message);
      }

      res.status(201).json({
        ...createdOrder.toObject(),
        emailSent: true,
        message: 'Order placed successfully! A confirmation email has been sent.',
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      // Validate that the request user is either the order owner or an admin
      if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  const { orderStatus, trackingNumber, carrier } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.orderStatus = orderStatus || order.orderStatus;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (carrier) order.carrier = carrier;

      if (orderStatus === 'Delivered') {
        order.isPaid = true; // Mark COD paid upon delivery
        order.paidAt = order.paidAt || new Date();
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard statistics (Admin only)
// @route   GET /api/orders/stats/summary
// @access  Private/Admin
export const getDashboardSummary = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSubscriptions = await Subscription.countDocuments({});
    const totalTickets = await SupportTicket.countDocuments({});

    // Calculate revenue
    const orders = await Order.find({ isPaid: true });
    const revenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

    // Calculate sales monthly summary (mocking simple structure or grouping by month)
    const recentOrders = await Order.find({})
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalProducts,
      totalOrders,
      revenue: Math.round(revenue * 100) / 100,
      totalCustomers,
      totalSubscriptions,
      totalTickets,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
