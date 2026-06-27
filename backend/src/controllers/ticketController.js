import SupportTicket from '../models/SupportTicket.js';

// @desc    Raise a support ticket
// @route   POST /api/tickets
// @access  Public (Optional auth)
export const createTicket = async (req, res) => {
  const { name, email, subject, message, priority } = req.body;

  try {
    const ticket = new SupportTicket({
      user: req.user ? req.user._id : undefined,
      name,
      email,
      subject,
      message,
      priority: priority || 'Medium',
    });

    const createdTicket = await ticket.save();
    res.status(201).json(createdTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user tickets
// @route   GET /api/tickets/mytickets
// @access  Private
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single ticket details
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (ticket) {
      // Validate ticket owner or admin
      if (
        (!ticket.user || ticket.user.toString() !== req.user._id.toString()) &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ message: 'Not authorized to view this ticket' });
      }
      res.json(ticket);
    } else {
      res.status(404).json({ message: 'Ticket not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a response message to a ticket
// @route   POST /api/tickets/:id/responses
// @access  Private
export const addTicketResponse = async (req, res) => {
  const { message } = req.body;

  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (ticket) {
      const isSenderAdmin = req.user.role === 'admin';
      
      const newResponse = {
        sender: isSenderAdmin ? 'Admin' : 'User',
        senderName: req.user.name,
        message,
      };

      ticket.responses.push(newResponse);

      // Automatically flip status to In Progress when admin replies
      if (isSenderAdmin && ticket.status === 'Open') {
        ticket.status = 'In_Progress';
      }

      await ticket.save();
      res.status(201).json(ticket);
    } else {
      res.status(404).json({ message: 'Ticket not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all support tickets (Admin only)
// @route   GET /api/tickets
// @access  Private/Admin
export const getTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({}).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update support ticket status or priority (Admin only)
// @route   PUT /api/tickets/:id
// @access  Private/Admin
export const updateTicketStatus = async (req, res) => {
  const { status, priority } = req.body;

  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (ticket) {
      ticket.status = status || ticket.status;
      ticket.priority = priority || ticket.priority;

      const updatedTicket = await ticket.save();
      res.json(updatedTicket);
    } else {
      res.status(404).json({ message: 'Ticket not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
