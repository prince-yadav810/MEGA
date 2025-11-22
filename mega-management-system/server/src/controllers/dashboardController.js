const Task = require('../models/Task');
const Client = require('../models/Client');
const Reminder = require('../models/Reminder');
const Attendance = require('../models/Attendance');
const Quotation = require('../models/Quotation');
const CallLog = require('../models/CallLog');
const User = require('../models/User');
const PaymentReminder = require('../models/PaymentReminder');

// Get dashboard statistics and data for the current user
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Initialize response object
    const dashboardData = {
      user: {
        name: req.user.name,
        role: req.user.role
      },
      tasks: {
        count: 0,
        items: [],
        upcoming: []
      },
      calls: {
        count: 0,
        items: []
      },
      reminders: {
        count: 0,
        items: []
      },
      quotations: {
        onHold: 0,
        items: []
      },
      attendance: null
    };

    // 1. Fetch Today's Tasks (due today or overdue, not completed)
    const taskQuery = {
      assignees: userId,
      dueDate: { $lte: endOfDay },
      status: { $ne: 'completed' }
    };

    const tasks = await Task.find(taskQuery)
      .populate('client', 'companyName')
      .populate('assignees', 'name email')
      .sort({ priority: -1, dueDate: 1 })
      .limit(10)
      .lean();

    dashboardData.tasks.count = tasks.length;
    dashboardData.tasks.items = tasks;

    // Fetch Upcoming Tasks (due after today) for employees
    if (userRole === 'employee') {
      const upcomingTaskQuery = {
        assignees: userId,
        dueDate: { $gt: endOfDay },
        status: { $ne: 'completed' }
      };

      const upcomingTasks = await Task.find(upcomingTaskQuery)
        .populate('client', 'companyName')
        .populate('assignees', 'name email')
        .sort({ dueDate: 1 })
        .limit(10)
        .lean();

      dashboardData.tasks.upcoming = upcomingTasks;
    }

    // 2. Fetch Clients to Call/Visit Today
    let clientsToCall = [];
    if (userRole === 'admin' || userRole === 'manager') {
      // Admin/Manager sees all clients due for calls today
      clientsToCall = await Client.find({
        nextCallDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        isActive: true
      })
        .populate('createdBy', 'name')
        .sort({ nextCallDate: 1 })
        .limit(10)
        .lean();
    } else {
      // Employees see only their assigned clients
      clientsToCall = await Client.find({
        nextCallDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        createdBy: userId,
        isActive: true
      })
        .populate('createdBy', 'name')
        .sort({ nextCallDate: 1 })
        .limit(10)
        .lean();
    }

    dashboardData.calls.count = clientsToCall.length;
    dashboardData.calls.items = clientsToCall;

    // 3. Fetch Reminders (Using Date Range)
    // Fetch reminders for today
    let reminders = await Reminder.find({
      createdBy: userId,
      isActive: true,
      reminderDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
      .sort({ reminderTime: 1 })
      .limit(10)
      .lean();

    // If no reminders today, fetch next 3 upcoming reminders
    let reminderDateRange = 'today';
    if (reminders.length === 0) {
      const nextMonth = new Date(startOfDay);
      nextMonth.setDate(nextMonth.getDate() + 30);

      reminders = await Reminder.find({
        createdBy: userId,
        isActive: true,
        reminderDate: {
          $gt: endOfDay,
          $lte: nextMonth
        }
      })
        .sort({ reminderDate: 1, reminderTime: 1 })
        .limit(3) // Show only 3 upcoming reminders
        .lean();

      if (reminders.length > 0) {
        reminderDateRange = 'upcoming';
      }
    }

    dashboardData.reminders.count = reminders.length;
    dashboardData.reminders.items = reminders;
    dashboardData.reminders.dateRange = reminderDateRange;

    // 4. Fetch Attendance Data
    if (userRole === 'admin' || userRole === 'manager') {
      // Admin: Get attendance summary for all non-admin users today
      const todayAttendance = await Attendance.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
        .populate('user', 'name email department role')
        .sort({ checkInTime: 1 })
        .lean();

      // Get only employees (exclude admins and managers)
      const allUsers = await User.find({ 
        isActive: true,
        role: 'employee' // Only track employees
      }).select('name email department role').lean();
      
      // Filter attendance to only show employees
      const employeeAttendance = todayAttendance.filter(att => att.user && att.user.role === 'employee');
      
      // Calculate who's present and who's absent
      const presentUserIds = employeeAttendance.map(att => att.user._id.toString());
      const absentUsers = allUsers.filter(user => !presentUserIds.includes(user._id.toString()));

      dashboardData.attendance = {
        summary: {
          total: allUsers.length,
          present: employeeAttendance.filter(att => att.status === 'present').length,
          absent: absentUsers.length,
          late: employeeAttendance.filter(att => att.status === 'late').length,
          halfDay: employeeAttendance.filter(att => att.status === 'half-day').length
        },
        presentList: employeeAttendance.map(att => ({
          user: att.user,
          checkInTime: att.checkInTime,
          checkOutTime: att.checkOutTime,
          status: att.status,
          workDuration: att.workDuration
        })),
        absentList: absentUsers
      };
    } else {
      // Employee: Get their own attendance record for today
      const userAttendance = await Attendance.findOne({
        user: userId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).lean();

      // Fetch additional stats for employee
      // 1. Advance taken this month
      const userWithAdvances = await User.findById(userId).select('advances').lean();
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0); // Last day of current month
      endOfMonth.setHours(23, 59, 59, 999);

      let advanceTaken = 0;
      if (userWithAdvances && userWithAdvances.advances) {
        advanceTaken = userWithAdvances.advances
          .filter(adv => {
            const advDate = new Date(adv.date);
            return (
              (adv.status === 'approved' || adv.status === 'paid') &&
              advDate >= startOfMonth && 
              advDate <= endOfMonth
            );
          })
          .reduce((sum, adv) => sum + adv.amount, 0);
      }

      // 2. Days Absent and Present this month
      const monthlyAttendance = await Attendance.find({
        user: userId,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }).lean();

      const daysPresent = monthlyAttendance.length;
      // Approximate working days passed so far (excluding Sundays maybe? - For now, just days passed)
      // Or better, "days absent" is usually tracked if there's an explicit "absent" record.
      // If not, we can't easily guess absent days without a holiday calendar.
      // I'll just return the count of explicit 'absent' status if exists, otherwise 0.
      // Wait, if the user didn't check in, there is no record.
      // Let's assume standard working days (Mon-Sat) passed minus present days.
      // For simplicity and robustness, let's just return daysPresent and let frontend handle 'absent' if it can,
      // OR calculate absent as (Days passed in month - Sundays - Days Present).
      // Let's keep it simple: Days Present is accurate. Days Absent is count of records with status 'absent'.
      // If the system doesn't create absent records automatically, this will be 0.
      const daysAbsent = monthlyAttendance.filter(a => a.status === 'absent').length; 

      dashboardData.attendance = {
        checkedIn: !!userAttendance,
        checkInTime: userAttendance?.checkInTime || null,
        checkOutTime: userAttendance?.checkOutTime || null,
        status: userAttendance?.status || null,
        workDuration: userAttendance?.workDuration || 0,
        advanceTaken,
        daysPresent,
        daysAbsent
      };
    }

    // 5. Fetch On-Hold Quotations
    let quotationQuery = { status: 'on_hold' };
    
    if (userRole === 'employee') {
      // Employees see only their quotations
      quotationQuery.createdBy = userId;
    }

    const onHoldQuotations = await Quotation.find(quotationQuery)
      .sort({ date: -1, priority: -1 })
      .limit(5)
      .lean();

    dashboardData.quotations.onHold = onHoldQuotations.length;
    dashboardData.quotations.items = onHoldQuotations;

    // 6. Additional Stats - Recent Call Logs (Today or upcoming)
    let callLogsQuery = {
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    if (userRole === 'employee') {
      callLogsQuery.performedBy = userId;
    }

    let todayCallLogs = await CallLog.find(callLogsQuery)
      .populate('client', 'companyName')
      .populate('performedBy', 'name')
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // If no call logs today, show upcoming scheduled calls (clients with nextCallDate in future)
    let callsDateRange = 'today';
    if (todayCallLogs.length === 0) {
      const nextWeek = new Date(startOfDay);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      // Fetch upcoming clients to call
      let upcomingClients = [];
      if (userRole === 'admin' || userRole === 'manager') {
        upcomingClients = await Client.find({
          nextCallDate: {
            $gt: endOfDay,
            $lte: nextWeek
          },
          isActive: true
        })
          .populate('createdBy', 'name')
          .sort({ nextCallDate: 1 })
          .limit(5)
          .lean();
      } else {
        upcomingClients = await Client.find({
          nextCallDate: {
            $gt: endOfDay,
            $lte: nextWeek
          },
          createdBy: userId,
          isActive: true
        })
          .populate('createdBy', 'name')
          .sort({ nextCallDate: 1 })
          .limit(5)
          .lean();
      }
      
      if (upcomingClients.length > 0) {
        callsDateRange = 'upcoming';
        // Map to similar structure
        todayCallLogs = upcomingClients.map(client => ({
          _id: client._id,
          client: { companyName: client.companyName },
          date: client.nextCallDate,
          outcome: 'Scheduled',
          notes: `Upcoming call scheduled`,
          performedBy: client.createdBy,
          isUpcoming: true
        }));
      }
    }

    dashboardData.recentCalls = {
      count: todayCallLogs.length,
      items: todayCallLogs,
      dateRange: callsDateRange
    };

    // 7. Fetch Active Payment Reminders
    let paymentReminderQuery = { status: 'active' };

    if (userRole === 'employee') {
      paymentReminderQuery.createdBy = userId;
    }

    const activePaymentReminders = await PaymentReminder.find(paymentReminderQuery)
      .populate('client', 'companyName')
      .populate('createdBy', 'name')
      .sort({ nextScheduledDate: 1 })
      .limit(10)
      .lean();

    dashboardData.paymentReminders = {
      count: activePaymentReminders.length,
      items: activePaymentReminders.map(pr => ({
        _id: pr._id,
        clientName: pr.client?.companyName || 'Unknown Client',
        invoiceNumber: pr.invoiceNumber || 'N/A',
        invoiceAmount: pr.invoiceAmount || 0,
        messagesSent: pr.messagesSent || 0,
        totalMessagesToSend: pr.totalMessagesToSend || 5,
        frequencyInDays: pr.frequencyInDays || 2,
        messageTemplate: pr.messageTemplate || '',
        nextScheduledDate: pr.nextScheduledDate,
        lastSentDate: pr.lastSentDate,
        status: pr.status,
        createdBy: pr.createdBy?.name || 'Unknown'
      }))
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats
};
