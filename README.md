# MRV-TEST

논토양 메탄 감축 MRV 관제 프로토타입입니다. LoRa 수위 노드 또는 게이트웨이 서버가 측정값을 `POST /api/telemetry`로 전송하면 로컬 JSON 저장소에 기록되고, 지도·센서·알림·MRV 보고서 화면이 실시간으로 갱신됩니다.

## Pages

- `index.html`: 지도 기반 권역별 관제 및 LoRa 수신 API 샘플
- `sensor.html`: 노드별 수위, CH4 플럭스, 연환산 감축량
- `alerts.html`: 통신 지연, 배터리, 담수 지속 등 알림 관리
- `mrv.html`: 서버 저장값 기반 월간 MRV 보고서 자동 작성

## Preview

```powershell
node preview-server.js
```

Then visit `http://127.0.0.1:4173`.

## LoRa uplink example

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4173/api/telemetry -ContentType "application/json" -Body '{
  "nodeId": "IK-001",
  "waterLevelCm": 1.8,
  "methaneFluxMgM2Hr": 6.4,
  "temperatureC": 24.6,
  "batteryPct": 86,
  "rssi": -94,
  "snr": 8.1
}'
```

If `methaneFluxMgM2Hr` is omitted, the prototype estimates CH4 from the water-level-based management factor. Replace the baseline and correction factors in `assets/mrv-model.js` with the certified methodology values before using the data for credit issuance.
