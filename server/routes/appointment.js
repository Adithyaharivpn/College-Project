const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const ChatRoom = require('../models/ChatRoom');
const Notification = require('../models/Notification');
const Job = require('../models/JobsModel');
const logger = require('../utils/logger');
const authMiddleware = require('../middleware/authMiddlware');

// Get active appointment for a given job
router.get('/by-job/:jobId', async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({ jobId: req.params.jobId });
    if (!chatRooms.length) return res.status(404).json({ message: 'No chat rooms found for this job' });

    const roomIds = chatRooms.map(r => r._id);
    const appointment = await Appointment.findOne({
      roomId: { $in: roomIds },
      status: { $nin: ['rejected', 'cancelled'] }
    }).sort({ createdAt: -1 });

    if (!appointment) return res.status(404).json({ message: 'No active appointment found' });
    res.json(appointment);
  } catch (err) {
    logger.error(`Error fetching appointment by job: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { roomId, providerId, date, price, status } = req.body;
    
    const newAppointment = new Appointment({
      roomId,
      providerId,
      date,
      price,
      status
    });

    const savedAppointment = await newAppointment.save();
    logger.info(`New appointment created: ${date} for Provider ${providerId}`, { 
        meta: { type: 'appointment_create', roomId } 
    });

    res.status(201).json(savedAppointment);
  } catch (err) {
    logger.error(`Error creating appointment: ${err.message}`);
    res.status(500).json(err);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { status: req.body.status } 
      },
      { new: true } 
    );
    
    logger.info(`Appointment ${req.params.id} updated to status: ${req.body.status}`);

    res.status(200).json(updatedAppointment);
  } catch (err) {
    logger.error(`Error updating appointment: ${err.message}`);
    res.status(500).json(err);
  }
});

router.put('/:id/start-journey', async (req, res) => {
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { status: 'in_transit' } 
      },
      { new: true } 
    );
    
    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    logger.info(`Appointment ${req.params.id} updated to status: in_transit (Provider started journey)`);

    res.status(200).json(updatedAppointment);
  } catch (err) {
    logger.error(`Error starting journey for appointment: ${err.message}`);
    res.status(500).json(err);
  }
});

router.post('/propose-reschedule', authMiddleware, async (req, res) => {
  try {
    const { jobId, proposedDate, proposedBy } = req.body;
    if (!jobId || !proposedDate || !proposedBy) {
      return res.status(400).json({ message: "jobId, proposedDate, and proposedBy are required" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    let room;
    if (req.user.role === 'tradesperson') {
      room = await ChatRoom.findOne({ jobId, tradespersonId: req.user.id });
    } else {
      if (job.assignedTo) {
        room = await ChatRoom.findOne({ jobId, tradespersonId: job.assignedTo });
      }
    }

    if (!room) {
      return res.status(404).json({ message: "No active chat found for this job. Please message the other party first." });
    }

    let appointment = await Appointment.findOne({
      roomId: room._id,
      status: { $nin: ['rejected', 'cancelled'] }
    }).sort({ createdAt: -1 });

    if (!appointment) {
      appointment = new Appointment({
        roomId: room._id,
        providerId: room.tradespersonId,
        date: job.scheduledDate || new Date(),
        price: job.price || 0,
        status: 'pending'
      });
    }

    appointment.status = 'reschedule_requested';
    appointment.proposedDate = proposedDate;
    appointment.proposedBy = proposedBy;
    appointment.rescheduleRequestedAt = new Date();

    await appointment.save();

    try {
      const recipientId = proposedBy.toString() === room.customerId.toString()
        ? room.tradespersonId
        : room.customerId;

      const notif = await Notification.create({
        recipient: recipientId,
        sender: proposedBy,
        message: `Reschedule proposed for "${job.title}". New date: ${new Date(proposedDate).toLocaleString('en-IN')}. Check chat to respond.`,
        link: `/dashboard/chat/${room._id}`
      });

      const io = req.app.get('io');
      if (io) io.to(recipientId.toString()).emit('receiveNotification', notif);
    } catch (notifErr) {
      logger.warn(`Reschedule notification failed: ${notifErr.message}`);
    }

    res.status(200).json({ message: "Reschedule proposed!", appointment });
  } catch (error) {
    logger.error(`Error in propose-reschedule: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch('/:id/reschedule-request', async (req, res) => {
  try {
     const { proposedDate, proposedBy } = req.body;
     if (!proposedDate || !proposedBy) {
        return res.status(400).json({ message: "proposedDate and proposedBy are required" });
     }

     const appointment = await Appointment.findById(req.params.id);
     if (!appointment) return res.status(404).json({ message: "Appointment not found" });

     appointment.status = 'reschedule_requested';
     appointment.proposedDate = proposedDate;
     appointment.proposedBy = proposedBy;
     appointment.rescheduleRequestedAt = new Date();

     await appointment.save();
     
     try {
       const room = await ChatRoom.findById(appointment.roomId);
       if (room) {
         const proposedByStr = proposedBy.toString();
         const recipientId = proposedByStr === room.customerId.toString()
           ? room.tradespersonId
           : room.customerId;

         const notif = await Notification.create({
           recipient: recipientId,
           sender: proposedBy,
           message: `A reschedule has been requested. Proposed date: ${new Date(proposedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}. Please check the chat to accept or decline.`,
           link: `/dashboard/chat/${room._id}`
         });

         const io = req.app.get('io');
         if (io) io.to(recipientId.toString()).emit('receiveNotification', notif);
         logger.info(`Reschedule notification sent to ${recipientId}`);
       }
     } catch (notifErr) {
       logger.warn(`Could not send reschedule notification: ${notifErr.message}`);
     }

     logger.info(`Appointment ${req.params.id} requested reschedule by ${proposedBy} to ${proposedDate}`);
     res.status(200).json(appointment);
  } catch (error) {
     logger.error(`Error requesting reschedule: ${error.message}`);
     res.status(500).json(error);
  }
});

router.patch('/:id/reschedule-accept', async (req, res) => {
  try {
     const appointment = await Appointment.findById(req.params.id);
     if (!appointment) return res.status(404).json({ message: "Appointment not found" });

     if (appointment.status !== 'reschedule_requested' || !appointment.proposedDate) {
        return res.status(400).json({ message: "No active reschedule request to accept" });
     }

     appointment.date = appointment.proposedDate;
     appointment.status = 'confirmed';
     appointment.proposedDate = undefined;
     appointment.proposedBy = undefined;
     appointment.rescheduleRequestedAt = undefined;

     await appointment.save();

     logger.info(`Appointment ${req.params.id} reschedule request accepted. New date: ${appointment.date}`);
     res.status(200).json(appointment);
  } catch (error) {
     logger.error(`Error accepting reschedule: ${error.message}`);
     res.status(500).json(error);
  }
});

router.patch('/:id/reschedule-decline', async (req, res) => {
  try {
     const appointment = await Appointment.findById(req.params.id);
     if (!appointment) return res.status(404).json({ message: "Appointment not found" });

     if (appointment.status !== 'reschedule_requested') {
         return res.status(400).json({ message: "No active reschedule request to decline" });
     }

     appointment.status = 'confirmed'; // Revert back to confirmed
     appointment.proposedDate = undefined;
     appointment.proposedBy = undefined;
     appointment.rescheduleRequestedAt = undefined;

     await appointment.save();

     logger.info(`Appointment ${req.params.id} reschedule request declined. Maintained originally set date.`);
     res.status(200).json(appointment);
  } catch (error) {
     logger.error(`Error declining reschedule: ${error.message}`);
     res.status(500).json(error);
  }
});

module.exports = router;