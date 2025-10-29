const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { reverseGeocode, validateCoordinates } = require('../utils/geocoding');
const moment = require('moment');

/**
 * Mark attendance (check-in)
 * POST /api/attendance/check-in
 * Access: Employee
 */
exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude, notes } = req.body;
    const userId = req.user.id;

    // Validate coordinates
    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Check if user already checked in today
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked attendance today'
      });
    }

    // Get address from coordinates
    const locationData = await reverseGeocode(latitude, longitude);

    // Create attendance record
    const attendance = await Attendance.create({
      user: userId,
      date: new Date(),
      checkInTime: new Date(),
      location: {
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        postalCode: locationData.postalCode
      },
      notes: notes || ''
    });

    // Populate user details
    await attendance.populate('user', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

/**
 * Mark check-out
 * PUT /api/attendance/check-out
 * Access: Employee
 */
exports.checkOut = async (req, res) => {
  try {
    const { latitude, longitude, notes } = req.body;
    const userId = req.user.id;

    // Validate coordinates
    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Find today's attendance record
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today'
      });
    }

    // Get address from coordinates
    const locationData = await reverseGeocode(latitude, longitude);

    // Update attendance record
    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = {
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      address: locationData.address,
      city: locationData.city,
      state: locationData.state,
      country: locationData.country,
      postalCode: locationData.postalCode
    };

    if (notes) {
      attendance.notes = attendance.notes ? `${attendance.notes}\nCheckout: ${notes}` : notes;
    }

    // Calculate work duration
    attendance.calculateWorkDuration();

    await attendance.save();
    await attendance.populate('user', 'name email department');

    res.status(200).json({
      success: true,
      message: 'Check-out marked successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking check-out',
      error: error.message
    });
  }
};

/**
 * Get today's attendance status for logged-in user
 * GET /api/attendance/today
 * Access: Employee
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('user', 'name email department');

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
};

/**
 * Get attendance records for logged-in user
 * GET /api/attendance/my-records
 * Access: Employee
 */
exports.getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;

    const query = { user: userId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = moment(startDate).startOf('day').toDate();
      }
      if (endDate) {
        query.date.$lte = moment(endDate).endOf('day').toDate();
      }
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name email department');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};

/**
 * Get attendance records for a specific user (Manager/Admin only)
 * GET /api/attendance/user/:userId
 * Access: Manager, Admin
 */
exports.getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const query = { user: userId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = moment(startDate).startOf('day').toDate();
      }
      if (endDate) {
        query.date.$lte = moment(endDate).endOf('day').toDate();
      }
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name email department avatar');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    console.error('Get user attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};

/**
 * Get attendance statistics for a user (Manager/Admin only)
 * GET /api/attendance/user/:userId/stats
 * Access: Manager, Admin
 */
exports.getUserAttendanceStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Default to current month/year if not provided
    const targetMonth = month ? parseInt(month) : moment().month() + 1;
    const targetYear = year ? parseInt(year) : moment().year();

    // Calculate date range for the month
    const startDate = moment(`${targetYear}-${targetMonth}-01`).startOf('month').toDate();
    const endDate = moment(`${targetYear}-${targetMonth}-01`).endOf('month').toDate();

    const attendance = await Attendance.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const halfDays = attendance.filter(a => a.status === 'half-day').length;
    const totalWorkMinutes = attendance.reduce((sum, a) => sum + (a.workDuration || 0), 0);
    const avgWorkHours = totalDays > 0 ? (totalWorkMinutes / totalDays / 60).toFixed(2) : 0;

    // Working days in the month (excluding weekends)
    const workingDays = moment(`${targetYear}-${targetMonth}-01`).daysInMonth();
    const attendanceRate = workingDays > 0 ? ((totalDays / workingDays) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department
        },
        period: {
          month: targetMonth,
          year: targetYear
        },
        stats: {
          totalDays,
          presentDays,
          lateDays,
          halfDays,
          workingDaysInMonth: workingDays,
          attendanceRate: `${attendanceRate}%`,
          avgWorkHours: `${avgWorkHours} hours`,
          totalWorkHours: `${(totalWorkMinutes / 60).toFixed(2)} hours`
        },
        records: attendance
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
};

/**
 * Get all attendance records (Manager/Admin only)
 * GET /api/attendance
 * Access: Manager, Admin
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, department, status, limit = 50 } = req.query;

    const query = {};

    // Add date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = moment(startDate).startOf('day').toDate();
      }
      if (endDate) {
        query.date.$lte = moment(endDate).endOf('day').toDate();
      }
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    let attendanceQuery = Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('user', 'name email department avatar');

    // Filter by department if provided
    const attendance = await attendanceQuery;

    let filteredAttendance = attendance;
    if (department) {
      filteredAttendance = attendance.filter(a => a.user && a.user.department === department);
    }

    res.status(200).json({
      success: true,
      count: filteredAttendance.length,
      data: filteredAttendance
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
};
