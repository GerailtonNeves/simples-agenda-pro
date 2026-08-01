/* ==========================================================================
   SIMPLES AGENDA PRO - SAAS LICENSE & DEVICE HARDWARE LOCK ENGINE
   ========================================================================== */

class LicenseEngine {
  constructor() {
    this.storageKey = 'simples_agenda_license';
    this.deviceIdKey = 'simples_agenda_device_id';
  }

  init() {
    this.ensureDeviceId();
    this.ensureDefaultLicense();
    this.checkLicenseLock();
  }

  // 1. GERAR IDENTIFICADOR ÚNICO DE DISPOSITIVO (HARDWARE FINGERPRINT)
  ensureDeviceId() {
    let devId = localStorage.getItem(this.deviceIdKey);
    if (!devId) {
      const navInfo = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
      let hash = 0;
      for (let i = 0; i < navInfo.length; i++) {
        const char = navInfo.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      devId = 'DEV-' + Math.abs(hash).toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem(this.deviceIdKey, devId);
    }
    return devId;
  }

  getDeviceId() {
    return localStorage.getItem(this.deviceIdKey) || this.ensureDeviceId();
  }

  // 2. OBTER OU INICIALIZAR LICENÇA
  getLicense() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) return JSON.parse(data);
    } catch(e) {}

    // Licença Padrão (Mensal Ativa Vinculada ao Dispositivo Atual)
    const devId = this.getDeviceId();
    const defaultLic = {
      plan: 'MENSAL', // 'MENSAL' ou 'ANUAL'
      status: 'ATIVO', // 'ATIVO', 'BLOQUEADO', 'EXPIRADO'
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      boundDeviceId: devId,
      boundDeviceName: 'Dispositivo Principal',
      activationCode: null,
      generatedCodes: [] // Histórico de códigos anuais criados pelo admin
    };
    localStorage.setItem(this.storageKey, JSON.stringify(defaultLic));
    return defaultLic;
  }

  saveLicense(lic) {
    localStorage.setItem(this.storageKey, JSON.stringify(lic));
    if (window.CloudSync) window.CloudSync.pushToCloud();
  }

  ensureDefaultLicense() {
    this.getLicense();
  }

  // 3. LOGICA DE BLOQUEIO POR DISPOSITIVO (PLANO MENSAL X ANUAL)
  checkLicenseLock() {
    const lic = this.getLicense();
    const currentDevId = this.getDeviceId();

    // Se o plano for MENSAL e estiver vinculado a outro dispositivo
    if (lic.plan === 'MENSAL') {
      if (!lic.boundDeviceId) {
        lic.boundDeviceId = currentDevId;
        this.saveLicense(lic);
      } else if (lic.boundDeviceId !== currentDevId) {
        // DISPOSITIVO NÃO AUTORIZADO! BLOQUEAR ACESSO MENSAL!
        this.showDeviceBlockedModal(lic);
        return false;
      }
    }

    // Verificar se a data de expiração passou
    if (lic.expirationDate && new Date(lic.expirationDate) < new Date()) {
      lic.status = 'EXPIRADO';
      this.saveLicense(lic);
      this.showExpiredModal(lic);
      return false;
    }

    return true;
  }

  // 4. GERADOR DE CÓDIGOS DE ATIVAÇÃO PARA PLANO ANUAL (EX: GN-2026-X9K2-M4P1)
  generateAnnualActivationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randSegment = (len) => {
      let res = '';
      for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res;
    };

    const year = new Date().getFullYear();
    const code = `GN-${year}-${randSegment(4)}-${randSegment(4)}`;

    const lic = this.getLicense();
    if (!lic.generatedCodes) lic.generatedCodes = [];
    lic.generatedCodes.push({
      code,
      createdAt: new Date().toISOString(),
      used: false,
      usedAt: null
    });
    this.saveLicense(lic);

    return code;
  }

  // 5. RESGATAR / ATIVAR CÓDIGO DE ATIVAÇÃO ANUAL
  redeemActivationCode(inputCode) {
    if (!inputCode) return { success: false, message: 'Digite o código de ativação.' };
    
    const cleanCode = inputCode.trim().toUpperCase();
    const lic = this.getLicense();

    // Validar se o código é válido ou no histórico
    const codeObj = (lic.generatedCodes || []).find(c => c.code === cleanCode);
    
    // Aceita códigos gerados pelo admin ou códigos com o prefixo oficial GN-
    if (cleanCode.startsWith('GN-') || codeObj) {
      lic.plan = 'ANUAL';
      lic.status = 'ATIVO';
      lic.activationCode = cleanCode;
      
      // Adiciona +365 dias a partir de hoje
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      lic.expirationDate = nextYear.toISOString();
      
      // Plano anual libera múltiplos dispositivos (desvincula trava de 1 aparelho)
      lic.boundDeviceId = null;

      if (codeObj) {
        codeObj.used = true;
        codeObj.usedAt = new Date().toISOString();
      }

      this.saveLicense(lic);
      return { success: true, message: '🎉 Plano Anual Ativado com Sucesso! 365 dias de acesso VIP liberados para todos os seus dispositivos.' };
    }

    return { success: false, message: '❌ Código de ativação inválido ou não encontrado. Verifique o código e tente novamente.' };
  }

  // 6. DESVINCULAR DISPOSITIVO MENSAL (PARA TROCA DE APARELHO)
  resetMonthlyDeviceBinding() {
    const lic = this.getLicense();
    lic.boundDeviceId = this.getDeviceId();
    lic.boundDeviceName = 'Novo Dispositivo Autorizado';
    this.saveLicense(lic);
    return true;
  }

  // 7. EXIBIR MODAL DE DISPOSITIVO BLOQUEADO
  showDeviceBlockedModal(lic) {
    let modal = document.getElementById('modalDeviceBlocked');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalDeviceBlocked';
      modal.className = 'modal-overlay active';
      modal.style.zIndex = '99999';
      modal.innerHTML = `
        <div class="modal-container" style="max-width:480px; border-top:6px solid #EF4444; border-radius:24px">
          <div class="modal-header" style="background:#FEE2E2; color:#991B1B">
            <div style="display:flex; align-items:center; gap:0.6rem">
              <i data-lucide="lock" style="width:28px; height:28px; color:#DC2626"></i>
              <h3 style="font-weight:900; color:#991B1B; font-size:1.15rem">ACESSO BLOQUEADO - PLANO MENSAL</h3>
            </div>
          </div>
          <div class="modal-body" style="padding:1.5rem 1.25rem; text-align:center">
            <div style="width:68px; height:68px; background:#FEE2E2; color:#DC2626; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:1rem">
              <i data-lucide="smartphone" style="width:36px; height:36px"></i>
            </div>
            <h4 style="font-size:1.15rem; font-weight:900; color:#0F172A; margin-bottom:0.5rem">Dispositivo Não Autorizado</h4>
            <p class="text-muted" style="font-size:0.875rem; line-height:1.5">
              Seu <strong>Plano Mensal</strong> está restrito a apenas <strong>1 dispositivo autorizado</strong>. O sistema detectou que este aparelho (${this.getDeviceId()}) é diferente do cadastrado.
            </p>
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:1rem; border-radius:16px; margin:1.25rem 0; font-size:0.825rem; text-align:left">
              💡 <strong>Deseja usar em múltiplos aparelhos?</strong><br>
              Migre para o <strong>Plano Anual VIP</strong> ou entre em contato para solicitar a liberação da troca de dispositivo.
            </div>
            <button class="btn btn-orange w-full" onclick="window.License.openRedeemModal()">
              🔑 Inserir Código de Ativação Anual
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      if (window.lucide) window.lucide.createIcons();
    } else {
      modal.classList.add('active');
    }
  }

  showExpiredModal(lic) {
    let modal = document.getElementById('modalLicenseExpired');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalLicenseExpired';
      modal.className = 'modal-overlay active';
      modal.style.zIndex = '99999';
      modal.innerHTML = `
        <div class="modal-container" style="max-width:480px; border-top:6px solid #F59E0B; border-radius:24px">
          <div class="modal-header" style="background:#FFF7ED; color:#C2410C">
            <div style="display:flex; align-items:center; gap:0.6rem">
              <i data-lucide="alert-triangle" style="width:28px; height:28px; color:#EA580C"></i>
              <h3 style="font-weight:900; color:#C2410C; font-size:1.15rem">LICENÇA EXPIRADA</h3>
            </div>
          </div>
          <div class="modal-body" style="padding:1.5rem 1.25rem; text-align:center">
            <h4 style="font-size:1.15rem; font-weight:900; color:#0F172A; margin-bottom:0.5rem">Sua Assinatura Expirou</h4>
            <p class="text-muted" style="font-size:0.875rem">
              Renove sua assinatura mensal ou insira um novo código de ativação anual para continuar utilizando o sistema.
            </p>
            <button class="btn btn-orange w-full margin-top" onclick="window.License.openRedeemModal()">
              🔑 Inserir Código de Ativação
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      if (window.lucide) window.lucide.createIcons();
    }
  }

  openRedeemModal() {
    let modal = document.getElementById('modalRedeemCode');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalRedeemCode';
      modal.className = 'modal-overlay active';
      modal.style.zIndex = '100000';
      modal.innerHTML = `
        <div class="modal-container" style="max-width:460px; border-radius:24px">
          <div class="modal-header" style="background:var(--primary-gradient); color:#FFF">
            <div style="display:flex; align-items:center; gap:0.5rem">
              <i data-lucide="key" style="width:22px; height:22px; color:#FFF"></i>
              <h3 style="color:#FFF; font-weight:900">Ativar Código de Licença Anual</h3>
            </div>
            <button class="icon-btn close-modal" style="color:#FFF; border-color:transparent; background:rgba(255,255,255,0.2)"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" style="padding:1.5rem 1.25rem">
            <label class="form-label" style="font-weight:800">Digite seu Código de Ativação *</label>
            <input type="text" id="inputActivationCode" class="form-control" placeholder="Ex: GN-2026-X9K2-M4P1" style="font-size:1.1rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; text-align:center; padding:0.85rem">
            
            <button class="btn btn-orange w-full margin-top" id="btnSubmitActivationCode">
              🚀 Ativar Licença Agora
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('.close-modal').onclick = () => modal.classList.remove('active');
      modal.querySelector('#btnSubmitActivationCode').onclick = () => {
        const val = document.getElementById('inputActivationCode').value;
        const res = this.redeemActivationCode(val);
        if (res.success) {
          alert(res.message);
          location.reload();
        } else {
          alert(res.message);
        }
      };

      if (window.lucide) window.lucide.createIcons();
    } else {
      modal.classList.add('active');
    }
  }
}

window.License = new LicenseEngine();
document.addEventListener('DOMContentLoaded', () => {
  window.License.init();
});
