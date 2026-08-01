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

    // Verificação contínua a cada 10 segundos para testar expiração em tempo real (ex: licenças de 5 minutos ou 24h)
    setInterval(() => {
      this.checkLicenseLock();
    }, 10000);
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
      plan: 'MENSAL (30 Dias)',
      status: 'ATIVO',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      boundDeviceId: devId,
      boundDeviceName: 'Dispositivo Principal',
      activationCode: null,
      generatedCodes: []
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

  // 3. LÓGICA DE BLOQUEIO POR DISPOSITIVO & EXPIRAÇÃO EM TEMPO REAL
  checkLicenseLock() {
    const lic = this.getLicense();
    const currentDevId = this.getDeviceId();

    // Se a licença já estiver em status expirado, manter bloqueado
    if (lic.status === 'EXPIRADO') {
      this.showExpiredModal(lic);
      return false;
    }

    // Se o plano for MENSAL ou TESTE (5m / 24h) e estiver vinculado a outro dispositivo
    if (lic.plan && (lic.plan.includes('MENSAL') || lic.plan.includes('TESTE') || lic.plan.includes('30') || lic.plan.includes('5 Minutos'))) {
      if (!lic.boundDeviceId) {
        lic.boundDeviceId = currentDevId;
        this.saveLicense(lic);
      } else if (lic.boundDeviceId !== currentDevId) {
        // DISPOSITIVO NÃO AUTORIZADO! BLOQUEAR ACESSO!
        this.showDeviceBlockedModal(lic);
        return false;
      }
    }

    // Verificar se a data/hora de expiração já passou
    if (lic.expirationDate && new Date(lic.expirationDate) < new Date()) {
      lic.status = 'EXPIRADO';
      this.saveLicense(lic);
      this.showExpiredModal(lic);
      return false;
    }

    return true;
  }

  // 4. GERADOR MULTIPLANOS DE CÓDIGOS DE ATIVAÇÃO (5 MINUTOS, 24H, 30 DIAS, 6 MESES, ANUAL)
  generateCodeByPlan(planType) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randSeg = (len) => {
      let res = '';
      for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
      return res;
    };

    let prefix = 'GN-ANO';
    let label = 'Anual VIP (1 Ano)';

    if (planType === '5m') {
      prefix = 'GN-5MIN';
      label = 'Teste Rápido (5 Minutos)';
    } else if (planType === '24h') {
      prefix = 'GN-TESTE';
      label = 'Teste Grátis (24 Horas)';
    } else if (planType === '30d') {
      prefix = 'GN-M30';
      label = 'Mensal (30 Dias)';
    } else if (planType === '6m') {
      prefix = 'GN-6M';
      label = 'Semestral (6 Meses)';
    } else if (planType === '1y') {
      prefix = 'GN-ANO';
      label = 'Anual VIP (1 Ano)';
    }

    const code = `${prefix}-${randSeg(4)}-${randSeg(4)}`;

    const lic = this.getLicense();
    if (!lic.generatedCodes) lic.generatedCodes = [];
    lic.generatedCodes.push({
      code,
      planType,
      label,
      createdAt: new Date().toISOString(),
      used: false
    });
    this.saveLicense(lic);

    return { code, label };
  }

  // 5. RESGATAR / ATIVAR CÓDIGO DE ATIVAÇÃO
  redeemActivationCode(inputCode) {
    if (!inputCode) return { success: false, message: 'Digite o código de ativação.' };
    
    const cleanCode = inputCode.trim().toUpperCase();
    const lic = this.getLicense();

    const codeObj = (lic.generatedCodes || []).find(c => c.code === cleanCode);
    
    let minutesToAdd = 0;
    let daysToAdd = 365;
    let planLabel = 'ANUAL VIP (1 Ano)';
    let isMultiDevice = true;

    if (cleanCode.includes('5MIN') || cleanCode.includes('5M') || (codeObj && codeObj.planType === '5m')) {
      minutesToAdd = 5;
      planLabel = 'TESTE RÁPIDO (5 Minutos)';
      isMultiDevice = false;
    } else if (cleanCode.includes('TESTE') || (codeObj && codeObj.planType === '24h')) {
      daysToAdd = 1;
      planLabel = 'TESTE GRÁTIS (24 Horas)';
      isMultiDevice = false;
    } else if (cleanCode.includes('M30') || (codeObj && codeObj.planType === '30d')) {
      daysToAdd = 30;
      planLabel = 'MENSAL (30 Dias)';
      isMultiDevice = false;
    } else if (cleanCode.includes('6M') || (codeObj && codeObj.planType === '6m')) {
      daysToAdd = 180;
      planLabel = 'SEMESTRAL (6 Meses)';
      isMultiDevice = true;
    } else if (cleanCode.includes('ANO') || cleanCode.includes('GN-') || (codeObj && codeObj.planType === '1y')) {
      daysToAdd = 365;
      planLabel = 'ANUAL VIP (1 Ano)';
      isMultiDevice = true;
    }

    if (cleanCode.startsWith('GN-') || codeObj) {
      lic.plan = planLabel;
      lic.status = 'ATIVO';
      lic.activationCode = cleanCode;
      
      const expDate = new Date();
      if (minutesToAdd > 0) {
        expDate.setTime(expDate.getTime() + minutesToAdd * 60 * 1000);
      } else {
        expDate.setTime(expDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      }
      lic.expirationDate = expDate.toISOString();
      
      if (isMultiDevice) {
        lic.boundDeviceId = null;
      } else {
        lic.boundDeviceId = this.getDeviceId();
      }

      if (codeObj) {
        codeObj.used = true;
        codeObj.usedAt = new Date().toISOString();
      }

      this.saveLicense(lic);
      const timeFormatted = minutesToAdd > 0 ? expDate.toLocaleTimeString('pt-BR') : expDate.toLocaleDateString('pt-BR');
      return { success: true, message: `🎉 Licença ${planLabel} Ativada com Sucesso! Acesso liberado no sistema até ${timeFormatted}.` };
    }

    return { success: false, message: '❌ Código de ativação inválido ou não encontrado. Verifique o código e tente novamente.' };
  }

  // 6. DESVINCULAR DISPOSITIVO MENSAL
  resetMonthlyDeviceBinding() {
    const lic = this.getLicense();
    lic.boundDeviceId = this.getDeviceId();
    lic.boundDeviceName = 'Novo Dispositivo Autorizado';
    this.saveLicense(lic);
    return true;
  }

  // 7. EXIBIR MODAL SELETO DE GERAÇÃO DE LICENÇA (5M, 24H, 30D, 6M, 1Y)
  openGenerateCodeModal() {
    let modal = document.getElementById('modalGenerateCode');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalGenerateCode';
      modal.className = 'modal-overlay active';
      modal.style.zIndex = '100000';
      modal.innerHTML = `
        <div class="modal-container" style="max-width:480px; border-radius:24px">
          <div class="modal-header" style="background:var(--primary-gradient); color:#FFF">
            <div style="display:flex; align-items:center; gap:0.5rem">
              <i data-lucide="sparkles" style="width:22px; height:22px; color:#FFF"></i>
              <h3 style="color:#FFF; font-weight:900">Gerar Código de Licença / Teste</h3>
            </div>
            <button class="icon-btn close-modal" style="color:#FFF; border-color:transparent; background:rgba(255,255,255,0.2)"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" style="padding:1.5rem 1.25rem">
            <div class="form-group">
              <label class="form-label" style="font-weight:800">Escolha a Duração do Plano *</label>
              <select id="selectPlanDuration" class="form-control" style="font-size:1rem; font-weight:700">
                <option value="5m">⚡ Teste Rápido de Vencimento (5 Minutos)</option>
                <option value="24h">⏱️ Teste Grátis (24 Horas de Acesso)</option>
                <option value="30d">📅 Plano Mensal (30 Dias)</option>
                <option value="6m">🗓️ Plano Semestral (6 Meses)</option>
                <option value="1y" selected>⭐ Plano Anual VIP (1 Ano / 365 Dias)</option>
              </select>
            </div>

            <button class="btn btn-orange w-full margin-top" id="btnConfirmGenerateCode">
              ⚡ Gerar Código Agora
            </button>

            <div id="generatedCodeResultBox" class="hidden margin-top" style="background:#FFF7ED; border:1px solid #FDBA74; padding:1.15rem; border-radius:18px; text-align:center">
              <span style="font-size:0.8rem; color:#C2410C; font-weight:800; text-transform:uppercase">Código Gerado com Sucesso:</span>
              <div id="generatedCodeDisplay" style="font-size:1.4rem; font-weight:900; color:#EA580C; margin:0.4rem 0; letter-spacing:0.05em"></div>
              <div style="display:flex; gap:0.5rem; margin-top:0.75rem">
                <button class="btn btn-light btn-xs" id="btnCopyGenCode" style="flex:1">📋 Copiar Código</button>
                <button class="btn btn-whatsapp btn-xs" id="btnSendGenCodeWA" style="flex:1">📲 Enviar no WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('.close-modal').onclick = () => modal.classList.remove('active');
      
      modal.querySelector('#btnConfirmGenerateCode').onclick = () => {
        const plan = modal.querySelector('#selectPlanDuration').value;
        const result = this.generateCodeByPlan(plan);
        
        const box = modal.querySelector('#generatedCodeResultBox');
        const display = modal.querySelector('#generatedCodeDisplay');
        display.textContent = result.code;
        box.classList.remove('hidden');

        modal.querySelector('#btnCopyGenCode').onclick = () => {
          navigator.clipboard.writeText(result.code);
          alert(`Código ${result.code} copiado para a área de transferência!`);
        };

        modal.querySelector('#btnSendGenCodeWA').onclick = () => {
          const text = encodeURIComponent(`Olá! Aqui está o seu código de ativação do sistema Simples Agenda Pro (${result.label}):\n\n🔑 Código: *${result.code}*\n\nAcesse o sistema e digite este código na tela de ativação para liberar seu acesso!`);
          window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        };
      };

      if (window.lucide) window.lucide.createIcons();
    } else {
      modal.classList.add('active');
    }
  }

  // 8. MODAL DE DISPOSITIVO BLOQUEADO
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
              <h3 style="font-weight:900; color:#991B1B; font-size:1.15rem">ACESSO BLOQUEADO - DISPOSITIVO NÃO AUTORIZADO</h3>
            </div>
          </div>
          <div class="modal-body" style="padding:1.5rem 1.25rem; text-align:center">
            <div style="width:68px; height:68px; background:#FEE2E2; color:#DC2626; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:1rem">
              <i data-lucide="smartphone" style="width:36px; height:36px"></i>
            </div>
            <h4 style="font-size:1.15rem; font-weight:900; color:#0F172A; margin-bottom:0.5rem">Dispositivo Não Autorizado</h4>
            <p class="text-muted" style="font-size:0.875rem; line-height:1.5">
              Seu plano está vinculado a apenas 1 dispositivo autorizado. O sistema detectou que este aparelho (${this.getDeviceId()}) é diferente do cadastrado.
            </p>
            <button class="btn btn-orange w-full margin-top" onclick="window.License.openRedeemModal()">
              🔑 Inserir Código de Ativação
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
              Insira um novo código de ativação (5min, 24h, 30 dias, 6 meses ou 1 ano) para liberar seu acesso.
            </p>
            <button class="btn btn-orange w-full margin-top" onclick="window.License.openRedeemModal()">
              🔑 Inserir Código de Ativação
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
              <h3 style="color:#FFF; font-weight:900">Ativar Código de Licença</h3>
            </div>
            <button class="icon-btn close-modal" style="color:#FFF; border-color:transparent; background:rgba(255,255,255,0.2)"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body" style="padding:1.5rem 1.25rem">
            <label class="form-label" style="font-weight:800">Digite seu Código de Ativação *</label>
            <input type="text" id="inputActivationCode" class="form-control" placeholder="Ex: GN-5MIN-X9K2 / GN-ANO-M4P1" style="font-size:1.1rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; text-align:center; padding:0.85rem">
            
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
