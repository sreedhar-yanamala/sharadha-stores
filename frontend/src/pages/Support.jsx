import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MessageSquare, Send, Plus, HelpCircle, ChevronDown, ChevronUp, ShoppingBag, ExternalLink, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

export default function Support() {
  const { user, token } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Mode tabs: 'faq' (Browse help), 'tickets' (Raise/View tickets), 'chat' (Live Bot Chat)
  const [activeTab, setActiveTab] = useState('faq');

  // FAQ states
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = [
    { q: 'Are your traditional sweets prepared with pure cow ghee?', a: 'Yes, absolutely. All our sweets, including Ghee Mysore Pak and Besan Laddoos, are prepared strictly using 100% pure premium cow ghee.' },
    { q: 'How long can I store traditional Murukku and butter snacks?', a: 'Our handmade Rice Murukku and Butter Murukku are packed fresh. They have a shelf life of 45 days. We recommend storing them in airtight containers.' },
    { q: 'Do you use synthetic food colors or preservatives?', a: 'No. Sharadha Stores is dedicated to pure traditional foods. We use 100% natural spices, wood-pressed oils, and zero synthetic preservatives or artificial colors.' },
    { q: 'Can I pause or reschedule my weekly subscription refill?', a: 'Yes! Navigate to the Subscriptions tab, click "My Subscriptions", and choose Pause. You can resume or cancel the delivery dates at your convenience.' },
    { q: 'Where do you ship your traditional food products?', a: 'We currently deliver throughout India, utilizing express shipping partners to ensure the items arrive fresh and crispy.' }
  ];

  // Ticketing states
  const [ticketsList, setTicketsList] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [subject, setSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);



  useEffect(() => {
    if (activeTab === 'tickets' && token) {
      fetchUserTickets();
    }
  }, [activeTab, token]);

  const fetchUserTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch(`${API_BASE}/api/tickets/mytickets`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTicketsList(data);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !ticketMsg.trim()) {
      showToast('Please enter both subject and message details.', 'warning');
      return;
    }
    setSubmittingTicket(true);
    try {
      const response = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify({
          name: user ? user.name : 'Guest User',
          email: user ? user.email : 'guest@example.com',
          subject,
          message: ticketMsg,
          priority
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        showToast('Support ticket registered successfully!', 'success');
        setSubject('');
        setTicketMsg('');
        if (token) fetchUserTickets();
      } else {
        showToast('Failed to create ticket.', 'error');
      }
    } catch (error) {
      showToast('Connection error.', 'error');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleViewTicketDetails = async (tId) => {
    try {
      const response = await fetch(`${API_BASE}/api/tickets/${tId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedTicket(data);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();
    if (!responseMsg.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/tickets/${selectedTicket._id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: responseMsg })
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedTicket(data);
        setResponseMsg('');
        fetchUserTickets();
      }
    } catch (error) {
      showToast('Error replying to ticket.', 'error');
    }
  };



  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      
      {/* Page Header */}
      <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Customer Support</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>We are happy to answer your traditional food questions</p>
        </div>

        {/* Support Tabs */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '2rem', overflow: 'hidden' }}>
          <button onClick={() => setActiveTab('faq')} className={`btn btn-sm ${activeTab === 'faq' ? 'btn-secondary' : 'btn-outline'}`} style={{ borderRadius: 0, padding: '0.5rem 1.25rem' }}>
            FAQs & Info
          </button>
          <button onClick={() => setActiveTab('tickets')} className={`btn btn-sm ${activeTab === 'tickets' ? 'btn-secondary' : 'btn-outline'}`} style={{ borderRadius: 0, padding: '0.5rem 1.25rem' }}>
            Ticketing Portal
          </button>

        </div>
      </div>

      {/* TAB 1: FAQ ACCORDIONS */}
      {activeTab === 'faq' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }} className="fade-in">
          {/* Collapsible details */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Frequently Asked Questions</h3>
            {faqs.map((faq, i) => (
              <div key={i} className="card-glass" style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '1.25rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    color: 'var(--text)',
                    background: openFaq === i ? 'rgba(46, 125, 50, 0.03)' : 'transparent'
                  }}
                >
                  <span style={{ display: 'flex', gap: '0.5rem' }}>
                    <HelpCircle size={18} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                    {faq.q}
                  </span>
                  {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaq === i && (
                  <div style={{ padding: '1rem 1.25rem 1.25rem 2.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Simple Contact Form cards */}
          <div style={{ flexShrink: 0 }} className="card-glass">
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Direct Helpline</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                If you have a quick order inquiry or custom sweet request, reach out to our kitchen helpline directly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={18} style={{ color: 'var(--secondary)' }} />
                  <span>Call: +91 98765 43210</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={18} style={{ color: 'var(--secondary)' }} />
                  <span>Mail: support@sharadhastores.com</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: SUPPORT TICKETS PORTAL */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }} className="fade-in">
          
          {/* Raise Support Ticket Form */}
          <div style={{ flex: '1 1 350px' }} className="card-glass">
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem' }}>Raise Support Ticket</h3>
              <form onSubmit={handleRaiseTicket}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    placeholder="E.g., Delay in delivery / custom sweet order"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-input">
                    <option value="Low">Low (General Inquiry)</option>
                    <option value="Medium">Medium (Account/Refund issue)</option>
                    <option value="High">High (Order issues)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Detailed Message</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your query in detail..."
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    className="form-input"
                    style={{ resize: 'none' }}
                    required
                  ></textarea>
                </div>
                <button type="submit" disabled={submittingTicket} className="btn btn-secondary" style={{ width: '100%' }}>
                  {submittingTicket ? 'Sending...' : 'Submit Ticket'}
                </button>
              </form>
            </div>
          </div>

          {/* User Tickets Log Grid */}
          <div style={{ flex: '2 1 450px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>My Support Tickets</h3>
            
            {!token ? (
              <div className="card-glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Please sign in to view your raised support tickets history.
              </div>
            ) : loadingTickets ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading tickets history...</div>
            ) : ticketsList.length === 0 ? (
              <div className="card-glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                You have not raised any support tickets yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {ticketsList.map(ticket => (
                  <div key={ticket._id} className="card-glass" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{ticket.subject}</h4>
                      <span className={`badge ${ticket.status === 'Open' ? 'badge-primary' : ticket.status === 'In_Progress' ? 'badge-accent' : 'badge-secondary'}`}>
                        {ticket.status === 'In_Progress' ? 'In Progress' : ticket.status}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span>Raised: {new Date(ticket.createdAt).toLocaleDateString()} • Priority: <span style={{ fontWeight: 600 }}>{ticket.priority}</span></span>
                      <button onClick={() => handleViewTicketDetails(ticket._id)} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        View Conversation &rarr;
                      </button>
                    </div>

                    {/* View details modal display inside card */}
                    {selectedTicket && selectedTicket._id === ticket._id && (
                      <div style={{
                        marginTop: '1.25rem',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}>
                        <div style={{ background: 'var(--background)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Initial Message:</span>
                          {selectedTicket.message}
                        </div>

                        {/* Responses list */}
                        {selectedTicket.responses.map((rep, idx) => (
                          <div key={idx} style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius)',
                            fontSize: '0.9rem',
                            maxWidth: '85%',
                            alignSelf: rep.sender === 'Admin' ? 'flex-start' : 'flex-end',
                            background: rep.sender === 'Admin' ? 'rgba(46, 125, 50, 0.08)' : 'rgba(255, 107, 53, 0.08)',
                            border: rep.sender === 'Admin' ? '1px solid rgba(46, 125, 50, 0.15)' : '1px solid rgba(255, 107, 53, 0.15)'
                          }}>
                            <span style={{ fontSize: '0.75rem', display: 'block', fontWeight: 600, color: 'var(--text-muted)' }}>{rep.senderName} ({rep.sender})</span>
                            {rep.message}
                          </div>
                        ))}

                        {/* Add response form */}
                        <form onSubmit={handleAddResponse} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Type your response reply..."
                            value={responseMsg}
                            onChange={(e) => setResponseMsg(e.target.value)}
                            className="form-input"
                            style={{ height: '38px', fontSize: '0.85rem' }}
                            required
                          />
                          <button type="submit" className="btn btn-secondary btn-sm" style={{ borderRadius: 'var(--radius)' }}>
                            Send
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
