(function (root) {
  const Model = root.MRVModel;

  function canUseApi() {
    return root.location && root.location.protocol !== "file:";
  }

  async function fetchSnapshot() {
    const response = await fetch("/api/telemetry", { cache: "no-store" });
    if (!response.ok) throw new Error(`telemetry api ${response.status}`);
    return response.json();
  }

  function startFallback(onSnapshot) {
    let readings = Model.createSeedReadings(new Date());
    let sequence = readings.length;
    onSnapshot(Model.createSnapshot(readings));

    const timer = root.setInterval(() => {
      readings = readings.concat(Model.createSimulatedReading(new Date(), sequence)).slice(-220);
      sequence += 1;
      onSnapshot(Model.createSnapshot(readings));
    }, 3600);

    return () => root.clearInterval(timer);
  }

  function subscribe(onSnapshot) {
    if (!Model) return () => {};
    if (!canUseApi()) return startFallback(onSnapshot);

    let stopped = false;
    let fallbackStop = null;
    let pollTimer = null;
    let eventSource = null;

    const startSafeFallback = () => {
      if (!fallbackStop && !stopped) fallbackStop = startFallback(onSnapshot);
    };

    fetchSnapshot()
      .then((snapshot) => {
        if (!stopped) onSnapshot(snapshot);
      })
      .catch(startSafeFallback);

    if ("EventSource" in root) {
      eventSource = new EventSource("/api/events");
      eventSource.addEventListener("snapshot", (event) => {
        if (!stopped) onSnapshot(JSON.parse(event.data));
      });
      eventSource.onerror = () => {
        if (!pollTimer) {
          pollTimer = root.setInterval(() => {
            fetchSnapshot().then(onSnapshot).catch(startSafeFallback);
          }, 5000);
        }
      };
    } else {
      pollTimer = root.setInterval(() => {
        fetchSnapshot().then(onSnapshot).catch(startSafeFallback);
      }, 5000);
    }

    return () => {
      stopped = true;
      if (eventSource) eventSource.close();
      if (pollTimer) root.clearInterval(pollTimer);
      if (fallbackStop) fallbackStop();
    };
  }

  root.MRVLive = {
    fetchSnapshot,
    subscribe,
  };
})(globalThis);
