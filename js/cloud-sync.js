/* ==========================================================================
   SIMPLES AGENDA PRO - PERMANENT REALTIME CLOUD SYNC ENGINE (API.RESTFUL-API.DEV)
   ========================================================================== */

class CloudSyncEngine {
  constructor() {
    // ID da nuvem permanente compartilhado para sincronização entre qualquer celular ou computador no mundo
    this.defaultCloudId = 'ff8081819f7e10ae019fb9d8ebc55950';
    this.endpoint = 'https://api.restful-api.dev/objects/';
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

  // Busca agendamentos e clientes recentes da nuvem em tempo real
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
      if (!jsonResult || !jsonResult.data) {
        this.isSyncing = false;
        return;
      }

      const data = jsonResult.data;
      let changesMade = false;

      // 1. Sincronizar Clientes vindos da Nuvem
      if (data.clients && Array.isArray(data.clients)) {
        let localClients = window.Store.getClients() || [];
        let clientsUpdated = false;

        data.clients.forEach(remoteCli => {
          const exists = localClients.some(c => c.id === remoteCli.id || (c.phone && remoteCli.phone && c.phone.replace(/\D/g, '') === remoteCli.phone.replace(/\D/g, '')));
          if (!exists) {
            localClients.push(remoteCli);
            clientsUpdated = true;
          }
        });

        if (clientsUpdated) {
          window.Store.saveClients(localClients);
          changesMade = true;
          if (window.Clients) window.Clients.render();
        }
      }

      // 2. Sincronizar Agendamentos vindos da Nuvem
      if (data.appointments && Array.isArray(data.appointments)) {
        let localAppts = window.Store.getAppointments() || [];
        let latestNewApptFromCloud = null;

        data.appointments.forEach(remoteAppt => {
          const localIdx = localAppts.findIndex(a => a.id === remoteAppt.id);

          if (localIdx === -1) {
            // Novo agendamento feito pelo cliente na internet!
            localAppts.push(remoteAppt);
            latestNewApptFromCloud = remoteAppt;
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

        // Se detectou um novo agendamento vindo de outro celular na internet
        if (latestNewApptFromCloud && window.App) {
          if (!window.App.knownApptIds.has(latestNewApptFromCloud.id)) {
            window.App.knownApptIds.add(latestNewApptFromCloud.id);
            window.App.triggerNewApptAlert(latestNewApptFromCloud);
          }
        }
      }
    } catch (err) {
      // Falha silenciosa se offline
    } finally {
      this.isSyncing = false;
    }
  }

  // Envia agendamentos e clientes locais para a Nuvem
  async pushToCloud(customData = null) {
    try {
      const localAppts = window.Store.getAppointments() || [];
      const localClients = window.Store.getClients() || [];

      const payloadData = customData || {
        appointments: localAppts,
        clients: localClients,
        lastUpdated: new Date().toISOString()
      };

      await fetch(this.getApiUrl(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: "SimplesAgendaCloud",
          data: payloadData
        })
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

      try {
        const res = await fetch(this.getApiUrl());
        if (res.ok) {
          const jsonResult = await res.json();
          if (jsonResult && jsonResult.data) {
            cloudAppts = jsonResult.data.appointments || [];
            cloudClients = jsonResult.data.clients || [];
          }
        }
      } catch (e) {}

      // Adicionar novo cliente se não existir
      if (newClient && !cloudClients.some(c => c.id === newClient.id)) {
        cloudClients.push(newClient);
      }

      // Adicionar novo agendamento
      if (!cloudAppts.some(a => a.id === newAppt.id)) {
        cloudAppts.push(newAppt);
      }

      // Salvar na nuvem compartilhada
      await fetch(this.getApiUrl(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: "SimplesAgendaCloud",
          data: {
            appointments: cloudAppts,
            clients: cloudClients,
            lastUpdated: new Date().toISOString()
          }
        })
      });
    } catch (err) {
      console.warn('Erro ao disparar agendamento público na nuvem:', err);
    }
  }
}

window.CloudSync = new CloudSyncEngine();
