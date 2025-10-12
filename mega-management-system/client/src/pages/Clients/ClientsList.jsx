// File Path: client/src/pages/Clients/ClientsList.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadClients();
    loadStats();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filterStatus]);

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

  const loadStats = async () => {
    try {
      const response = await clientService.getClientStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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
          client.contactPersons?.some(contact => 
            contact.name.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower)
          ) ||
          client.address?.city?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(client => client.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(client => !client.isActive);
    }

    setFilteredClients(filtered);
  };

  const handleCreateClient = async (clientData) => {
    try {
      setFormLoading(true);
      const response = await clientService.createClient(clientData);
      if (response.success) {
        toast.success(response.message || 'Client created successfully');
        setIsFormOpen(false);
        loadClients();
        loadStats();
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
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                  <p className="text-xs text-gray-500">Total Clients</p>
                </div>
              </div>
            </Card>

            <Card padding="sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-success-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
              </div>
            </Card>

            <Card padding="sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <UserX className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.inactiveClients}</p>
                  <p className="text-xs text-gray-500">Inactive</p>
                </div>
              </div>
            </Card>

            <Card padding="sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.clientsWithOutstanding}</p>
                  <p className="text-xs text-gray-500">With Outstanding</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                leftIcon={Search}
                placeholder="Search by company, contact name, or email..."
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
              {searchTerm || filterStatus !== 'all' ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first client'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
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