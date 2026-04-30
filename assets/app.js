const KAKAO_APP_KEY = "a78ec05726852b1ae48e0ad49a527fbd";

const Model = window.MRVModel;
const Live = window.MRVLive;
const regions = Model.REGIONS;

const layout = document.querySelector(".control-layout");
const panelToggle = document.querySelector(".panel-toggle");
const mapContainer = document.querySelector("#kakao-map");
const fallback = document.querySelector(".map-fallback");
const selectedName = document.querySelector("[data-selected-name]");
const selectedDetail = document.querySelector("[data-selected-detail]");
const ledgerBody = document.querySelector("[data-ledger-body]");
const regionTitle = document.querySelector("[data-region-title]");
const measurePoint = document.querySelector("[data-measure-point]");
const measureState = document.querySelector("[data-measure-state]");
const controlPoint = document.querySelector("[data-control-point]");
const controlState = document.querySelector("[data-control-state]");
const liveReading = document.querySelector("[data-live-reading]");
const liveReduction = document.querySelector("[data-live-reduction]");
const connectionState = document.querySelector("[data-connection-state]");
const regionSelect = document.querySelector("[data-region-select]");
const regionDetailTitle = document.querySelector("[data-region-detail-title]");
const regionDetailLabel = document.querySelector("[data-region-detail-label]");
const regionDetailLocation = document.querySelector("[data-region-detail-location]");
const regionDetailHardware = document.querySelector("[data-region-detail-hardware]");
const regionDetailCode = document.querySelector("[data-region-detail-code]");
const carbonTotal = document.querySelector("[data-carbon-total]");
const carbonDelta = document.querySelector("[data-carbon-delta]");
const carbonBaseline = document.querySelector("[data-carbon-baseline]");
const creditTotal = document.querySelector("[data-credit-total]");
const hardwareStatus = document.querySelector("[data-hardware-status]");
const syncTime = document.querySelector("[data-sync-time]");
const trendBars = document.querySelectorAll("[data-trend-bar]");
const apiSample = document.querySelector("[data-api-sample]");

let map;
let activeRegion = regions[0];
let latestSnapshot;
let hybridOverlayEnabled = false;
const overlays = new Map();

function loadKakaoSdk() {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(resolve);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`;
    script.async = true;
    script.onerror = () => reject(new Error("Kakao Maps SDK failed to load"));
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Maps SDK is unavailable"));
        return;
      }
      window.kakao.maps.load(resolve);
    };
    document.head.appendChild(script);
  });
}

function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatTime(value) {
  if (!value) return "수신 대기";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function findRegionSummary(snapshot, regionId) {
  return snapshot?.summary?.regions?.find((item) => item.regionId === regionId);
}

function latestForRegion(snapshot, regionId) {
  return (snapshot?.latest || []).filter((reading) => reading.regionId === regionId);
}

function clearOverlays() {
  overlays.forEach((overlay) => overlay.setMap(null));
  overlays.clear();
}

function setSelectedReading(reading, panToNode = true) {
  if (!reading) return;

  document.querySelectorAll(".ledger-row[data-node-id]").forEach((row) => {
    row.classList.toggle("active", row.dataset.nodeId === reading.nodeId);
  });

  overlays.forEach((overlay, id) => {
    const marker = overlay.getContent();
    marker.classList.toggle("active", id === reading.nodeId);
  });

  if (selectedName && selectedDetail) {
    selectedName.textContent = reading.nodeId;
    selectedDetail.textContent = `${reading.location} | 수위 ${reading.waterLevelCm} cm | ${reading.annualReductionTco2e} tCO2eq/년`;
  }

  if (map && panToNode) {
    map.panTo(new window.kakao.maps.LatLng(reading.lat, reading.lng));
  }
}

function createOverlay(reading) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = `map-marker ${reading.status === "safe" ? "safe" : "warn"}`;
  marker.setAttribute("aria-label", `${reading.nodeId} ${reading.location} ${reading.annualReductionTco2e} tCO2eq`);
  marker.innerHTML = `<strong>${reading.nodeId}</strong><span>${reading.waterLevelCm} cm</span>`;
  marker.addEventListener("click", () => setSelectedReading(reading));

  const overlay = new window.kakao.maps.CustomOverlay({
    position: new window.kakao.maps.LatLng(reading.lat, reading.lng),
    content: marker,
    yAnchor: 1,
  });

  overlay.setMap(map);
  overlays.set(reading.nodeId, overlay);
}

function renderLedger(readings) {
  if (!ledgerBody) return;

  ledgerBody.innerHTML = readings
    .slice()
    .sort((a, b) => new Date(b.measuredAt) - new Date(a.measuredAt))
    .map(
      (reading) => `
        <button class="ledger-row" type="button" data-node-id="${reading.nodeId}" role="row">
          <span>${formatTime(reading.measuredAt)}</span>
          <span><i></i>${reading.location} (${reading.nodeId})</span>
          <span>수위 ${reading.waterLevelCm} cm / CH4 ${reading.methaneFluxMgM2Hr} mg/m2/h</span>
          <strong>${reading.annualReductionTco2e.toLocaleString("ko-KR")} tCO2eq/년</strong>
          <em>${reading.verification}</em>
        </button>
      `
    )
    .join("");

  ledgerBody.querySelectorAll(".ledger-row[data-node-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const reading = readings.find((item) => item.nodeId === row.dataset.nodeId);
      setSelectedReading(reading);
    });
  });
}

function updateTrendBars(summary) {
  const base = Math.max(1, summary?.annualReductionTco2e || 1);
  trendBars.forEach((bar, index) => {
    const height = 32 + ((base / 17 + index * 9) % 54);
    bar.style.setProperty("--h", `${Math.round(height)}%`);
  });
}

function updateApiSample(region) {
  if (!apiSample) return;

  const firstNode = Model.NODES.find((node) => node.regionId === region.id);
  apiSample.textContent = JSON.stringify(
    {
      nodeId: firstNode?.id || "IK-001",
      waterLevelCm: 1.8,
      methaneFluxMgM2Hr: 6.4,
      temperatureC: 24.6,
      batteryPct: 86,
      rssi: -94,
      snr: 8.1,
      measuredAt: new Date().toISOString(),
    },
    null,
    2
  );
}

function renderSnapshot(snapshot) {
  latestSnapshot = snapshot;
  const region = activeRegion;
  const regionSummary = findRegionSummary(snapshot, region.id);
  const regionReadings = latestForRegion(snapshot, region.id);
  const latest = regionReadings.slice().sort((a, b) => new Date(b.measuredAt) - new Date(a.measuredAt))[0];

  if (connectionState) {
    connectionState.textContent = window.location.protocol === "file:" ? "샘플 데이터" : "서버 연결";
  }
  if (regionTitle) regionTitle.textContent = region.title;
  if (measurePoint) measurePoint.textContent = region.label;
  if (measureState) measureState.textContent = latest ? `${latest.nodeId} 수신 중` : "수신 대기";
  if (controlPoint) controlPoint.textContent = "전주";
  if (controlState) controlState.textContent = "서버 저장 정상";
  if (liveReading && latest) {
    liveReading.textContent = `수위 ${latest.waterLevelCm} cm · CH4 ${latest.methaneFluxMgM2Hr} mg/m2/h`;
  }
  if (liveReduction && regionSummary) {
    liveReduction.textContent = `연환산 ${formatNumber(regionSummary.annualReductionTco2e, 2)} tCO2eq`;
  }
  if (regionDetailTitle) regionDetailTitle.textContent = region.title;
  if (regionDetailLabel) regionDetailLabel.textContent = `${region.label} (${region.code})`;
  if (regionDetailLocation) regionDetailLocation.textContent = region.location;
  if (regionDetailHardware) {
    regionDetailHardware.textContent = `${regionSummary?.activeNodes || 0} / ${region.nodeCount} 개소`;
  }
  if (regionDetailCode) regionDetailCode.textContent = `${region.code} 계열 LoRa 수위·메탄 MRV`;
  if (carbonTotal) carbonTotal.textContent = formatNumber(regionSummary?.annualReductionTco2e || 0, 2);
  if (carbonDelta) carbonDelta.textContent = `일 ${formatNumber(regionSummary?.dailyReductionTco2e || 0, 3)} tCO2eq`;
  if (carbonBaseline) carbonBaseline.textContent = `CH4 GWP100 ${snapshot.gwpCh4} 적용, 인증 계수 교체 가능`;
  if (creditTotal) creditTotal.textContent = (regionSummary?.creditEstimate || 0).toLocaleString("ko-KR");
  if (hardwareStatus) hardwareStatus.textContent = `${regionSummary?.activeNodes || 0} / ${region.nodeCount}`;
  if (syncTime) syncTime.textContent = `마지막 수신 ${formatTime(regionSummary?.lastReceivedAt)}`;

  renderLedger(regionReadings);
  updateTrendBars(regionSummary);
  updateApiSample(region);

  if (map && window.kakao?.maps) {
    clearOverlays();
    regionReadings.forEach(createOverlay);
    if (regionReadings.length) setSelectedReading(regionReadings[0], false);
  } else if (regionReadings.length) {
    setSelectedReading(regionReadings[0], false);
  }
}

function syncHybridOverlay() {
  if (!map || !window.kakao?.maps) return;

  const shouldShowHybrid = map.getMapTypeId() === window.kakao.maps.MapTypeId.SKYVIEW;
  if (shouldShowHybrid && !hybridOverlayEnabled) {
    map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
    hybridOverlayEnabled = true;
  }

  if (!shouldShowHybrid && hybridOverlayEnabled) {
    map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
    hybridOverlayEnabled = false;
  }
}

function setRegion(region, pan = true) {
  activeRegion = region;
  if (regionSelect && regionSelect.value !== region.id) regionSelect.value = region.id;

  if (map && window.kakao?.maps && pan) {
    map.panTo(new window.kakao.maps.LatLng(region.center[0], region.center[1]));
  }

  if (latestSnapshot) renderSnapshot(latestSnapshot);
}

async function initMap() {
  if (!mapContainer) return;

  try {
    await loadKakaoSdk();

    map = new window.kakao.maps.Map(mapContainer, {
      center: new window.kakao.maps.LatLng(activeRegion.center[0], activeRegion.center[1]),
      level: 4,
    });

    map.setMapTypeId(window.kakao.maps.MapTypeId.ROADMAP);
    map.addControl(new window.kakao.maps.MapTypeControl(), window.kakao.maps.ControlPosition.TOPRIGHT);
    map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);
    window.kakao.maps.event.addListener(map, "maptypeid_changed", syncHybridOverlay);
    syncHybridOverlay();

    if (latestSnapshot) renderSnapshot(latestSnapshot);

    window.addEventListener("resize", () => {
      window.kakao.maps.event.trigger(map, "resize");
    });
  } catch (error) {
    console.error(error);
    if (fallback) fallback.hidden = false;
  }
}

panelToggle?.addEventListener("click", () => {
  const collapsed = layout?.dataset.panelState !== "collapsed";
  if (layout) layout.dataset.panelState = collapsed ? "collapsed" : "open";
  panelToggle.setAttribute("aria-expanded", String(!collapsed));
  panelToggle.setAttribute("aria-label", collapsed ? "패널 펼치기" : "왼쪽 패널 접기");

  window.setTimeout(() => {
    if (map && window.kakao?.maps) window.kakao.maps.event.trigger(map, "resize");
  }, 260);
});

regionSelect?.addEventListener("change", (event) => {
  const region = regions.find((item) => item.id === event.target.value);
  if (region) setRegion(region);
});

if (regionSelect) {
  regionSelect.innerHTML = regions
    .map((region) => `<option value="${region.id}">${region.title} - ${region.label}</option>`)
    .join("");
}

Live.subscribe(renderSnapshot);
initMap();
