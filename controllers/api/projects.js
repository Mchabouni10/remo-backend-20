//controller/api/projects.js
// controller/api/projects.js
function calculateCostsAndTotals(categories, settings) {
  let materialCost = 0;
  let laborCost = 0;

  categories.forEach(category => {
    category.workItems.forEach(item => {
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
    laborDiscountAmount, // Include in return
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

    console.log('Received settings:', settings); // Debug log

    const deposit = Number(settings.deposit) || 0;
    const { parsed: payments, totalPaid, amountDue } = parsePayments(settings.payments, deposit);

    const costs = calculateCostsAndTotals(categories, settings);
    if (isNaN(costs.total) || isNaN(totalPaid)) {
      throw new Error(`Invalid cost calculations`);
    }

    const projectData = {
      userId: req.user._id,
      customerInfo,
      categories,
      settings: {
        ...settings,
        deposit,
        payments,
        totalPaid,
        amountDue,
        amountRemaining: Math.max(0, costs.total - totalPaid),
        laborDiscountAmount: costs.laborDiscountAmount, // Store calculated value
        discountedLaborCost: costs.discountedLaborCost, // Store calculated value
      },
    };

    const project = await new Project(projectData).save();
    console.log('Project created:', project._id);
    res.json(project);
  } catch (err) {
    console.error('Error in create():', err);
    res.status(400).json({ error: err.message || 'Bad request' });
  }
}

async function update(req, res) {
  try {
    const { customerInfo, categories = [], settings = {} } = req.body;

    console.log('Received settings for update:', settings); // Debug log

    const deposit = Number(settings.deposit) || 0;
    const { parsed: payments, totalPaid, amountDue } = parsePayments(settings.payments, deposit);

    const costs = calculateCostsAndTotals(categories, settings);
    if (isNaN(costs.total) || isNaN(totalPaid)) {
      throw new Error(`Invalid cost calculations`);
    }

    const updatedData = {
      customerInfo,
      categories,
      settings: {
        ...settings,
        deposit,
        payments,
        totalPaid,
        amountDue,
        amountRemaining: Math.max(0, costs.total - totalPaid),
        laborDiscountAmount: costs.laborDiscountAmount, // Store calculated value
        discountedLaborCost: costs.discountedLaborCost, // Store calculated value
      },
      updatedAt: Date.now(),
    };

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Error in update():', err);
    res.status(400).json({ error: err.message || 'Bad request' });
  }
}
