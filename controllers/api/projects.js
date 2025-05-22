//controller/api/projects.js
//controller/api/projects.js
const Project = require('../../models/project');

function getUnits(item) {
  if (!item.type || !Array.isArray(item.surfaces)) {
    console.warn('getUnits: Invalid item type or surfaces, returning 0', { type: item.type, surfaces: item.surfaces });
    return 0;
  }

  const totalUnits = item.surfaces.reduce((sum, surf) => {
    const type = surf.measurementType;
    let units = 0;

    switch (type) {
      case 'linear-foot':
        units = parseFloat(surf.linearFt) || 0;
        break;
      case 'by-unit':
        units = parseFloat(surf.units) || parseFloat(surf.sqft) || 0;
        break;
      case 'single-surface':
      case 'room-surface':
        units = parseFloat(surf.sqft) || 0;
        break;
      default:
        console.warn(`Unknown measurementType: "${type}"`);
        return sum;
    }
    return sum + units;
  }, 0);

  return totalUnits;
}

function parsePayments(payments = [], deposit = 0, depositMethod = 'Deposit') {
  const validMethods = ['Credit', 'Debit', 'Check', 'Cash', 'Zelle', 'Deposit'];
  const parsed = [];
  let totalPaid = 0;

  // Handle deposit as a payment
  const numericDeposit = Number(deposit) || 0;
  if (numericDeposit >= 0.01) {
    const method = validMethods.includes(depositMethod) ? depositMethod : 'Deposit';
    if (!validMethods.includes(depositMethod)) {
      console.warn(`Invalid deposit method: "${depositMethod}", defaulting to 'Deposit'`);
    }
    const depositPayment = {
      date: new Date(),
      amount: numericDeposit,
      method,
      note: 'Deposit payment',
      isPaid: true,
      status: 'Paid',
    };
    parsed.push(depositPayment);
    totalPaid += numericDeposit;
  } else if (numericDeposit > 0) {
    console.warn(`Skipping invalid deposit: ${numericDeposit}`);
  }

  // Parse regular payments
  payments.forEach((payment, index) => {
    const amount = Number(payment.amount) || 0;
    if (amount >= 0.01) {
      const method = validMethods.includes(payment.method) ? payment.method : 'Cash';
      if (payment.method && !validMethods.includes(payment.method)) {
        console.warn(`Invalid payment method at index ${index}: "${payment.method}", defaulting to 'Cash'`);
      }
      const paymentDate = payment.date ? new Date(payment.date) : new Date();
      if (isNaN(paymentDate.getTime())) {
        console.warn(`Invalid payment date at index ${index}: ${payment.date}, using current date`);
        paymentDate = new Date();
      }
      const parsedPayment = {
        date: paymentDate,
        amount,
        method,
        note: payment.note || '',
        isPaid: Boolean(payment.isPaid),
        status: payment.isPaid ? 'Paid' : (paymentDate < new Date() ? 'Overdue' : 'Pending'),
      };
      parsed.push(parsedPayment);
      if (payment.isPaid) {
        totalPaid += amount;
      }
    } else if (amount > 0) {
      console.warn(`Skipping invalid payment at index ${index}: amount=${amount}`);
    }
  });

  const amountDue = parsed.reduce((sum, p) => sum + (!p.isPaid ? p.amount : 0), 0);
  return { parsed, totalPaid, amountDue };
}

function calculateCostsAndTotals(categories, settings) {
  let materialCost = 0;
  let laborCost = 0;

  categories.forEach((category) => {
    category.workItems.forEach((item) => {
      const units = getUnits(item);
      materialCost += (Number(item.materialCost) || 0) * units;
      laborCost += (Number(item.laborCost) || 0) * units;
    });
  });

  const laborDiscountAmount = laborCost * (settings.laborDiscount || 0);
  const discountedLaborCost = laborCost - laborDiscountAmount;
  const baseSubtotal = materialCost + discountedLaborCost;

  const wasteCost = baseSubtotal * (settings.wasteFactor || 0);
  const tax = baseSubtotal * (settings.taxRate || 0);
  const markupCost = baseSubtotal * (settings.markup || 0);
  const miscFeesTotal = (settings.miscFees || []).reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const transportationFee = settings.transportationFee || 0;

  const total = baseSubtotal + wasteCost + tax + markupCost + miscFeesTotal + transportationFee;

  return {
    total,
    materialCost,
    laborCost,
    discountedLaborCost,
    wasteCost,
    tax,
    markupCost,
    miscFeesTotal,
    transportationFee,
    baseSubtotal,
  };
}

async function create(req, res) {
  try {
    const { customerInfo, categories = [], settings = {} } = req.body;
    const deposit = Number(settings.deposit) || 0;
    const depositMethod = settings.depositMethod || 'Deposit';

    if (deposit > 0 && deposit < 0.01) {
      console.error('Invalid deposit:', deposit);
      throw new Error('Deposit must be 0 or at least 0.01');
    }

    const { parsed: payments, totalPaid, amountDue } = parsePayments(settings.payments, deposit, depositMethod);
    const costs = calculateCostsAndTotals(categories, settings);

    if (isNaN(costs.total) || isNaN(totalPaid)) {
      console.error('Invalid calculations:', { total: costs.total, totalPaid });
      throw new Error('Invalid cost or payment calculations');
    }

    const projectData = {
      userId: req.user._id,
      customerInfo,
      categories,
      settings: {
        ...settings,
        deposit,
        depositMethod,
        payments,
        totalPaid,
        amountDue,
        amountRemaining: Math.max(0, costs.total - totalPaid),
      },
    };

    const project = await new Project(projectData).save();
    res.status(201).json(project);
  } catch (err) {
    console.error('create error:', err);
    let errorMessage = 'Bad request';
    if (err.name === 'ValidationError') {
      errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
      console.error('Validation errors:', Object.keys(err.errors));
    } else if (err.message) {
      errorMessage = err.message;
    }
    res.status(400).json({
      error: errorMessage,
      details: err.name === 'ValidationError' ? err.errors : err.message,
    });
  }
}

async function index(req, res) {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort('-createdAt');
    res.json(projects);
  } catch (err) {
    console.error('index error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

async function show(req, res) {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('show error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

async function update(req, res) {
  try {
    const { customerInfo, categories = [], settings = {} } = req.body;
    const deposit = Number(settings.deposit) || 0;
    const depositMethod = settings.depositMethod || 'Deposit';

    if (deposit > 0 && deposit < 0.01) {
      console.error('Invalid deposit:', deposit);
      throw new Error('Deposit must be 0 or at least 0.01');
    }

    const { parsed: payments, totalPaid, amountDue } = parsePayments(settings.payments, deposit, depositMethod);
    const costs = calculateCostsAndTotals(categories, settings);

    if (isNaN(costs.total) || isNaN(totalPaid)) {
      console.error('Invalid calculations:', { total: costs.total, totalPaid });
      throw new Error('Invalid cost or payment calculations');
    }

    const updatedData = {
      customerInfo,
      categories,
      settings: {
        ...settings,
        deposit,
        depositMethod,
        payments,
        totalPaid,
        amountDue,
        amountRemaining: Math.max(0, costs.total - totalPaid),
      },
      updatedAt: Date.now(),
    };

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!project) {
      console.warn('Project not found:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error('update error:', err);
    let errorMessage = 'Bad request';
    if (err.name === 'ValidationError') {
      errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
      console.error('Validation errors:', Object.keys(err.errors));
    } else if (err.message) {
      errorMessage = err.message;
    }
    res.status(400).json({
      error: errorMessage,
      details: err.name === 'ValidationError' ? err.errors : err.message,
    });
  }
}

async function deleteProject(req, res) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  delete: deleteProject,
};