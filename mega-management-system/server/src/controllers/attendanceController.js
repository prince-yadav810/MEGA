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

/**
 * Get comprehensive attendance summary with salary calculations
 * GET /api/attendance/user/:userId/summary
 * Access: Manager, Admin (or own data for Employee)
 */
exports.getUserAttendanceSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    // Check if user is accessing their own data or is a manager/admin
    if (req.user.id !== userId && !['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this data'
      });
    }

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

    // Get attendance records for the month
    const attendance = await Attendance.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    // Calculate total days in month
    const totalDaysInMonth = moment(`${targetYear}-${targetMonth}-01`).daysInMonth();
    const today = moment().startOf('day');

    // Calculate working days (excluding Sundays and future dates)
    let workingDays = 0;
    let pastAndCurrentWorkingDays = 0;
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = moment(`${targetYear}-${targetMonth}-${i}`);
      if (date.day() !== 0) { // 0 is Sunday
        workingDays++;
        // Only count past and current dates for statistics
        if (date.isSameOrBefore(today, 'day')) {
          pastAndCurrentWorkingDays++;
        }
      }
    }

    // Calculate statistics (only for past and current dates)
    const presentDays = attendance.filter(a => a.checkOutTime).length;
    const halfDays = attendance.filter(a => a.checkInTime && !a.checkOutTime).length;
    const absentDays = pastAndCurrentWorkingDays - presentDays - halfDays;
    const lateDays = attendance.filter(a => {
      if (!a.checkInTime) return false;
      const checkInHour = moment(a.checkInTime).hour();
      return checkInHour >= 10; // Consider late if check-in after 10 AM
    }).length;

    // Calculate total work hours
    const totalWorkMinutes = attendance.reduce((sum, a) => sum + (a.workDuration || 0), 0);
    const totalWorkHours = (totalWorkMinutes / 60).toFixed(2);
    const avgWorkHours = presentDays > 0 ? (totalWorkMinutes / presentDays / 60).toFixed(2) : 0;
    const attendanceRate = workingDays > 0 ? ((presentDays / workingDays) * 100).toFixed(2) : 0;

    // Get advances for the month (or all pending advances)
    const monthString = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const advancesThisMonth = user.advances.filter(adv => {
      const advMonth = moment(adv.date).format('YYYY-MM');
      return advMonth === monthString;
    });

    // Calculate total advances (approved but not yet deducted)
    const totalAdvances = user.advances
      .filter(adv => ['approved', 'paid'].includes(adv.status) && !adv.deductedFromSalary)
      .reduce((sum, adv) => sum + adv.amount, 0);

    // Calculate salary
    const baseSalary = user.salary || 0;
    const salaryPerDay = baseSalary / workingDays;
    const earnedSalary = (salaryPerDay * presentDays).toFixed(2);
    const deductions = totalAdvances;
    const netSalary = (earnedSalary - deductions).toFixed(2);

    // Format attendance calendar data (for each day of month)
    const calendarData = [];
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = moment(`${targetYear}-${targetMonth}-${i}`);
      const dateString = date.format('YYYY-MM-DD');
      const isSunday = date.day() === 0;

      // Find attendance record for this day
      const dayAttendance = attendance.find(a => moment(a.date).format('YYYY-MM-DD') === dateString);

      // Find if advance was taken on this day
      const advanceOnDay = user.advances.find(adv => moment(adv.date).format('YYYY-MM-DD') === dateString);

      // Check if date is in the future
      const isFutureDate = date.isAfter(today, 'day');

      let status = 'absent';
      if (isFutureDate) {
        status = 'unmarked';
      } else if (isSunday) {
        status = 'holiday';
      } else if (dayAttendance) {
        if (dayAttendance.checkOutTime) {
          status = 'present';
        } else if (dayAttendance.checkInTime) {
          status = 'half-day';
        }
      }

      calendarData.push({
        date: dateString,
        day: i,
        dayOfWeek: date.format('ddd'),
        status: status,
        attendance: dayAttendance ? {
          checkInTime: dayAttendance.checkInTime,
          checkOutTime: dayAttendance.checkOutTime,
          workDuration: dayAttendance.workDuration,
          location: dayAttendance.location?.address || 'N/A'
        } : null,
        advance: advanceOnDay ? {
          amount: advanceOnDay.amount,
          reason: advanceOnDay.reason,
          status: advanceOnDay.status
        } : null
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          avatar: user.avatar,
          baseSalary: baseSalary
        },
        period: {
          month: targetMonth,
          year: targetYear,
          monthName: moment(`${targetYear}-${targetMonth}-01`).format('MMMM'),
          totalDaysInMonth,
          workingDays
        },
        stats: {
          presentDays,
          absentDays,
          halfDays,
          lateDays,
          attendanceRate: parseFloat(attendanceRate),
          totalWorkHours: parseFloat(totalWorkHours),
          avgWorkHours: parseFloat(avgWorkHours)
        },
        advances: {
          monthlyAdvances: advancesThisMonth,
          totalAdvancesThisMonth: advancesThisMonth.reduce((sum, adv) => sum + adv.amount, 0),
          pendingAdvances: totalAdvances,
          allAdvances: user.advances
        },
        salary: {
          baseSalary,
          salaryPerDay: parseFloat(salaryPerDay.toFixed(2)),
          earnedSalary: parseFloat(earnedSalary),
          deductions,
          netSalary: parseFloat(netSalary)
        },
        calendar: calendarData
      }
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message
    });
  }
};

/**
 * Get logged-in employee's attendance summary
 * GET /api/attendance/my-summary?month=12&year=2024
 * Access: Employee (authenticated user)
 */
exports.getMyAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;
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

    // Get attendance records for the month
    const attendance = await Attendance.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    // Calculate total days in month
    const totalDaysInMonth = moment(`${targetYear}-${targetMonth}-01`).daysInMonth();
    const today = moment().startOf('day');

    // Calculate working days (excluding Sundays and future dates)
    let workingDays = 0;
    let pastAndCurrentWorkingDays = 0;
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = moment(`${targetYear}-${targetMonth}-${i}`);
      if (date.day() !== 0) { // 0 is Sunday
        workingDays++;
        // Only count past and current dates for statistics
        if (date.isSameOrBefore(today, 'day')) {
          pastAndCurrentWorkingDays++;
        }
      }
    }

    // Calculate statistics (only for past and current dates)
    const presentDays = attendance.filter(a => a.checkOutTime).length;
    const halfDays = attendance.filter(a => a.checkInTime && !a.checkOutTime).length;
    const absentDays = pastAndCurrentWorkingDays - presentDays - halfDays;
    const lateDays = attendance.filter(a => {
      if (!a.checkInTime) return false;
      const checkInHour = moment(a.checkInTime).hour();
      return checkInHour >= 10; // Consider late if check-in after 10 AM
    }).length;

    // Calculate total work hours
    const totalWorkMinutes = attendance.reduce((sum, a) => sum + (a.workDuration || 0), 0);
    const totalWorkHours = (totalWorkMinutes / 60).toFixed(2);
    const avgWorkHours = presentDays > 0 ? (totalWorkMinutes / presentDays / 60).toFixed(2) : 0;
    const attendanceRate = workingDays > 0 ? ((presentDays / workingDays) * 100).toFixed(2) : 0;

    // Get advances for the month (or all pending advances)
    const monthString = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const advancesThisMonth = (user.advances || []).filter(adv => {
      const advMonth = moment(adv.date).format('YYYY-MM');
      return advMonth === monthString;
    });

    // Calculate total advances (approved but not yet deducted)
    const totalAdvances = (user.advances || [])
      .filter(adv => ['approved', 'paid'].includes(adv.status) && !adv.deductedFromSalary)
      .reduce((sum, adv) => sum + adv.amount, 0);

    // Calculate salary
    const baseSalary = user.salary || 0;
    const salaryPerDay = baseSalary / workingDays;
    const earnedSalary = (salaryPerDay * presentDays).toFixed(2);
    const deductions = totalAdvances;
    const netSalary = (earnedSalary - deductions).toFixed(2);

    // Format attendance calendar data (for each day of month)
    const calendarData = [];
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = moment(`${targetYear}-${targetMonth}-${i}`);
      const dateString = date.format('YYYY-MM-DD');
      const isSunday = date.day() === 0;

      // Find attendance record for this day
      const dayAttendance = attendance.find(a => moment(a.date).format('YYYY-MM-DD') === dateString);

      // Find if advance was taken on this day
      const advanceOnDay = (user.advances || []).find(adv => moment(adv.date).format('YYYY-MM-DD') === dateString);

      // Check if date is in the future
      const isFutureDate = date.isAfter(today, 'day');

      let status = 'absent';
      if (isFutureDate) {
        status = 'unmarked';
      } else if (isSunday) {
        status = 'holiday';
      } else if (dayAttendance) {
        if (dayAttendance.checkOutTime) {
          status = 'present';
        } else if (dayAttendance.checkInTime) {
          status = 'half-day';
        }
      }

      calendarData.push({
        date: dateString,
        day: i,
        dayOfWeek: date.format('ddd'),
        status: status,
        attendance: dayAttendance ? {
          checkInTime: dayAttendance.checkInTime,
          checkOutTime: dayAttendance.checkOutTime,
          workDuration: dayAttendance.workDuration,
          location: dayAttendance.location?.address || 'N/A'
        } : null,
        advance: advanceOnDay ? {
          amount: advanceOnDay.amount,
          reason: advanceOnDay.reason,
          status: advanceOnDay.status
        } : null
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          avatar: user.avatar,
          baseSalary: baseSalary
        },
        period: {
          month: targetMonth,
          year: targetYear,
          monthName: moment(`${targetYear}-${targetMonth}-01`).format('MMMM'),
          totalDaysInMonth,
          workingDays
        },
        stats: {
          presentDays,
          absentDays,
          halfDays,
          lateDays,
          attendanceRate: parseFloat(attendanceRate),
          totalWorkHours: parseFloat(totalWorkHours),
          avgWorkHours: parseFloat(avgWorkHours)
        },
        advances: {
          monthlyAdvances: advancesThisMonth,
          totalAdvancesThisMonth: advancesThisMonth.reduce((sum, adv) => sum + adv.amount, 0),
          pendingAdvances: totalAdvances,
          allAdvances: user.advances || []
        },
        salary: {
          baseSalary,
          salaryPerDay: parseFloat(salaryPerDay.toFixed(2)),
          earnedSalary: parseFloat(earnedSalary),
          deductions,
          netSalary: parseFloat(netSalary)
        },
        calendar: calendarData
      }
    });
  } catch (error) {
    console.error('Get my attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message
    });
  }
};

/**
 * Manually update attendance for a user (Admin only)
 * PUT /api/attendance/user/:userId/manual
 * Access: Admin
 */
exports.updateAttendanceManually = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, status } = req.body;

    // Validate required fields
    if (!date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Date and status are required'
      });
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'half-day'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: present, absent, half-day'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Parse the date and get start/end of day
    const targetDate = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();
    const today = moment().startOf('day');

    // Prevent marking attendance for future dates
    if (moment(date).isAfter(today, 'day')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark attendance for future dates'
      });
    }

    // Find existing attendance record for this date
    let attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: targetDate,
        $lte: endOfDay
      }
    });

    if (status === 'absent') {
      // Delete attendance record if exists
      if (attendance) {
        await Attendance.findByIdAndDelete(attendance._id);
      }
      return res.status(200).json({
        success: true,
        message: 'Attendance marked as absent',
        data: null
      });
    }

    // For present and half-day, create or update attendance record
    const checkInTime = moment(date).set({ hour: 9, minute: 0, second: 0 }).toDate();
    const checkOutTime = status === 'present' 
      ? moment(date).set({ hour: 18, minute: 0, second: 0 }).toDate()
      : null;

    // Calculate work duration for present (full day)
    const workDuration = status === 'present' 
      ? 8 * 60 // 8 hours in minutes
      : 4 * 60; // 4 hours for half-day

    if (attendance) {
      // Update existing record
      attendance.status = status;
      attendance.checkInTime = checkInTime;
      attendance.checkOutTime = checkOutTime;
      attendance.workDuration = workDuration;
      await attendance.save();
    } else {
      // Create new record
      // For manual attendance, we'll use default location (can be updated later if needed)
      attendance = await Attendance.create({
        user: userId,
        date: targetDate,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        status: status,
        workDuration: workDuration,
        location: {
          coordinates: {
            latitude: 0,
            longitude: 0
          },
          address: 'Manually marked by admin',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        notes: 'Manually updated by admin'
      });
    }

    // Populate user details
    await attendance.populate('user', 'name email department');

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${status}`,
      data: attendance
    });
  } catch (error) {
    console.error('Manual attendance update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
};
