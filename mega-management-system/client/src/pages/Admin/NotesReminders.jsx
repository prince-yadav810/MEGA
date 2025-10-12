// File path: client/src/pages/Admin/NotesReminders.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Pin, Edit2, Trash2, X, Calendar, Clock, Repeat, Bell } from 'lucide-react';
import noteService from '../../services/noteService';
import reminderService from '../../services/reminderService';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

const NotesReminders = () => {
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editingReminder, setEditingReminder] = useState(null);
  const { addNotification } = useNotifications();

  // Note form state
  const [noteForm, setNoteForm] = useState({
    heading: '',
    content: ''
  });

  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    title: '',
    reminderDate: '',
    reminderTime: '',
    repeatFrequency: 'none'
  });

  const colors = ['#FFE5E5', '#FFF4E5', '#E5F5FF', '#F0E5FF', '#E5FFE5', '#FFE5F5'];

  useEffect(() => {
    fetchData();
    // Check for due reminders every minute
    const interval = setInterval(checkDueReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesRes, remindersRes] = await Promise.all([
        noteService.getAllNotes(),
        reminderService.getAllReminders()
      ]);
      
      if (notesRes.success) setNotes(notesRes.data);
      if (remindersRes.success) setReminders(remindersRes.data);
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const checkDueReminders = async () => {
    try {
      const response = await reminderService.checkDueReminders();
      if (response.success && response.data.length > 0) {
        response.data.forEach(reminder => {
          addNotification({
            type: 'info',
            title: '🔔 Reminder',
            message: reminder.title
          });
        });
        fetchData(); // Refresh reminders list
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  // Note handlers
  const handleCreateNote = async () => {
    if (!noteForm.heading.trim() || !noteForm.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await noteService.createNote(noteForm);
      if (response.success) {
        setNotes([response.data, ...notes]);
        setNoteForm({ heading: '', content: '' });
        setShowNoteModal(false);
        toast.success('Note created successfully');
      }
    } catch (error) {
      toast.error('Error creating note');
    }
  };

  const handleUpdateNote = async () => {
    if (!noteForm.heading.trim() || !noteForm.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await noteService.updateNote(editingNote._id, noteForm);
      if (response.success) {
        setNotes(notes.map(n => n._id === editingNote._id ? response.data : n));
        setNoteForm({ heading: '', content: '' });
        setEditingNote(null);
        setShowNoteModal(false);
        toast.success('Note updated successfully');
      }
    } catch (error) {
      toast.error('Error updating note');
    }
  };

  const handleTogglePin = async (noteId) => {
    try {
      const response = await noteService.togglePin(noteId);
      if (response.success) {
        setNotes(notes.map(n => n._id === noteId ? response.data : n).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        }));
      }
    } catch (error) {
      toast.error('Error toggling pin');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await noteService.deleteNote(noteId);
      if (response.success) {
        setNotes(notes.filter(n => n._id !== noteId));
        toast.success('Note deleted successfully');
      }
    } catch (error) {
      toast.error('Error deleting note');
    }
  };

  // Reminder handlers
  const handleCreateReminder = async () => {
    if (!reminderForm.title.trim() || !reminderForm.reminderDate || !reminderForm.reminderTime) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await reminderService.createReminder(reminderForm);
      if (response.success) {
        setReminders([response.data, ...reminders]);
        setReminderForm({ title: '', reminderDate: '', reminderTime: '', repeatFrequency: 'none' });
        setShowReminderModal(false);
        toast.success('Reminder created successfully');
      }
    } catch (error) {
      toast.error('Error creating reminder');
    }
  };

  const handleUpdateReminder = async () => {
    if (!reminderForm.title.trim() || !reminderForm.reminderDate || !reminderForm.reminderTime) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await reminderService.updateReminder(editingReminder._id, reminderForm);
      if (response.success) {
        setReminders(reminders.map(r => r._id === editingReminder._id ? response.data : r));
        setReminderForm({ title: '', reminderDate: '', reminderTime: '', repeatFrequency: 'none' });
        setEditingReminder(null);
        setShowReminderModal(false);
        toast.success('Reminder updated successfully');
      }
    } catch (error) {
      toast.error('Error updating reminder');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await reminderService.deleteReminder(reminderId);
      if (response.success) {
        setReminders(reminders.filter(r => r._id !== reminderId));
        toast.success('Reminder deleted successfully');
      }
    } catch (error) {
      toast.error('Error deleting reminder');
    }
  };

  const openNoteModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({ heading: note.heading, content: note.content });
    } else {
      setEditingNote(null);
      setNoteForm({ heading: '', content: '' });
    }
    setShowNoteModal(true);
  };

  const openReminderModal = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      setReminderForm({
        title: reminder.title,
        reminderDate: new Date(reminder.reminderDate).toISOString().split('T')[0],
        reminderTime: reminder.reminderTime,
        repeatFrequency: reminder.repeatFrequency
      });
    } else {
      setEditingReminder(null);
      setReminderForm({ title: '', reminderDate: '', reminderTime: '', repeatFrequency: 'none' });
    }
    setShowReminderModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6 sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notes & Reminders</h1>
            <p className="text-gray-600 mt-1">Keep track of important information and set reminders</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-8">
        {/* Notes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
            <button
              onClick={() => openNoteModal()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Note</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note) => (
              <div
                key={note._id}
                className="relative group rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200"
                style={{ 
                  backgroundColor: note.color,
                  minHeight: '180px'
                }}
              >
                {/* Pin icon */}
                {note.isPinned && (
                  <Pin className="absolute top-2 right-2 h-5 w-5 text-gray-700 fill-current" />
                )}

                {/* Note content */}
                <div className="mb-12">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{note.heading}</h3>
                  <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                </div>

                {/* Footer with timestamp and creator */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-xs text-gray-600 mb-2">
                    by {note.createdByName} • {formatDate(note.createdAt)}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleTogglePin(note._id)}
                      className="p-1.5 bg-white/80 hover:bg-white rounded-md transition-colors"
                      title={note.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={`h-4 w-4 ${note.isPinned ? 'text-primary-600 fill-current' : 'text-gray-600'}`} />
                    </button>
                    <button
                      onClick={() => openNoteModal(note)}
                      className="p-1.5 bg-white/80 hover:bg-white rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="p-1.5 bg-white/80 hover:bg-white rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-600">No notes yet. Create your first note!</p>
              </div>
            )}
          </div>
        </div>

        {/* Reminders Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Reminders</h2>
            <button
              onClick={() => openReminderModal()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Reminder</span>
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {reminders.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {reminders.map((reminder) => (
                  <div
                    key={reminder._id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Bell className="h-5 w-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(reminder.reminderDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{reminder.reminderTime}</span>
                          </div>
                          {reminder.repeatFrequency !== 'none' && (
                            <div className="flex items-center space-x-1">
                              <Repeat className="h-4 w-4" />
                              <span className="capitalize">{reminder.repeatFrequency}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Created by {reminder.createdByName}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openReminderModal(reminder)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⏰</div>
                <p className="text-gray-600">No reminders yet. Create your first reminder!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingNote ? 'Edit Note' : 'Create Note'}
              </h3>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setEditingNote(null);
                  setNoteForm({ heading: '', content: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heading
                </label>
                <input
                  type="text"
                  value={noteForm.heading}
                  onChange={(e) => setNoteForm({ ...noteForm, heading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter note heading"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Write your note here..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setEditingNote(null);
                  setNoteForm({ heading: '', content: '' });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingNote ? handleUpdateNote : handleCreateNote}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingNote ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingReminder ? 'Edit Reminder' : 'Create Reminder'}
              </h3>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setEditingReminder(null);
                  setReminderForm({ title: '', reminderDate: '', reminderTime: '', repeatFrequency: 'none' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter reminder title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={reminderForm.reminderDate}
                  onChange={(e) => setReminderForm({ ...reminderForm, reminderDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={reminderForm.reminderTime}
                  onChange={(e) => setReminderForm({ ...reminderForm, reminderTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat
                </label>
                <select
                  value={reminderForm.repeatFrequency}
                  onChange={(e) => setReminderForm({ ...reminderForm, repeatFrequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="none">No Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setEditingReminder(null);
                  setReminderForm({ title: '', reminderDate: '', reminderTime: '', repeatFrequency: 'none' });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingReminder ? handleUpdateReminder : handleCreateReminder}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingReminder ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesReminders;