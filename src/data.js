// Seeded random helper for stable, reproducible yet organic data
let dataSeed = 101;
export function seededRandom() {
  const x = Math.sin(dataSeed++) * 10000;
  return x - Math.floor(x);
}

// Generates the baseline and current telemetry for all plants and machines
export function generateMockData() {
  const plants = [
    { id: 'plant_1', name: 'Plant 1 — Houston, TX', location: 'Houston', baseRisk: 34, machinesCount: 10 },
    { id: 'plant_2', name: 'Plant 2 — Munich, Germany', location: 'Munich', baseRisk: 52, machinesCount: 11 },
    { id: 'plant_3', name: 'Plant 3 — Pune, India', location: 'Pune', baseRisk: 78, machinesCount: 13 },
    { id: 'plant_4', name: 'Plant 4 — Tokyo, Japan', location: 'Tokyo', baseRisk: 18, machinesCount: 9 },
    { id: 'plant_5', name: 'Plant 5 — Shanghai, China', location: 'Shanghai', baseRisk: 61, machinesCount: 12 },
    { id: 'plant_6', name: 'Plant 6 — São Paulo, Brazil', location: 'São Paulo', baseRisk: 43, machinesCount: 10 }
  ];

  const machineTemplates = [
    { type: 'Conveyor Drive', model: 'CD-80', part: 'Heavy Duty V-Belt B-85', sensors: { vib: { name: 'Vibration RMS', base: 1.5, unit: 'mm/s' }, temp: { name: 'Bearing Temp', base: 52, unit: '°C' }, current: { name: 'Current Draw', base: 14.5, unit: 'A' } } },
    { type: 'Gearbox Unit', model: 'GU-500', part: 'Bearing 6205-2RS', sensors: { vib: { name: 'Vibration RMS', base: 1.8, unit: 'mm/s' }, temp: { name: 'Oil Temp', base: 60, unit: '°C' }, current: { name: 'Input Torque', base: 85, unit: 'Nm' } } },
    { type: 'Drive Motor', model: 'DM-12', part: 'AC Drive Motor Fan', sensors: { vib: { name: 'Vibration RMS', base: 1.2, unit: 'mm/s' }, temp: { name: 'Winding Temp', base: 65, unit: '°C' }, current: { name: 'Current Draw', base: 45.0, unit: 'A' } } },
    { type: 'Hydraulic Pump', model: 'HP-90', part: 'Hydraulic Seal Kit HK-220', sensors: { vib: { name: 'Displacement Noise', base: 2.2, unit: 'mm/s' }, temp: { name: 'Fluid Temp', base: 48, unit: '°C' }, current: { name: 'System Pressure', base: 120, unit: 'bar' } } },
    { type: 'Belt Tensioner', model: 'BT-30', part: 'Tensioner Pulley TP-90', sensors: { vib: { name: 'Vibration RMS', base: 2.0, unit: 'mm/s' }, temp: { name: 'Bearing Temp', base: 50, unit: '°C' }, current: { name: 'Tension Force', base: 3.5, unit: 'kN' } } },
    { type: 'Bearing Assembly', model: 'BA-77', part: 'Lubricant Seal Ring SR-15', sensors: { vib: { name: 'Bearing G-force', base: 0.8, unit: 'g' }, temp: { name: 'Bearing Temp', base: 58, unit: '°C' }, current: { name: 'Acoustic Emission', base: 15, unit: 'dB' } } }
  ];

  // Populate Plants & Machines
  plants.forEach(plant => {
    plant.machines = [];
    for (let i = 0; i < plant.machinesCount; i++) {
      const template = machineTemplates[Math.floor(seededRandom() * machineTemplates.length)];
      const jitter = (seededRandom() * 26) - 13; // -13 to +13 risk jitter
      let risk = Math.round(plant.baseRisk + jitter);
      risk = Math.max(8, Math.min(96, risk));

      // Sensor factor based on risk score
      let factor = 1.0;
      if (risk >= 70) {
        factor = 1.45 + (risk - 70) * 0.015; // Elevate sensors significantly
      } else if (risk >= 45) {
        factor = 1.1 + (risk - 45) * 0.01;
      } else {
        factor = 0.85 + (risk * 0.005);
      }

      const currentVib = +(template.sensors.vib.base * factor + (seededRandom() * 0.08)).toFixed(2);
      const currentTemp = Math.round(template.sensors.temp.base * factor + (seededRandom() * 2));
      const currentVal = +(template.sensors.current.base * factor + (seededRandom() * 0.4)).toFixed(1);

      plant.machines.push({
        id: `${plant.id}_m${i+1}`,
        name: `${template.type} ${template.model}-${201 + i}`,
        type: template.type,
        primaryPart: template.part,
        riskScore: risk,
        sensors: {
          vib: { name: template.sensors.vib.name, base: template.sensors.vib.base, current: currentVib, unit: template.sensors.vib.unit },
          temp: { name: template.sensors.temp.name, base: template.sensors.temp.base, current: currentTemp, unit: template.sensors.temp.unit },
          current: { name: template.sensors.current.name, base: template.sensors.current.base, current: currentVal, unit: template.sensors.current.unit }
        },
        // 20 ticks of historical data ending at current values
        history: Array.from({ length: 20 }, (_, idx) => {
          const progress = idx / 19;
          const scale = 1 + (factor - 1) * progress;
          const noise = (seededRandom() * 0.06 - 0.03);
          return {
            vib: +(template.sensors.vib.base * scale + noise).toFixed(2),
            temp: Math.round(template.sensors.temp.base * scale + noise * 4),
            current: +(template.sensors.current.base * scale + noise * 2).toFixed(1)
          };
        })
      });
    }

    // Recompute plant average risk based on machines
    const totalRisk = plant.machines.reduce((acc, m) => acc + m.riskScore, 0);
    plant.averageRisk = Math.round(totalRisk / plant.machines.length);
  });

  // Build fleet-wide lists
  const allFleetMachines = [];
  plants.forEach(p => {
    p.machines.forEach(m => {
      allFleetMachines.push({ plant: p, machine: m });
    });
  });

  // Sort by risk descending
  allFleetMachines.sort((a, b) => b.machine.riskScore - a.machine.riskScore);

  // Generate Reorder Priority Queue (Top 7 at-risk assets)
  const reorderQueue = [];
  for (let i = 0; i < 7; i++) {
    const item = allFleetMachines[i];
    const risk = item.machine.riskScore;
    let urgency = 'Watch';
    if (risk >= 70) urgency = 'Critical';
    else if (risk >= 45) urgency = 'High';

    const confidence = Math.round(78 + (risk * 0.18) + (seededRandom() * 4));
    const qty = Math.floor(seededRandom() * 3) + 2; // 2 to 4 qty
    
    let eta = '10 Days';
    if (urgency === 'Critical') eta = '1-2 Days';
    else if (urgency === 'High') eta = '3-5 Days';

    reorderQueue.push({
      id: `reorder_${i+1}`,
      partName: item.machine.primaryPart,
      plantName: item.plant.name,
      plantId: item.plant.id,
      machineName: item.machine.name,
      machineId: item.machine.id,
      quantity: qty,
      urgency: urgency,
      confidence: Math.min(99, confidence),
      eta: eta
    });
  }

  // Generate Anomaly Alerts
  const anomalies = [];
  const alertTimes = ['6 mins ago', '22 mins ago', '1.4 hrs ago', '4.1 hrs ago'];
  for (let i = 0; i < 4; i++) {
    const item = allFleetMachines[i + 7]; // Grab next 4 assets
    const sensors = Object.values(item.machine.sensors);
    const sensor = sensors[Math.floor(seededRandom() * sensors.length)];
    const deviation = Math.round(65 + seededRandom() * 140);
    let severity = 'Warning';
    if (deviation >= 130) severity = 'Critical';

    anomalies.push({
      id: `anomaly_${i+1}`,
      timestamp: alertTimes[i],
      plantName: item.plant.name,
      plantId: item.plant.id,
      machineName: item.machine.name,
      machineId: item.machine.id,
      metric: sensor.name,
      deviation: `+${deviation}%`,
      severity: severity
    });
  }

  // 6-week plant trend heatmap data
  const heatmap = [];
  plants.forEach(plant => {
    const row = {
      plantId: plant.id,
      plantName: plant.name,
      weeks: []
    };
    for (let w = 0; w < 6; w++) {
      const progress = w / 5;
      const noise = (seededRandom() * 12) - 6;
      let wRisk = Math.round(plant.averageRisk - (1 - progress) * 18 + noise);
      wRisk = Math.max(10, Math.min(95, wRisk));
      row.weeks.push(wRisk);
    }
    heatmap.push(row);
  });

  // Benchmark values
  const benchmarks = [
    { stage: 'Feature Engineering', cpu: 2310, cpuFormatted: '38.5 min', gpu: 42, gpuFormatted: '42.1 sec', speedup: 55 },
    { stage: 'ETL Pipelines', cpu: 6852, cpuFormatted: '114.2 min', gpu: 108, gpuFormatted: '1.8 min', speedup: 63 },
    { stage: 'Forecast Training', cpu: 14700, cpuFormatted: '245.0 min', gpu: 186, gpuFormatted: '3.1 min', speedup: 79 },
    { stage: 'Anomaly Scoring', cpu: 1104, cpuFormatted: '18.4 min', gpu: 12, gpuFormatted: '12.0 sec', speedup: 92 }
  ];

  return {
    plants,
    reorderQueue,
    anomalies,
    heatmap,
    benchmarks
  };
}

// AI Copilot grounded response generator
export function getCopilotResponse(query, data) {
  const q = query.toLowerCase();
  
  // 1. CTA Drill down question: "why does [Machine] need [Part]?"
  if (q.includes("why does") && q.includes("need")) {
    let foundPlant = null;
    let foundMachine = null;
    
    data.plants.forEach(p => {
      p.machines.forEach(m => {
        if (q.includes(m.name.toLowerCase()) || q.includes(m.type.toLowerCase())) {
          foundPlant = p;
          foundMachine = m;
        }
      });
    });
    
    if (foundPlant && foundMachine) {
      const dev = Math.round(((foundMachine.sensors.vib.current - foundMachine.sensors.vib.base) / foundMachine.sensors.vib.base) * 100);
      return `### Vertex AI Grounded Diagnosis
          
**Machine Node:** \`${foundMachine.name}\` located at **${foundPlant.name}**
**Failure Probabilities:**
* **Failure Risk Score:** \`${foundMachine.riskScore}%\` (${foundMachine.riskScore >= 70 ? 'CRITICAL' : 'ELEVATED'})
* **Active Telemetry Anomaly Streams:**
  - **${foundMachine.sensors.vib.name}:** ${foundMachine.sensors.vib.current} ${foundMachine.sensors.vib.unit} (Baseline: ${foundMachine.sensors.vib.base}) | **+${dev}% Dev**
  - **${foundMachine.sensors.temp.name}:** ${foundMachine.sensors.temp.current} ${foundMachine.sensors.temp.unit} (Baseline: ${foundMachine.sensors.temp.base})
  
**NVIDIA Acceleration Analytics:**
RAPIDS cuDF forecasting models tracked vibration harmonics drift over the 20-minute sliding window. The regression model forecasts a **94% chance of mechanical seizure** within 48 hours.
  
**Procurement Recommendation:**
Order **${foundMachine.primaryPart}** immediately. Lead time SLA is **${foundMachine.riskScore >= 70 ? '1-2 Days' : '3-5 Days'}**. Dispatching via GCloud Procurement prevents a projected **12-hour unplanned facility downtime.**`;
    }
  }

  // 2. Chip question: "Which parts should I reorder for Plant 3 this week, and why?"
  if (q.includes("plant 3") || q.includes("pune")) {
    const puneReorders = data.reorderQueue.filter(item => item.plantName.includes("Pune"));
    
    let response = `### Spare-Parts Demand Matrix: Plant 3 — Pune, India
    
Vertex AI models have highlighted elevated vibration signatures across Conveyor systems at the Pune facility. Here are the prioritized spare-part orders:

`;
    puneReorders.forEach(item => {
      response += `* **\`${item.partName}\`** (Qty: ${item.quantity})
  - **Asset:** ${item.machineName}
  - **Urgency:** **${item.urgency}** (ETA: ${item.eta})
  - **Forecast Confidence:** \`${item.confidence}%\`
  - **Reason:** Signal harmonic drift detected on telemetry channel.\n`;
    });
    
    response += `\n**Inventory Optimisation Recommendation:** 
Running cuML clustering indicates that Pune conveyor bearings are hitting thermal exhaustion. Dispatching the reorders today ensures delivery before the estimated failure epoch on Friday.`;
    return response;
  }

  // 3. Chip question: "Compare GPU vs CPU acceleration for our analytics pipelines."
  if (q.includes("gpu vs cpu") || q.includes("benchmark") || q.includes("acceleration") || q.includes("rapids")) {
    let response = `### NVIDIA GPU vs Legacy CPU Performance Benchmarks
    
Here is the raw telemetry execution comparison between our legacy CPU Spark framework and the current GKE cluster powered by NVIDIA A100 Tensor Core GPUs & RAPIDS cuDF:

| Pipeline Stage | CPU (pandas/Spark) | GPU (RAPIDS cuDF/cuML) | Speedup |
| :--- | :--- | :--- | :--- |
`;
    data.benchmarks.forEach(b => {
      response += `| ${b.stage} | ${b.cpuFormatted} | ${b.gpuFormatted} | **${b.speedup}x Faster** |\n`;
    });
    
    response += `\n### Architectural Insights:
* **Fleet-wide Reprocess Time:** Full-fleet telemetry processing takes **5.2 Minutes** on GPU vs **6.4 Hours** on CPU clusters.
* **Economic Value:** GPU acceleration reduces cloud compute resources by **88%** and supports streaming real-time alerts.`;
    return response;
  }

  // 4. Anomaly alerts question: "List the recent critical anomalies across the fleet."
  if (q.includes("anomaly") || q.includes("alerts") || q.includes("critical anomalies")) {
    let response = `### Live Telemetry Streaming Anomalies
    
There are **${data.anomalies.length} active sensor anomalies** logged in Vertex AI anomaly queues within the last 4 hours:

`;
    data.anomalies.forEach(a => {
      response += `* **[${a.severity}]** \`${a.machineName}\` (${a.plantName.split(' — ')[1]})
  - **Telemetry Channel:** ${a.metric} registered **${a.deviation}** baseline deviation.
  - **Trigger Epoch:** ${a.timestamp}
  - **Recommended Action:** Drill down into this asset's dashboard in the **Fleet Drill-Down** panel.\n`;
    });
    return response;
  }
  
  // 5. Highest risk query
  if ((q.includes("highest") && q.includes("plant")) || q.includes("worst") || q.includes("highest overall")) {
    const sorted = [...data.plants].sort((a,b) => b.averageRisk - a.averageRisk);
    const worst = sorted[0];
    
    return `### Fleet Risk Index Leaderboard
    
* **Highest Risk Facility:** **${worst.name}** at **${worst.averageRisk}%** Average Failure Risk.
* **Contributing Factor:** The critical failure scores on Conveyor and Motor nodes have spiked.
* **Immediate Remedy:** Navigate to the **Fleet Drill-Down** view for ${worst.location} and approve the queued orders for **${worst.machines[0].primaryPart}** to prevent critical stoppage.`;
  }

  // 6. Generic Fallback response
  return `### ServiceIQ Copilot Response
  
I received your request: *"${query}"*
  
**Fleet Status Overview:**
* **Monitored Facility Nodes:** 6 plants actively reporting
* **Pending Urgent Reorders:** ${data.reorderQueue.filter(x => x.urgency === 'Critical').length} items flagged
* **Unprocessed Alerts:** ${data.anomalies.length} anomalies active
* **GKE GPU Speedup Ratio:** 72.2x over legacy Spark clusters
  
You can use the suggestions chips below to query specific Pune demand logs, anomaly lists, or RAPIDS benchmark matrices.`;
}
