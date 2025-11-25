// File Path: client/src/components/forms/ClientForm.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, X } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const ClientForm = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    clientType: 'buyer',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    contactPersons: [
      {
        name: '',
        designation: '',
        phone: '',
        email: '',
        whatsappNumber: '',
        isPrimary: true
      }
    ],
    companyWebsite: '',
    notes: '',
    tags: [],
    products: [],
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [productInput, setProductInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        address: {
          street: initialData.address?.street || '',
          city: initialData.address?.city || '',
          state: initialData.address?.state || '',
          pincode: initialData.address?.pincode || '',
          country: initialData.address?.country || 'India'
        },
        contactPersons: initialData.contactPersons?.length > 0 
          ? initialData.contactPersons 
          : [{
              name: '',
              designation: '',
              phone: '',
              email: '',
              whatsappNumber: '',
              isPrimary: true
            }]
      });
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData({
      companyName: '',
      businessType: '',
      clientType: 'buyer',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      contactPersons: [
        {
          name: '',
          designation: '',
          phone: '',
          email: '',
          whatsappNumber: '',
          isPrimary: true
        }
      ],
      companyWebsite: '',
      notes: '',
      tags: [],
      products: [],
      isActive: true
    });
    setErrors({});
    setTagInput('');
    setProductInput('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...formData.contactPersons];
    updatedContacts[index][field] = value;
    setFormData(prev => ({
      ...prev,
      contactPersons: updatedContacts
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addProduct = () => {
    const product = productInput.trim();
    if (product && !formData.products.includes(product)) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, product]
      }));
      setProductInput('');
    }
  };

  const removeProduct = (productToRemove) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => product !== productToRemove)
    }));
  };

  const handleProductInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProduct();
    }
  };

  const setPrimaryContact = (index) => {
    const updatedContacts = formData.contactPersons.map((contact, i) => ({
      ...contact,
      isPrimary: i === index
    }));
    setFormData(prev => ({
      ...prev,
      contactPersons: updatedContacts
    }));
  };

  const addContactPerson = () => {
    setFormData(prev => ({
      ...prev,
      contactPersons: [
        ...prev.contactPersons,
        {
          name: '',
          designation: '',
          phone: '',
          email: '',
          whatsappNumber: '',
          isPrimary: false
        }
      ]
    }));
  };

  const removeContactPerson = (index) => {
    if (formData.contactPersons.length === 1) return;
    
    const updatedContacts = formData.contactPersons.filter((_, i) => i !== index);
    
    // If removed contact was primary, make first contact primary
    if (formData.contactPersons[index].isPrimary && updatedContacts.length > 0) {
      updatedContacts[0].isPrimary = true;
    }
    
    setFormData(prev => ({
      ...prev,
      contactPersons: updatedContacts
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.clientType || !['supplier', 'buyer', 'both'].includes(formData.clientType)) {
      newErrors.clientType = 'Client type is required';
    }

    if (formData.contactPersons.length === 0) {
      newErrors.contactPersons = 'At least one contact person is required';
    } else {
      const firstContact = formData.contactPersons[0];
      if (!firstContact.name.trim()) {
        newErrors.firstContactName = 'Primary contact name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initialData ? 'Edit Client' : 'Add New Client'}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            {initialData ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              error={errors.companyName}
              placeholder="Enter company name"
            />
            <Input
              label="Business Type"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              placeholder="e.g., Manufacturing, Trading"
            />
          </div>

          {/* Client Type */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="clientType"
                  value="buyer"
                  checked={formData.clientType === 'buyer'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Buyer</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="clientType"
                  value="supplier"
                  checked={formData.clientType === 'supplier'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Supplier</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="clientType"
                  value="both"
                  checked={formData.clientType === 'both'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Both</span>
              </label>
            </div>
            {errors.clientType && (
              <p className="mt-1 text-sm text-red-600">{errors.clientType}</p>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
          <div className="space-y-4">
            <Input
              label="Street Address"
              name="street"
              value={formData.address.street}
              onChange={handleAddressChange}
              placeholder="Enter street address"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                name="city"
                value={formData.address.city}
                onChange={handleAddressChange}
                placeholder="Enter city"
              />
              <Input
                label="State"
                name="state"
                value={formData.address.state}
                onChange={handleAddressChange}
                placeholder="Enter state"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Pincode"
                name="pincode"
                value={formData.address.pincode}
                onChange={handleAddressChange}
                placeholder="Enter pincode"
              />
              <Input
                label="Country"
                name="country"
                value={formData.address.country}
                onChange={handleAddressChange}
                placeholder="Enter country"
              />
            </div>
          </div>
        </div>

        {/* Contact Persons */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Contact Persons</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={addContactPerson}
            >
              Add Contact
            </Button>
          </div>

          {errors.contactPersons && (
            <p className="text-sm text-error-600 mb-2">{errors.contactPersons}</p>
          )}

          <div className="space-y-4">
            {formData.contactPersons.map((contact, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryContact(index)}
                      className={`p-1 rounded ${
                        contact.isPrimary
                          ? 'text-warning-500'
                          : 'text-gray-300 hover:text-warning-400'
                      }`}
                      title={contact.isPrimary ? 'Primary Contact' : 'Set as Primary'}
                    >
                      <Star className={`h-4 w-4 ${contact.isPrimary ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      Contact Person {index + 1}
                      {contact.isPrimary && (
                        <span className="ml-2 text-xs text-warning-600">(Primary)</span>
                      )}
                    </span>
                  </div>
                  {formData.contactPersons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContactPerson(index)}
                      className="p-1 text-error-500 hover:bg-error-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Name *"
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                    error={index === 0 ? errors.firstContactName : ''}
                    placeholder="Enter name"
                  />
                  <Input
                    label="Designation"
                    value={contact.designation}
                    onChange={(e) => handleContactChange(index, 'designation', e.target.value)}
                    placeholder="e.g., Manager, Director"
                  />
                  <Input
                    label="Phone"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                  />
                  <Input
                    label="WhatsApp Number"
                    value={contact.whatsappNumber}
                    onChange={(e) => handleContactChange(index, 'whatsappNumber', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    helper="For payment reminders"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
          <div className="space-y-4">
            <Input
              label="Company Website"
              name="companyWebsite"
              type="url"
              value={formData.companyWebsite}
              onChange={handleChange}
              placeholder="https://example.com"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add tag (e.g., VIP, Priority, Manufacturing)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                containerClassName="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Add Tag
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Tags help you categorize and filter clients easily
            </p>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {formData.clientType === 'supplier' ? 'Products/Services Supplied' :
             formData.clientType === 'buyer' ? 'Products/Services Purchased' :
             'Products/Services'}
          </h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={
                  formData.clientType === 'supplier' ? 'Add product you supply (e.g., Steel, Electronics)' :
                  formData.clientType === 'buyer' ? 'Add product you buy (e.g., Raw Materials, Components)' :
                  'Add product/service (e.g., Steel, Electronics)'
                }
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                onKeyPress={handleProductInputKeyPress}
                containerClassName="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addProduct}
                disabled={!productInput.trim()}
              >
                Add
              </Button>
            </div>

            {formData.products.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.products.map((product, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      formData.clientType === 'supplier' ? 'bg-blue-100 text-blue-700' :
                      formData.clientType === 'buyer' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {product}
                    <button
                      type="button"
                      onClick={() => removeProduct(product)}
                      className={`ml-2 ${
                        formData.clientType === 'supplier' ? 'text-blue-600 hover:text-blue-800' :
                        formData.clientType === 'buyer' ? 'text-green-600 hover:text-green-800' :
                        'text-purple-600 hover:text-purple-800'
                      }`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              {formData.clientType === 'supplier' ? 'List products or services you supply. This helps others find you when searching.' :
               formData.clientType === 'buyer' ? 'List products or services you purchase. This helps suppliers find you.' :
               'List products or services. This makes your business searchable.'}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ClientForm;