from flask import Blueprint, request, jsonify
from models import db, SupportTicket, TicketResponse
from middleware.auth import protect, admin_required, optional_protect

ticket_bp = Blueprint('tickets', __name__)


# POST /api/tickets  (optional auth)
@ticket_bp.route('/', methods=['POST'])
@optional_protect
def create_ticket(current_user):
    data = request.get_json()
    ticket = SupportTicket(
        user_id=current_user.id if current_user else None,
        name=data.get('name', ''),
        email=data.get('email', ''),
        subject=data.get('subject', ''),
        message=data.get('message', ''),
        priority=data.get('priority', 'Medium'),
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify(ticket.to_dict()), 201


# GET /api/tickets/mytickets
@ticket_bp.route('/mytickets', methods=['GET'])
@protect
def my_tickets(current_user):
    tickets = SupportTicket.query.filter_by(user_id=current_user.id).order_by(SupportTicket.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tickets])


# GET /api/tickets  (admin)
@ticket_bp.route('/', methods=['GET'])
@admin_required
def get_tickets(current_user):
    tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tickets])


# GET /api/tickets/:id
@ticket_bp.route('/<int:ticket_id>', methods=['GET'])
@protect
def get_ticket(ticket_id, current_user):
    ticket = db.session.get(SupportTicket, ticket_id)
    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404
    if (not ticket.user_id or ticket.user_id != current_user.id) and current_user.role != 'admin':
        return jsonify({'message': 'Not authorized to view this ticket'}), 403
    return jsonify(ticket.to_dict())


# POST /api/tickets/:id/responses
@ticket_bp.route('/<int:ticket_id>/responses', methods=['POST'])
@protect
def add_response(ticket_id, current_user):
    ticket = db.session.get(SupportTicket, ticket_id)
    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404

    data = request.get_json()
    is_admin = current_user.role == 'admin'

    response = TicketResponse(
        ticket_id=ticket.id,
        sender='Admin' if is_admin else 'User',
        sender_name=current_user.name,
        message=data.get('message', ''),
    )
    db.session.add(response)

    if is_admin and ticket.status == 'Open':
        ticket.status = 'In_Progress'

    db.session.commit()
    return jsonify(ticket.to_dict()), 201


# PUT /api/tickets/:id  (admin)
@ticket_bp.route('/<int:ticket_id>', methods=['PUT'])
@admin_required
def update_ticket(ticket_id, current_user):
    ticket = db.session.get(SupportTicket, ticket_id)
    if not ticket:
        return jsonify({'message': 'Ticket not found'}), 404

    data = request.get_json()
    ticket.status = data.get('status', ticket.status)
    ticket.priority = data.get('priority', ticket.priority)

    db.session.commit()
    return jsonify(ticket.to_dict())
