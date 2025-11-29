// File path: server/src/controllers/noteController.js
// REPLACE entire file with this

const Note = require('../models/Note');
const User = require('../models/User');
const { createNotification, notifyMultipleUsers } = require('./notificationController');
const cloudinary = require('../config/cloudinary');

exports.getAllNotes = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Filter notes based on visibility:
    // - Show public notes to everyone
    // - Show private notes only to their creator
    // - Show legacy notes (no createdBy) to everyone
    const notes = await Note.find({
      $or: [
        { visibility: 'public' },
        { createdBy: userId },
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    }).sort({ isPinned: -1, createdAt: -1 });

    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, message: 'Error fetching notes', error: error.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    console.log('=== CREATE NOTE REQUEST ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const { heading, content, color, visibility } = req.body;

    if (!heading || !content) {
      return res.status(400).json({ success: false, message: 'Heading and content are required' });
    }

    const colors = ['#FFE5E5', '#FFF4E5', '#E5F5FF', '#F0E5FF', '#E5FFE5', '#FFE5F5'];
    const selectedColor = color || colors[Math.floor(Math.random() * colors.length)];

    // Handle file uploads
    const attachments = [];
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments)
        ? req.files.attachments
        : [req.files.attachments];

      const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      for (const file of files) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
          return res.status(400).json({
            success: false,
            message: `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
          });
        }

        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File ${file.name} exceeds the maximum size of 10MB`
          });
        }

        try {
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'mega/notes',
            resource_type: 'auto'
          });

          attachments.push({
            filename: file.name,
            originalName: file.name,
            url: result.secure_url,
            publicId: result.public_id,
            fileType: fileExtension,
            size: file.size
          });
        } catch (uploadError) {
          console.error('Error uploading file to Cloudinary:', uploadError);
          return res.status(500).json({
            success: false,
            message: `Error uploading file ${file.name}`
          });
        }
      }
    }

    const note = new Note({
      heading,
      content,
      color: selectedColor,
      createdBy: req.user?.id,
      createdByName: req.user?.name || 'Team Member',
      visibility: visibility || 'private',
      attachments
    });

    await note.save();

    // Send notifications only for public notes
    if (req.user && visibility === 'public') {
      const hasAttachments = attachments.length > 0;
      
      // Notify all users except super admins for public notes
      try {
        const employeesManagersAndAdmins = await User.find({
          isActive: true,
          role: { $in: ['employee', 'manager', 'admin'] }
        }).select('_id');

        const userIds = employeesManagersAndAdmins.map(u => u._id);

        if (userIds.length > 0) {
          const attachmentText = hasAttachments ? ` with ${attachments.length} file(s)` : '';
          await notifyMultipleUsers(
            userIds,
            {
              type: 'info',
              category: 'note',
              title: 'New Public Note',
              message: `"${heading}" has been created by ${req.user.name}${attachmentText}`,
              entityType: 'note',
              entityId: note._id,
              actionUrl: '/notes-reminders',
              createdBy: req.user.name || 'Team Member'
            },
            req.io
          );
          console.log(`✉️  Public note notification sent to ${userIds.length} user(s)`);
        }
      } catch (notifyError) {
        console.error('Error sending public note notifications:', notifyError);
      }
    }

    res.status(201).json({ success: true, data: note, message: 'Note created successfully' });
  } catch (error) {
    console.error('=== ERROR CREATING NOTE ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    res.status(500).json({ success: false, message: 'Error creating note', error: error.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, content, color, isPinned, visibility } = req.body;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Handle new file uploads
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments)
        ? req.files.attachments
        : [req.files.attachments];

      const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      for (const file of files) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
          return res.status(400).json({
            success: false,
            message: `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
          });
        }

        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File ${file.name} exceeds the maximum size of 10MB`
          });
        }

        try {
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'mega/notes',
            resource_type: 'auto'
          });

          note.attachments.push({
            filename: file.name,
            originalName: file.name,
            url: result.secure_url,
            publicId: result.public_id,
            fileType: fileExtension,
            size: file.size
          });
        } catch (uploadError) {
          console.error('Error uploading file to Cloudinary:', uploadError);
          return res.status(500).json({
            success: false,
            message: `Error uploading file ${file.name}`
          });
        }
      }
    }

    // Update other fields
    if (heading) note.heading = heading;
    if (content) note.content = content;
    if (color) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (visibility) note.visibility = visibility;

    await note.save();

    // Send notifications only for public notes when files are added
    if (req.user && note.visibility === 'public' && req.files && req.files.attachments) {
      // Notify all users except super admins when files are added to public notes
      try {
        const employeesManagersAndAdmins = await User.find({
          isActive: true,
          role: { $in: ['employee', 'manager', 'admin'] }
        }).select('_id');

        const userIds = employeesManagersAndAdmins.map(u => u._id);

        if (userIds.length > 0) {
          const filesAdded = Array.isArray(req.files.attachments) 
            ? req.files.attachments.length 
            : 1;
          await notifyMultipleUsers(
            userIds,
            {
              type: 'info',
              category: 'note',
              title: 'Files Added to Public Note',
              message: `${filesAdded} file(s) added to "${note.heading}" by ${req.user.name}`,
              entityType: 'note',
              entityId: note._id,
              actionUrl: '/notes-reminders',
              createdBy: req.user.name || 'Team Member'
            },
            req.io
          );
          console.log(`✉️  Public note file upload notification sent to ${userIds.length} user(s)`);
        }
      } catch (notifyError) {
        console.error('Error sending public note file upload notifications:', notifyError);
      }
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
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Check if note is public before deleting
    const isPublic = note.visibility === 'public';
    const noteHeading = note.heading;

    // Delete all attachments from Cloudinary
    if (note.attachments && note.attachments.length > 0) {
      for (const attachment of note.attachments) {
        try {
          await cloudinary.uploader.destroy(attachment.publicId);
        } catch (error) {
          console.error(`Error deleting file from Cloudinary: ${attachment.publicId}`, error);
        }
      }
    }

    await Note.findByIdAndDelete(id);

    // Send notifications if note was public
    if (req.user && isPublic) {
      try {
        const employeesManagersAndAdmins = await User.find({
          isActive: true,
          role: { $in: ['employee', 'manager', 'admin'] }
        }).select('_id');

        const userIds = employeesManagersAndAdmins.map(u => u._id);

        if (userIds.length > 0) {
          await notifyMultipleUsers(
            userIds,
            {
              type: 'warning',
              category: 'note',
              title: 'Public Note Deleted',
              message: `"${noteHeading}" has been deleted by ${req.user.name}`,
              entityType: 'note',
              entityId: null,
              actionUrl: '/notes-reminders',
              createdBy: req.user.name || 'Team Member'
            },
            req.io
          );
          console.log(`✉️  Public note deletion notification sent to ${userIds.length} user(s)`);
        }
      } catch (notifyError) {
        console.error('Error sending public note deletion notifications:', notifyError);
      }
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Error deleting note', error: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { noteId, attachmentId } = req.params;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const attachment = note.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Check if note is public
    const isPublic = note.visibility === 'public';
    const attachmentName = attachment.filename;

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(attachment.publicId);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
    }

    // Remove from note
    note.attachments.pull(attachmentId);
    await note.save();

    // Send notifications if note is public
    if (req.user && isPublic) {
      try {
        const employeesManagersAndAdmins = await User.find({
          isActive: true,
          role: { $in: ['employee', 'manager', 'admin'] }
        }).select('_id');

        const userIds = employeesManagersAndAdmins.map(u => u._id);

        if (userIds.length > 0) {
          await notifyMultipleUsers(
            userIds,
            {
              type: 'warning',
              category: 'note',
              title: 'File Deleted from Public Note',
              message: `File "${attachmentName}" deleted from "${note.heading}" by ${req.user.name}`,
              entityType: 'note',
              entityId: note._id,
              actionUrl: '/notes-reminders',
              createdBy: req.user.name || 'Team Member'
            },
            req.io
          );
          console.log(`✉️  Public note file deletion notification sent to ${userIds.length} user(s)`);
        }
      } catch (notifyError) {
        console.error('Error sending public note file deletion notifications:', notifyError);
      }
    }

    res.json({ success: true, message: 'Attachment deleted successfully', data: note });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ success: false, message: 'Error deleting attachment', error: error.message });
  }
};

exports.renameAttachment = async (req, res) => {
  try {
    const { noteId, attachmentId } = req.params;
    const { filename } = req.body;

    if (!filename || !filename.trim()) {
      return res.status(400).json({ success: false, message: 'Filename is required' });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const attachment = note.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Update filename
    attachment.filename = filename.trim();
    await note.save();

    res.json({ success: true, message: 'Attachment renamed successfully', data: note });
  } catch (error) {
    console.error('Error renaming attachment:', error);
    res.status(500).json({ success: false, message: 'Error renaming attachment', error: error.message });
  }
};