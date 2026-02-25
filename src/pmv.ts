// ASHRAE 55 PMV Calculation (Improved Fanger Model)

export interface PMVOptions {
  tr?: number;  // Mean Radiant Temperature (default: ta)
  vel?: number; // Air velocity in m/s (default: 0.1)
  met?: number; // Metabolic rate in met (default: 1.1)
  clo?: number; // Clothing insulation in clo (default: dynamic based on ta)
}

export interface PMVResult {
  pmv: number;
  ppd: number;
  status: string;
  color: string;
  bg: string;
}

export const calculatePMV = (ta: number, rh: number, options: PMVOptions = {}): PMVResult => {
  if (ta === undefined || rh === undefined) {
    return { pmv: 0, ppd: 0, status: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-100' };
  }

  const tr = options.tr !== undefined ? options.tr : ta;
  const vel = options.vel !== undefined ? options.vel : 0.1;
  const met = options.met !== undefined ? options.met : 1.1;
  
  // Dynamic clothing level based on month
  let defaultClo = 1.0;
  const month = new Date().getMonth(); // 0-11
  
  if (month >= 5 && month <= 7) { // Jun, Jul, Aug (Summer)
    defaultClo = 0.5;
  } else if (month >= 2 && month <= 4) { // Mar, Apr, May (Spring)
    defaultClo = 0.75;
  } else if (month >= 8 && month <= 10) { // Sep, Oct, Nov (Autumn)
    defaultClo = 0.75;
  } else { // Dec, Jan, Feb (Winter)
    defaultClo = 1.0;
  }

  const clo = options.clo !== undefined ? options.clo : defaultClo;

  // Saturation vapor pressure (Pa) using Magnus-Tetens formula
  // es (hPa) = 6.112 * exp((17.67 * ta) / (ta + 243.5))
  // pa (Pa) = (rh / 100) * es * 100
  const es_hPa = 6.112 * Math.exp((17.67 * ta) / (ta + 243.5));
  const pa = (rh / 100) * es_hPa * 100;

  const icl = 0.155 * clo; // Thermal insulation of clothing in m2K/W
  const m = met * 58.15; // Metabolic rate in W/m2
  const w = 0; // External work in W/m2
  const mw = m - w; // Internal heat production

  // Iterative calculation for clothing surface temperature (tcl)
  let tcl = ta;
  let hc = 12.1 * Math.sqrt(vel);
  
  // Increased iterations and tighter convergence
  for (let i = 0; i < 100; i++) {
    let hcf = 12.1 * Math.sqrt(vel);
    const tcl2 = tcl + 273.15;
    const ta2 = ta + 273.15;
    const tr2 = tr + 273.15; // Use tr instead of ta

    // Heat transfer coefficient by forced convection
    hc = 2.38 * Math.pow(Math.abs(tcl - ta), 0.25);
    if (hcf > hc) hc = hcf;

    const t1 = 3.96 * Math.pow(10, -8) * 0.95 * (Math.pow(tcl2, 4) - Math.pow(tr2, 4));
    const t2 = hc * (tcl - ta);
    
    const tclNew = 35.7 - 0.028 * mw - icl * (t1 + t2);
    if (Math.abs(tclNew - tcl) < 0.001) break; // Tighter convergence
    tcl = (tclNew + tcl) / 2;
  }

  const tcl2 = tcl + 273.15;
  const tr2 = tr + 273.15;
  const t1 = 3.96 * Math.pow(10, -8) * 0.95 * (Math.pow(tcl2, 4) - Math.pow(tr2, 4));
  const t2 = hc * (tcl - ta);
  
  const loss = t1 + t2;
  const ts = 0.303 * Math.exp(-0.036 * m) + 0.028;
  
  // Heat loss components
  const hl1 = 3.05 * 0.001 * (5733 - 6.99 * mw - pa);
  const hl2 = 0.42 * (mw - 58.15);
  const hl3 = 1.7 * 0.00001 * m * (5867 - pa);
  const hl4 = 0.0014 * m * (34 - ta);
  
  const pmvVal = ts * (mw - hl1 - hl2 - hl3 - hl4 - loss);
  const pmv = Math.round(pmvVal * 100) / 100; // Round to 2 decimals

  // PPD Calculation
  // PPD = 100 - 95 * exp(-0.03353 * PMV^4 - 0.2179 * PMV^2)
  const ppdVal = 100 - 95 * Math.exp(-0.03353 * Math.pow(pmvVal, 4) - 0.2179 * Math.pow(pmvVal, 2));
  const ppd = Math.round(ppdVal * 10) / 10; // Round to 1 decimal

  // Status determination based on ASHRAE 55
  let status = 'Comfortable';
  let color = 'text-emerald-600 dark:text-emerald-400';
  let bg = 'bg-emerald-500/10 dark:bg-emerald-400/10';

  if (pmv > 0.5) {
    if (pmv > 3) { status = 'Hot'; color = 'text-rose-600 dark:text-rose-400'; bg = 'bg-rose-500/10 dark:bg-rose-400/10'; }
    else if (pmv > 2) { status = 'Warm'; color = 'text-red-600 dark:text-red-400'; bg = 'bg-red-500/10 dark:bg-red-400/10'; }
    else if (pmv > 1) { status = 'Slightly Warm'; color = 'text-orange-600 dark:text-orange-400'; bg = 'bg-orange-500/10 dark:bg-orange-400/10'; }
    else { status = 'Neutral (+)'; color = 'text-emerald-600 dark:text-emerald-400'; bg = 'bg-emerald-500/10 dark:bg-emerald-400/10'; }
  } else if (pmv < -0.5) {
    if (pmv < -3) { status = 'Cold'; color = 'text-blue-800 dark:text-blue-300'; bg = 'bg-blue-800/10 dark:bg-blue-300/10'; }
    else if (pmv < -2) { status = 'Cool'; color = 'text-blue-600 dark:text-blue-400'; bg = 'bg-blue-500/10 dark:bg-blue-400/10'; }
    else if (pmv < -1) { status = 'Slightly Cool'; color = 'text-cyan-600 dark:text-cyan-400'; bg = 'bg-cyan-500/10 dark:bg-cyan-400/10'; }
    else { status = 'Neutral (-)'; color = 'text-emerald-600 dark:text-emerald-400'; bg = 'bg-emerald-500/10 dark:bg-emerald-400/10'; }
  }

  return { pmv, ppd, status, color, bg };
};
