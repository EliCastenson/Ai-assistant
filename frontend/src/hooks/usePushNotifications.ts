import { useEffect, useState } from 'react'
import { api } from '../lib/api'

// VAPID public key (replace with your own from backend config)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission)
  const [error, setError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/service-worker.js').then(reg => {
        // Request permission
        Notification.requestPermission().then(result => {
          setPermission(result)
          if (result === 'granted') {
            reg.pushManager.getSubscription().then(async existingSub => {
              if (!existingSub) {
                try {
                  const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                  })
                  // Send subscription to backend
                  const key = sub.toJSON().keys || {}
                  await api.post('/api/notifications/subscribe', {
                    endpoint: sub.endpoint,
                    p256dh: key.p256dh,
                    auth: key.auth,
                  })
                  setSubscribed(true)
                } catch (err) {
                  setError('Failed to subscribe to push notifications.')
                }
              } else {
                setSubscribed(true)
              }
            })
          }
        })
      }).catch(() => setError('Failed to register service worker.'))
    }
  }, [])

  return { permission, error, subscribed }
} 