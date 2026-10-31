import { motion, useReducedMotion } from 'framer-motion';

export default function HeroDiagram() {
  const shouldReduceMotion = useReducedMotion();

  // Purdue bands (y coordinates for bands and labels)
  const bands = [
    { label: 'L4', y: 35, yLine: 95 },
    { label: 'L3.5', y: 105, yLine: 165 },
    { label: 'L3', y: 175, yLine: 235 },
    { label: 'L2', y: 245, yLine: 305 },
    { label: 'L1/L0', y: 315, yLine: 385 },
  ];

  // Hexagon point helper for PLCs
  const getHexPoints = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const chlorineHex = getHexPoints(220, 345, 17);
  const pumpHex = getHexPoints(95, 345, 14);

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative mx-auto w-full max-w-[520px] min-w-0">
      {/* Background ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,#F26A1B_0%,transparent_70%)] opacity-25 blur-3xl"
        aria-hidden="true"
      />

      <span className="sr-only">
        Interactive Purdue model network architecture diagram depicting an attack trajectory from Internet through
        Vendor VPN, Historian, and Water SCADA to an OT Chlorine PLC, which cascades downstream physical disruption into
        water treatment and hospital services.
      </span>

      {/* Main SVG Graphic */}
      <motion.svg
        viewBox="0 0 520 460"
        className="w-full h-auto block select-none max-w-full"
        aria-hidden="true"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <defs>
          <filter id="red-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pulse-halo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <style>{`
          @keyframes attackDash {
            to { stroke-dashoffset: -36; }
          }
          @keyframes pulseScale {
            0%, 100% { transform: scale(1); opacity: 0.45; }
            50% { transform: scale(1.35); opacity: 0.9; }
          }
          .animate-attack-dash {
            stroke-dasharray: 8 4;
            animation: attackDash 3s linear infinite;
          }
          .animate-plc-pulse {
            transform-origin: 220px 345px;
            animation: pulseScale 2.2s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-attack-dash { animation: none; stroke-dasharray: none; }
            .animate-plc-pulse { animation: none; }
          }
        `}</style>

        {/* Purdue level horizontal bands */}
        {bands.map((b, i) => (
          <g key={i}>
            <text
              x="16"
              y={b.y}
              fill="#6F6863"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              letterSpacing="0.08em"
            >
              {b.label}
            </text>
            <line
              x1="16"
              y1={b.yLine}
              x2="504"
              y2={b.yLine}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
          </g>
        ))}

        {/* Inactive background connection lines */}
        <g stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 3">
          {/* IT/DMZ mesh */}
          <line x1="75" y1="55" x2="250" y2="65" />
          <line x1="250" y1="65" x2="410" y2="65" />
          <line x1="250" y1="65" x2="150" y2="135" />
          <line x1="250" y1="65" x2="330" y2="135" />
          <line x1="410" y1="65" x2="450" y2="135" />
          <line x1="330" y1="135" x2="380" y2="205" />
          <line x1="150" y1="135" x2="140" y2="275" />
          <line x1="230" y1="205" x2="140" y2="275" />
          <line x1="140" y1="275" x2="95" y2="345" />
          <line x1="380" y1="205" x2="370" y2="345" />
        </g>

        {/* Downstream Physical Consequence Edges */}
        <g stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="4 3">
          <line x1="220" y1="345" x2="175" y2="420" />
          <line x1="220" y1="345" x2="315" y2="420" />
        </g>

        {/* Highlighted active attack path */}
        <g>
          {/* Background glow stroke */}
          <polyline
            points="75,55 150,135 330,135 230,205 220,345"
            fill="none"
            stroke="#FF4D4F"
            strokeWidth="3.5"
            strokeOpacity="0.4"
            filter="url(#red-glow)"
          />
          {/* Dash animated front stroke */}
          <polyline
            points="75,55 150,135 330,135 230,205 220,345"
            fill="none"
            stroke="#FF4D4F"
            strokeWidth="2.5"
            className="animate-attack-dash"
          />
        </g>

        {/* Physical City Services at bottom */}
        <g>
          {/* Water Service */}
          <rect
            x="145"
            y="410"
            width="64"
            height="26"
            rx="5"
            fill="#120D0B"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.2"
          />
          <text
            x="177"
            y="426"
            fill="#FFFFFF"
            fontSize="10.5"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="Manrope, sans-serif"
          >
            Water
          </text>

          {/* Hospital Service */}
          <rect
            x="275"
            y="410"
            width="74"
            height="26"
            rx="5"
            fill="#120D0B"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.2"
          />
          <text
            x="312"
            y="426"
            fill="#FFFFFF"
            fontSize="10.5"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="Manrope, sans-serif"
          >
            Hospital
          </text>
        </g>

        {/* Nodes (Circles + Hexagons) */}
        {/* L4 Nodes */}
        <motion.g variants={itemVariants}>
          {/* Internet Entry */}
          <circle cx="75" cy="55" r="14" fill="#120D0B" stroke="#FF7A2B" strokeWidth="2" />
          <text x="75" y="58" fill="#FF7A2B" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono">
            EXT
          </text>
          <text x="75" y="78" fill="#A09A96" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">
            Internet
          </text>
        </motion.g>

        <motion.g variants={itemVariants}>
          {/* Corp WS */}
          <circle cx="250" cy="65" r="11" fill="#120D0B" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x="250" y="86" fill="#6F6863" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            IT-WS1
          </text>
        </motion.g>

        <motion.g variants={itemVariants}>
          {/* Domain Controller */}
          <circle cx="410" cy="65" r="11" fill="#120D0B" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x="410" y="86" fill="#6F6863" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            DC-01
          </text>
        </motion.g>

        {/* L3.5 DMZ Nodes */}
        <motion.g variants={itemVariants}>
          {/* Vendor VPN */}
          <circle cx="150" cy="135" r="13" fill="#120D0B" stroke="#FF7A2B" strokeWidth="2" />
          <text x="150" y="138" fill="#FF7A2B" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="JetBrains Mono">
            VPN
          </text>
          <text x="150" y="158" fill="#A09A96" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            Vendor VPN
          </text>
        </motion.g>

        <motion.g variants={itemVariants}>
          {/* Historian */}
          <circle cx="330" cy="135" r="12" fill="#120D0B" stroke="#FF7A2B" strokeWidth="1.5" />
          <text x="330" y="157" fill="#A09A96" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            Historian
          </text>
        </motion.g>

        <motion.g variants={itemVariants}>
          {/* DMZ Patch Server */}
          <circle cx="450" cy="135" r="10" fill="#120D0B" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x="450" y="155" fill="#6F6863" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">
            WSUS
          </text>
        </motion.g>

        {/* L3 Operations Nodes */}
        <motion.g variants={itemVariants}>
          {/* Water SCADA */}
          <circle cx="230" cy="205" r="13" fill="#120D0B" stroke="#FF4D4F" strokeWidth="2" />
          <text x="230" y="209" fill="#FF4D4F" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="JetBrains Mono">
            SCADA
          </text>
          <text x="230" y="228" fill="#A09A96" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            Water SCADA
          </text>
        </motion.g>

        <motion.g variants={itemVariants}>
          {/* Power SCADA */}
          <circle cx="380" cy="205" r="11" fill="#120D0B" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x="380" y="226" fill="#6F6863" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            Pwr SCADA
          </text>
        </motion.g>

        {/* L2 Supervisory */}
        <motion.g variants={itemVariants}>
          {/* Water HMI */}
          <circle cx="140" cy="275" r="11" fill="#120D0B" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x="140" y="295" fill="#6F6863" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            Water HMI
          </text>
        </motion.g>

        {/* L1/L0 Control & Physical */}
        <motion.g variants={itemVariants}>
          {/* Substation RTU */}
          <circle cx="370" cy="345" r="11" fill="#120D0B" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x="370" y="367" fill="#6F6863" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            Sub RTU
          </text>
        </motion.g>

        <motion.g variants={itemVariants}>
          {/* Pump PLC (Hexagon) */}
          <polygon
            points={pumpHex}
            fill="#120D0B"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
          />
          <text x="95" y="368" fill="#6F6863" fontSize="8.5" textAnchor="middle" fontFamily="JetBrains Mono">
            Pump PLC
          </text>
        </motion.g>

        {/* Target Chlorine PLC (Hexagon + Red Pulse Halo) */}
        <motion.g variants={itemVariants}>
          {/* Pulsing ring */}
          <circle
            cx="220"
            cy="345"
            r="23"
            fill="none"
            stroke="#FF4D4F"
            strokeWidth="2"
            className="animate-plc-pulse"
          />
          {/* Hexagon Body */}
          <polygon
            points={chlorineHex}
            fill="#120D0B"
            stroke="#FF4D4F"
            strokeWidth="2.5"
            filter="url(#red-glow)"
          />
          <text
            x="220"
            y="348"
            fill="#FF4D4F"
            fontSize="9"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="JetBrains Mono"
          >
            PLC
          </text>
          <text
            x="220"
            y="375"
            fill="#FFFFFF"
            fontSize="9.5"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="Manrope, sans-serif"
          >
            Chlorine PLC
          </text>
        </motion.g>

        {/* Pinned Glass Tooltip Card near Chlorine PLC */}
        <g>
          {/* Pin connector line */}
          <line
            x1="238"
            y1="345"
            x2="256"
            y2="333"
            stroke="#FF4D4F"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          {/* Card background */}
          <rect
            x="256"
            y="316"
            width="244"
            height="34"
            rx="6"
            fill="#120D0B"
            fillOpacity="0.9"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
          {/* Red indicator dot */}
          <circle cx="270" cy="333" r="3.5" fill="#FF4D4F" />
          {/* Tooltip Content */}
          <text
            x="281"
            y="336"
            fontSize="9.5"
            fontFamily="JetBrains Mono, monospace"
          >
            <tspan fill="#FFFFFF" fontWeight="600">Chlorine PLC</tspan>
            <tspan fill="#A09A96"> · </tspan>
            <tspan fill="#FF4D4F" fontWeight="700">risk 87</tspan>
            <tspan fill="#A09A96"> · 4.2 h to impact</tspan>
          </text>
        </g>
      </motion.svg>

      {/* Illustrative caption */}
      <p className="mt-2 text-center text-[10px] text-[#6F6863] font-mono tracking-wider">
        illustrative
      </p>
    </div>
  );
}
