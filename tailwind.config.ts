import type { Config } from "tailwindcss";

export default {
	content: ["./src/**/*.{ts,tsx,html}"],
	darkMode: "class",
	theme: {
		extend: {
			fontFamily: {
				serif: ['"Instrument Serif"', "Georgia", "serif"],
				sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
			},
			colors: {
				sand: {
					50: "#FAFAF7",
					100: "#F5F4F0",
					200: "#E8E6DF",
					300: "#D4D1C7",
					400: "#9C9889",
					500: "#6B6960",
					600: "#4A4840",
					700: "#33322C",
					800: "#222220",
					850: "#1A1A18",
					900: "#141413",
					950: "#0F0F0E",
				},
				honey: {
					50: "#FDF8ED",
					100: "#F9EDCC",
					200: "#F0D894",
					300: "#E5BE58",
					400: "#D4A53C",
					500: "#C49028",
					600: "#A87420",
					700: "#8B5B1C",
					800: "#73491C",
					900: "#603C1C",
				},
				coral: {
					50: "#FEF3F0",
					100: "#FCEAE4",
					400: "#E07050",
					500: "#C45D3E",
					600: "#A84830",
				},
				moss: {
					50: "#F0F7F2",
					100: "#E0F0E5",
					400: "#5BAB72",
					500: "#3D8B5A",
					600: "#2D6B44",
				},
			},
		},
	},
	plugins: [],
} satisfies Config;
