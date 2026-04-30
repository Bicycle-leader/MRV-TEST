(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MRVModel = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const GWP_CH4 = 27.2;

  const REGIONS = [
    {
      id: "region-1",
      slug: "iksan",
      title: "전북 1권역 MRV 관제센터",
      label: "익산",
      route: "익산 논토양 측정 → 전주 통합 관제",
      center: [35.94665, 126.96234],
      location: "익산 왕궁 논단지",
      code: "IK",
      nodeCount: 4,
      totalAreaHa: 28.4,
      baselineMethaneKgHaDay: 2.72,
    },
    {
      id: "region-2",
      slug: "jeonju",
      title: "전북 2권역 MRV 관제센터",
      label: "전주",
      route: "전주 실증포장 측정 → 전주 통합 관제",
      center: [35.82422, 127.14795],
      location: "전주 농생명 실증포장",
      code: "JJ",
      nodeCount: 5,
      totalAreaHa: 31.6,
      baselineMethaneKgHaDay: 2.55,
    },
    {
      id: "region-3",
      slug: "gunsan",
      title: "전북 3권역 MRV 관제센터",
      label: "군산",
      route: "군산 논토양 측정 → 전주 통합 관제",
      center: [35.96768, 126.73663],
      location: "군산 구암 논단지",
      code: "GS",
      nodeCount: 6,
      totalAreaHa: 36.8,
      baselineMethaneKgHaDay: 2.84,
    },
    {
      id: "region-4",
      slug: "jeongeup",
      title: "전북 4권역 MRV 관제센터",
      label: "정읍",
      route: "정읍 논토양 측정 → 전주 통합 관제",
      center: [35.56992, 126.85582],
      location: "정읍 태인 벼 재배지",
      code: "JU",
      nodeCount: 4,
      totalAreaHa: 24.5,
      baselineMethaneKgHaDay: 2.48,
    },
    {
      id: "region-5",
      slug: "namwon",
      title: "전북 5권역 MRV 관제센터",
      label: "남원",
      route: "남원 논토양 측정 → 전주 통합 관제",
      center: [35.41636, 127.39039],
      location: "남원 주생 벼 재배지",
      code: "NW",
      nodeCount: 3,
      totalAreaHa: 20.2,
      baselineMethaneKgHaDay: 2.42,
    },
    {
      id: "region-6",
      slug: "gimje",
      title: "전북 6권역 MRV 관제센터",
      label: "김제",
      route: "김제 논토양 측정 → 전주 통합 관제",
      center: [35.80371, 126.88057],
      location: "김제 만경평야 실증단지",
      code: "GJ",
      nodeCount: 5,
      totalAreaHa: 34.1,
      baselineMethaneKgHaDay: 2.9,
    },
    {
      id: "region-7",
      slug: "wanju",
      title: "전북 7권역 MRV 관제센터",
      label: "완주",
      route: "완주 논토양 측정 → 전주 통합 관제",
      center: [35.90422, 127.16209],
      location: "완주 수소농업 거점",
      code: "WJ",
      nodeCount: 4,
      totalAreaHa: 27.7,
      baselineMethaneKgHaDay: 2.63,
    },
    {
      id: "region-8",
      slug: "jinan",
      title: "전북 8권역 MRV 관제센터",
      label: "진안",
      route: "진안 논토양 측정 → 전주 통합 관제",
      center: [35.79172, 127.42483],
      location: "진안 산림 인접 논구역",
      code: "JA",
      nodeCount: 3,
      totalAreaHa: 18.9,
      baselineMethaneKgHaDay: 2.36,
    },
    {
      id: "region-9",
      slug: "gochang",
      title: "전북 9권역 MRV 관제센터",
      label: "고창",
      route: "고창 논토양 측정 → 전주 통합 관제",
      center: [35.43586, 126.70208],
      location: "고창 해리 벼 재배지",
      code: "GC",
      nodeCount: 4,
      totalAreaHa: 25.8,
      baselineMethaneKgHaDay: 2.58,
    },
    {
      id: "region-10",
      slug: "buan",
      title: "전북 10권역 MRV 관제센터",
      label: "부안",
      route: "부안 논토양 측정 → 전주 통합 관제",
      center: [35.73171, 126.73341],
      location: "부안 새만금 벼 실증단지",
      code: "BA",
      nodeCount: 4,
      totalAreaHa: 29.2,
      baselineMethaneKgHaDay: 2.69,
    },
  ];

  const OFFSETS = [
    [-0.0011, -0.0025],
    [0.0006, -0.001],
    [0.0015, 0.0012],
    [-0.0008, 0.0023],
    [-0.0021, -0.0006],
    [0.0022, -0.0021],
  ];

  const NODES = REGIONS.flatMap((region) =>
    Array.from({ length: region.nodeCount }, (_, index) => {
      const [latOffset, lngOffset] = OFFSETS[index % OFFSETS.length];

      return {
        id: `${region.code}-${String(index + 1).padStart(3, "0")}`,
        regionId: region.id,
        regionSlug: region.slug,
        name: `${region.code}-${String(index + 1).padStart(3, "0")}`,
        location: region.location,
        areaHa: round(region.totalAreaHa / region.nodeCount, 2),
        lat: round(region.center[0] + latOffset, 6),
        lng: round(region.center[1] + lngOffset, 6),
      };
    })
  );

  function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((Number(value) || 0) * factor) / factor;
  }

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function findRegion(regionId) {
    return REGIONS.find((region) => region.id === regionId || region.slug === regionId) || REGIONS[0];
  }

  function findNode(nodeId) {
    return NODES.find((node) => node.id === nodeId || node.name === nodeId);
  }

  function methaneFactorFromWaterLevel(waterLevelCm) {
    if (waterLevelCm >= 7) return 1;
    if (waterLevelCm >= 3) return 0.82;
    if (waterLevelCm >= 0) return 0.65;
    if (waterLevelCm >= -5) return 0.42;
    return 0.3;
  }

  function waterLevelState(waterLevelCm) {
    if (waterLevelCm >= 7) return "상시 담수";
    if (waterLevelCm >= 3) return "담수 유지";
    if (waterLevelCm >= 0) return "얕은 물관리";
    if (waterLevelCm >= -5) return "중간낙수";
    return "강한 중간낙수";
  }

  function calculateTelemetry(input = {}) {
    const node = findNode(input.nodeId) || NODES[0];
    const region = findRegion(input.regionId || node.regionId);
    const measuredAt = input.measuredAt ? new Date(input.measuredAt) : new Date();
    const safeMeasuredAt = Number.isNaN(measuredAt.getTime()) ? new Date() : measuredAt;
    const areaHa = toNumber(input.areaHa, node.areaHa);
    const waterLevelCm = round(toNumber(input.waterLevelCm, 4.2), 1);
    const batteryPct = Math.max(0, Math.min(100, round(toNumber(input.batteryPct, 82), 0)));
    const rssi = round(toNumber(input.rssi, -96), 0);
    const snr = round(toNumber(input.snr, 7.5), 1);
    const baselineMethaneKgDay = region.baselineMethaneKgHaDay * areaHa;
    const directFlux = Number(input.methaneFluxMgM2Hr);
    const hasDirectFlux = Number.isFinite(directFlux) && directFlux >= 0;
    const methaneKgDay = hasDirectFlux
      ? directFlux * areaHa * 0.24
      : baselineMethaneKgDay * methaneFactorFromWaterLevel(waterLevelCm);
    const methaneFluxMgM2Hr = hasDirectFlux ? directFlux : methaneKgDay / (areaHa * 0.24);
    const methaneReductionKgDay = Math.max(0, baselineMethaneKgDay - methaneKgDay);
    const reductionTco2eDay = (methaneReductionKgDay * GWP_CH4) / 1000;
    const emissionTco2eDay = (methaneKgDay * GWP_CH4) / 1000;
    const status = batteryPct < 20 ? "danger" : rssi < -122 ? "warn" : "safe";

    return {
      id: `${node.id}-${safeMeasuredAt.getTime()}-${Math.round(Math.random() * 1000)}`,
      nodeId: node.id,
      nodeName: node.name,
      regionId: region.id,
      regionLabel: region.label,
      location: node.location,
      lat: node.lat,
      lng: node.lng,
      areaHa,
      measuredAt: safeMeasuredAt.toISOString(),
      receivedAt: new Date().toISOString(),
      waterLevelCm,
      waterLevelState: waterLevelState(waterLevelCm),
      methaneFluxMgM2Hr: round(methaneFluxMgM2Hr, 2),
      methaneKgDay: round(methaneKgDay, 2),
      baselineMethaneKgDay: round(baselineMethaneKgDay, 2),
      reductionTco2eDay: round(reductionTco2eDay, 4),
      emissionTco2eDay: round(emissionTco2eDay, 4),
      annualReductionTco2e: round(reductionTco2eDay * 365, 2),
      temperatureC: round(toNumber(input.temperatureC, 24.2), 1),
      batteryPct,
      rssi,
      snr,
      sequence: toNumber(input.sequence, 0),
      status,
      verification: status === "safe" ? "자동 검증됨" : status === "warn" ? "검토 필요" : "현장 점검",
    };
  }

  function createSeedReadings(now = new Date()) {
    const readings = [];

    NODES.forEach((node, nodeIndex) => {
      for (let step = 5; step >= 0; step -= 1) {
        const measuredAt = new Date(now.getTime() - step * 5 * 60 * 1000 - nodeIndex * 13000);
        const cycle = (nodeIndex * 7 + step * 3) % 12;
        readings.push(
          calculateTelemetry({
            nodeId: node.id,
            waterLevelCm: round(6.8 - cycle * 0.72 + Math.sin(nodeIndex + step) * 0.55, 1),
            temperatureC: round(23.6 + ((nodeIndex + step) % 5) * 0.6, 1),
            batteryPct: 92 - ((nodeIndex + step) % 8) * 3,
            rssi: -88 - ((nodeIndex * 5 + step) % 34),
            snr: 9.4 - ((nodeIndex + step) % 6) * 0.7,
            measuredAt: measuredAt.toISOString(),
            sequence: step,
          })
        );
      }
    });

    return readings;
  }

  function createSimulatedReading(now = new Date(), sequence = 0) {
    const node = NODES[sequence % NODES.length];
    const wave = Math.sin(sequence / 3) * 2.2;
    const trend = (sequence % 10) * -0.32;

    return calculateTelemetry({
      nodeId: node.id,
      waterLevelCm: round(5.6 + wave + trend, 1),
      temperatureC: round(24.1 + Math.cos(sequence / 4) * 1.4, 1),
      batteryPct: 88 - (sequence % 11),
      rssi: -91 - (sequence % 39),
      snr: round(8.5 - (sequence % 6) * 0.8, 1),
      measuredAt: now.toISOString(),
      sequence,
    });
  }

  function latestReadings(readings = []) {
    const byNode = new Map();

    readings.forEach((reading) => {
      const current = byNode.get(reading.nodeId);
      if (!current || new Date(reading.measuredAt) > new Date(current.measuredAt)) {
        byNode.set(reading.nodeId, reading);
      }
    });

    return Array.from(byNode.values()).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  }

  function average(values) {
    const valid = values.filter((value) => Number.isFinite(Number(value))).map(Number);
    if (!valid.length) return 0;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  }

  function summarizeReadings(readings = []) {
    const latest = latestReadings(readings);
    const byRegion = REGIONS.map((region) => {
      const regionLatest = latest.filter((reading) => reading.regionId === region.id);
      const dailyReductionTco2e = regionLatest.reduce((sum, item) => sum + item.reductionTco2eDay, 0);
      const annualReductionTco2e = dailyReductionTco2e * 365;
      const verifiedCount = regionLatest.filter((item) => item.status === "safe").length;

      return {
        regionId: region.id,
        slug: region.slug,
        title: region.title,
        label: region.label,
        location: region.location,
        code: region.code,
        activeNodes: regionLatest.length,
        nodeCount: region.nodeCount,
        areaHa: round(regionLatest.reduce((sum, item) => sum + item.areaHa, 0), 2),
        avgWaterLevelCm: round(average(regionLatest.map((item) => item.waterLevelCm)), 1),
        avgMethaneFluxMgM2Hr: round(average(regionLatest.map((item) => item.methaneFluxMgM2Hr)), 2),
        dailyReductionTco2e: round(dailyReductionTco2e, 3),
        annualReductionTco2e: round(annualReductionTco2e, 2),
        creditEstimate: Math.floor(Math.max(0, annualReductionTco2e)),
        verificationRate: regionLatest.length ? round((verifiedCount / regionLatest.length) * 100, 1) : 0,
        lastReceivedAt: regionLatest
          .map((item) => item.receivedAt)
          .sort((a, b) => new Date(b) - new Date(a))[0],
      };
    });

    const totalDailyReduction = byRegion.reduce((sum, region) => sum + region.dailyReductionTco2e, 0);
    const annualReductionTco2e = totalDailyReduction * 365;
    const verifiedCount = latest.filter((item) => item.status === "safe").length;

    return {
      activeNodes: latest.length,
      nodeCount: NODES.length,
      avgWaterLevelCm: round(average(latest.map((item) => item.waterLevelCm)), 1),
      avgMethaneFluxMgM2Hr: round(average(latest.map((item) => item.methaneFluxMgM2Hr)), 2),
      avgBatteryPct: round(average(latest.map((item) => item.batteryPct)), 0),
      weakCommCount: latest.filter((item) => item.rssi < -122).length,
      dailyReductionTco2e: round(totalDailyReduction, 3),
      annualReductionTco2e: round(annualReductionTco2e, 2),
      creditEstimate: Math.floor(Math.max(0, annualReductionTco2e)),
      verificationRate: latest.length ? round((verifiedCount / latest.length) * 100, 1) : 0,
      lastReceivedAt: latest.map((item) => item.receivedAt).sort((a, b) => new Date(b) - new Date(a))[0],
      regions: byRegion,
    };
  }

  function buildAlerts(readings = [], now = new Date()) {
    const latest = latestReadings(readings);
    const alerts = [];

    latest.forEach((reading) => {
      const staleMinutes = (now - new Date(reading.receivedAt)) / 60000;

      if (staleMinutes > 15) {
        alerts.push({
          id: `${reading.nodeId}-stale`,
          level: "high",
          nodeId: reading.nodeId,
          regionId: reading.regionId,
          title: `${reading.nodeId} 수신 지연 ${Math.round(staleMinutes)}분`,
          message: `${reading.location} 노드의 최신 수신 시간이 기준을 초과했습니다.`,
          action: "게이트웨이 상태 확인",
          createdAt: reading.receivedAt,
        });
      }

      if (reading.batteryPct < 30) {
        alerts.push({
          id: `${reading.nodeId}-battery`,
          level: reading.batteryPct < 20 ? "high" : "medium",
          nodeId: reading.nodeId,
          regionId: reading.regionId,
          title: `${reading.nodeId} 배터리 ${reading.batteryPct}%`,
          message: `${reading.location} 현장 장비의 배터리 교체 예약이 필요합니다.`,
          action: "배터리 교체",
          createdAt: reading.receivedAt,
        });
      }

      if (reading.rssi < -122) {
        alerts.push({
          id: `${reading.nodeId}-rssi`,
          level: "medium",
          nodeId: reading.nodeId,
          regionId: reading.regionId,
          title: `${reading.nodeId} LoRa RSSI ${reading.rssi} dBm`,
          message: "통신 품질 저하로 재전송 또는 게이트웨이 안테나 점검이 필요합니다.",
          action: "통신 품질 점검",
          createdAt: reading.receivedAt,
        });
      }

      if (reading.waterLevelCm >= 7) {
        alerts.push({
          id: `${reading.nodeId}-water`,
          level: "low",
          nodeId: reading.nodeId,
          regionId: reading.regionId,
          title: `${reading.nodeId} 담수 수위 ${reading.waterLevelCm} cm`,
          message: "메탄 배출 저감을 위해 중간낙수 또는 얕은 물관리 전환 여부를 검토하세요.",
          action: "물관리 일정 검토",
          createdAt: reading.receivedAt,
        });
      }
    });

    return alerts.sort((a, b) => {
      const weight = { high: 3, medium: 2, low: 1 };
      return weight[b.level] - weight[a.level] || new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function createSnapshot(readings = []) {
    const safeReadings = readings.length ? readings : createSeedReadings(new Date());

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      gwpCh4: GWP_CH4,
      regions: REGIONS,
      nodes: NODES,
      readings: safeReadings.slice(-160),
      latest: latestReadings(safeReadings),
      summary: summarizeReadings(safeReadings),
      alerts: buildAlerts(safeReadings),
    };
  }

  return {
    GWP_CH4,
    REGIONS,
    NODES,
    calculateTelemetry,
    createSeedReadings,
    createSimulatedReading,
    createSnapshot,
    latestReadings,
    summarizeReadings,
    buildAlerts,
    round,
  };
});
