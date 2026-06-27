import mongoose from 'mongoose';

const orderItemSchema = mongoose.Schema({
  title: { type: String, required: true },
  quantity: { type: Number, required: true },
  images: [{ type: String, required: true }],
  price: { type: Number, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
});

const statusTimelineSchema = mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String }
});

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true, // UPI, Card, COD
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Packed', 'Shipped', 'Delivered'],
      default: 'Pending',
    },
    statusTimeline: [statusTimelineSchema],
    trackingNumber: {
      type: String,
    },
    carrier: {
      type: String,
      default: 'Sharadha Delivery Service'
    }
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to initialize timeline when status is created/changed
orderSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('orderStatus')) {
    const statusMap = {
      'Pending': 'Order placed and waiting for processing.',
      'Packed': 'Traditional foods packed fresh from kitchen.',
      'Shipped': 'Dispatched via delivery agent.',
      'Delivered': 'Order delivered to your doorstep.'
    };
    
    this.statusTimeline.push({
      status: this.orderStatus,
      timestamp: new Date(),
      description: statusMap[this.orderStatus] || 'Status updated.'
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
