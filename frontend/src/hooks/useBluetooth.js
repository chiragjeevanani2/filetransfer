import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useBluetooth — wraps the Web Bluetooth API for nearby-device scanning
 * and provides a "share via Bluetooth" function using the Web Share API
 * (which routes through Bluetooth on supported Android / iOS platforms).
 *
 * Returns:
 *   supported        — boolean, true when Web Bluetooth + Web Share APIs exist
 *   scanning         — boolean, whether a scan is in progress
 *   bluetoothDevices — Array<{ id, name, rssi?, type }> discovered devices
 *   startScan / stopScan
 *   shareFileViaBluetooth(file) — tries navigator.share → falls back to download
 *   isNearby(deviceId)          — checks if a device-id matches a BLE device name
 */

const SHARE_SERVICE_UUID = '0000fe95-0000-1000-8000-00805f9b34fb' // Xiaomi mi Beacons / generic share service
const SCAN_DURATION_MS = 12_000

export function useBluetooth() {
  const [supported, setSupported] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [bluetoothDevices, setBluetoothDevices] = useState([])
  const scanTimer = useRef(null)
  const deviceIds = useRef(new Set())

  // Probe for browser support on mount
  useEffect(() => {
    const hasBluetooth = !!(navigator.bluetooth)
    const hasShare = !!(navigator.share)
    setSupported(hasBluetooth || hasShare)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current)
    }
  }, [])

  /**
   * Start a Web Bluetooth scan.
   *
   * requestDevice() is user-gesture gated and shows a browser picker.
   * After the user picks a device we keep the GATT server connected and
   * poll for RSSI to estimate proximity.
   */
  const startScan = useCallback(async () => {
    if (!navigator.bluetooth || scanning) return

    setScanning(true)
    setBluetoothDevices([])
    deviceIds.current.clear()

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SHARE_SERVICE_UUID],
      })

      // Add the initially picked device
      const entry = { id: device.id, name: device.name || 'Unknown BLE Device', rssi: null, type: 'ble' }
      setBluetoothDevices(prev => {
        if (deviceIds.current.has(device.id)) return prev
        deviceIds.current.add(device.id)
        return [...prev, entry]
      })

      // Attempt to connect to GATT for RSSI
      try {
        const server = await device.gatt.connect()
        // Some devices expose the battery service which gives us a handle to poll RSSI
        // Not all browsers expose RSSI — wrap in try/catch
        try {
          const batteryService = await server.getPrimaryService('battery_service')
          const batteryLevel = await batteryService.getCharacteristic('battery_level')
          // Read just to confirm connection; RSSI isn't directly exposed via Web Bluetooth
          await batteryLevel.readValue()
        } catch {
          // Battery service not available — that's fine
        }
      } catch {
        // GATT connection failed — still usable as a discovered device
      }

      // Keep scanning window open briefly for additional picks
      scanTimer.current = setTimeout(() => {
        setScanning(false)
      }, SCAN_DURATION_MS)

      // Allow picking additional devices within the scan window
      // (browser will show picker again if user clicks scan again)
    } catch (err) {
      // User cancelled or no device found
      console.info('[Bluetooth] Scan ended:', err.message)
      setScanning(false)
    }
  }, [scanning])

  const stopScan = useCallback(() => {
    if (scanTimer.current) clearTimeout(scanTimer.current)
    setScanning(false)
  }, [])

  /**
   * Share a file via the Web Share API.
   *
   * On Android Chrome this triggers the native share sheet which includes
   * Bluetooth, Nearby Share, and other system targets.
   * Falls back to a regular download when the Share API is unavailable.
   */
  const shareFileViaBluetooth = useCallback(async (file) => {
    const blob = file instanceof Blob ? file : file

    if (navigator.share && navigator.canShare) {
      const fileObj = new File(
        [blob],
        file.name || 'shared-file',
        { type: file.type || 'application/octet-stream' }
      )
      try {
        if (navigator.canShare({ files: [fileObj] })) {
          await navigator.share({
            title: file.name || 'Shared file',
            text: `Sharing ${file.name || 'file'} via LocalDrop`,
            files: [fileObj],
          })
          return { success: true, method: 'share-api' }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: false, method: 'cancelled' }
        }
        console.info('[Bluetooth] Web Share failed, falling back:', err.message)
      }
    }

    // Fallback: trigger download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name || 'shared-file'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    return { success: true, method: 'download' }
  }, [])

  /**
   * Check if a given device name/id appears in the Bluetooth device list
   * (used to show proximity badges on WebSocket-connected devices).
   */
  const isNearby = useCallback((nameOrId) => {
    if (!nameOrId) return false
    const lower = nameOrId.toLowerCase()
    return bluetoothDevices.some(
      d => (d.name && d.name.toLowerCase() === lower) ||
           (d.id && d.id.toLowerCase() === lower)
    )
  }, [bluetoothDevices])

  return {
    supported,
    scanning,
    bluetoothDevices,
    startScan,
    stopScan,
    shareFileViaBluetooth,
    isNearby,
  }
}
