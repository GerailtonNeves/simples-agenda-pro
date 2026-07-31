/* ==========================================================================
   SIMPLES AGENDA PRO - REALTIME CLOUD SYNC ENGINE (COM BLOQUEIO ABSOLUTO DE DELETADOS)
   ========================================================================== */

class CloudSyncEngine {
  constructor() {
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

      // LISTA NEGRA: Descartar imediatamente qualquer item deletado previamente!
      const deletedIds = new Set(window.Store ? window.Store.getDeletedIds() : []);

      // 0. Sincronizar Configurações vindas da Nuvem
      if (data.settings && typeof data.settings === 'object') {
        const localSettings = window.Store.getSettings() || {};
        if (data.settings.workStartTime || data.settings.businessName) {
          const mergedSettings = { ...localSettings, ...data.settings };
          if (JSON.stringify(localSettings) !== JSON.stringify(mergedSettings)) {
            window.Store.saveSettings(mergedSettings);
          }
        }
      }

      // 1. Sincronizar Serviços vindos da Nuvem (Filtrado contra Lista Negra)
      if (data.services && Array.isArray(data.services)) {
        data.services = data.services.filter(s => !deletedIds.has(s.id));
        let localServices = window.Store.getServices() || [];
        const cloudServiceIds = new Set(data.services.map(s => s.id));
        let servicesUpdated = false;

        const initialSrvCount = localServices.length;
        localServices = localServices.filter(s => cloudServiceIds.has(s.id));
        if (localServices.length !== initialSrvCount) {
          servicesUpdated = true;
        }

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

      // 2. Sincronizar Clientes vindos da Nuvem (Filtrado contra Lista Negra)
      if (data.clients && Array.isArray(data.clients)) {
        data.clients = data.clients.filter(c => !deletedIds.has(c.id));
        let localClients = window.Store.getClients() || [];
        const cloudClientIds = new Set(data.clients.map(c => c.id));
        let clientsUpdated = false;

        const initialCliCount = localClients.length;
        localClients = localClients.filter(c => cloudClientIds.has(c.id));
        if (localClients.length !== initialCliCount) {
          clientsUpdated = true;
        }

        data.clients.forEach(remoteCli => {
          const idx = localClients.findIndex(c => c.id === remoteCli.id || (c.phone && remoteCli.phone && c.phone.replace(/\D/g, '') === remoteCli.phone.replace(/\D/g, '')));
          if (idx === -1) {
            localClients.push(remoteCli);
            clientsUpdated = true;
          } else {
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
          if (window.Clients) window.Clients.render();
        }
      }

      // 3. Sincronizar Agendamentos vindos da Nuvem (Filtrado contra Lista Negra)
      if (data.appointments && Array.isArray(data.appointments)) {
        data.appointments = data.appointments.filter(a => !deletedIds.has(a.id));
        let localAppts = window.Store.getAppointments() || [];
        const cloudApptIds = new Set(data.appointments.map(a => a.id));

        const initialApptCount = localAppts.length;
        localAppts = localAppts.filter(a => cloudApptIds.has(a.id));
        if (localAppts.length !== initialApptCount) {
          changesMade = true;
        }

        data.appointments.forEach(remoteAppt => {
          const localIdx = localAppts.findIndex(a => a.id === remoteAppt.id);

          if (localIdx === -1) {
            localAppts.push(remoteAppt);
            newApptsReceived.push(remoteAppt);
            changesMade = true;
          } else {
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

  async pushToCloud(customData = null) {
    try {
      const deletedIds = new Set(window.Store ? window.Store.getDeletedIds() : []);
      const localAppts = (window.Store.getAppointments() || []).filter(a => !deletedIds.has(a.id));
      const localClients = (window.Store.getClients() || []).filter(c => !deletedIds.has(c.id));
      const localServices = (window.Store.getServices() || []).filter(s => !deletedIds.has(s.id));
      const localSettings = window.Store.getSettings() || {};

      const payload = customData || {
        appointments: localAppts,
        clients: localClients,
        services: localServices,
        settings: localSettings,
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

  async sendPublicBooking(newAppt, newClient) {
    try {
      let cloudAppts = [];
      let cloudClients = [];
      let cloudServices = window.Store.getServices() || [];
      let cloudSettings = window.Store.getSettings() || {};
      const deletedIds = new Set(window.Store ? window.Store.getDeletedIds() : []);

      try {
        const res = await fetch(this.getApiUrl());
        if (res.ok) {
          const jsonResult = await res.json();
          const data = jsonResult ? (jsonResult.data ? jsonResult.data : jsonResult) : {};
          cloudAppts = (data.appointments || []).filter(a => !deletedIds.has(a.id));
          cloudClients = (data.clients || []).filter(c => !deletedIds.has(c.id));
          if (data.services && data.services.length > 0) {
            cloudServices = data.services.filter(s => !deletedIds.has(s.id));
          }
          if (data.settings) {
            cloudSettings = data.settings;
          }
        }
      } catch (e) {}

      const existingCliIdx = cloudClients.findIndex(c => c.id === newClient.id || (c.phone && newClient.phone && c.phone.replace(/\D/g, '') === newClient.phone.replace(/\D/g, '')));
      if (existingCliIdx === -1) {
        cloudClients.push(newClient);
      } else {
        cloudClients[existingCliIdx] = { ...cloudClients[existingCliIdx], ...newClient };
      }

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
          settings: cloudSettings,
          lastUpdated: new Date().toISOString()
        })
      });
    } catch (err) {
      console.warn('Erro ao disparar agendamento público na nuvem:', err);
    }
  }
}

window.CloudSync = new CloudSyncEngine();
