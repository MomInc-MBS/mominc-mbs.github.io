// Only aggregate inference counts are stored; no IPs, player IDs, or answers.
export function consumeBudget(previous, now, perMinute = 60, perDay = 4000) {
 const day = Math.floor(now / 86400000), minute = Math.floor(now / 60000);
 const current = {day, minute, dayCount: previous?.day === day ? previous.dayCount : 0,
  minuteCount: previous?.minute === minute ? previous.minuteCount : 0};
 const retryAfter = current.dayCount >= perDay ? Math.ceil(((day + 1) * 86400000 - now) / 1000)
  : Math.ceil(((minute + 1) * 60000 - now) / 1000);
 if(current.dayCount >= perDay || current.minuteCount >= perMinute) return {allowed:false, current, retryAfter};
 current.dayCount++; current.minuteCount++;
 return {allowed:true, current, retryAfter:0};
}
