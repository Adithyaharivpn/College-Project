const Job = require('../models/JobsModel');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const Appointment = require('../models/Appointment');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const logger = require('../utils/logger'); 
const axios = require('axios');

const postJob = async (req, res) => {
  try {
    const { title, category, description, city, location } = req.body;
    const userId = req.user.id; 

    if (!title || !category || !description || !city) {
      logger.warn(`Job post failed: Missing fields by User ${userId}`);
      return res.status(400).json({ message: 'Please fill out all required fields.' });
    }
    
    const newJob = new Job({
      title,
      category,
      description,
      city,
      location,
      user: userId, 
    });

    await newJob.save();
    logger.info(`Job posted: "${title}" by User ${userId}`, { meta: { jobId: newJob._id } });

    const io = req.app.get('io');
    if (io) {
        io.emit('job_created', newJob);
    }

    res.status(201).json({ message: 'Job posted successfully!', job: newJob });

  } catch (error) {
    logger.error(`Error posting job: ${error.message}`);
    res.status(500).json({ message: 'Error, please try again later.' });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' })
      .populate('user', 'name') 
      .sort({ createdAt: -1 }); 

    res.status(200).json(jobs);
  } catch (error) {
    logger.error(`Error fetching jobs: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user.id })
      .populate('user', 'name') 
      .sort({ createdAt: -1 })
      .select('+completionCode');

    const jobsWithAppointments = await Promise.all(jobs.map(async (job) => {
       const jobObj = job.toObject();
       const chatRooms = await ChatRoom.find({ jobId: job._id });
       if (chatRooms.length > 0) {
         const roomIds = chatRooms.map(r => r._id);
         const appointment = await Appointment.findOne({ 
           roomId: { $in: roomIds },
           status: { $nin: ['rejected', 'cancelled'] }
         }).sort({ createdAt: -1 });
         if (appointment) {
           jobObj.appointment = appointment;
         }
       }
       return jobObj;
    }));

    res.json(jobsWithAppointments);
  } catch (err) {
    logger.error(`Error fetching my jobs: ${err.message}`);
    res.status(500).send('Server Error');
  }
};

const getTradespersonFeed = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const realUser = await User.findById(userId);

    const userCategories = realUser && Array.isArray(realUser.tradeCategory) 
      ? realUser.tradeCategory 
      : (realUser && realUser.tradeCategory ? [realUser.tradeCategory] : []);

    const query = { status: 'open' };
    
    // Only fetch jobs matching the tradesperson's selected categories
    if (userCategories.length > 0 && userCategories[0]) {
      query.category = { $in: userCategories };
    }

    const jobs = await Job.find(query)
    .populate('user') 
    .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    logger.error(`Error fetching tradesperson feed: ${err.message}`);
    res.status(500).send('Server Error');
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('user', 'name profilePictureUrl')
      .populate('assignedTo', 'name profilePictureUrl')
      .select('+completionCode');

    if (!job) return res.status(404).json({ msg: 'Job not found' });

    let jobData = job.toObject();
    const currentUserId = req.user ? req.user.id.toString() : '';
    const jobOwnerId = job.user._id ? job.user._id.toString() : job.user.toString();
    
    const isOwner = currentUserId === jobOwnerId;
    if (!isOwner || !job.isPaid || job.status === 'completed' || job.status === 'cancelled') {
       delete jobData.completionCode; 
    }

    const chatRooms = await ChatRoom.find({ jobId: jobData._id });
    if (chatRooms.length > 0) {
       const roomIds = chatRooms.map(r => r._id);
       const appointment = await Appointment.findOne({
         roomId: { $in: roomIds },
         status: { $nin: ['rejected', 'cancelled'] }
       }).sort({ createdAt: -1 });
       if (appointment) {
         jobData.appointment = appointment;
       }
    }

    res.json(jobData);
  } catch (err) {
    console.error(`Error fetching job details: ${err.message}`);
    res.status(500).send('Server Error');
  }
};
const getTradespersonActivejobs = async (req, res) => {
  const currentUserId = req.user.id; 

  try {
    const jobs = await Job.find({ 
        assignedTo: currentUserId, 
        status: { $in: ['assigned', 'completed', 'in_progress', 'cancelled'] } 
    })
    .populate('user', 'name email profilePictureUrl') 
    .sort({ updatedAt: -1 });

    const ChatRoom = require('../models/ChatRoom');
    const Appointment = require('../models/Appointment');

    const jobsWithAppointments = await Promise.all(jobs.map(async (job) => {
       const jobObj = job.toObject();
       const chatRooms = await ChatRoom.find({ jobId: job._id });
       if (chatRooms.length > 0) {
         const roomIds = chatRooms.map(r => r._id);
         const appointment = await Appointment.findOne({ 
           roomId: { $in: roomIds },
           status: { $nin: ['rejected', 'cancelled'] }
         }).sort({ createdAt: -1 });
         if (appointment) {
           jobObj.appointment = appointment;
         }
       }
       return jobObj;
    }));

    res.json(jobsWithAppointments);
  } catch (error) {
    console.error(`Error fetching tradesperson works: ${error.message}`);
    res.status(500).json({ message: "Server error fetching jobs" });
  }
};

const updateJob = async (req, res) => {
  try {
    const { title, description, category, city } = req.body;
    
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.user.toString() !== req.user.id) {
      logger.warn(`Unauthorized job update attempt by User ${req.user.id} on Job ${req.params.id}`);
      return res.status(401).json({ message: 'Not authorized to edit this job' });
    }
    job.title = title || job.title;
    job.description = description || job.description;
    job.category = category || job.category;
    job.city = city || job.city;

    await job.save();
    
    logger.info(`Job updated: ${req.params.id} by User ${req.user.id}`);

    const io = req.app.get('io');
    if (io) {
        io.emit('job_updated', job);
    }
    
    res.json(job);
  } catch (error) {
    logger.error(`Error updating job: ${error.message}`);
    res.status(500).send('Server Error');
  }
};

const completeJob = async (req, res) => {
  const { jobId, code } = req.body;
  try {
    const job = await Job.findById(jobId).select('+completionCode');

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.completionCode !== code) {
      logger.warn(`Job completion failed: Invalid code for Job ${jobId}`);
      return res.status(400).json({ message: "Invalid Code! Ask the customer for the correct code." });
    }

    job.status = 'completed';
    job.isCompleted = true;
    await job.save();

    const transaction = await Transaction.findOne({ job: jobId, status: 'pending' });
    if (transaction) {
        transaction.status = 'success';
        await transaction.save();
        logger.info(`Transaction released for Job ${jobId}`);
    }

    try {
        await ChatRoom.updateMany(
            { jobId: jobId },
            { $set: { isArchived: true } }
        );
        logger.info(`Chatrooms archived for completed Job ${jobId}`);
    } catch (archiveErr) {
        logger.warn(`Could not archive chatroom for Job ${jobId}: ${archiveErr.message}`);
    }

    logger.info(`Job successfully completed: ${jobId}`, { meta: { type: 'job_complete' } });

    const io = req.app.get('io');
    if (io) {
        io.to(job.user.toString()).emit('job_review_prompt', { 
            jobId: job._id, 
            targetId: req.user.id
        });
        
        if (job.assignedTo) {
             io.to(job.assignedTo.toString()).emit('job_review_prompt', { 
                jobId: job._id, 
                targetId: job.user 
            });
        }
    }

    res.json({ message: "Job Verified & Completed!", success: true });
  } catch (error) {
    logger.error(`Error completing job: ${error.message}`);
    res.status(500).json(error);
  }
};

const markJobAsPaid = async (req, res) => {
    try {
        const { paymentId } = req.body;
        const job = await Job.findById(req.params.id).populate('user').populate('assignedTo');

        if (!job) return res.status(404).json({ message: 'Job not found' });

        const amountPaid = job.price || 0; 
        const newTransaction = new Transaction({
            user: job.user._id, 
            tradesperson: job.assignedTo ? job.assignedTo._id : null, 
            job: job._id,
            stripePaymentId: paymentId,
            amount: amountPaid,
            status: 'success'
        });
        
        await newTransaction.save();
        job.isPaid = true;
        job.paymentId = paymentId;
        job.completionCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await job.save();
        
        logger.info(`Payment Transaction Saved: ${newTransaction._id}`);

        res.json({ 
            success: true, 
            message: "Payment recorded & Code generated",
            completionCode: job.completionCode 
        });

    } catch (error) {
        logger.error("Error in markJobAsPaid:", error);
        res.status(500).send('Server Error');
    }
};

const depositJobFunds = async (req, res) => {
  try {
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      
      const currentUserId = req.user.id.toString();
      if (job.user.toString() !== currentUserId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      job.fundsDeposited = true;
      
      job.completionCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const escrowTx = new Transaction({
        user: job.user,
        tradesperson: job.assignedTo,
        job: job._id,
        amount: job.price || 0,
        status: 'pending',
        stripePaymentId: `ESCROW_${Date.now()}` 
      });
      await escrowTx.save();

      await job.save();

      const io = req.app.get('io');
      if (io) io.emit('job_updated', job);

      res.json({ success: true, message: "Funds Deposited to Escrow", job });

  } catch (error) {
      logger.error(`Error depositing funds: ${error.message}`);
      res.status(500).json({ message: error.message });
  }
};


const searchLocation = async (req, res) => {
    try {
        const { q } = req.query;
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`, {
            headers: { 'User-Agent': 'HomeCrew-App' }
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const rescheduleJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate } = req.body;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const currentUserId = req.user.id.toString();
    const isOwner = job.user.toString() === currentUserId;
    const isAssigned = job.assignedTo && job.assignedTo.toString() === currentUserId;

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to reschedule this job' });
    }

    const fs = require('fs');
    const logsDir = require('path').join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    const debugLogPath = require('path').join(logsDir, 'reschedule_debug.txt');
    
    const normalizedStatus = (job.status || "").toLowerCase();
    const hasAssignee = !!job.assignedTo;
    
    const logMsg = `[${new Date().toISOString()}] REQ: ${id} | Status: "${job.status}" | HasAssignee: ${hasAssignee}\n`;
    fs.appendFileSync(debugLogPath, logMsg);
    
    // Strict block: If job has an assignee OR status is assigned/in_progress, force mutual approval
    if (hasAssignee || ['assigned', 'in_progress'].includes(normalizedStatus)) {
      logger.warn(`Reschedule blocked: Job ${id} (Status: ${job.status}, Assignee: ${hasAssignee}) requires mutual approval.`);
      return res.status(400).json({ 
          message: 'Mutual approval required for assigned jobs. Please use the reschedule request in chat.' 
      });
    }

    job.scheduledDate = scheduledDate;
    await job.save();
    try {
      const chatRooms = await ChatRoom.find({ jobId: job._id });
      if (chatRooms.length > 0) {
        const roomIds = chatRooms.map(r => r._id);
        await Appointment.findOneAndUpdate(
          { roomId: { $in: roomIds }, status: { $nin: ['rejected', 'cancelled'] } },
          { $set: { date: new Date(scheduledDate) } },
          { sort: { createdAt: -1 } }
        );
      }
    } catch (apptErr) {
      logger.warn(`Could not sync appointment date on reschedule: ${apptErr.message}`);
    }

    const io = req.app.get('io');
    if (io) {
        io.emit('job_updated', job);
    }

    res.status(200).json({ 
      message: "Job rescheduled successfully", 
      scheduledDate: job.scheduledDate 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const cancelJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.status === 'completed' || job.status === 'cancelled') {
      return res.status(400).json({ message: "Cannot cancel a job that is already finished or cancelled" });
    }

    // 1. Robust ID Check
    const currentUserId = req.user.id.toString();
    const jobOwnerId = job.user.toString();
    const jobAssigneeId = job.assignedTo ? job.assignedTo.toString() : null;

    const isOwner = jobOwnerId === currentUserId;
    const isTradesperson = jobAssigneeId === currentUserId;

    // Fix: Allow BOTH to cancel
    if (!isOwner && !isTradesperson) {
      return res.status(403).json({ message: 'Only the poster or assigned worker can cancel.' });
    }

    if (job.status === 'in_progress' && isOwner) {
      return res.status(400).json({ 
        message: "Work is in progress. Please contact the worker to discuss cancellation." 
      });
    }

    if (isTradesperson) {
      if (job.fundsDeposited) {
        const transaction = await Transaction.findOne({ job: job._id, status: 'pending' });
        if (transaction) {
          transaction.status = 'refunded';
          await transaction.save();
          
          // Notify customer of refund
          const refundNotif = await Notification.create({
            recipient: job.user,
            sender: currentUserId,
            message: `Refund Processed: ₹${transaction.amount} for "${job.title}" has been returned as the worker cancelled.`,
            link: `/dashboard/jobs`
          });
          const io = req.app.get('io');
          if (io) io.to(job.user.toString()).emit('receiveNotification', refundNotif);
        }
      }

      // Penalty check (< 4 hours)
      const chatRoom = await ChatRoom.findOne({ jobId: job._id });
      if (chatRoom) {
        const appointment = await Appointment.findOne({ roomId: chatRoom._id }).sort({ createdAt: -1 });
        if (appointment && appointment.status !== 'cancelled') {
          const timeDiff = new Date(appointment.date).getTime() - new Date().getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff > 0 && hoursDiff < 4) {
            const Report = require('../models/Report');
            await Report.create({
              reporterId: job.user,
              reportedUserId: currentUserId,
              jobId: job._id,
              reason: 'late_cancellation',
              description: `Tradesperson cancelled < 4 hours before start time.`,
              status: 'pending'
            });
          }
        }
      }
    }

    if (isOwner && job.assignedTo) {
      const chatRoom = await ChatRoom.findOne({ jobId: job._id });
      if (chatRoom) {
        const appointment = await Appointment.findOne({ roomId: chatRoom._id }).sort({ createdAt: -1 });
        if (appointment && appointment.status === 'in_transit' && job.fundsDeposited) {
          const transaction = await Transaction.findOne({ job: job._id, status: 'pending' });
          if (transaction) {
            const travelFee = transaction.amount * 0.10;
            transaction.status = 'refunded'; 
            await transaction.save();

            await Transaction.create({
              user: job.user,
              tradesperson: job.assignedTo,
              job: job._id,
              amount: travelFee,
              status: 'success',
              stripePaymentId: `TRAVEL_FEE_${Date.now()}`
            });
          }
        }
      }
    }

    // 3. Update Status
    if (isTradesperson) {
      job.status = 'open';
    } else {
      job.status = 'cancelled'; 
    }
    
    job.assignedTo = null;
    job.fundsDeposited = false;
    job.scheduledDate = null;
    
    await job.save();

    const io = req.app.get('io');
    if (io) io.emit('job_updated', job);

    res.status(200).json({ message: "Job cancelled successfully", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const disputeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    const currentUserId = req.user.id.toString();
    const jobOwnerId = job.user.toString();
    const jobAssigneeId = job.assignedTo ? job.assignedTo.toString() : null;

    if (currentUserId !== jobOwnerId && currentUserId !== jobAssigneeId) {
      return res.status(403).json({ message: "Not authorized to dispute this job" });
    }

    job.status = 'disputed';
    await job.save();

    const transaction = await Transaction.findOne({ job: job._id, status: 'pending' });
    if (transaction) {
      transaction.status = 'on_hold';
      await transaction.save();
    }

    const Report = require('../models/Report');
    await Report.create({
      reporterId: currentUserId,
      reportedUserId: currentUserId === jobOwnerId ? jobAssigneeId : jobOwnerId,
      jobId: job._id,
      reason: 'antigravity_triggered',
      description: 'Job disputed via automated process.',
      status: 'pending'
    });

    const io = req.app.get('io');
    if (io) io.emit('job_updated', job);

    res.status(200).json({ message: "Job disputed successfully", job });
  } catch (err) {
    res.status(500).json({ message: "Server error during dispute" });
  }
};


const getJobCode = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).select('+completionCode');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const currentUserId = req.user.id.toString();
    if (job.user.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to view completion code' });
    }

    const isFunded = job.fundsDeposited || job.isPaid;
    const isActiveJob = ['assigned', 'in_progress'].includes(job.status);
    
    if (!isFunded || !isActiveJob || !job.completionCode) {
      return res.status(400).json({ message: 'Completion code is not available yet' });
    }

    res.json({ completionCode: job.completionCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}

const startJob = async (req, res) => {
  try {
     const { id } = req.params;
     const { lat, lng } = req.body;

     const job = await Job.findById(id);
     if (!job) return res.status(404).json({ message: 'Job not found' });

     const currentUserId = req.user.id.toString();
     if (!job.assignedTo || job.assignedTo.toString() !== currentUserId) {
        return res.status(403).json({ message: 'Only assigned tradesperson can start this job' });
     }

     if (job.status === 'in_progress' || job.status === 'completed' || job.status === 'cancelled') {
        return res.status(400).json({ message: `Cannot start job from status: ${job.status}` });
     }

     job.status = 'in_progress';
     await job.save();

     logger.info(`Job ${id} started by Tradesperson ${currentUserId}`);

     const io = req.app.get('io');
     if (io) {
        io.emit('job_updated', job);
     }

     res.status(200).json({ message: 'Job started successfully', job });
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};


module.exports = { 
  postJob, 
  getJobs, 
  getMyJobs, 
  getTradespersonFeed, 
  getJobById, 
  getTradespersonActivejobs, 
  updateJob, 
  completeJob, 
  markJobAsPaid, 
  searchLocation,
  cancelJob,
  disputeJob,
  rescheduleJob,
  depositJobFunds,
  startJob
};
module.exports.getJobCode = getJobCode;