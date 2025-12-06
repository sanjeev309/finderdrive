/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    hover: 'var(--accent-hover)',
                },
                selection: 'var(--selection)',
                border: 'var(--border)',
            },
            keyframes: {
                slideInRight: {
                    'from': { opacity: '0', transform: 'translateX(20px)' },
                    'to': { opacity: '1', transform: 'translateX(0)' },
                }
            },
            animation: {
                slideInRight: 'slideInRight 0.2s cubic-bezier(0, 0, 0.2, 1)',
            }
        },
    },
    plugins: [],
}
