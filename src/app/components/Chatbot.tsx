'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Chatbot.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Chatbot() {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chatbot_greeting', '¡Hola! Soy Luna, tu asistente virtual de VirtualAid. ¿En qué puedo ayudarte hoy?'),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickResponses = [
    t('chatbot_q_how', 'How to schedule an appointment?'),
    t('chatbot_q_specialties', 'What specialties do you have?'),
    t('chatbot_q_prices', 'What are the prices?'),
    t('chatbot_q_contact', 'Contact information'),
    t('chatbot_q_whatsapp', 'Contact via WhatsApp')
  ];

  const generateBotResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    if (
      lowerMessage.includes(t('chatbot_kw_appointment', 'appointment').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_schedule', 'schedule').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_book', 'book').toLowerCase())
    ) {
      return t('chatbot_r_how', 'To schedule an appointment, follow these steps:\n1. Click "Sign Up" in the menu\n2. Select the specialty you need\n3. Choose an available date and time\n4. Confirm your booking\n\nWould you like me to redirect you to registration?');
    }
    if (
      lowerMessage.includes(t('chatbot_kw_specialty', 'specialty').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_doctor', 'doctor').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_physician', 'physician').toLowerCase())
    ) {
      return t('chatbot_r_specialties', 'We have the following specialties available:\n• Cardiology - From $80\n• Dermatology - From $60\n• Pediatrics - From $50\n• Gynecology - From $70\n• Traumatology - From $90\n• Neurology - From $100\n\nAre you interested in any particular one?');
    }
    if (
      lowerMessage.includes(t('chatbot_kw_price', 'price').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_cost', 'cost').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_payment', 'payment').toLowerCase())
    ) {
      return t('chatbot_r_prices', 'Our prices vary by specialty:\n• Pediatrics: From $50\n• Dermatology: From $60\n• Gynecology: From $70\n• Cardiology: From $80\n• Traumatology: From $90\n• Neurology: From $100\n\nAll prices are transparent, no surprises.');
    }
    if (
      lowerMessage.includes(t('chatbot_kw_contact', 'contact').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_phone', 'phone').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_email', 'email').toLowerCase()) ||
      lowerMessage.includes('whatsapp')
    ) {
      return t('chatbot_r_contact', 'You can contact us by:\n📧 Email: info@virtualaid.com\n📞 Phone: +1 (555) 123-4567\n💬 WhatsApp: Click the WhatsApp button at the top\n🕒 Hours: Mon - Fri: 8:00 AM - 6:00 PM\n\nWe also have 24/7 support available.');
    }
    if (
      lowerMessage.includes(t('chatbot_kw_hello', 'hello').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_goodmorning', 'good morning').toLowerCase()) ||
      lowerMessage.includes(t('chatbot_kw_goodevening', 'good evening').toLowerCase())
    ) {
      return t('chatbot_r_greeting', 'Hello! Welcome to VirtualAid. I am here to help you with:\n• Information about our specialties\n• How to schedule an appointment\n• Prices and services\n• Contact details\n\nHow can I assist you?');
    }
    if (lowerMessage.includes('whatsapp')) {
      return t('chatbot_r_whatsapp', 'Perfect! You can contact us directly via WhatsApp by clicking the green 💬 button at the top of the chat. It will automatically redirect you to our WhatsApp with a predefined message.\n\nIs there anything else I can help you with?');
    }
    return t('chatbot_r_default', 'Thank you for your message. I can help you with information about:\n• Medical specialties\n• How to schedule appointments\n• Consultation prices\n• Contact information\n• Contact via WhatsApp\n\nWhat topic would you like to know more about?');
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular delay de respuesta del bot
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputValue),
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickResponse = (response: string) => {
    if (response === 'Contactar por WhatsApp') {
      handleWhatsAppRedirect();
      return;
    }
    setInputValue(response);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleWhatsAppRedirect = () => {
    const phoneNumber = "1234567890"; // Reemplaza con tu número de WhatsApp
    const message = "Hola, me gustaría obtener más información sobre VirtualAid";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Botones flotantes */}
      <div className="floating-buttons">
        {/* Botón de WhatsApp */}
        <div className="whatsapp-float-btn" onClick={handleWhatsAppRedirect} title="Contactar por WhatsApp">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
        </div>

        {/* Botón del chatbot */}
        <div className={`chatbot-toggle ${isOpen ? 'chatbot-toggle-open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          )}
        </div>
      </div>

      {/* Ventana del chatbot */}
      <div className={`chatbot-window ${isOpen ? 'chatbot-window-open' : ''}`}>
        <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-avatar">👩‍⚕️</div>
          <div>
            <h4 className="chatbot-title">{t('chatbot_name', 'Luna Assistant')}</h4>
            <p className="chatbot-status">
              <span className="status-indicator"></span>
              {t('chatbot_online', 'Online')}
            </p>
          </div>
        </div>
          <button className="chatbot-close" onClick={() => setIsOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.isUser ? 'message-user' : 'message-bot'}`}>
              <div className="message-content">
                <p className="message-text">{message.text}</p>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message message-bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="quick-responses">
            <p className="quick-responses-title">{t('chatbot_faq', 'Preguntas frecuentes:')}</p>
            {quickResponses.map((response, index) => (
              <button
                key={index}
                className="quick-response-btn"
                onClick={() => handleQuickResponse(response)}
              >
                {response}
              </button>
            ))}
          </div>
        )}

        <div className="chatbot-input">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chatbot_placeholder', 'Escribe tu mensaje...')}
            className="chatbot-input-field"
          />
          <button
            onClick={handleSendMessage}
            className="chatbot-send-btn"
            disabled={!inputValue.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
