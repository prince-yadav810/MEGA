// File path: client/src/pages/Admin/NotesReminders.jsx
// REPLACE entire file with this

import React, { useState, useEffect } from 'react';
import { Plus, Pin, Edit2, Trash2, X, Calendar, Clock, Repeat, Bell, Copy, Check, ChevronDown, ChevronUp, Upload, File, FileText, FileSpreadsheet, Image as ImageIcon, Download, Paperclip } from 'lucide-react';
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
  const [expandedNotes, setExpandedNotes] = useState({});
  const [copiedNoteId, setCopiedNoteId] = useState(null);
  const { addNotification } = useNotifications();

  // Note form state
  const [noteForm, setNoteForm] = useState({ heading: '', content: '' });
  
  // File management state (separate section)
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileNote, setFileNote] = useState('');
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    title: '',
    reminderDate: '',
    reminderTime: '',
    repeatFrequency: 'none',
    isAdvanced: false,
    customInterval: 1,
    customIntervalUnit: 'days',
    weeklyDays: [],
    monthlyType: 'date',
    monthlyDate: 1,
    monthlyWeekNumber: 1,
    monthlyWeekDay: 1,
    alertTimes: [],
    startDate: '',
    endDate: ''
  });

  const [newAlertTime, setNewAlertTime] = useState('');

  const colors = ['#FFE5E5', '#FFF4E5', '#E5F5FF', '#F0E5FF', '#E5FFE5', '#FFE5F5'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const allowedFileTypes = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];

  useEffect(() => {
    fetchData();
    fetchFiles();
    const interval = setInterval(checkDueReminders, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchFiles = async () => {
    try {
      // Fetch all notes and reminders with attachments to display in Files section
      const [notesRes, remindersRes] = await Promise.all([
        noteService.getAllNotes(),
        reminderService.getAllReminders()
      ]);
      
      const allFiles = [];
      
      // Extract files from notes
      if (notesRes.success && notesRes.data) {
        notesRes.data.forEach(note => {
          if (note.attachments && note.attachments.length > 0) {
            note.attachments.forEach(att => {
              allFiles.push({
                ...att,
                sourceType: 'note',
                sourceId: note._id,
                sourceName: note.heading,
                noteContent: note.content
              });
            });
          }
        });
      }
      
      // Extract files from reminders
      if (remindersRes.success && remindersRes.data) {
        remindersRes.data.forEach(reminder => {
          if (reminder.attachments && reminder.attachments.length > 0) {
            reminder.attachments.forEach(att => {
              allFiles.push({
                ...att,
                sourceType: 'reminder',
                sourceId: reminder._id,
                sourceName: reminder.title,
                noteContent: ''
              });
            });
          }
        });
      }
      
      setFiles(allFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
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
            message: `${reminder.title} ${reminder.triggeredTime ? `at ${reminder.triggeredTime}` : ''}`
          });
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  // File helper functions
  const getFileIcon = (fileType) => {
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) {
      return <ImageIcon className="h-5 w-5" />;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(type)) {
      return <FileText className="h-5 w-5" />;
    } else if (['xls', 'xlsx'].includes(type)) {
      return <FileSpreadsheet className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // File management functions
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types
    const invalidFiles = selectedFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return !allowedFileTypes.includes(ext);
    });
    
    if (invalidFiles.length > 0) {
      toast.error(`Invalid file type. Allowed: ${allowedFileTypes.join(', ')}`);
      return;
    }
    
    // Add to uploading queue
    setUploadingFiles([...uploadingFiles, ...selectedFiles]);
    toast.success(`${selectedFiles.length} file(s) selected. Click on each to add details and save.`);
  };

  const openFileModal = (file) => {
    setCurrentFile(file);
    setFileNote('');
    setShowFileUploadModal(true);
  };

  const handleSaveFile = async () => {
    if (!currentFile) return;
    
    try {
      // Create a note with this file as attachment
      const noteData = {
        heading: currentFile.name,
        content: fileNote || 'File attachment'
      };
      
      const response = await noteService.createNote(noteData, [currentFile]);
      
      if (response.success) {
        // Remove from uploading queue
        setUploadingFiles(uploadingFiles.filter(f => f !== currentFile));
        setShowFileUploadModal(false);
        setCurrentFile(null);
        setFileNote('');
        
        // Refresh files
        await fetchFiles();
        await fetchData();
        
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      toast.error('Error uploading file');
    }
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      let response;
      if (file.sourceType === 'note') {
        response = await noteService.deleteAttachment(file.sourceId, file._id);
      } else {
        response = await reminderService.deleteAttachment(file.sourceId, file._id);
      }
      
      if (response.success) {
        toast.success('File deleted successfully');
        await fetchFiles();
        await fetchData();
      }
    } catch (error) {
      toast.error('Error deleting file');
    }
  };

  const startRenameFile = (file) => {
    setRenamingFile(file);
    setRenameValue(file.filename);
  };

  const cancelRename = () => {
    setRenamingFile(null);
    setRenameValue('');
  };

  const handleRenameFile = async () => {
    if (!renameValue.trim() || !renamingFile) {
      toast.error('Filename cannot be empty');
      return;
    }

    try {
      let response;
      if (renamingFile.sourceType === 'note') {
        response = await noteService.renameAttachment(renamingFile.sourceId, renamingFile._id, renameValue);
      } else {
        response = await reminderService.renameAttachment(renamingFile.sourceId, renamingFile._id, renameValue);
      }
      
      if (response.success) {
        toast.success('File renamed successfully');
        cancelRename();
        await fetchFiles();
        await fetchData();
      }
    } catch (error) {
      toast.error('Error renaming file');
    }
  };

  const downloadFile = (url) => {
    window.open(url, '_blank');
  };

  const removeUploadingFile = (file) => {
    setUploadingFiles(uploadingFiles.filter(f => f !== file));
  };

  // Note handlers
  const handleCreateNote = async () => {
    if (!noteForm.heading.trim() || !noteForm.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await noteService.createNote(noteForm, null);
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
      const response = await noteService.updateNote(editingNote._id, noteForm, null);
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

  const handleCopyNote = async (noteId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedNoteId(noteId);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedNoteId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const toggleNoteExpansion = (noteId) => {
    setExpandedNotes(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  // Reminder handlers
  const handleCreateReminder = async () => {
    if (!reminderForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!reminderForm.isAdvanced && (!reminderForm.reminderDate || !reminderForm.reminderTime)) {
      toast.error('Date and time are required');
      return;
    }

    if (reminderForm.isAdvanced && (!reminderForm.startDate || !reminderForm.reminderTime)) {
      toast.error('Start date and time are required');
      return;
    }

    try {
      const dataToSend = { ...reminderForm };
      if (reminderForm.isAdvanced) {
        dataToSend.reminderDate = reminderForm.startDate;
      }

      const response = await reminderService.createReminder(dataToSend, null);
      if (response.success) {
        setReminders([response.data, ...reminders]);
        resetReminderForm();
        setShowReminderModal(false);
        toast.success('Reminder created successfully');
      }
    } catch (error) {
      toast.error('Error creating reminder');
    }
  };

  const handleUpdateReminder = async () => {
    if (!reminderForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const dataToSend = { ...reminderForm };
      if (reminderForm.isAdvanced) {
        dataToSend.reminderDate = reminderForm.startDate;
      }

      const response = await reminderService.updateReminder(editingReminder._id, dataToSend, null);
      if (response.success) {
        setReminders(reminders.map(r => r._id === editingReminder._id ? response.data : r));
        resetReminderForm();
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

  const resetReminderForm = () => {
    setReminderForm({
      title: '',
      reminderDate: '',
      reminderTime: '',
      repeatFrequency: 'none',
      isAdvanced: false,
      customInterval: 1,
      customIntervalUnit: 'days',
      weeklyDays: [],
      monthlyType: 'date',
      monthlyDate: 1,
      monthlyWeekNumber: 1,
      monthlyWeekDay: 1,
      alertTimes: [],
      startDate: '',
      endDate: ''
    });
    setNewAlertTime('');
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
        reminderDate: reminder.reminderDate ? new Date(reminder.reminderDate).toISOString().split('T')[0] : '',
        reminderTime: reminder.reminderTime,
        repeatFrequency: reminder.repeatFrequency,
        isAdvanced: reminder.isAdvanced || false,
        customInterval: reminder.customInterval || 1,
        customIntervalUnit: reminder.customIntervalUnit || 'days',
        weeklyDays: reminder.weeklyDays || [],
        monthlyType: reminder.monthlyType || 'date',
        monthlyDate: reminder.monthlyDate || 1,
        monthlyWeekNumber: reminder.monthlyWeekNumber || 1,
        monthlyWeekDay: reminder.monthlyWeekDay || 1,
        alertTimes: reminder.alertTimes || [],
        startDate: reminder.startDate ? new Date(reminder.startDate).toISOString().split('T')[0] : '',
        endDate: reminder.endDate ? new Date(reminder.endDate).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingReminder(null);
      resetReminderForm();
    }
    setShowReminderModal(true);
  };

  const toggleWeekDay = (day) => {
    setReminderForm(prev => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(day)
        ? prev.weeklyDays.filter(d => d !== day)
        : [...prev.weeklyDays, day]
    }));
  };

  const addAlertTime = () => {
    if (newAlertTime && !reminderForm.alertTimes.includes(newAlertTime)) {
      setReminderForm(prev => ({
        ...prev,
        alertTimes: [...prev.alertTimes, newAlertTime].sort()
      }));
      setNewAlertTime('');
    }
  };

  const removeAlertTime = (time) => {
    setReminderForm(prev => ({
      ...prev,
      alertTimes: prev.alertTimes.filter(t => t !== time)
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRepeatPattern = (reminder) => {
    if (reminder.repeatFrequency === 'none') return 'One-time';
    if (reminder.repeatFrequency === 'daily') return 'Daily';
    if (reminder.repeatFrequency === 'yearly') return 'Yearly';
    
    if (reminder.repeatFrequency === 'weekly') {
      if (reminder.weeklyDays && reminder.weeklyDays.length > 0) {
        return `Weekly on ${reminder.weeklyDays.map(d => weekDays[d]).join(', ')}`;
      }
      return 'Weekly';
    }
    
    if (reminder.repeatFrequency === 'monthly') {
      if (reminder.monthlyType === 'weekday') {
        const weekNum = ['First', 'Second', 'Third', 'Fourth', 'Last'][reminder.monthlyWeekNumber === -1 ? 4 : reminder.monthlyWeekNumber - 1];
        return `Monthly on ${weekNum} ${weekDays[reminder.monthlyWeekDay]}`;
      }
      return `Monthly on day ${reminder.monthlyDate}`;
    }
    
    if (reminder.repeatFrequency === 'custom') {
      return `Every ${reminder.customInterval} ${reminder.customIntervalUnit}`;
    }
    
    return reminder.repeatFrequency;
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
            {notes.map((note) => {
              const isExpanded = expandedNotes[note._id];
              const isLongText = note.content.length > 150;
              const displayText = isExpanded || !isLongText ? note.content : note.content.slice(0, 150);

              return (
                <div
                  key={note._id}
                  className="relative group rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col"
                  style={{ 
                    backgroundColor: note.color,
                    minHeight: '200px'
                  }}
                >
                  {/* Pin icon */}
                  {note.isPinned && (
                    <Pin className="absolute top-2 right-2 h-5 w-5 text-gray-700 fill-current" />
                  )}

                  {/* Note content */}
                  <div className="flex-1 mb-2">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{note.heading}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {displayText}
                      {isLongText && !isExpanded && '...'}
                    </p>
                    {isLongText && (
                      <button
                        onClick={() => toggleNoteExpansion(note._id)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 flex items-center space-x-1"
                      >
                        <span>{isExpanded ? 'less' : 'more'}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                  </div>

                  {/* Footer - at bottom */}
                  <div className="mt-auto pt-2 border-t border-gray-400/20">
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
                        onClick={() => handleCopyNote(note._id, note.content)}
                        className="p-1.5 bg-white/80 hover:bg-white rounded-md transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedNoteId === note._id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
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
              );
            })}

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
                  <div key={reminder._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Bell className="h-5 w-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {reminder.isAdvanced && reminder.startDate 
                                ? `${formatDate(reminder.startDate)}${reminder.endDate ? ` - ${formatDate(reminder.endDate)}` : ''}`
                                : formatDate(reminder.reminderDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {reminder.alertTimes && reminder.alertTimes.length > 0
                                ? reminder.alertTimes.join(', ')
                                : reminder.reminderTime}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Repeat className="h-4 w-4" />
                            <span>{getRepeatPattern(reminder)}</span>
                          </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                <input
                  type="text"
                  value={noteForm.heading}
                  onChange={(e) => setNoteForm({ ...noteForm, heading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter note heading"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
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

      {/* Reminder Modal - Continued in next part due to length */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingReminder ? 'Edit Reminder' : 'Create Reminder'}
              </h3>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setEditingReminder(null);
                  resetReminderForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter reminder title"
                />
              </div>

              {/* Advanced Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="advancedToggle"
                  checked={reminderForm.isAdvanced}
                  onChange={(e) => setReminderForm({ ...reminderForm, isAdvanced: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="advancedToggle" className="text-sm font-medium text-gray-700">
                  Advanced Options
                </label>
              </div>

              {/* Simple Mode */}
              {!reminderForm.isAdvanced && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        value={reminderForm.reminderDate}
                        onChange={(e) => setReminderForm({ ...reminderForm, reminderDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                      <input
                        type="time"
                        value={reminderForm.reminderTime}
                        onChange={(e) => setReminderForm({ ...reminderForm, reminderTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
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
                </>
              )}

              {/* Advanced Mode */}
              {reminderForm.isAdvanced && (
                <>
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={reminderForm.startDate}
                        onChange={(e) => setReminderForm({ ...reminderForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={reminderForm.endDate}
                        onChange={(e) => setReminderForm({ ...reminderForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Time *</label>
                    <input
                      type="time"
                      value={reminderForm.reminderTime}
                      onChange={(e) => setReminderForm({ ...reminderForm, reminderTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Multiple Alert Times */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alert Times (Optional - Multiple alerts per day)
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="time"
                        value={newAlertTime}
                        onChange={(e) => setNewAlertTime(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Add alert time"
                      />
                      <button
                        onClick={addAlertTime}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reminderForm.alertTimes.map((time) => (
                        <span
                          key={time}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          <Clock className="h-3 w-3" />
                          <span>{time}</span>
                          <button
                            onClick={() => removeAlertTime(time)}
                            className="ml-1 hover:text-primary-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Repeat Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Pattern</label>
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
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {/* Weekly Days Selection */}
                  {reminderForm.repeatFrequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day, index) => (
                          <button
                            key={day}
                            onClick={() => toggleWeekDay(index)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              reminderForm.weeklyDays.includes(index)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Options */}
                  {reminderForm.repeatFrequency === 'monthly' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Pattern</label>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={reminderForm.monthlyType === 'date'}
                              onChange={() => setReminderForm({ ...reminderForm, monthlyType: 'date' })}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">On specific date</span>
                          </label>
                          {reminderForm.monthlyType === 'date' && (
                            <select
                              value={reminderForm.monthlyDate}
                              onChange={(e) => setReminderForm({ ...reminderForm, monthlyDate: parseInt(e.target.value) })}
                              className="ml-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                                <option key={date} value={date}>Day {date}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        
                        <div className="space-y-2 mt-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={reminderForm.monthlyType === 'weekday'}
                              onChange={() => setReminderForm({ ...reminderForm, monthlyType: 'weekday' })}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">On specific week and day</span>
                          </label>
                          {reminderForm.monthlyType === 'weekday' && (
                            <div className="ml-6 grid grid-cols-2 gap-2">
                              <select
                                value={reminderForm.monthlyWeekNumber}
                                onChange={(e) => setReminderForm({ ...reminderForm, monthlyWeekNumber: parseInt(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value={1}>First</option>
                                <option value={2}>Second</option>
                                <option value={3}>Third</option>
                                <option value={4}>Fourth</option>
                                <option value={-1}>Last</option>
                              </select>
                              <select
                                value={reminderForm.monthlyWeekDay}
                                onChange={(e) => setReminderForm({ ...reminderForm, monthlyWeekDay: parseInt(e.target.value) })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                {weekDays.map((day, index) => (
                                  <option key={day} value={index}>{day}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom Interval */}
                  {reminderForm.repeatFrequency === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Every</label>
                        <input
                          type="number"
                          min="1"
                          value={reminderForm.customInterval}
                          onChange={(e) => setReminderForm({ ...reminderForm, customInterval: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                          value={reminderForm.customIntervalUnit}
                          onChange={(e) => setReminderForm({ ...reminderForm, customIntervalUnit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setEditingReminder(null);
                  resetReminderForm();
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

      {/* File Upload Modal */}
      {showFileUploadModal && currentFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
              <button
                onClick={() => {
                  setShowFileUploadModal(false);
                  setCurrentFile(null);
                  setFileNote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-primary-600">
                  {getFileIcon(currentFile.name.split('.').pop())}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{currentFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(currentFile.size)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add a Note (Optional)
                </label>
                <textarea
                  value={fileNote}
                  onChange={(e) => setFileNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Add a description or note about this file..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowFileUploadModal(false);
                  setCurrentFile(null);
                  setFileNote('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFile}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Files & Documents</h2>
            <p className="text-sm text-gray-600 mt-1">Upload and manage your important files and credentials</p>
          </div>
          <div>
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Files</span>
            </label>
          </div>
        </div>

        {/* Uploading Queue */}
        {uploadingFiles.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              Files Ready to Upload ({uploadingFiles.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uploadingFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="text-primary-600 flex-shrink-0">
                      {getFileIcon(file.name.split('.').pop())}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => openFileModal(file)}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Add details and upload"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeUploadingFile(file)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {files.length === 0 && uploadingFiles.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Upload className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No files uploaded yet</h3>
            <p className="text-gray-600 mb-4">
              Start by uploading your important documents and files
            </p>
            <label
              htmlFor="file-upload"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Your First File</span>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file._id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="text-primary-600 flex-shrink-0">
                      {getFileIcon(file.fileType)}
                    </div>
                    {renamingFile && renamingFile._id === file._id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameFile();
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{file.filename}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {file.noteContent && (
                  <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                    <p className="line-clamp-2">{file.noteContent}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500 capitalize">
                    {file.sourceType}
                  </span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {renamingFile && renamingFile._id === file._id ? (
                      <>
                        <button
                          onClick={handleRenameFile}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => downloadFile(file.url)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => startRenameFile(file)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesReminders;