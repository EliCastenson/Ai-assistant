import { useState, useEffect } from 'react'

interface DesktopAPI {
  showNotification: (title: string, body: string, icon?: string) => Promise<void>
  openFileDialog: () => Promise<string | null>
  saveFileDialog: () => Promise<string | null>
  getAppDataDir: () => Promise<string>
  isDesktop: boolean
}

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: any) => Promise<any>
      event: {
        listen: (event: string, callback: (data: any) => void) => Promise<void>
      }
    }
  }
}

export function useDesktop(): DesktopAPI {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setIsDesktop(!!window.__TAURI__)
  }, [])

  const showNotification = async (title: string, body: string, icon?: string) => {
    if (isDesktop && window.__TAURI__) {
      await window.__TAURI__.invoke('show_notification', {
        payload: { title, body, icon }
      })
    } else {
      // Fallback to browser notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon })
      }
    }
  }

  const openFileDialog = async (): Promise<string | null> => {
    if (isDesktop && window.__TAURI__) {
      return await window.__TAURI__.invoke('open_file_dialog')
    } else {
      // Fallback to browser file input
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          resolve(file ? file.name : null)
        }
        input.click()
      })
    }
  }

  const saveFileDialog = async (): Promise<string | null> => {
    if (isDesktop && window.__TAURI__) {
      return await window.__TAURI__.invoke('save_file_dialog')
    } else {
      // Fallback - just return a default name
      return 'download.txt'
    }
  }

  const getAppDataDir = async (): Promise<string> => {
    if (isDesktop && window.__TAURI__) {
      return await window.__TAURI__.invoke('get_app_data_dir')
    } else {
      // Fallback to localStorage
      return 'localStorage'
    }
  }

  return {
    showNotification,
    openFileDialog,
    saveFileDialog,
    getAppDataDir,
    isDesktop
  }
} 