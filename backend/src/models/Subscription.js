import mongoose from 'mongoose';

const subscriptionItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  title: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
});

const subscriptionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    planType: {
      type: String,
      required: true,
      enum: ['Weekly', 'Monthly', 'Festival_Combo'],
    },
    items: [subscriptionItemSchema],
    price: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Paused', 'Cancelled'],
      default: 'Active',
    },
    deliveryDay: {
      type: String,
      required: true, // e.g., 'Monday', 'Friday', or '1st of Month'
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    nextDeliveryDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true, // Auto-debit mock, COD, UPI
    }
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
