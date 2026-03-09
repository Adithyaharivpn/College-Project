const express = require('express');
const router = express.Router();
const { postJob, getJobs, getMyJobs, getTradespersonFeed, getJobById, getTradespersonActivejobs, updateJob,completeJob,markJobAsPaid,searchLocation, cancelJob, rescheduleJob, getJobCode, depositJobFunds, startJob } = require('../controller/PostJob');
const authMiddleware = require('../middleware/authMiddlware');


router.get('/', getJobs);

router.get('/userjob', authMiddleware, getMyJobs);

router.get('/feed', authMiddleware, getTradespersonFeed);

router.get('/tradesperson/my-works', authMiddleware, getTradespersonActivejobs);

router.post('/', authMiddleware, postJob);

router.post('/complete', authMiddleware, completeJob);

router.get('/location-search', searchLocation); 

router.put('/:id', authMiddleware, updateJob);

router.get('/:id', authMiddleware, getJobById);

router.get('/:id/code', authMiddleware, getJobCode);

router.put('/:id/pay', authMiddleware, markJobAsPaid);

router.put('/:id/cancel', authMiddleware, cancelJob);

router.put('/:id/reschedule', authMiddleware, rescheduleJob);

router.put('/:id/deposit', authMiddleware, depositJobFunds);

router.put('/:id/start', authMiddleware, startJob);








module.exports = router;
