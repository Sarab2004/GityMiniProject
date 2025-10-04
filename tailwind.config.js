/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                bg: '#F7FAFC',
                surface: '#FFFFFF',
                border: '#E5E7EB',
                text: '#111827',
                text2: '#4B5563',
                muted: '#9CA3AF',
                primary: '#3B82F6',
                primaryHover: '#2563EB',
                primarySubtle: '#DBEAFE',
                accent: '#0EA5A4',
                accentHover: '#0C8E8D',
                accentSubtle: '#CCFBF1',
                success: '#16A34A',
                warning: '#F59E0B',
                danger: '#DC2626',
                info: '#0284C7',
                divider: '#EEF2F7',
                focus: '#93C5FD',
            },
            fontFamily: {
                'peyda': ['Peyda', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
            },
            height: {
                'control': '44px',
            },
        },
    },
    plugins: [],
}
