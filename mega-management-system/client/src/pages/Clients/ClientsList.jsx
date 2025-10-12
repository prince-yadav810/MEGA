// File Path: client/src/pages/Clients/ClientsList.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Tag } from 'lucide-react';
import ClientCard from '../../components/clients/ClientCard';
import ClientForm from '../../components/forms/ClientForm';
import ClientDetailsModal from '../../components/clients/ClientDetailsModal';
import PaymentReminderForm from '../../components/clients/PaymentReminderForm';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import clientService from '../../services/clientService';
import toast from 'react-hot-toast';

const ClientsList = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filterStatus, selectedTags]);

  useEffect(() => {
    // Extract all unique tags from clients
    const tags = new Set();
    clients.forEach(client => {
      if (client.tags && Array.isArray(client.tags)) {
        client.tags.forEach(tag => tags.add(tag));
      }
    });
    setAvailableTags(Array.from(tags).sort());
  }, [clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getAllClients();
      if (response.success) {
        setClients(response.data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };


  const filterClients = () => {
    let filtered = [...clients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client => {
        const searchLower = searchTerm.toLowerCase();
        return (
          client.companyName.toLowerCase().includes(searchLower) ||
          client.businessType?.toLowerCase().includes(searchLower) ||
          client.contactPersons?.some(contact => 
            contact.name.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower)
          ) ||
          client.address?.city?.toLowerCase().includes(searchLower) ||
          client.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(client => client.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(client => !client.isActive);
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(client => {
        return selectedTags.every(tag => client.tags?.includes(tag));
      });
    }

    setFilteredClients(filtered);
  };

  const toggleTagFilter = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleCreateClient = async (clientData) => {
    try {
      setFormLoading(true);
      const response = await clientService.createClient(clientData);
      if (response.success) {
        toast.success(response.message || 'Client created successfully');
        setIsFormOpen(false);
        loadClients();
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClient = async (clientData) => {
    try {
      setFormLoading(true);
      const response = await clientService.updateClient(editingClient._id || editingClient.id, clientData);
      if (response.success) {
        toast.success(response.message || 'Client updated successfully');
        setIsFormOpen(false);
        setEditingClient(null);
        loadClients();
        
        // Update selected client if details modal is open
        if (selectedClient && (selectedClient._id === editingClient._id || selectedClient.id === editingClient.id)) {
          setSelectedClient(response.data);
        }
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setFormLoading(false);
    }
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleEditClick = (client) => {
    setEditingClient(client);
    setIsFormOpen(true);
    setIsDetailsOpen(false);
  };

  const handleCreateReminder = (client) => {
    setSelectedClient(client);
    setIsReminderFormOpen(true);
    setIsDetailsOpen(false);
  };

  const handleSubmitReminder = async (reminderData) => {
    try {
      setFormLoading(true);
      const response = await clientService.createReminder(selectedClient._id || selectedClient.id, reminderData);
      if (response.success) {
        toast.success(response.message || 'Payment reminder created successfully');
        setIsReminderFormOpen(false);
        setIsDetailsOpen(true); // Reopen details modal
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create payment reminder');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    // Remove from local state
    setClients(prev => prev.filter(c => (c._id || c.id) !== clientId));
    setSelectedClient(null);
    setIsDetailsOpen(false);
  };

  const handleOpenAddForm = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clients</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your business relationships</p>
            </div>
            <div className="hidden sm:block">
              <Button icon={Plus} onClick={handleOpenAddForm}>
                Add Client
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search and Filter */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  leftIcon={Search}
                  placeholder="Search by company name, business type, contact name, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full sm:w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Clients</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Filter by Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`
                        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors
                        ${selectedTags.includes(tag)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-error-100 text-error-700 hover:bg-error-200"
                    >
                      Clear Tags
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Clients Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-500 mt-2">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' || selectedTags.length > 0 ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' || selectedTags.length > 0
                ? 'Try adjusting your search, filters, or tags'
                : 'Get started by adding your first client'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && selectedTags.length === 0 && (
              <Button icon={Plus} onClick={handleOpenAddForm}>
                Add Your First Client
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client._id || client.id}
                client={client}
                onClick={handleClientClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={handleOpenAddForm}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors z-20"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modals */}
      <ClientForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
        initialData={editingClient}
        isLoading={formLoading}
      />

      <ClientDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onEdit={handleEditClick}
        onCreateReminder={handleCreateReminder}
        onRefresh={loadClients}
        onDelete={handleDeleteClient}
      />

      <PaymentReminderForm
        isOpen={isReminderFormOpen}
        onClose={() => setIsReminderFormOpen(false)}
        onSubmit={handleSubmitReminder}
        client={selectedClient}
        isLoading={formLoading}
      />
    </div>
  );
};

export default ClientsList;