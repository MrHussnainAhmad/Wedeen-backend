import mongoose from 'mongoose';

const zakatCalculationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    calculationId: { type: String, required: true },
    currency: { type: String, default: 'USD' },
    cashSavings: { type: Number, default: 0 },
    goldValue: { type: Number, default: 0 },
    silverValue: { type: Number, default: 0 },
    investments: { type: Number, default: 0 },
    businessAssets: { type: Number, default: 0 },
    liabilities: { type: Number, default: 0 },
    nisabThreshold: { type: Number, default: 0 },
    zakatableTotal: { type: Number, default: 0 },
    zakatDue: { type: Number, default: 0 },
    createdAtClient: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

zakatCalculationSchema.index({ userId: 1, calculationId: 1 }, { unique: true });

export const ZakatCalculation = mongoose.model('ZakatCalculation', zakatCalculationSchema);
