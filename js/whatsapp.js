/* ==========================================================================
   SIMPLES AGENDA PRO - WHATSAPP AUTOMATION ENGINE
   ========================================================================== */

class WhatsAppEngine {
  formatPhone(phone) {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
      digits = '55' + digits;
    }
    return digits;
  }

  buildMessage(template, params = {}) {
    let msg = template || '';
    const settings = window.Store.getSettings();

    const replacements = {
      '{cliente}': params.clientName || 'Cliente',
      '{servico}': params.serviceName || 'Atendimento',
      '{data}': params.date ? this.formatDateBR(params.date) : 'hoje',
      '{horario}': params.time || '10:00',
      '{valor}': params.price ? parseFloat(params.price).toFixed(2).replace('.', ',') : '0,00',
      '{empresa}': settings.businessName || 'Nossa Empresa'
    };

    Object.keys(replacements).forEach(key => {
      msg = msg.replaceAll(key, replacements[key]);
    });

    return msg;
  }

  getWhatsAppUrl(phone, text) {
    const cleanPhone = this.formatPhone(phone);
    const encodedText = encodeURIComponent(text);

    // Se estiver em dispositivo móvel, usa wa.me, se desktop usa web.whatsapp.com
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      return `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }
    return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }

  sendBookingCreatedNotification(appt) {
    const clients = window.Store.getClients();
    const services = window.Store.getServices();
    const settings = window.Store.getSettings();

    const client = clients.find(c => c.id === appt.clientId);
    const service = services.find(s => s.id === appt.serviceId);

    if (!client || !client.phone) {
      window.showToast('Cliente sem telefone cadastrado.', 'warning');
      return;
    }

    const template = settings.whatsappTemplates?.created || '';
    const message = this.buildMessage(template, {
      clientName: client.name,
      serviceName: service ? service.name : 'Serviço',
      date: appt.date,
      time: appt.time,
      price: appt.price
    });

    const url = this.getWhatsAppUrl(client.phone, message);
    window.open(url, '_blank');
  }

  sendUpcomingReminder(appt) {
    const clients = window.Store.getClients();
    const services = window.Store.getServices();
    const settings = window.Store.getSettings();

    const client = clients.find(c => c.id === appt.clientId);
    const service = services.find(s => s.id === appt.serviceId);

    if (!client || !client.phone) {
      window.showToast('Telefone inválido para envio.', 'warning');
      return;
    }

    const template = settings.whatsappTemplates?.reminder || '';
    const message = this.buildMessage(template, {
      clientName: client.name,
      serviceName: service ? service.name : 'Serviço',
      date: appt.date,
      time: appt.time,
      price: appt.price
    });

    const url = this.getWhatsAppUrl(client.phone, message);
    window.open(url, '_blank');
  }

  formatDateBR(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }
}

window.WhatsApp = new WhatsAppEngine();
