const SystemSettings = require('../models/SystemSettings');

/**
 * Get all system settings
 * @route GET /api/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

/**
 * Get company settings
 * @route GET /api/settings/company
 */
exports.getCompanySettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings.company
    });
  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company settings',
      error: error.message
    });
  }
};

/**
 * Update company settings
 * @route PUT /api/settings/company
 */
exports.updateCompanySettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Update company settings
    Object.keys(req.body).forEach(key => {
      if (settings.company[key] !== undefined) {
        settings.company[key] = req.body[key];
      }
    });

    settings.updatedBy = req.user.userId;
    settings.markModified('company');
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Company settings updated successfully',
      data: settings.company
    });
  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company settings',
      error: error.message
    });
  }
};

/**
 * Get attendance settings
 * @route GET /api/settings/attendance
 */
exports.getAttendanceSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings.attendance
    });
  } catch (error) {
    console.error('Get attendance settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance settings',
      error: error.message
    });
  }
};

/**
 * Update attendance settings
 * @route PUT /api/settings/attendance
 */
exports.updateAttendanceSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Handle nested officeLocation update
    if (req.body.officeLocation) {
      settings.attendance.officeLocation = {
        ...settings.attendance.officeLocation,
        ...req.body.officeLocation
      };
      delete req.body.officeLocation;
    }

    // Update other attendance settings
    Object.keys(req.body).forEach(key => {
      if (settings.attendance[key] !== undefined) {
        settings.attendance[key] = req.body[key];
      }
    });

    settings.updatedBy = req.user.userId;
    settings.markModified('attendance');
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Attendance settings updated successfully',
      data: settings.attendance
    });
  } catch (error) {
    console.error('Update attendance settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance settings',
      error: error.message
    });
  }
};

/**
 * Get quotation settings
 * @route GET /api/settings/quotation
 */
exports.getQuotationSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings.quotation
    });
  } catch (error) {
    console.error('Get quotation settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation settings',
      error: error.message
    });
  }
};

/**
 * Update quotation settings
 * @route PUT /api/settings/quotation
 */
exports.updateQuotationSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Handle nested bankDetails update
    if (req.body.bankDetails) {
      settings.quotation.bankDetails = {
        ...settings.quotation.bankDetails,
        ...req.body.bankDetails
      };
      delete req.body.bankDetails;
    }

    // Update other quotation settings
    Object.keys(req.body).forEach(key => {
      if (settings.quotation[key] !== undefined) {
        settings.quotation[key] = req.body[key];
      }
    });

    settings.updatedBy = req.user.userId;
    settings.markModified('quotation');
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Quotation settings updated successfully',
      data: settings.quotation
    });
  } catch (error) {
    console.error('Update quotation settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quotation settings',
      error: error.message
    });
  }
};

/**
 * Get payroll settings
 * @route GET /api/settings/payroll
 */
exports.getPayrollSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings.payroll
    });
  } catch (error) {
    console.error('Get payroll settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll settings',
      error: error.message
    });
  }
};

/**
 * Update payroll settings
 * @route PUT /api/settings/payroll
 */
exports.updatePayrollSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Update payroll settings
    Object.keys(req.body).forEach(key => {
      if (settings.payroll[key] !== undefined) {
        settings.payroll[key] = req.body[key];
      }
    });

    settings.updatedBy = req.user.userId;
    settings.markModified('payroll');
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Payroll settings updated successfully',
      data: settings.payroll
    });
  } catch (error) {
    console.error('Update payroll settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll settings',
      error: error.message
    });
  }
};

/**
 * Get user management settings
 * @route GET /api/settings/user-management
 */
exports.getUserManagementSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings.userManagement
    });
  } catch (error) {
    console.error('Get user management settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user management settings',
      error: error.message
    });
  }
};

/**
 * Update user management settings
 * @route PUT /api/settings/user-management
 */
exports.updateUserManagementSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Update user management settings
    Object.keys(req.body).forEach(key => {
      if (settings.userManagement[key] !== undefined) {
        settings.userManagement[key] = req.body[key];
      }
    });

    settings.updatedBy = req.user.userId;
    settings.markModified('userManagement');
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'User management settings updated successfully',
      data: settings.userManagement
    });
  } catch (error) {
    console.error('Update user management settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user management settings',
      error: error.message
    });
  }
};

/**
 * Get notification settings (global)
 * @route GET /api/settings/notifications
 */
exports.getNotificationSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings.notifications
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings',
      error: error.message
    });
  }
};

/**
 * Update notification settings (global)
 * @route PUT /api/settings/notifications
 */
exports.updateNotificationSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Update notification settings
    Object.keys(req.body).forEach(key => {
      if (settings.notifications[key] !== undefined) {
        settings.notifications[key] = req.body[key];
      }
    });

    settings.updatedBy = req.user.userId;
    settings.markModified('notifications');
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings.notifications
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
};

/**
 * Get departments list
 * @route GET /api/settings/departments
 */
exports.getDepartments = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings.userManagement.departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};
