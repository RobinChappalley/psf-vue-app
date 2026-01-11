export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}
