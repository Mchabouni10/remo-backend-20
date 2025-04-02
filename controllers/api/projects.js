const Project = require('../../models/project');

module.exports = {
  create,
  index,
  show,
  update,
  delete: deleteProject,
};

async function create(req, res) {
  try {
    const payments = (req.body.settings?.payments || []).map(payment => {
      const date = new Date(payment.date);
      if (isNaN(date.getTime())) throw new Error(`Invalid payment date: ${payment.date}`);
      return {
        date: date,
        amount: Number(payment.amount),
        method: payment.method || 'Cash',
        note: payment.note || '',
        isPaid: Boolean(payment.isPaid),
      };
    });

    const projectData = {
      userId: req.user._id,
      customerInfo: req.body.customerInfo,
      categories: req.body.categories || [],
      settings: {
        taxRate: Number(req.body.settings?.taxRate) || 0,
        transportationFee: Number(req.body.settings?.transportationFee) || 0,
        wasteFactor: Number(req.body.settings?.wasteFactor) || 0,
        miscFees: req.body.settings?.miscFees || [],
        deposit: Number(req.body.settings?.deposit) || 0,
        payments: payments,
        markup: Number(req.body.settings?.markup) || 0,
      },
    };
    console.log('Creating project with data:', JSON.stringify(projectData, null, 2));
    const project = new Project(projectData);
    await project.save();
    console.log('Created project:', JSON.stringify(project, null, 2));
    res.json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(400).json({ error: err.message || 'Bad request' });
  }
}

async function index(req, res) {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort('-createdAt');
    console.log('Fetched projects:', projects.length);
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function show(req, res) {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    console.log('Fetched project:', JSON.stringify(project, null, 2));
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function update(req, res) {
  try {
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));

    const payments = (req.body.settings?.payments || []).map(payment => {
      const date = new Date(payment.date);
      if (isNaN(date.getTime())) throw new Error(`Invalid payment date: ${payment.date}`);
      return {
        date: date,
        amount: Number(payment.amount),
        method: payment.method || 'Cash',
        note: payment.note || '',
        isPaid: Boolean(payment.isPaid),
      };
    });

    const updatedData = {
      customerInfo: req.body.customerInfo,
      categories: req.body.categories || [],
      settings: {
        taxRate: Number(req.body.settings?.taxRate) || 0,
        transportationFee: Number(req.body.settings?.transportationFee) || 0,
        wasteFactor: Number(req.body.settings?.wasteFactor) || 0,
        miscFees: req.body.settings?.miscFees || [],
        deposit: Number(req.body.settings?.deposit) || 0,
        payments: payments,
        markup: Number(req.body.settings?.markup) || 0,
      },
      updatedAt: Date.now(),
    };
    console.log('Processed update data:', JSON.stringify(updatedData, null, 2));

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        $set: {
          customerInfo: updatedData.customerInfo,
          categories: updatedData.categories,
          settings: updatedData.settings,
          updatedAt: updatedData.updatedAt,
        },
        $unset: { 'settings.amountPaid': '' },
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }
    console.log('Saved project:', JSON.stringify(project, null, 2));
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(400).json({ error: err.message || 'Bad request' });
  }
}

async function deleteProject(req, res) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    console.log('Deleted project:', req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Server error' });
  }
}