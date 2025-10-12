// File Path: client/src/components/clients/ClientDetailsModal.jsx

import React, { useState, useEffect } from 'react';
import {
  Building2, Mail, Phone, Globe, MapPin, Edit, Bell, FileText,
  User, Star, Clock, CheckCircle, XCircle, PlayCircle, PauseCircle
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import clientService from '../../services/clientService';
import toast from 'react-hot-toast';

const ClientDetailsModal = ({ 
  isOpen, 
  onClose, 
  client, 
  onEdit,
  onCreateReminder,
  onRefresh 
}) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      loadReminders();
    }
  }, [isOpen, client]);

  const loadReminders = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      const response = await clientService.getClientReminders(client._id || client.id);
      if (response.success) {
        setReminders(response.data);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to stop this reminder campaign?')) return;

    try {
      const response = await clientService.stopReminder(reminderId, 'Manually stopped by user');
      if (response.success) {
        toast.success('Reminder stopped successfully');
        loadReminders();
      }
    } catch (error) {
      toast.error('Failed to stop reminder');
    }
  };

  const handleResumeReminder = async (reminderId) => {
    try {
      const response = await clientService.resumeReminder(reminderId);
      if (response.success) {
        toast.success('Reminder resumed successfully');
        loadReminders();
      }
    } catch (error) {
      toast.error('Failed to resume reminder');
    }
  };

  const handleSendManually = async (reminderId) => {
    if (!window.confirm('Send reminder message now?')) return;

    try {
      const response = await clientService.sendReminderManually(reminderId);
      if (response.success) {
        toast.success('Reminder sent successfully');
        loadReminders();
      }
    } catch (error) {
      toast.error('Failed to send reminder');
    }
  };

  if (!client) return null;

  const primaryContact = client.contactPersons?.find(c => c.isPrimary) || client.contactPersons?.[0];

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'success', text: 'Active' },
      completed: { color: 'primary', text: 'Completed' },
      stopped: { color: 'error', text: 'Stopped' },
      paused: { color: 'warning', text: 'Paused' }
    };
    const badge = badges[status] || badges.active;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${badge.color}-100 text-${badge.color}-700`}>
        {badge.text}
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client.companyName}
      size="full"
      fullScreen={true}
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            icon={Edit}
            onClick={() => onEdit(client)}
            size="sm"
          >
            Edit Client
          </Button>
          <Button
            variant="success"
            icon={Bell}
            onClick={() => onCreateReminder(client)}
            size="sm"
          >
            Payment Reminder
          </Button>
        </div>

        {/* Company Information */}
        <Card>
          <Card.Header>
            <Card.Title>Company Information</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company Name</p>
                    <p className="text-base text-gray-900">{client.companyName}</p>
                  </div>
                </div>

                {client.businessType && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Business Type</p>
                      <p className="text-base text-gray-900">{client.businessType}</p>
                    </div>
                  </div>
                )}

                {client.companyWebsite && (
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Website</p>
                      <a 
                        href={client.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-primary-600 hover:underline"
                      >
                        {client.companyWebsite}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {(client.address?.street || client.address?.city) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-base text-gray-900">
                        {[
                          client.address.street,
                          client.address.city,
                          client.address.state,
                          client.address.pincode,
                          client.address.country
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full ${
                      client.isActive ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {client.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                <p className="text-base text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Contact Persons */}
        <Card>
          <Card.Header>
            <Card.Title>Contact Persons</Card.Title>
            <Card.Description>
              {client.contactPersons?.length} contact{client.contactPersons?.length !== 1 ? 's' : ''}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.contactPersons?.map((contact, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <h4 className="font-medium text-gray-900">{contact.name}</h4>
                    {contact.isPrimary && (
                      <Star className="h-4 w-4 text-warning-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {contact.designation && (
                      <p className="text-gray-600">{contact.designation}</p>
                    )}
                    {contact.phone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.whatsappNumber && (
                      <div className="flex items-center space-x-2 text-success-600">
                        <Bell className="h-4 w-4" />
                        <span>{contact.whatsappNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Payment Reminders */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Payment Reminders</Card.Title>
                <Card.Description>
                  {reminders.length} reminder campaign{reminders.length !== 1 ? 's' : ''}
                </Card.Description>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={Bell}
                onClick={() => onCreateReminder(client)}
              >
                New Reminder
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            {loading ? (
              <p className="text-center text-gray-500 py-4">Loading reminders...</p>
            ) : reminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No payment reminders yet</p>
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-4"
                  onClick={() => onCreateReminder(client)}
                >
                  Create First Reminder
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder._id || reminder.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusBadge(reminder.status)}
                          {reminder.invoiceNumber && (
                            <span className="text-sm text-gray-600">
                              Invoice: <strong>{reminder.invoiceNumber}</strong>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{reminder.messageTemplate}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Frequency</p>
                        <p className="font-medium">{reminder.frequencyInDays} days</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Progress</p>
                        <p className="font-medium">
                          {reminder.messagesSent} / {reminder.totalMessagesToSend}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Sent</p>
                        <p className="font-medium">
                          {reminder.lastSentDate 
                            ? new Date(reminder.lastSentDate).toLocaleDateString()
                            : 'Not sent yet'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Next Scheduled</p>
                        <p className="font-medium">
                          {reminder.nextScheduledDate
                            ? new Date(reminder.nextScheduledDate).toLocaleDateString()
                            : '-'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {reminder.status === 'active' && (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            icon={XCircle}
                            onClick={() => handleStopReminder(reminder._id || reminder.id)}
                          >
                            Stop
                          </Button>
                          <Button
                            size="xs"
                            variant="primary"
                            icon={PlayCircle}
                            onClick={() => handleSendManually(reminder._id || reminder.id)}
                          >
                            Send Now
                          </Button>
                        </>
                      )}
                      {(reminder.status === 'stopped' || reminder.status === 'paused') && (
                        <Button
                          size="xs"
                          variant="success"
                          icon={PlayCircle}
                          onClick={() => handleResumeReminder(reminder._id || reminder.id)}
                        >
                          Resume
                        </Button>
                      )}
                      {reminder.status === 'completed' && (
                        <span className="flex items-center text-sm text-success-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Campaign Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Quotations Section - Coming Soon */}
        <Card>
          <Card.Header>
            <Card.Title>Quotations</Card.Title>
            <Card.Description>View all quotations for this client</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-500">
                Quotation management feature will be available soon
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>
    </Modal>
  );
};

export default ClientDetailsModal;