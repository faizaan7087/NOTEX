const Reminder = require('../models/Reminder');

// @desc    Get all reminders for current user
// @route   GET /api/reminders
// @access  Private
const getReminders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { completed, priority } = req.query;

    const query = { userId };
    if (completed === 'true') {
      query.isCompleted = true;
    } else if (completed === 'false') {
      query.isCompleted = false;
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query.priority = priority;
    }

    const reminders = await Reminder.find(query, { dueDate: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error('[Get Reminders Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve reminders'
    });
  }
};

// @desc    Create a new reminder
// @route   POST /api/reminders
// @access  Private
const createReminder = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { title, description, dueDate, priority, subject, noteId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title for the reminder.'
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a due date and time for the reminder.'
      });
    }

    const parsedDue = new Date(dueDate);
    if (isNaN(parsedDue.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date/time provided.'
      });
    }

    const reminder = await Reminder.create({
      userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      dueDate: parsedDue,
      priority: priority || 'medium',
      subject: subject ? subject.trim() : '',
      noteId: noteId || null
    });

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully!',
      reminder
    });
  } catch (error) {
    console.error('[Create Reminder Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create reminder'
    });
  }
};

// @desc    Update a reminder (edit or toggle completion)
// @route   PUT /api/reminders/:id
// @access  Private
const updateReminder = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const reminderId = req.params.id;

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    if (String(reminder.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this reminder'
      });
    }

    const updated = await Reminder.findByIdAndUpdate(reminderId, req.body);

    res.status(200).json({
      success: true,
      message: 'Reminder updated successfully!',
      reminder: updated
    });
  } catch (error) {
    console.error('[Update Reminder Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update reminder'
    });
  }
};

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
const deleteReminder = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const reminderId = req.params.id;

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    if (String(reminder.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this reminder'
      });
    }

    await Reminder.findByIdAndDelete(reminderId);

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully!'
    });
  } catch (error) {
    console.error('[Delete Reminder Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete reminder'
    });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder
};
