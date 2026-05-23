import React from 'react'
import Svg, { Path, Rect, Line, Circle, Polyline, Polygon, G } from 'react-native-svg'

type IconName =
  | 'home' | 'receipt' | 'calendar' | 'compass' | 'plus'
  | 'heart' | 'heartFill' | 'bed' | 'fork' | 'car'
  | 'camera' | 'pin' | 'clock' | 'chevronR' | 'search'
  | 'star' | 'starFill' | 'users' | 'bag'
  | 'share' | 'trash' | 'edit' | 'qr' | 'x' | 'link' | 'check' | 'chevronL'

interface Props {
  name: IconName
  size?: number
  color?: string
  fill?: string
}

export default function Icon({ name, size = 20, color = 'currentColor', fill = 'none' }: Props) {
  const props = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: fill,
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'home':
      return (
        <Svg {...props}>
          <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" strokeWidth="1.8" />
        </Svg>
      )
    case 'receipt':
      return (
        <Svg {...props}>
          <Rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="1.8" />
          <Line x1="8" y1="8" x2="16" y2="8" strokeWidth="1.8" />
          <Line x1="8" y1="12" x2="16" y2="12" strokeWidth="1.8" />
          <Line x1="8" y1="16" x2="12" y2="16" strokeWidth="1.8" />
        </Svg>
      )
    case 'calendar':
      return (
        <Svg {...props}>
          <Rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8" />
          <Line x1="3" y1="9" x2="21" y2="9" strokeWidth="1.8" />
          <Line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.8" />
          <Line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.8" />
        </Svg>
      )
    case 'compass':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="9" strokeWidth="1.8" />
          <Polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill={color} strokeWidth="1.6" />
        </Svg>
      )
    case 'plus':
      return (
        <Svg {...props}>
          <Line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" />
          <Line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" />
        </Svg>
      )
    case 'heart':
      return (
        <Svg {...props}>
          <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeWidth="1.8" />
        </Svg>
      )
    case 'heartFill':
      return (
        <Svg {...props} fill={color}>
          <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeWidth="1.8" />
        </Svg>
      )
    case 'bed':
      return (
        <Svg {...props}>
          <Path d="M3 22V12h18v10M3 12V6a2 2 0 012-2h14a2 2 0 012 2v6M3 16h18" strokeWidth="1.8" />
        </Svg>
      )
    case 'fork':
      return (
        <Svg {...props}>
          <Line x1="12" y1="2" x2="12" y2="22" strokeWidth="1.8" />
          <Path d="M7 2v6a3 3 0 006 0V2" strokeWidth="1.8" />
        </Svg>
      )
    case 'car':
      return (
        <Svg {...props}>
          <Path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h13a2 2 0 012 2v6a2 2 0 01-2 2h-2" strokeWidth="1.8" />
          <Rect x="7" y="14" width="10" height="6" rx="2" strokeWidth="1.8" />
          <Circle cx="10" cy="20" r="1" fill={color} stroke="none" />
          <Circle cx="18" cy="20" r="1" fill={color} stroke="none" />
        </Svg>
      )
    case 'camera':
      return (
        <Svg {...props}>
          <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeWidth="1.8" />
          <Circle cx="12" cy="13" r="4" strokeWidth="1.8" />
        </Svg>
      )
    case 'pin':
      return (
        <Svg {...props}>
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeWidth="1.8" />
          <Circle cx="12" cy="10" r="3" strokeWidth="1.8" />
        </Svg>
      )
    case 'clock':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="9" strokeWidth="1.8" />
          <Polyline points="12,7 12,12 15,15" strokeWidth="1.8" />
        </Svg>
      )
    case 'chevronR':
      return (
        <Svg {...props}>
          <Polyline points="9,18 15,12 9,6" strokeWidth="2" />
        </Svg>
      )
    case 'search':
      return (
        <Svg {...props}>
          <Circle cx="11" cy="11" r="7" strokeWidth="1.8" />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
        </Svg>
      )
    case 'star':
      return (
        <Svg {...props}>
          <Polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" strokeWidth="1.8" />
        </Svg>
      )
    case 'starFill':
      return (
        <Svg {...props} fill={color}>
          <Polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" strokeWidth="1.8" />
        </Svg>
      )
    case 'users':
      return (
        <Svg {...props}>
          <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="1.8" />
          <Circle cx="9" cy="7" r="4" strokeWidth="1.8" />
          <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth="1.8" />
        </Svg>
      )
    case 'bag':
      return (
        <Svg {...props}>
          <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeWidth="1.8" />
          <Line x1="3" y1="6" x2="21" y2="6" strokeWidth="1.8" />
          <Path d="M16 10a4 4 0 01-8 0" strokeWidth="1.8" />
        </Svg>
      )
    case 'share':
      return (
        <Svg {...props}>
          <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeWidth="1.8" />
          <Polyline points="16,6 12,2 8,6" strokeWidth="1.8" />
          <Line x1="12" y1="2" x2="12" y2="15" strokeWidth="1.8" />
        </Svg>
      )
    case 'trash':
      return (
        <Svg {...props}>
          <Polyline points="3,6 5,6 21,6" strokeWidth="1.8" />
          <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeWidth="1.8" />
          <Path d="M10 11v6M14 11v6" strokeWidth="1.8" />
          <Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeWidth="1.8" />
        </Svg>
      )
    case 'edit':
      return (
        <Svg {...props}>
          <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="1.8" />
          <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="1.8" />
        </Svg>
      )
    case 'qr':
      return (
        <Svg {...props}>
          <Rect x="3" y="3" width="8" height="8" rx="1" strokeWidth="1.8" />
          <Rect x="13" y="3" width="8" height="8" rx="1" strokeWidth="1.8" />
          <Rect x="3" y="13" width="8" height="8" rx="1" strokeWidth="1.8" />
          <Line x1="13" y1="13" x2="13" y2="13.01" strokeWidth="2.5" />
          <Line x1="17" y1="13" x2="17" y2="13.01" strokeWidth="2.5" />
          <Line x1="21" y1="13" x2="21" y2="13.01" strokeWidth="2.5" />
          <Line x1="13" y1="17" x2="13" y2="17.01" strokeWidth="2.5" />
          <Line x1="17" y1="17" x2="21" y2="17" strokeWidth="1.8" />
          <Line x1="21" y1="17" x2="21" y2="21" strokeWidth="1.8" />
          <Line x1="13" y1="21" x2="17" y2="21" strokeWidth="1.8" />
        </Svg>
      )
    case 'x':
      return (
        <Svg {...props}>
          <Line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
          <Line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
        </Svg>
      )
    case 'link':
      return (
        <Svg {...props}>
          <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeWidth="1.8" />
          <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeWidth="1.8" />
        </Svg>
      )
    case 'check':
      return (
        <Svg {...props}>
          <Polyline points="20,6 9,17 4,12" strokeWidth="2" />
        </Svg>
      )
    case 'chevronL':
      return (
        <Svg {...props}>
          <Polyline points="15,18 9,12 15,6" strokeWidth="2" />
        </Svg>
      )
    default:
      return null
  }
}
