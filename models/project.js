//model/project.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const surfaceSchema = new Schema({
  measurementType: {
    type: String,
    enum: ['single-surface', 'room-surface', 'linear-foot', 'by-unit'],
    required: true,
  },
  width: { type: Number, min: 0 },
  height: { type: Number, min: 0 },
  sqft: { type: Number, min: 0 },
  manualSqft: { type: Boolean, default: false },
  linearFt: { type: Number, min: 0 },
  units: { type: Number, min: 0 },
  length: { type: Number, min: 0 },
  roomShape: { type: String, enum: ['rectangular', 'other'], default: 'rectangular' },
  roomHeight: { type: Number, min: 0 },
  doors: [{
    size: String,
    width: Number,
    height: Number,
    area: Number,
  }],
  windows: [{
    size: String,
    width: Number,
    height: Number,
    area: Number,
  }],
  closets: [{
    size: String,
    width: Number,
    height: Number,
    area: Number,
  }],
});

const workItemSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  subtype: { type: String, default: '' },
  surfaces: [surfaceSchema],
  materialCost: { type: Number, default: 0, min: 0 },
  laborCost: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '' },
  unitType: {
    type: String,
    enum: ['sqft', 'linear ft', 'units'],
    default: 'sqft',
  },
}, {
  validate: {
    validator: function() {
      const hasValidSurfaces = this.surfaces && this.surfaces.length > 0 && this.surfaces.every(surf => {
        if (this.materialCost > 0 || this.laborCost > 0) {
          if (surf.measurementType === 'linear-foot') {
            return surf.linearFt > 0;
          } else if (surf.measurementType === 'by-unit') {
            return surf.units > 0 || surf.sqft > 0;
          } else {
            return surf.sqft > 0;
          }
        }
        return true;
      });
      return hasValidSurfaces;
    },
    message: 'Surfaces must have valid units (linearFt, units, or sqft) when materialCost or laborCost is non-zero',
  },
});

const categorySchema = new Schema({
  name: { type: String, required: true },
  workItems: [workItemSchema],
});

const miscFeeSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
});

const paymentSchema = new Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  method: {
    type: String,
    enum: ['Credit', 'Debit', 'Check', 'Cash', 'Zelle'],
    default: 'Cash',
  },
  note: { type: String, default: '' },
  isPaid: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue'],
    default: 'Pending',
  },
}, { timestamps: true });

const settingsSchema = new Schema({
  taxRate: { type: Number, default: 0, min: 0, max: 1 },
  transportationFee: { type: Number, default: 0, min: 0 },
  wasteFactor: { type: Number, default: 0, min: 0, max: 1 },
  laborDiscount: { type: Number, default: 0, min: 0, max: 1 },
  miscFees: [miscFeeSchema],
  deposit: { type: Number, default: 0, min: 0 },
  payments: [paymentSchema],
  markup: { type: Number, default: 0, min: 0, max: 1 },
  totalPaid: { type: Number, default: 0, min: 0 },
  amountDue: { type: Number, default: 0, min: 0 },
  amountRemaining: { type: Number, default: 0, min: 0 },
});

const customerInfoSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  unit: { type: String, default: '' },
  state: { type: String, default: 'IL' },
  zipCode: { type: String, match: /^\d{5}$/, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  projectName: { type: String, default: '' },
  type: { type: String, enum: ['Residential', 'Commercial'], default: 'Residential' },
  paymentType: {
    type: String,
    enum: ['Credit', 'Debit', 'Check', 'Cash', 'Zelle'],
    default: 'Cash',
  },
  startDate: { type: Date, required: true },
  finishDate: { type: Date },
  notes: { type: String, default: '' },
});

const projectSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerInfo: customerInfoSchema,
  categories: [categorySchema],
  settings: settingsSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);