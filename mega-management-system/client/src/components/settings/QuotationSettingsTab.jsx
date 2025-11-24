import React, { useState, useEffect } from 'react';
import { FileText, Hash, Percent, CreditCard, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import settingsService from '../../services/settingsService';

const QuotationSettingsTab = () => {
  const [settings, setSettings] = useState({
    prefix: 'MEGA',
    nextNumber: 1,
    numberFormat: '{PREFIX}/{YEAR}/{NUMBER}',
    defaultGstRate: 18,
    defaultPaymentTerms: '50% advance, 50% on delivery',
    defaultOfferValidity: 30,
    showBankDetails: true,
    bankDetails: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      branch: ''
    },
    termsAndConditions: '',
    footerNote: 'Thank you for your business!'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getQuotationSettings();
      if (response.success && response.data) {
        setSettings(prev => ({
          ...prev,
          ...response.data,
          bankDetails: { ...prev.bankDetails, ...response.data.bankDetails }
        }));
      }
    } catch (error) {
      console.error('Failed to load quotation settings:', error);
      toast.error('Failed to load quotation settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await settingsService.updateQuotationSettings(settings);
      if (response.success) {
        toast.success('Quotation settings saved successfully!');
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving quotation settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate preview quote number
  const generatePreviewNumber = () => {
    const year = new Date().getFullYear();
    const paddedNumber = String(settings.nextNumber).padStart(3, '0');
    return settings.numberFormat
      .replace('{PREFIX}', settings.prefix)
      .replace('{YEAR}', year)
      .replace('{NUMBER}', paddedNumber);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading quotation settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Quotation Settings</h2>
        <p className="text-sm text-gray-600">
          Configure quotation numbering, defaults, and document settings
        </p>
      </div>

      {/* Quote Numbering */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Hash className="h-5 w-5 mr-2 text-blue-600" />
          Quote Numbering
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefix
            </label>
            <input
              type="text"
              value={settings.prefix}
              onChange={(e) => handleChange('prefix', e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              placeholder="MEGA"
              maxLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Quote Number
            </label>
            <input
              type="number"
              value={settings.nextNumber}
              onChange={(e) => handleChange('nextNumber', parseInt(e.target.value) || 1)}
              min={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number Format
            </label>
            <select
              value={settings.numberFormat}
              onChange={(e) => handleChange('numberFormat', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="{PREFIX}/{YEAR}/{NUMBER}">PREFIX/YEAR/NUMBER</option>
              <option value="{PREFIX}-{YEAR}-{NUMBER}">PREFIX-YEAR-NUMBER</option>
              <option value="{PREFIX}{NUMBER}">PREFIX + NUMBER</option>
              <option value="QT-{YEAR}-{NUMBER}">QT-YEAR-NUMBER</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Preview:</span>{' '}
            <span className="font-mono text-blue-600">{generatePreviewNumber()}</span>
          </p>
        </div>
      </div>

      {/* Default Values */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Percent className="h-5 w-5 mr-2 text-blue-600" />
          Default Values
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default GST Rate (%)
            </label>
            <select
              value={settings.defaultGstRate}
              onChange={(e) => handleChange('defaultGstRate', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>0% (Exempt)</option>
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Validity (days)
            </label>
            <input
              type="number"
              value={settings.defaultOfferValidity}
              onChange={(e) => handleChange('defaultOfferValidity', parseInt(e.target.value) || 30)}
              min={1}
              max={365}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Payment Terms
            </label>
            <input
              type="text"
              value={settings.defaultPaymentTerms}
              onChange={(e) => handleChange('defaultPaymentTerms', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="50% advance, 50% on delivery"
            />
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Bank Details
          </h3>
          <button
            type="button"
            onClick={() => handleChange('showBankDetails', !settings.showBankDetails)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.showBankDetails ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.showBankDetails ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.showBankDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={settings.bankDetails.bankName}
                onChange={(e) => handleBankChange('bankName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="State Bank of India"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={settings.bankDetails.accountName}
                onChange={(e) => handleBankChange('accountName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="MEGA Enterprises Pvt Ltd"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={settings.bankDetails.accountNumber}
                onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1234567890123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={settings.bankDetails.ifscCode}
                onChange={(e) => handleBankChange('ifscCode', e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                placeholder="SBIN0001234"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <input
                type="text"
                value={settings.bankDetails.branch}
                onChange={(e) => handleBankChange('branch', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Andheri West, Mumbai"
              />
            </div>
          </div>
        )}
      </div>

      {/* Terms & Footer */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Document Content
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Terms & Conditions
          </label>
          <textarea
            value={settings.termsAndConditions}
            onChange={(e) => handleChange('termsAndConditions', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1. Prices are exclusive of GST unless mentioned otherwise.&#10;2. Delivery timeline: 2-3 weeks from confirmation.&#10;3. ..."
          />
          <p className="text-xs text-gray-500 mt-1">
            These terms will appear on all quotations
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Footer Note
          </label>
          <input
            type="text"
            value={settings.footerNote}
            onChange={(e) => handleChange('footerNote', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Thank you for your business!"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Quotation Settings'}
        </button>
      </div>
    </div>
  );
};

export default QuotationSettingsTab;
