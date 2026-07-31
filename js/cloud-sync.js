/* ==========================================================================
   SIMPLES AGENDA PRO - REALTIME CLOUD SYNC ENGINE (COM SERVIÇOS & CLIENTES)
   ========================================================================== */

class CloudSyncEngine {
  constructor() {
    // ID da nuvem compartilhada para sincronização completa de agendamentos, clientes e serviços
    this.defaultCloudId = '019fb9e9-5858-7525-979a-745b0d36df6f';
    this.endpoint = 'https://jsonblob.com/api/jsonBlob/';
    this.pollingInterval = null;
    this.isSyncing = false;
  }

  getCloudId() {
    const settings = window.Store ? window.Store.getSettings() : null;
    return (settings && settings.cloudSyncId) ? settings.cloudSyncId : this.defaultCloudId;
  }

  getApiUrl() {
    return this.endpoint + this.getCloudId();
  }

  // Inicializa o motor de sincronização na nuvem
  init() {
    this.pollFromCloud();
    this.startAutoSync();
  }

  startAutoSync(seconds = 3) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      this.pollFromCloud();
    }, seconds * 1000);
  }

  // Busca agendamentos, clientes e serviços recentes da nuvem em tempo real
  async pollFromCloud() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        this.isSyncing = false;
        return;
      }

      const jsonResult = await response.json();
      if (!jsonResult) {
        this.isSyncing = false;
        return;
      }

      const data = jsonResult.data ? jsonResult.data : jsonResult;
      let changesMade = false;
      let newApptsReceived = [];

      // 1. Sincronizar Serviços vindos da Nuvem (para que o agendar.html veja os serviços reais criados pelo dono)
      if (data.services && Array.isArray(data.services) && data.services.length > 0) {
        let localServices = window.Store.getServices() || [];
        let servicesUpdated = false;

        data.services.forEach(remoteSrv => {
          const idx = localServices.findIndex(s => s.id === remoteSrv.id);
          if (idx === -1) {
            localServices.push(remoteSrv);
            servicesUpdated = true;
          } else if (JSON.stringify(localServices[idx]) !== JSON.stringify(remoteSrv)) {
            localServices[idx] = remoteSrv;
            servicesUpdated = true;
          }
        });

        if (servicesUpdated) {
          window.Store.saveServices(localServices);
          if (window.Services) window.Services.render();
        }
      }

      // 2. Sincronizar Clientes vindos da Nuvem (incluindo Empresa e Cidade)
      if (data.clients && Array.isArray(data.clients)) {
        let localClients = window.Store.getClients() || [];
        let clientsUpdated = false;

        data.clients.forEach(remoteCli => {
          const idx = localClients.findIndex(c => c.id === remoteCli.id || (c.phone && remoteCli.phone && c.phone.replace(/\D/g, '') === remoteCli.phone.replace(/\D/g, '')));
          if (idx === -1) {
            localClients.push(remoteCli);
            clientsUpdated = true;
          } else {
            // Atualizar empresa ou cidade se trazidos da nuvem
            if (remoteCli.company && !localClients[idx].company) {
              localClients[idx].company = remoteCli.company;
              clientsUpdated = true;
            }
            if (remoteCli.city && !localClients[idx].city) {
              localClients[idx].city = remoteCli.city;
              clientsUpdated = true;
            }
          }
        });

        if (clientsUpdated) {
          window.Store.saveClients(localClients);
          changesMade = true;
          if (window.Clients) window.Clients.render();
        }
      }

      // 3. Sincronizar Agendamentos vindos da Nuvem
      if (data.appointments && Array.isArray(data.appointments)) {
        let localAppts = window.Store.getAppointments() || [];

        data.appointments.forEach(remoteAppt => {
          const localIdx = localAppts.findIndex(a => a.id === remoteAppt.id);

          if (localIdx === -1) {
            // Novo agendamento feito pelo cliente na internet!
            localAppts.push(remoteAppt);
            newApptsReceived.push(remoteAppt);
            changesMade = true;
          } else {
            // Se o status mudou na nuvem
            if (localAppts[localIdx].status !== remoteAppt.status) {
              localAppts[localIdx] = remoteAppt;
              changesMade = true;
            }
          }
        });

        if (changesMade) {
          window.Store.saveAppointments(localAppts);
          if (window.Agenda) window.Agenda.render();
          if (window.App) window.App.updateAlertCenterBadge();
        }

        // Se detectou novos agendamentos vindos do celular dos clientes
        if (newApptsReceived.length > 0 && window.App) {
          newApptsReceived.forEach(newAppt => {
            if (!window.App.knownApptIds.has(newAppt.id)) {
              window.App.knownApptIds.add(newAppt.id);
              window.App.triggerNewApptAlert(newAppt);
            }
          });
        }
      }
    } catch (err) {
      console.warn('Status da Nuvem:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  // Envia agendamentos, clientes e serviços locais para a Nuvem
  async pushToCloud(customData = null) {
    try {
      const localAppts = window.Store.getAppointments() || [];
      const localClients = window.Store.getClients() || [];
      const localServices = window.Store.getServices() || [];

      const payload = customData || {
        appointments: localAppts,
        clients: localClients,
        services: localServices,
        lastUpdated: new Date().toISOString()
      };

      await fetch(this.getApiUrl(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Erro ao enviar dados para a Nuvem:', err);
    }
  }

  // Envia 1 novo agendamento feito pelo cliente no link público
  async sendPublicBooking(newAppt, newClient) {
    try {
      let cloudAppts = [];
      let cloudClients = [];
      let cloudServices = window.Store.getServices() || [];

      try {
        const res = await fetch(this.getApiUrl());
        if (res.ok) {
          const jsonResult = await res.json();
          const data = jsonResult ? (jsonResult.data ? jsonResult.data : jsonResult) : {};
          cloudAppts = data.appointments || [];
          cloudClients = data.clients || [];
          if (data.services && data.services.length > 0) {
            cloudServices = data.services;
          }
        }
      } catch (e) {}

      // Atualizar ou adicionar cliente
      const existingCliIdx = cloudClients.findIndex(c => c.id === newClient.id || (c.phone && newClient.phone && c.phone.replace(/\D/g, '') === newClient.phone.replace(/\D/g, '')));
      if (existingCliIdx === -1) {
        cloudClients.push(newClient);
      } else {
        cloudClients[existingCliIdx] = { ...cloudClients[existingCliIdx], ...newClient };
      }

      // Adicionar novo agendamento
      if (!cloudAppts.some(a => a.id === newAppt.id)) {
        cloudAppts.push(newAppt);
      }

      await fetch(this.getApiUrl(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          appointments: cloudAppts,
          clients: cloudClients,
          services: cloudServices,
          lastUpdated: new Date().toISOString()
        })
      });
    } catch (err) {
      console.warn('Erro ao disparar agendamento público na nuvem:', err);
    }
  }
}

window.CloudSync = new CloudSyncEngine();
