/**
 * NOTEX Notification & Audio Chime Helper
 * Provides browser Web Notifications and Web Audio API synthesized chimes
 */

// Synthesize a clean, pleasant ambient chime using the Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Play two ascending harmonious harmonic notes (E5 659.25Hz -> G#5 830.61Hz -> B5 987.77Hz)
    const notes = [
      { freq: 659.25, time: 0, duration: 0.35, gain: 0.18 },
      { freq: 830.61, time: 0.12, duration: 0.45, gain: 0.22 },
      { freq: 987.77, time: 0.24, duration: 0.65, gain: 0.25 }
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Envelope: Fast attack, smooth exponential decay
      gainNode.gain.setValueAtTime(0.001, now + time);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });

    // Close audio context after playback completes
    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, 1500);
  } catch (err) {
    console.warn('[Audio Chime] Web Audio playback issue:', err);
  }
};

// Check current notification status
export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Request permission for Web Notifications
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[Notification Permission Error]:', err);
    return 'denied';
  }
};

// Trigger a native browser notification
export const sendBrowserNotification = (title, options = {}) => {
  playNotificationChime();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || `notex-${Date.now()}`,
        requireInteraction: true,
        silent: false,
        ...options
      });

      notif.onclick = () => {
        window.focus();
        if (options.onClickUrl) {
          window.location.href = options.onClickUrl;
        }
        notif.close();
      };

      return notif;
    } catch (err) {
      console.warn('[Browser Notification Error]:', err);
      return null;
    }
  }

  return null;
};
