/* ==========================================================================
   SIMPLES AGENDA PRO - SETTINGS & BUSINESS LOGO MANAGER
   ========================================================================== */

class SettingsView {
  constructor() {}

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('settingsBusinessForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBusinessProfile();
    });

    document.getElementById('settingsWhatsAppForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveWhatsAppTemplates();
    });

    // Upload de Logo Foto
    const logoInput = document.getElementById('logoFileInput');
    logoInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.updateLogoPreview(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('btnRemoveLogo')?.addEventListener('click', () => {
      this.updateLogoPreview('');
    });

    document.getElementById('btnExportBackup')?.addEventListener('click', () => {
      this.exportBackupJSON();
    });

    document.getElementById('importBackupInput')?.addEventListener('change', (e) => {
      this.importBackupJSON(e);
    });

    document.getElementById('btnResetData')?.addEventListener('click', () => {
      if (confirm('Atenção: deseja resetar todos os dados do sistema para os dados padrões de demonstração?')) {
        localStorage.clear();
        window.location.reload();
      }
    });
  }

  render() {
    const settings = window.Store.getSettings();

    document.getElementById('settingBusinessName').value = settings.businessName || '';
    document.getElementById('settingBusinessPhone').value = settings.businessPhone || '';
    document.getElementById('settingBusinessAddress').value = settings.businessAddress || '';

    this.updateLogoPreview(settings.businessLogo || '');

    const templates = settings.whatsappTemplates || {};
    document.getElementById('settingMsgCreated').value = templates.created || '';
    document.getElementById('settingMsgReminder').value = templates.reminder || '';
    document.getElementById('settingMsgBirthday').value = templates.birthday || '';
  }

  updateLogoPreview(logoBase64) {
    const imgElem = document.getElementById('settingsLogoPreviewImg');
    const placeholder = document.getElementById('settingsLogoPlaceholder');
    const removeBtn = document.getElementById('btnRemoveLogo');

    const sidebarImg = document.getElementById('sidebarLogoImg');
    const sidebarPlaceholder = document.getElementById('logoPlaceholder');
    const mobileHeaderImg = document.getElementById('mobileHeaderLogoImg');

    if (logoBase64) {
      if (imgElem) { imgElem.src = logoBase64; imgElem.classList.remove('hidden'); }
      if (placeholder) placeholder.classList.add('hidden');
      if (removeBtn) removeBtn.classList.remove('hidden');

      if (sidebarImg) { sidebarImg.src = logoBase64; sidebarImg.classList.remove('hidden'); }
      if (sidebarPlaceholder) sidebarPlaceholder.classList.add('hidden');
      if (mobileHeaderImg) { mobileHeaderImg.src = logoBase64; mobileHeaderImg.classList.remove('hidden'); }
    } else {
      if (imgElem) { imgElem.src = ''; imgElem.classList.add('hidden'); }
      if (placeholder) placeholder.classList.remove('hidden');
      if (removeBtn) removeBtn.classList.add('hidden');

      if (sidebarImg) { sidebarImg.src = ''; sidebarImg.classList.add('hidden'); }
      if (sidebarPlaceholder) sidebarPlaceholder.classList.remove('hidden');
      if (mobileHeaderImg) { mobileHeaderImg.src = ''; mobileHeaderImg.classList.add('hidden'); }
    }
  }

  saveBusinessProfile() {
    let settings = window.Store.getSettings();
    const name = document.getElementById('settingBusinessName').value;
    const phone = document.getElementById('settingBusinessPhone').value;
    const address = document.getElementById('settingBusinessAddress').value;

    const imgElem = document.getElementById('settingsLogoPreviewImg');
    const logoBase64 = imgElem && !imgElem.classList.contains('hidden') ? imgElem.src : '';

    settings.businessName = name;
    settings.businessPhone = phone;
    settings.businessAddress = address;
    settings.businessLogo = logoBase64;

    window.Store.saveSettings(settings);

    const brandDisplay = document.getElementById('brandNameDisplay');
    if (brandDisplay) brandDisplay.textContent = name || 'Simples Agenda Pro';

    window.showToast('Perfil do negócio e logo salvos com sucesso!', 'success');
  }

  saveWhatsAppTemplates() {
    let settings = window.Store.getSettings();
    if (!settings.whatsappTemplates) settings.whatsappTemplates = {};

    settings.whatsappTemplates.created = document.getElementById('settingMsgCreated').value;
    settings.whatsappTemplates.reminder = document.getElementById('settingMsgReminder').value;
    settings.whatsappTemplates.birthday = document.getElementById('settingMsgBirthday').value;

    window.Store.saveSettings(settings);
    window.showToast('Modelos de mensagem do WhatsApp salvos!', 'success');
  }

  exportBackupJSON() {
    const data = {
      settings: window.Store.getSettings(),
      clients: window.Store.getClients(),
      services: window.Store.getServices(),
      products: window.Store.getProducts(),
      appointments: window.Store.getAppointments(),
      transactions: window.Store.getTransactions()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_simples_agenda_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    window.showToast('Backup exportado com sucesso!', 'success');
  }

  importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.settings) window.Store.saveSettings(data.settings);
        if (data.clients) window.Store.saveClients(data.clients);
        if (data.services) window.Store.saveServices(data.services);
        if (data.products) window.Store.saveProducts(data.products);
        if (data.appointments) window.Store.saveAppointments(data.appointments);
        if (data.transactions) window.Store.saveTransactions(data.transactions);

        window.showToast('Backup restaurado com sucesso!', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        window.showToast('Arquivo de backup inválido.', 'warning');
      }
    };
    reader.readAsText(file);
  }
}

window.Settings = new SettingsView();
