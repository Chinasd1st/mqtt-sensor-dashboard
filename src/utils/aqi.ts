export function calculateAQI(co2: number, pm25: number, tvoc: number): { 
  score: number; 
  level: string; 
  color: string; 
  bg: string 
} {
  // 计算每个污染物的子指数（0-100，越高越好，取最低作为整体AQI）
  // 子指数公式：线性插值 + 阈值分段（类似EPA AQI方法，但简化室内版）

  // PM2.5 子指数（μg/m³，参考WHO/EPA/RESET 2024-2026趋势）
  function pm25SubIndex(pm: number): number {
    if (pm <= 9) return 100;          // Excellent (EPA新年均标准)
    if (pm <= 15) return 100 - (pm - 9) * (20 / 6);   // → 80 at 15
    if (pm <= 35) return 80 - (pm - 15) * (40 / 20);  // → 40 at 35
    if (pm <= 75) return 40 - (pm - 35) * (30 / 40);  // → 10 at 75
    return Math.max(0, 10 - (pm - 75) * (10 / 75));   // → 0 at ~150+
  }

  // CO₂ 子指数（ppm，参考ASHRAE/中国GB/T 18883/COGfx研究）
  function co2SubIndex(c: number): number {
    if (c <= 600) return 100;         // 极佳通风
    if (c <= 800) return 100 - (c - 600) * (20 / 200); // → 80 at 800
    if (c <= 1000) return 80 - (c - 800) * (30 / 200); // → 50 at 1000
    if (c <= 1500) return 50 - (c - 1000) * (30 / 500); // → 20 at 1500
    return Math.max(0, 20 - (c - 1500) * (20 / 1000)); // → 0 at >2500
  }

  // TVOC 子指数（ppb，参考RESET/WELL/欧盟，假设典型分子量换算）
  function tvocSubIndex(t: number): number {
    if (t <= 150) return 100;         // 极低
    if (t <= 250) return 100 - (t - 150) * (20 / 100); // → 80 at 250
    if (t <= 500) return 80 - (t - 250) * (30 / 250);  // → 50 at 500
    if (t <= 800) return 50 - (t - 500) * (30 / 300);  // → 20 at 800
    return Math.max(0, 20 - (t - 800) * (20 / 700));   // → 0 at >1500
  }

  const pmScore = pm25SubIndex(pm25);
  const co2Score = co2SubIndex(co2);
  const tvocScore = tvocSubIndex(tvoc);

  // 整体AQI = 最差子指数（最限制污染物决定）
  const aqi = Math.min(pmScore, co2Score, tvocScore);

  // 分级（5级，更细分，参考Atmotube/EPA风格）
  let level: string;
  let color: string;
  let bg: string;

  if (aqi >= 81) {
    level = 'Excellent';
    color = 'text-emerald-500';
    bg = 'bg-emerald-500/10';
  } else if (aqi >= 61) {
    level = 'Good';
    color = 'text-emerald-400';     // 稍浅绿
    bg = 'bg-emerald-400/10';
  } else if (aqi >= 41) {
    level = 'Moderate';
    color = 'text-amber-500';
    bg = 'bg-amber-500/10';
  } else if (aqi >= 21) {
    level = 'Unhealthy';            // 新增一级
    color = 'text-orange-500';
    bg = 'bg-orange-500/10';
  } else {
    level = 'Poor';
    color = 'text-red-500';
    bg = 'bg-red-500/10';
  }

  // 分数直接用aqi（0-100，更连续、直观）
  const score = Math.round(aqi);

  return {
    score,
    level,
    color,
    bg
  };
}