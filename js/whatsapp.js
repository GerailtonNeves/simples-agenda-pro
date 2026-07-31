/* ==========================================================================
   SIMPLES AGENDA PRO - WHATSAPP INTEGRATION & AUTOMATED MESSAGES (MULTIPLE DATES & PLURAL SUPPORT)
   ========================================================================== */

class WhatsAppEngine {
  constructor() {}

  // Formata o número de telefone removendo caracteres não numéricos e adicionando DDI 55 se necessário
  formatPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  }

  // Formata data de YYYY-MM-DD para DD/MM/YYYY
  formatDateBR(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // Preenche a mensagem substituindo as tags dinâmicas
  buildMessage(templateText, params = {}) {
    const settings = window.Store.getSettings();
    const businessName = settings.businessName || 'Nossa Empresa';

    let msg = templateText || '';
    msg = msg.replace(/{cliente}/g, params.clientName || 'Cliente');
    msg = msg.replace(/{servico}/g, params.serviceName || 'Serviço');
    msg = msg.replace(/{data}/g, this.formatDateBR(params.date) || '');
    msg = msg.replace(/{horario}/g, params.time || '');
    msg = msg.replace(/{valor}/g, params.price ? parseFloat(params.price).toFixed(2).replace('.', ',') : '0,00');
    msg = msg.replace(/{empresa}/g, businessName);

    return msg;
  }

  // Gera o link oficial do WhatsApp API / Web
  getWhatsAppUrl(phone, messageText) {
    const formattedPhone = this.formatPhoneNumber(phone);
    const encodedText = encodeURIComponent(messageText);
    
    // Detecta se é mobile ou desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    } else {
      return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    }
  }

  // Dispara abertura imediata do WhatsApp
  openWhatsApp(phone, messageText) {
    const url = this.getWhatsAppUrl(phone, messageText);
    window.open(url, '_blank');
  }

  // Dispara mensagem automatizada de "Agendamento Criado com Sucesso" (Suporta 1 data no singular ou múltiplas datas no plural)
  sendBookingCreatedNotification(appointment) {
    const clients = window.Store.getClients();
    const services = window.Store.getServices();
    const settings = window.Store.getSettings();
    const allAppts = window.Store.getAppointments();

    const client = clients.find(c => c.id === appointment.clientId);
    const service = services.find(s => s.id === appointment.serviceId);

    if (!client || !client.phone) {
      window.showToast('Cliente não possui telefone cadastrado.', 'danger');
      return;
    }

    const businessName = settings.businessName || 'Nossa Empresa';
    const todayStr = window.getLocalDateStr();

    // Busca todos os agendamentos futuros não cancelados do mesmo cliente
    const clientAppts = allAppts.filter(a =>
      a.clientId === appointment.clientId &&
      a.status !== 'cancelled' &&
      a.date >= todayStr
    );

    // Ordenar agendamentos cronologicamente por data e horário
    clientAppts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    let message = '';

    if (clientAppts.length > 1) {
      // MENSAGEM NO PLURAL PARA MÚLTIPLAS DATAS (GRAMÁTICA CORRETA)
      const serviceName = service ? service.name : 'Atendimento';
      const priceFormatted = parseFloat(appointment.price || (service ? service.price : 0)).toFixed(2).replace('.', ',');

      message = `Olá, *${client.name}*! 👋\n\nSeus agendamentos para *${serviceName}* na empresa *${businessName}* foram realizados com sucesso!\n\n📅 *Confira abaixo todas as suas datas e horários agendados:*\n\n`;

      clientAppts.forEach((a, index) => {
        const dateBR = this.formatDateBR(a.date);
        message += `• *${dateBR}* às *${a.time}*\n`;
      });

      message += `\n💰 *Valor por sessão:* R$ ${priceFormatted}\n\nAguardamos você com muito carinho! 😊`;
    } else {
      // MENSAGEM NO SINGULAR PARA 1 DATA
      const template = settings.whatsappTemplates?.created || 'Olá {cliente}! Seu agendamento para *{servico}* na empresa *{empresa}* foi realizado com sucesso para o dia *{data}* às *{horario}*.\n\nValor: R$ {valor}.\nAguardamos você!';
      
      message = this.buildMessage(template, {
        clientName: client.name,
        serviceName: service ? service.name : 'Atendimento',
        date: appointment.date,
        time: appointment.time,
        price: appointment.price
      });
    }

    this.openWhatsApp(client.phone, message);
  }

  // Dispara mensagem de "Lembrete de Agendamento Próximo" (Suporta 1 data no singular ou múltiplas datas no plural)
  sendAppointmentReminder(appointment) {
    const clients = window.Store.getClients();
    const services = window.Store.getServices();
    const settings = window.Store.getSettings();
    const allAppts = window.Store.getAppointments();

    const client = clients.find(c => c.id === appointment.clientId);
    const service = services.find(s => s.id === appointment.serviceId);

    if (!client || !client.phone) {
      window.showToast('Cliente não possui telefone cadastrado.', 'danger');
      return;
    }

    const businessName = settings.businessName || 'Nossa Empresa';
    const todayStr = window.getLocalDateStr();

    const clientAppts = allAppts.filter(a =>
      a.clientId === appointment.clientId &&
      a.status !== 'cancelled' &&
      a.date >= todayStr
    );

    clientAppts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    let message = '';

    if (clientAppts.length > 1) {
      // LEMBRETE NO PLURAL PARA MÚLTIPLAS DATAS (GRAMÁTICA CORRETA)
      const serviceName = service ? service.name : 'Atendimento';

      message = `Olá, *${client.name}*! 👋\n\nPassando para lembrar dos seus agendamentos para *${serviceName}* na empresa *${businessName}*:\n\n📅 *Confira todas as suas datas e horários agendados:*\n\n`;

      clientAppts.forEach(a => {
        const dateBR = this.formatDateBR(a.date);
        message += `• *${dateBR}* às *${a.time}*\n`;
      });

      message += `\nPor favor, responda OK para confirmar sua presença! 😊`;
    } else {
      const template = settings.whatsappTemplates?.reminder || 'Olá {cliente}! Passando para lembrar do seu agendamento em *{data}* às *{horario}* para *{servico}* na *{empresa}*.\n\nPor favor, responda OK para confirmar sua presença! 😊';
      
      message = this.buildMessage(template, {
        clientName: client.name,
        serviceName: service ? service.name : 'Atendimento',
        date: appointment.date,
        time: appointment.time,
        price: appointment.price
      });
    }

    this.openWhatsApp(client.phone, message);
  }
}

window.WhatsApp = new WhatsAppEngine();
