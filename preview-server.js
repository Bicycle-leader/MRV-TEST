const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const model = require("./assets/mrv-model.js");

const root = process.cwd();
const port = Number(process.env.PORT) || 4173;
const dataDir = path.join(root, "data");
const dataFile = path.join(dataDir, "telemetry.json");
const clients = new Set();

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    const readings = model.createSeedReadings(new Date());
    fs.writeFileSync(dataFile, JSON.stringify({ readings }, null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();

  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      readings: Array.isArray(parsed.readings) ? parsed.readings : [],
    };
  } catch (error) {
    const readings = model.createSeedReadings(new Date());
    return { readings };
  }
}

function writeStore(store) {
  ensureStore();
  const readings = (store.readings || [])
    .slice(-800)
    .sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt));

  fs.writeFileSync(dataFile, JSON.stringify({ readings }, null, 2), "utf8");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Payload too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function normalizeLoRaPayload(payload) {
  const decoded =
    payload?.uplink_message?.decoded_payload ||
    payload?.object ||
    payload?.decoded_payload ||
    payload?.payload ||
    payload;

  const deviceId =
    payload?.end_device_ids?.device_id ||
    payload?.deviceInfo?.deviceName ||
    payload?.deviceInfo?.devEui ||
    decoded?.deviceId ||
    decoded?.nodeId;

  return {
    nodeId: decoded.nodeId || decoded.node_id || decoded.deviceId || deviceId,
    regionId: decoded.regionId || decoded.region_id,
    waterLevelCm: decoded.waterLevelCm ?? decoded.water_level_cm ?? decoded.waterLevel ?? decoded.water,
    methaneFluxMgM2Hr:
      decoded.methaneFluxMgM2Hr ??
      decoded.methane_flux_mg_m2_hr ??
      decoded.ch4FluxMgM2Hr ??
      decoded.ch4_flux,
    temperatureC: decoded.temperatureC ?? decoded.temperature_c ?? decoded.temp,
    batteryPct: decoded.batteryPct ?? decoded.battery_pct ?? decoded.battery,
    rssi: decoded.rssi ?? payload?.uplink_message?.rx_metadata?.[0]?.rssi ?? payload?.rxInfo?.[0]?.rssi,
    snr: decoded.snr ?? payload?.uplink_message?.rx_metadata?.[0]?.snr ?? payload?.rxInfo?.[0]?.snr,
    areaHa: decoded.areaHa ?? decoded.area_ha,
    measuredAt: decoded.measuredAt || decoded.measured_at || payload?.received_at,
    sequence: decoded.sequence ?? decoded.seq,
  };
}

function broadcastSnapshot(snapshot) {
  const packet = `event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`;

  clients.forEach((client) => {
    try {
      client.write(packet);
    } catch (error) {
      clients.delete(client);
    }
  });
}

function snapshotFromStore() {
  return model.createSnapshot(readStore().readings);
}

async function handleApi(request, response, url) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "MRV LoRa telemetry server",
      nodeCount: model.NODES.length,
      time: new Date().toISOString(),
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/telemetry") {
    sendJson(response, 200, snapshotFromStore());
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/events") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    response.write(`event: snapshot\ndata: ${JSON.stringify(snapshotFromStore())}\n\n`);
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/telemetry") {
    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      const packets = Array.isArray(payload) ? payload : [payload];
      const store = readStore();
      const readings = packets.map((packet) => model.calculateTelemetry(normalizeLoRaPayload(packet)));

      store.readings.push(...readings);
      writeStore(store);

      const snapshot = snapshotFromStore();
      broadcastSnapshot(snapshot);
      sendJson(response, 201, { ok: true, accepted: readings.length, readings, snapshot });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/simulate") {
    const store = readStore();
    const reading = model.createSimulatedReading(new Date(), store.readings.length);
    store.readings.push(reading);
    writeStore(store);

    const snapshot = snapshotFromStore();
    broadcastSnapshot(snapshot);
    sendJson(response, 201, { ok: true, reading, snapshot });
    return true;
  }

  return false;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);

  try {
    if (await handleApi(request, response, url)) return;
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message });
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.resolve(root, "." + pathname);
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  ensureStore();
  console.log(`MRV preview: http://127.0.0.1:${port}`);
  console.log(`LoRa uplink API: POST http://127.0.0.1:${port}/api/telemetry`);
});
