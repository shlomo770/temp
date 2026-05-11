// Color constants for consistent usage across the application
export const COLORS = {
  white: '#ffffff',
  yellow: '#fbdf1d',
  blue: '#5c59da',
  orange: '#fb781d',
  red: '#f84747',
  gray: '#767070',
  green:'#43e55f',


  // Status colors
  connected: 'text-white',
  disconnected: 'text-red-600',
  warning: 'text-yellow-600',
  standby: 'text-blue-600',
  oper: 'text-blue-400',
  armed: 'text-orange-400',
  error: 'text-red-400',
  idle: 'text-gray-400',
  default: 'text-gray-300',

  // Battery colors
  battery: 'text-white',
  batteryWarning: 'text-red-400',

  // Icon colors
  serverConnected: 'text-white',
  serverDisconnected: 'text-red-600',
  satellite: 'text-white',
  video: 'text-red-400',
  microchip: 'text-purple-400',
  radar: 'text-orange-400',
  gps: 'text-blue-400',
  gpsOk: 'text-white',
  gpsWarning: 'text-yellow-400',
  gpsFail: 'text-red-600',
  gpsNoCome: 'text-red-600',
  radarOk: 'text-white',
  radarWarning: 'text-yellow-400',
  radarFail: 'text-red-600',
  radarStby: 'text-green-400',
  radarNoCome: 'text-red-600',

  // Gun colors
  gunOk: 'text-white',
  gunWarning: 'text-yellow-400',
  gunFail: 'text-red-600',
  gunTracking: 'text-blue-600',
  gunArmed: 'text-white',
  gunNoCome: 'text-red-600',

  // Background colors
  bgConnected: 'bg-white',
  bgDisconnected: 'bg-red-500/20',
  bgWarning: 'bg-yellow-500/20',
  bgStandby: 'bg-blue-500/20',
  bgOper: 'bg-blue-500/20',
  bgArmed: 'bg-orange-500/20',
  bgError: 'bg-red-500/20',
  bgIdle: 'bg-gray-500/20',

  // Border colors
  borderConnected: 'border-white',
  borderDisconnected: 'border-red-400/30',
  borderWarning: 'border-yellow-400/30',
  borderStandby: 'border-blue-400/30',
  borderOper: 'border-blue-400/30',
  borderArmed: 'border-orange-400/30',
  borderError: 'border-red-400/30',
  borderIdle: 'border-gray-400/30',
} as const;

export type ColorKey = keyof typeof COLORS; 