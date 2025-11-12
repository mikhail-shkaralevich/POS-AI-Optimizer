// Utilities to generate mock benchmark (industry average) series for small retail
// Assumptions (based on typical small retail patterns):
// - Daily revenue: ~$1,200 weekdays, ~$1,800 weekends (Sun higher than Sat by a bit)
// - ATV: ~$55 weekdays, ~$60 weekends
// - Transactions/day: ~30 weekdays, ~45 weekends (used to split new vs returning)
// - New vs Returning split: 65% new, 35% returning
// - Foot traffic: ~220 weekdays, ~350 weekends
// - Conversion rate: ~18% weekdays, ~20% weekends (percentage values)
// Small random noise added for realism.

function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun,6=Sat
  return day === 0 || day === 6;
}

function dayOfWeek(date) {
  return new Date(date).getDay();
}

function jitter(base, percent = 0.08) {
  // Add +/- percent noise
  const range = base * percent;
  const delta = (Math.random() * 2 - 1) * range;
  return Math.max(0, Math.round(base + delta));
}

function jitterFloat(base, percent = 0.05, digits = 1) {
  const range = base * percent;
  const delta = (Math.random() * 2 - 1) * range;
  const val = base + delta;
  return parseFloat(val.toFixed(digits));
}

// Generate a value per date using weekday/weekend baselines plus light seasonality
function withSeasonality(baseWeekday, baseWeekend, date) {
  const d = new Date(date);
  const dow = d.getDay();
  // Weekend boost: Sat slightly lower than Sun
  const base = dow === 0 ? baseWeekend * 1.05 : (dow === 6 ? baseWeekend * 0.95 : baseWeekday);
  // Add slight mid-week dip and Friday uptick
  const seasonal = [0.97, 0.98, 0.95, 0.98, 1.03, 1.05, 1.10][dow];
  return base * seasonal;
}

export function generateBenchmarkSeries(type, originalTrend) {
  // originalTrend: array of daily entries with .date and either .value or .new/.returning
  // Returns: array matching originalTrend dates, with fields 'benchmark' (or 'benchmarkNew'/'benchmarkReturning')
  if (!Array.isArray(originalTrend) || originalTrend.length === 0) return [];

  if (type === 'customers') {
    return originalTrend.map(item => {
      const date = item.date;
      // Estimate total transactions for the day
      const baseTransactions = withSeasonality(30, 45, date);
      const tx = jitter(baseTransactions, 0.15);
      const newPct = 0.65;
      const returningPct = 0.35;
      const benchNew = Math.max(0, Math.round(tx * newPct));
      const benchReturning = Math.max(0, tx - benchNew);
      return {
        date: item.date,
        fullDate: item.fullDate || item.date,
        benchmarkNew: benchNew,
        benchmarkReturning: benchReturning,
      };
    });
  }

  if (type === 'revenue') {
    return originalTrend.map(item => {
      const date = item.date;
      const base = withSeasonality(1200, 1800, date);
      const val = jitter(base, 0.12);
      return { date: item.date, fullDate: item.fullDate || item.date, benchmark: val };
    });
  }

  if (type === 'atv') {
    return originalTrend.map(item => {
      const date = item.date;
      const base = withSeasonality(55, 60, date);
      const val = jitterFloat(base, 0.06, 2);
      return { date: item.date, fullDate: item.fullDate || item.date, benchmark: val };
    });
  }

  if (type === 'footTraffic') {
    return originalTrend.map(item => {
      const date = item.date;
      const base = withSeasonality(220, 350, date);
      const val = jitter(base, 0.15);
      return { date: item.date, fullDate: item.fullDate || item.date, benchmark: val };
    });
  }

  if (type === 'conversion') {
    return originalTrend.map(item => {
      const date = item.date;
      const weekend = isWeekend(date);
      const base = weekend ? 20 : 18; // as percent
      const val = jitterFloat(base, 0.08, 1);
      return { date: item.date, fullDate: item.fullDate || item.date, benchmark: val };
    });
  }

  return [];
}
