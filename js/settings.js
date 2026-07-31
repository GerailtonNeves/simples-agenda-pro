/* ==========================================================================
   SIMPLES AGENDA PRO - SYSTEM SETTINGS & AUTOMATIC LOGO COMPRESSION
   ========================================================================== */

class SettingsView {
  constructor() {}

  init() {
    this.bindEvents();
    this.loadSettings();
  }

  bindEvents() {
    // Form de Dados do Negócio
    document.getElementById('settingsBusinessForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBusinessData();
    });

    // Upload de Logo Foto com Compressão Inteligente (Canvas)
    const logoInput = document.getElementById('logoFileInput');
    logoInput?.addEventListener('change', (e) => this.handleLogoUpload(e));

    document.getElementById('btnRemoveLogo')?.addEventListener('click', () => this.removeLogo());

    // Form de Templates do WhatsApp
    document.getElementById('settingsWhatsAppForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveWhatsAppTemplates();
    });

    // Backup & Restore
    document.getElementById('btnExportBackup')?.addEventListener('click', () => this.exportBackup());
    document.getElementById('importBackupInput')?.addEventListener('change', (e) => this.importBackup(e));
    document.getElementById('btnResetData')?.addEventListener('click', () => this.resetData());
  }

  loadSettings() {
    const settings = window.Store.getSettings() || {};

    const nameInput = document.getElementById('settingBusinessName');
    const phoneInput = document.getElementById('settingBusinessPhone');
    const addrInput = document.getElementById('settingBusinessAddress');
    const startTimeInput = document.getElementById('settingWorkStartTime');
    const endTimeInput = document.getElementById('settingWorkEndTime');
    const intervalSelect = document.getElementById('settingSlotInterval');

    if (nameInput) nameInput.value = settings.businessName || '';
    if (phoneInput) phoneInput.value = settings.businessPhone || '';
    if (addrInput) addrInput.value = settings.businessAddress || '';
    if (startTimeInput) startTimeInput.value = settings.workStartTime || '10:00';
    if (endTimeInput) endTimeInput.value = settings.workEndTime || '16:00';
    if (intervalSelect) intervalSelect.value = settings.slotInterval || '30';

    this.updateLogoDisplays(settings.businessLogo);

    const msgCreated = document.getElementById('settingMsgCreated');
    const msgReminder = document.getElementById('settingMsgReminder');
    const msgBirthday = document.getElementById('settingMsgBirthday');

    if (msgCreated) msgCreated.value = settings.whatsappTemplates?.created || '';
    if (msgReminder) msgReminder.value = settings.whatsappTemplates?.reminder || '';
    if (msgBirthday) msgBirthday.value = settings.whatsappTemplates?.birthday || '';
  }

  handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.showToast('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar e comprimir para ~300px para persistir perfeitamente no localStorage sem erro de tamanho
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Gera string Base64 super leve (~20KB) e garantida no localStorage
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

        const settings = window.Store.getSettings() || {};
        settings.businessLogo = compressedBase64;
        window.Store.saveSettings(settings);

        this.updateLogoDisplays(compressedBase64);

        if (window.BookingPortal) {
          window.BookingPortal.render();
        }

        window.showToast('Foto da logo salva e ativada no Portal do Cliente com sucesso!', 'success');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeLogo() {
    if (confirm('Deseja remover a foto da logo?')) {
      const settings = window.Store.getSettings() || {};
      settings.businessLogo = '';
      window.Store.saveSettings(settings);
      this.updateLogoDisplays('');
      
      if (window.BookingPortal) {
        window.BookingPortal.render();
      }

      window.showToast('Foto da logo removida.', 'success');
    }
  }

  updateLogoDisplays(logoBase64) {
    // Preview no Form de Configurações
    const previewImg = document.getElementById('settingsLogoPreviewImg');
    const placeholderIcon = document.getElementById('settingsLogoPlaceholder');
    const removeBtn = document.getElementById('btnRemoveLogo');

    if (logoBase64) {
      if (previewImg) { previewImg.src = logoBase64; previewImg.classList.remove('hidden'); }
      if (placeholderIcon) placeholderIcon.classList.add('hidden');
      if (removeBtn) removeBtn.classList.remove('hidden');
    } else {
      if (previewImg) previewImg.classList.add('hidden');
      if (placeholderIcon) placeholderIcon.classList.remove('hidden');
      if (removeBtn) removeBtn.classList.add('hidden');
    }

    // Logo no Sidebar (Menu Lateral)
    const sidebarLogoImg = document.getElementById('sidebarLogoImg');
    const sidebarPlaceholder = document.getElementById('logoPlaceholder');

    if (sidebarLogoImg && sidebarPlaceholder) {
      if (logoBase64) {
        sidebarLogoImg.src = logoBase64;
        sidebarLogoImg.classList.remove('hidden');
        sidebarPlaceholder.classList.add('hidden');
      } else {
        sidebarLogoImg.classList.add('hidden');
        sidebarPlaceholder.classList.remove('hidden');
      }
    }

    // Logo no Header Mobile
    const mobileHeaderLogoImg = document.getElementById('mobileHeaderLogoImg');
    if (mobileHeaderLogoImg) {
      if (logoBase64) {
        mobileHeaderLogoImg.src = logoBase64;
        mobileHeaderLogoImg.classList.remove('hidden');
      } else {
        mobileHeaderLogoImg.classList.add('hidden');
      }
    }

    // Logo no Portal do Cliente Simulador
    const portalLogoImg = document.getElementById('portalLogoImg');
    if (portalLogoImg) {
      if (logoBase64) {
        portalLogoImg.src = logoBase64;
        portalLogoImg.classList.remove('hidden');
      } else {
        portalLogoImg.classList.add('hidden');
      }
    }
  }

  saveBusinessData() {
    const settings = window.Store.getSettings() || {};
    settings.businessName = document.getElementById('settingBusinessName')?.value;
    settings.businessPhone = document.getElementById('settingBusinessPhone')?.value;
    settings.businessAddress = document.getElementById('settingBusinessAddress')?.value;
    settings.workStartTime = document.getElementById('settingWorkStartTime')?.value || '10:00';
    settings.workEndTime = document.getElementById('settingWorkEndTime')?.value || '16:00';
    settings.slotInterval = document.getElementById('settingSlotInterval')?.value || '30';

    window.Store.saveSettings(settings);
    if (window.CloudSync) window.CloudSync.pushToCloud();

    const brandNameDisplay = document.getElementById('brandNameDisplay');
    if (brandNameDisplay) brandNameDisplay.textContent = settings.businessName || 'Simples Agenda Pro';

    if (window.BookingPortal) {
      window.BookingPortal.render();
    }

    window.showToast('Dados e horários de atendimento salvos e sincronizados com a nuvem!', 'success');
  }

  saveWhatsAppTemplates() {
    const settings = window.Store.getSettings() || {};
    settings.whatsappTemplates = {
      created: document.getElementById('settingMsgCreated')?.value,
      reminder: document.getElementById('settingMsgReminder')?.value,
      birthday: document.getElementById('settingMsgBirthday')?.value
    };

    window.Store.saveSettings(settings);
    window.showToast('Modelos de mensagem de WhatsApp salvos!', 'success');
  }

  exportBackup() {
    const data = {
      settings: window.Store.getSettings(),
      clients: window.Store.getClients(),
      services: window.Store.getServices(),
      products: window.Store.getProducts(),
      appointments: window.Store.getAppointments(),
      transactions: window.Store.getTransactions()
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `simples_agenda_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    window.showToast('Backup exportado com sucesso!', 'success');
  }

  importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.settings && data.clients && data.services) {
          if (data.settings) window.Store.saveSettings(data.settings);
          if (data.clients) window.Store.saveClients(data.clients);
          if (data.services) window.Store.saveServices(data.services);
          if (data.products) window.Store.saveProducts(data.products);
          if (data.appointments) window.Store.saveAppointments(data.appointments);
          if (data.transactions) window.Store.saveTransactions(data.transactions);

          window.showToast('Backup importado com sucesso! Recarregando...', 'success');
          setTimeout(() => location.reload(), 1200);
        } else {
          window.showToast('Arquivo JSON de backup inválido.', 'danger');
        }
      } catch (err) {
        window.showToast('Erro ao ler arquivo de backup.', 'danger');
      }
    };
    reader.readAsText(file);
  }

  resetData() {
    if (confirm('ATENÇÃO: Deseja apagar todos os dados e restaurar as configurações de fábrica?')) {
      window.Store.resetAllData();
      window.showToast('Dados restaurados para o padrão. Recarregando...', 'warning');
      setTimeout(() => location.reload(), 1000);
    }
  }
}

window.Settings = new SettingsView();
