const KAKAO_APP_KEY = "a78ec05726852b1ae48e0ad49a527fbd";

const regions = [
  {
    id: "region-1",
    title: "전북 1권역 관제 센터",
    label: "익산",
    route: "Iksan (측정) → Jeonju (관제)",
    center: [35.94665, 126.96234],
    location: "익산 제1산단",
    code: "IK",
    carbon: 1258.59,
    delta: 2.43,
    credits: 1258,
    hardware: "4 / 4",
    baseline: "+12.5% 전년 베이스라인 대비",
  },
  {
    id: "region-2",
    title: "전북 2권역 관제 센터",
    label: "전주",
    route: "Jeonju (측정) → Jeonju (관제)",
    center: [35.82422, 127.14795],
    location: "전주 탄소산업단지",
    code: "JJ",
    carbon: 984.17,
    delta: 1.82,
    credits: 984,
    hardware: "5 / 5",
    baseline: "+9.8% 전년 베이스라인 대비",
  },
  {
    id: "region-3",
    title: "전북 3권역 관제 센터",
    label: "군산",
    route: "Gunsan (측정) → Jeonju (관제)",
    center: [35.96768, 126.73663],
    location: "군산 국가산단",
    code: "GS",
    carbon: 1422.91,
    delta: 2.96,
    credits: 1422,
    hardware: "6 / 6",
    baseline: "+14.1% 전년 베이스라인 대비",
  },
  {
    id: "region-4",
    title: "전북 4권역 관제 센터",
    label: "정읍",
    route: "Jeongeup (측정) → Jeonju (관제)",
    center: [35.56992, 126.85582],
    location: "정읍 농생명 클러스터",
    code: "JU",
    carbon: 816.48,
    delta: 1.27,
    credits: 816,
    hardware: "4 / 4",
    baseline: "+8.6% 전년 베이스라인 대비",
  },
  {
    id: "region-5",
    title: "전북 5권역 관제 센터",
    label: "남원",
    route: "Namwon (측정) → Jeonju (관제)",
    center: [35.41636, 127.39039],
    location: "남원 에너지 전환 지구",
    code: "NW",
    carbon: 732.62,
    delta: 1.11,
    credits: 732,
    hardware: "3 / 3",
    baseline: "+7.4% 전년 베이스라인 대비",
  },
  {
    id: "region-6",
    title: "전북 6권역 관제 센터",
    label: "김제",
    route: "Gimje (측정) → Jeonju (관제)",
    center: [35.80371, 126.88057],
    location: "김제 스마트팜 단지",
    code: "GJ",
    carbon: 1096.34,
    delta: 2.08,
    credits: 1096,
    hardware: "5 / 5",
    baseline: "+11.2% 전년 베이스라인 대비",
  },
  {
    id: "region-7",
    title: "전북 7권역 관제 센터",
    label: "완주",
    route: "Wanju (측정) → Jeonju (관제)",
    center: [35.90422, 127.16209],
    location: "완주 수소산업 거점",
    code: "WJ",
    carbon: 1188.04,
    delta: 2.31,
    credits: 1188,
    hardware: "4 / 4",
    baseline: "+12.1% 전년 베이스라인 대비",
  },
  {
    id: "region-8",
    title: "전북 8권역 관제 센터",
    label: "진안",
    route: "Jinan (측정) → Jeonju (관제)",
    center: [35.79172, 127.42483],
    location: "진안 산림 MRV 구역",
    code: "JA",
    carbon: 642.79,
    delta: 0.94,
    credits: 642,
    hardware: "3 / 3",
    baseline: "+6.9% 전년 베이스라인 대비",
  },
  {
    id: "region-9",
    title: "전북 9권역 관제 센터",
    label: "고창",
    route: "Gochang (측정) → Jeonju (관제)",
    center: [35.43586, 126.70208],
    location: "고창 농업 MRV 단지",
    code: "GC",
    carbon: 908.22,
    delta: 1.64,
    credits: 908,
    hardware: "4 / 4",
    baseline: "+9.3% 전년 베이스라인 대비",
  },
  {
    id: "region-10",
    title: "전북 10권역 관제 센터",
    label: "부안",
    route: "Buan (측정) → Jeonju (관제)",
    center: [35.73171, 126.73341],
    location: "부안 재생에너지 실증단지",
    code: "BA",
    carbon: 1034.51,
    delta: 1.92,
    credits: 1034,
    hardware: "4 / 4",
    baseline: "+10.6% 전년 베이스라인 대비",
  },
];

const offsets = [
  [-0.0011, -0.0025],
  [0.0006, -0.001],
  [0.0015, 0.0012],
  [-0.0008, 0.0023],
  [-0.0021, -0.0006],
];

const layout = document.querySelector(".control-layout");
const panelToggle = document.querySelector(".panel-toggle");
const mapContainer = document.querySelector("#kakao-map");
const fallback = document.querySelector(".map-fallback");
const selectedName = document.querySelector("[data-selected-name]");
const selectedDetail = document.querySelector("[data-selected-detail]");
const ledgerBody = document.querySelector("[data-ledger-body]");
const regionTitle = document.querySelector("[data-region-title]");
const routeLabels = document.querySelectorAll("[data-map-route]");
const measurePoint = document.querySelector("[data-measure-point]");
const measureState = document.querySelector("[data-measure-state]");
const controlPoint = document.querySelector("[data-control-point]");
const controlState = document.querySelector("[data-control-state]");
const liveReading = document.querySelector("[data-live-reading]");
const liveReduction = document.querySelector("[data-live-reduction]");
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

let map;
let activeRegion = regions[0];
let currentCarbon = activeRegion.carbon;
let currentDelta = activeRegion.delta;
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
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function createSensors(region) {
  return offsets.map(([latOffset, lngOffset], index) => {
    const report = region.delta / 20 + index * 0.012;
    return {
      id: `node-${index + 1}`,
      name: `${region.code}-${String(index + 1).padStart(3, "0")}`,
      location: region.location,
      status: index === 3 ? "warn" : "safe",
      label: "자동 검증됨",
      measure: `전력 ${(42.4 + index * 1.4).toFixed(1)} kWh / 가스 ${(11.7 + index * 0.3).toFixed(1)} m³`,
      report: `+${report.toFixed(2)} tCO₂eq`,
      time: `오후 ${9 - Math.floor(index / 3)}:${String(41 - index * 11).padStart(2, "0")}:45`,
      lat: region.center[0] + latOffset,
      lng: region.center[1] + lngOffset,
    };
  });
}

function clearOverlays() {
  overlays.forEach((overlay) => overlay.setMap(null));
  overlays.clear();
}

function setSelectedSensor(sensor, panToNode = true) {
  if (!sensor) return;

  document.querySelectorAll(".ledger-row[data-node-id]").forEach((row) => {
    row.classList.toggle("active", row.dataset.nodeId === sensor.id);
  });

  overlays.forEach((overlay, id) => {
    const marker = overlay.getContent();
    marker.classList.toggle("active", id === sensor.id);
  });

  if (selectedName && selectedDetail) {
    selectedName.textContent = sensor.name;
    selectedDetail.textContent = `${sensor.location} | ${sensor.label} | ${sensor.report}`;
  }

  if (map && panToNode) {
    map.panTo(new window.kakao.maps.LatLng(sensor.lat, sensor.lng));
  }
}

function createOverlay(sensor) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = `map-marker ${sensor.status}`;
  marker.setAttribute("aria-label", `${sensor.name} ${sensor.location} ${sensor.report}`);
  marker.innerHTML = `<strong>${sensor.name}</strong><span>${sensor.report}</span>`;
  marker.addEventListener("click", () => setSelectedSensor(sensor));

  const overlay = new window.kakao.maps.CustomOverlay({
    position: new window.kakao.maps.LatLng(sensor.lat, sensor.lng),
    content: marker,
    yAnchor: 1,
  });

  overlay.setMap(map);
  overlays.set(sensor.id, overlay);
}

function renderLedger(sensors) {
  if (!ledgerBody) return;

  ledgerBody.innerHTML = sensors
    .map(
      (sensor) => `
        <button class="ledger-row" type="button" data-node-id="${sensor.id}" role="row">
          <span>${sensor.time}</span>
          <span><i></i>${sensor.location} (${sensor.name})</span>
          <span>${sensor.measure}</span>
          <strong>${sensor.report}</strong>
          <em>${sensor.label}</em>
        </button>
      `
    )
    .join("");

  ledgerBody.querySelectorAll(".ledger-row[data-node-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const sensor = sensors.find((item) => item.id === row.dataset.nodeId);
      setSelectedSensor(sensor);
    });
  });
}

function updateCarbonDisplay() {
  if (carbonTotal) carbonTotal.textContent = formatNumber(currentCarbon);
  if (carbonDelta) carbonDelta.textContent = `+${currentDelta.toFixed(2)} tCO₂eq`;
}

function updateTelemetry(region = activeRegion) {
  const regionIndex = Math.max(regions.indexOf(region), 0);
  const livePower = 42.4 + regionIndex * 0.8 + Math.random() * 2.4;
  const liveGas = 11.7 + regionIndex * 0.18 + Math.random() * 0.7;
  const liveReport = currentDelta / 20 + Math.random() * 0.02;

  if (measurePoint) measurePoint.textContent = region.label;
  if (measureState) measureState.textContent = `${region.code} 측정 중`;
  if (controlPoint) controlPoint.textContent = "전주";
  if (controlState) controlState.textContent = "수신 정상";
  if (liveReading) liveReading.textContent = `전력 ${livePower.toFixed(1)} kWh · 가스 ${liveGas.toFixed(1)} m³`;
  if (liveReduction) liveReduction.textContent = `감축 +${liveReport.toFixed(2)} tCO₂eq`;
}

function updateTrendBars(seed = 0) {
  trendBars.forEach((bar, index) => {
    const height = 42 + ((index * 11 + seed * 7) % 43);
    bar.style.setProperty("--h", `${height}%`);
  });
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
  currentCarbon = region.carbon;
  currentDelta = region.delta;

  if (regionSelect && regionSelect.value !== region.id) regionSelect.value = region.id;

  if (regionTitle) regionTitle.textContent = region.title;
  routeLabels.forEach((item) => {
    item.textContent = region.route;
  });
  updateTelemetry(region);
  if (regionDetailTitle) regionDetailTitle.textContent = region.title;
  if (regionDetailLabel) regionDetailLabel.textContent = `${region.label} (${region.code})`;
  if (regionDetailLocation) regionDetailLocation.textContent = region.location;
  if (regionDetailHardware) regionDetailHardware.textContent = `${region.hardware} 개소`;
  if (regionDetailCode) regionDetailCode.textContent = `${region.code} 계열 자동 검증`;
  if (carbonBaseline) carbonBaseline.textContent = region.baseline;
  if (creditTotal) creditTotal.textContent = region.credits.toLocaleString("ko-KR");
  if (hardwareStatus) hardwareStatus.textContent = region.hardware;
  if (syncTime) syncTime.textContent = "마지막 동기화: 오후 9:56:24";

  updateCarbonDisplay();
  updateTrendBars(regions.indexOf(region));

  const sensors = createSensors(region);
  renderLedger(sensors);

  if (map && window.kakao?.maps) {
    clearOverlays();
    sensors.forEach(createOverlay);
    if (pan) {
      map.panTo(new window.kakao.maps.LatLng(region.center[0], region.center[1]));
    }
    setSelectedSensor(sensors[0], false);
  } else {
    setSelectedSensor(sensors[0], false);
  }
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

    setRegion(activeRegion, false);

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
  panelToggle.setAttribute("aria-label", collapsed ? "패널 펼치기" : "좌측 패널 접기");

  window.setTimeout(() => {
    if (map && window.kakao?.maps) {
      window.kakao.maps.event.trigger(map, "resize");
    }
  }, 260);
});

regionSelect?.addEventListener("change", (event) => {
  const region = regions.find((item) => item.id === event.target.value);
  if (region) setRegion(region);
});

window.setInterval(() => {
  currentDelta = activeRegion.delta + Math.random() * 0.32;
  currentCarbon += currentDelta / 80;
  updateCarbonDisplay();
  updateTelemetry();
  updateTrendBars(Math.round(currentCarbon * 10));
}, 2400);

setRegion(activeRegion, false);
initMap();
