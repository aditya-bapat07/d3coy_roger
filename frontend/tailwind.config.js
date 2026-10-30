/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        control: {
          bg: '#0A0E17',          // Near-black control room navy
          surface: '#111827',     // Dark slate surface
          card: '#162032',        // Elevated panel
          cardHover: '#1C293F',   // Hover state
          border: '#23324A',      // Subtle slate border
          subtle: '#64748B',      // Secondary text / icon
          text: '#F1F5F9',        // Primary readable text
        },
        risk: {
          low: '#10B981',         // 0-25 Green
          medium: '#F59E0B',      // 26-50 Amber
          high: '#EF4444',        // 51-75 Red
          critical: '#991B1B',    // 76-100 Deep Red
          criticalBg: '#450A0A',
        },
        purdue: {
          l4: '#3B82F6',          // Enterprise IT
          dmz: '#8B5CF6',         // L3.5 DMZ
          l3: '#06B6D4',          // Operations
          l2: '#F59E0B',          // Control SCADA/HMI
          l1: '#EC4899',          // Basic Control (PLC/RTU)
          l0: '#10B981',          // Field Devices / Physical
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 15px -3px rgba(59, 130, 246, 0.25)',
        alert: '0 0 20px -3px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}

