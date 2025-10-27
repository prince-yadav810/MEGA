// File path: server/src/controllers/noteController.js
// REPLACE entire file with this

const Note = require('../models/Note');
const { createNotification } = require('./notificationController');

exports.getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ isPinned: -1, createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, message: 'Error fetching notes', error: error.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { heading, content, color } = req.body;

    if (!heading || !content) {
      return res.status(400).json({ success: false, message: 'Heading and content are required' });
    }

    const colors = ['#FFE5E5', '#FFF4E5', '#E5F5FF', '#F0E5FF', '#E5FFE5', '#FFE5F5'];
    const selectedColor = color || colors[Math.floor(Math.random() * colors.length)];

    const note = new Note({
      heading,
      content,
      color: selectedColor,
      createdByName: 'Team Member'
    });

    await note.save();

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'success',
        category: 'note',
        title: 'Note Created',
        message: `Note "${heading}" has been created successfully`,
        entityType: 'note',
        entityId: note._id,
        actionUrl: '/notes-reminders',
        createdBy: req.user.name || 'Team Member'
      }, req.io);
    }

    res.status(201).json({ success: true, data: note, message: 'Note created successfully' });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, message: 'Error creating note', error: error.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, content, color, isPinned } = req.body;

    const note = await Note.findByIdAndUpdate(
      id,
      { heading, content, color, isPinned },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'success',
        category: 'note',
        title: 'Note Updated',
        message: `Note "${note.heading}" has been updated successfully`,
        entityType: 'note',
        entityId: note._id,
        actionUrl: '/notes-reminders',
        createdBy: req.user.name || 'Team Member'
      }, req.io);
    }

    res.json({ success: true, data: note, message: 'Note updated successfully' });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Error updating note', error: error.message });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.json({ success: true, data: note, message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully` });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ success: false, message: 'Error toggling pin', error: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'warning',
        category: 'note',
        title: 'Note Deleted',
        message: `Note "${note.heading}" has been deleted successfully`,
        entityType: 'note',
        entityId: null,
        actionUrl: '/notes-reminders',
        createdBy: req.user.name || 'Team Member'
      }, req.io);
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Error deleting note', error: error.message });
  }
};