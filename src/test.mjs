import { generateMockData } from './data.js';
try {
  const d = generateMockData();
  console.log("SUCCESS: Data generated successfully!");
  console.log("Plants:", d.plants.length);
  console.log("Reorders:", d.reorderQueue.length);
  console.log("Anomalies:", d.anomalies.length);
} catch (e) {
  console.error("CRASH ERROR:", e);
}
