import express from 'express';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  addTicketResponse,
  getTickets,
  updateTicketStatus,
} from '../controllers/ticketController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createTicket)
  .get(protect, admin, getTickets);

router.get('/mytickets', protect, getMyTickets);

router.route('/:id')
  .get(protect, getTicketById)
  .put(protect, admin, updateTicketStatus);

router.route('/:id/responses').post(protect, addTicketResponse);

export default router;
