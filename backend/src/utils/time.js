let timeOffset = 0; // In milliseconds: networkTime - localTime
let hasSynced = false;

/**
 * Fetches the precise time from the local time service and calculates the offset.
 */
async function syncTime() {
  if (process.env.RENDER || process.env.NODE_ENV === 'production') {
    // Bỏ qua đồng bộ giờ local khi chạy trên production hoặc Render
    return false;
  }
  try {
    const res = await fetch('http://localhost:8000/api/time');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.timestamp) {
      const networkTime = Math.round(data.timestamp * 1000);
      const localTime = Date.now();
      timeOffset = networkTime - localTime;
      hasSynced = true;
      console.log(`[TimeSync] Successfully synchronized clock with local time service. Offset: ${timeOffset}ms`);
      return true;
    }
  } catch (error) {
    console.error('[TimeSync] Failed to synchronize clock with local time service:', error.message);
  }
  return false;
}

/**
 * Gets the synchronized current date/time.
 * Falls back to local system time if sync has never occurred.
 * @returns {Date}
 */
function getCurrentTime() {
  return new Date(Date.now() + timeOffset);
}

// Start periodic synchronization (every 15 minutes)
syncTime().catch(err => console.error('[TimeSync] Initial sync error:', err.message));
setInterval(() => {
  syncTime().catch(err => console.error('[TimeSync] Periodic sync error:', err.message));
}, 15 * 60 * 1000);

module.exports = {
  syncTime,
  getCurrentTime,
  getOffset: () => timeOffset,
  isSynced: () => hasSynced
};
