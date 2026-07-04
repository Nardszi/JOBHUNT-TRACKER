const NOTIFICATION_PERMISSION_KEY = "jh_notifications_enabled";
const NOTIFICATION_TIME_KEY = "jh_notification_time";
const LAST_DAILY_NOTIF_KEY = "jh_last_daily_notif";

export function isNotificationsSupported(): boolean {
  return "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationsSupported()) return "denied";
  const result = await Notification.requestPermission();
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, result === "granted" ? "true" : "false");
  return result;
}

export function setNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, enabled ? "true" : "false");
}

export function getNotificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === "true" && Notification.permission === "granted";
}

export function getNotificationTime(): string {
  return localStorage.getItem(NOTIFICATION_TIME_KEY) || "09:00";
}

export function setNotificationTime(time: string) {
  localStorage.setItem(NOTIFICATION_TIME_KEY, time);
}

function showBrowserNotification(title: string, body: string, tag?: string) {
  if (!getNotificationsEnabled()) return;
  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: "/favicon.ico",
          tag,
          badge: "/favicon.ico",
        });
      });
    } else {
      new Notification(title, { body, tag });
    }
  } catch {
    new Notification(title, { body, tag });
  }
}

export function checkFollowUpReminders(apps: Array<{ company: string; followUpDate: string; status: string }>) {
  if (!getNotificationsEnabled()) return;
  const today = new Date().toISOString().slice(0, 10);
  const due = apps.filter(
    (a) =>
      a.followUpDate === today &&
      a.status !== "Offer" &&
      a.status !== "Rejected"
  );
  if (due.length > 0) {
    showBrowserNotification(
      "Follow-up Reminder",
      `You have ${due.length} follow-up(s) due today: ${due.map((a) => a.company).join(", ")}`,
      "followup-" + today
    );
  }
}

export function checkDailyTaskNudge() {
  if (!getNotificationsEnabled()) return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const lastNotif = localStorage.getItem(LAST_DAILY_NOTIF_KEY);
  if (lastNotif === today) return;

  const time = getNotificationTime();
  const [h, m] = time.split(":").map(Number);
  const notifTime = new Date();
  notifTime.setHours(h, m, 0, 0);

  if (now >= notifTime) {
    showBrowserNotification(
      "Daily Task Nudge",
      "Don't forget to check your job hunt tasks for today!",
      "daily-" + today
    );
    localStorage.setItem(LAST_DAILY_NOTIF_KEY, today);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startNotificationChecks(getApps: () => Array<{ company: string; followUpDate: string; status: string }>) {
  stopNotificationChecks();
  checkDailyTaskNudge();
  checkFollowUpReminders(getApps());
  intervalId = setInterval(() => {
    checkDailyTaskNudge();
    checkFollowUpReminders(getApps());
  }, 60 * 1000);
}

export function stopNotificationChecks() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
