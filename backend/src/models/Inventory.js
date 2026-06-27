import mongoose from 'mongoose';

const batchSchema = mongoose.Schema({
  batchNumber: { type: String, required: true },
  manufactureDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true },
  isExpired: { type: Boolean, default: false }
});

const inventorySchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
      unique: true,
    },
    title: { type: String, required: true },
    stockCount: { type: Number, required: true, default: 0 },
    batches: [batchSchema],
    shelfLifeAlertDays: {
      type: Number,
      default: 15, // Warning triggers if expiry is within 15 days
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    }
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
