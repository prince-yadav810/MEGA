import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, Mail, Phone, Globe, MapPin, Edit, Bell, FileText,
  User, Star, Clock, CheckCircle, XCircle, PlayCircle, ArrowLeft, Trash2, Settings, ChevronDown, ChevronUp
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/common/Modal';
import ClientForm from '../../components/forms/ClientForm';
import PaymentReminderForm from '../../components/clients/PaymentReminderForm';
import CallLogModal from '../../components/clients/CallLogModal';
import QuotationCard from '../../components/quotations/QuotationCard';
import clientService from '../../services/clientService';
import { getQuotationsByClient } from '../../services/quotationService';
import toast from 'react-hot-toast';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [isCallLogOpen, setIsCallLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFrequencyModalOpen, setIsFrequencyModalOpen] = useState(false);
  const [showAllCalls, setShowAllCalls] = useState(false);
  const [frequencyValue, setFrequencyValue] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (id) {
      loadClientDetails();
      loadReminders();
      loadCallLogs();
    }
  }, [id]);

  useEffect(() => {
    if (client && client.companyName) {
      loadQuotations();
    }
  }, [client]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClient(id);
      if (response.success) {
        setClient(response.data);
      }
    } catch (error) {
      console.error('Error loading client details:', error);
      toast.error('Failed to load client details');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const response = await clientService.getClientReminders(id);
      if (response.success) {
        setReminders(response.data);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const loadCallLogs = async () => {
    try {
      const response = await clientService.getClientLogs(id);
      if (response.success) {
        setCallLogs(response.data);
      }
    } catch (error) {
      console.error('Error loading call logs:', error);
    }
  };

  const loadQuotations = async () => {
    if (!client || !client.companyName) return;
    
    try {
      const response = await getQuotationsByClient(client.companyName);
      if (response.success) {
        setQuotations(response.data);
      }
    } catch (error) {
      console.error('Error loading quotations:', error);
    }
  };

  const handleUpdateClient = async (clientData) => {
    try {
      setFormLoading(true);
      const response = await clientService.updateClient(id, clientData);
      if (response.success) {
        toast.success(response.message || 'Client updated successfully');
        setIsFormOpen(false);
        loadClientDetails();
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setFormLoading(false);
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

  const handleSubmitReminder = async (reminderData) => {
    try {
      setFormLoading(true);
      const response = await clientService.createReminder(id, reminderData);
      if (response.success) {
        toast.success(response.message || 'Payment reminder created successfully');
        setIsReminderFormOpen(false);
        loadReminders();
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create payment reminder');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCallLogged = () => {
    loadCallLogs();
    loadClientDetails(); // Refresh next call date
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${client.companyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await clientService.deleteClient(id);
      if (response.success) {
        toast.success('Client deleted successfully');
        navigate('/clients');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleUpdateFrequency = () => {
    const currentFreq = client.callFrequency || 10;
    setFrequencyValue(currentFreq.toString());
    setIsFrequencyModalOpen(true);
    setIsSettingsOpen(false);
  };

  const handleFrequencySubmit = async () => {
    const frequency = parseInt(frequencyValue, 10);
    if (isNaN(frequency) || frequency <= 0) {
      toast.error('Please enter a valid number of days');
      return;
    }

    try {
      await clientService.updateCallFrequency(id, frequency);
      toast.success('Call frequency updated');
      loadClientDetails();
      setIsFrequencyModalOpen(false);
      setFrequencyValue('');
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast.error('Failed to update frequency');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-gray-500 mt-2">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/clients')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Back to Clients"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{client.companyName}</h1>
              <p className="text-sm text-gray-500 mt-1">Client Details & Management</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="success"
                icon={Bell}
                onClick={() => setIsReminderFormOpen(true)}
                size="sm"
              >
                Payment Reminder
              </Button>
              <Button
                variant="secondary"
                icon={Phone}
                onClick={() => setIsCallLogOpen(true)}
                size="sm"
              >
                Log Call
              </Button>
            </div>
            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <Button
                variant="outline"
                icon={Settings}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                size="sm"
              >
                Settings
              </Button>
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <ul className="py-1">
                    <li>
                      <button
                        onClick={() => {
                          setIsFormOpen(true);
                          setIsSettingsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Client
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handleUpdateFrequency();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Change Call Frequency
                      </button>
                    </li>
                    <li className="border-t border-gray-200 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          handleDelete();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Client
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Call Frequency</p>
                    <p className="text-base text-gray-900">
                      Every {client.callFrequency || 10} days
                    </p>
                    {client.nextCallDate && (
                       <p className="text-sm text-gray-500">
                         Next call: {new Date(client.nextCallDate).toLocaleDateString()}
                       </p>
                    )}
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

            {client.tags && client.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Call History */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Call History</Card.Title>
              <div className="flex items-center gap-2">
                {callLogs.length > 5 && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={showAllCalls ? ChevronUp : ChevronDown}
                    onClick={() => setShowAllCalls(!showAllCalls)}
                  >
                    {showAllCalls ? 'View Less' : 'View All'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  icon={Phone}
                  onClick={() => setIsCallLogOpen(true)}
                >
                  Log Call
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
             {callLogs.length === 0 ? (
               <div className="text-center py-8">
                 <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                 <p className="text-gray-500">No calls logged yet.</p>
                 <Button
                   size="sm"
                   variant="primary"
                   className="mt-4"
                   onClick={() => setIsCallLogOpen(true)}
                 >
                   Log First Call
                 </Button>
               </div>
             ) : (
               <div className="flow-root">
                 <ul role="list" className="-mb-8">
                   {(showAllCalls ? callLogs : callLogs.slice(0, 5)).map((log, logIdx, array) => (
                       <li key={log._id || logIdx}>
                         <div className="relative pb-8">
                           {logIdx !== array.length - 1 ? (
                             <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                           ) : null}
                           <div className="relative flex space-x-3">
                             <div>
                               <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                 log.outcome === 'Fruitful' ? 'bg-green-500' : 
                                 log.outcome === 'Not Interested' ? 'bg-red-500' : 
                                 log.outcome === 'Callback Requested' ? 'bg-blue-500' :
                                 log.outcome === 'Need to Visit' ? 'bg-purple-500' :
                                 'bg-gray-500'
                               }`}>
                                 <Phone className="h-5 w-5 text-white" aria-hidden="true" />
                               </span>
                             </div>
                             <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                               <div>
                                 <p className="text-sm text-gray-500">
                                   <span className="font-medium text-gray-900">{log.outcome}</span>
                                   {log.performedBy?.name && <span className="text-gray-500"> by {log.performedBy.name}</span>}
                                 </p>
                                 {log.notes && (
                                   <p className="mt-1 text-sm text-gray-700">{log.notes}</p>
                                 )}
                               </div>
                               <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                 <time dateTime={log.date}>{new Date(log.date).toLocaleDateString()}</time>
                               </div>
                             </div>
                           </div>
                         </div>
                       </li>
                     ))}
                 </ul>
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
                onClick={() => setIsReminderFormOpen(true)}
              >
                New Reminder
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            {reminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No payment reminders yet</p>
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-4"
                  onClick={() => setIsReminderFormOpen(true)}
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

        {/* Quotations */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Quotations</Card.Title>
                <Card.Description>
                  {quotations.length} quotation{quotations.length !== 1 ? 's' : ''} for this client
                </Card.Description>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={FileText}
                onClick={() => navigate('/quotations')}
              >
                View All
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            {quotations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No quotations found for this client</p>
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-4"
                  onClick={() => navigate('/quotations')}
                >
                  Go to Quotations
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quotations.map((quotation) => (
                  <QuotationCard key={quotation._id} quotation={quotation} />
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Modals */}
      <ClientForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdateClient}
        initialData={client}
        isLoading={formLoading}
      />

      <PaymentReminderForm
        isOpen={isReminderFormOpen}
        onClose={() => setIsReminderFormOpen(false)}
        onSubmit={handleSubmitReminder}
        client={client}
        isLoading={formLoading}
      />

      <CallLogModal
        isOpen={isCallLogOpen}
        onClose={() => setIsCallLogOpen(false)}
        client={client}
        onSuccess={handleCallLogged}
      />

      {/* Call Frequency Modal */}
      <Modal
        isOpen={isFrequencyModalOpen}
        onClose={() => {
          setIsFrequencyModalOpen(false);
          setFrequencyValue('');
        }}
        title="Update Call Frequency"
        size="sm"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsFrequencyModalOpen(false);
                setFrequencyValue('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleFrequencySubmit}>
              Update
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Set how often you want to call this client (in days).
          </p>
          <Input
            label="Call Frequency (days)"
            type="number"
            min="1"
            value={frequencyValue}
            onChange={(e) => setFrequencyValue(e.target.value)}
            placeholder="Enter number of days"
            helper="Enter the number of days between calls"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ClientDetails;
