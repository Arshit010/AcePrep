import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const validRouteRegexes = [
    /^\/$/,
    /^\/features\/?$/,
    /^\/about\/?$/,
    /^\/contact\/?$/,
    /^\/privacy\/?$/,
    /^\/privacy-policy\/?$/,
    /^\/login\/?$/,
    /^\/register\/?$/,
    /^\/dashboard\/?$/,
    /^\/start-interview\/?$/,
    /^\/start-video-interview\/?$/,
    /^\/resume-upload\/?$/,
    /^\/interview\/[a-zA-Z0-9_-]+\/?$/,
    /^\/video-interview\/[a-zA-Z0-9_-]+\/?$/,
    /^\/result\/[a-zA-Z0-9_-]+\/?$/,
    /^\/history\/?$/,
    /^\/forgot-password\/?$/,
    /^\/reset-password\/[a-zA-Z0-9_-]+\/?$/,
];

function spa404Plugin() {
    return {
        name: 'vite-plugin-spa-404',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.method !== 'GET') return next();

                const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
                const pathname = url.pathname;

                const isAssetOrApi =
                    pathname.startsWith('/api') ||
                    pathname.startsWith('/@') ||
                    pathname.startsWith('/src/') ||
                    pathname.startsWith('/node_modules/') ||
                    pathname.includes('.') ||
                    (req.headers.accept && !req.headers.accept.includes('text/html'));

                if (!isAssetOrApi) {
                    if (pathname.length > 2048) {
                        res.statusCode = 404;
                        const originalWriteHead = res.writeHead;
                        res.writeHead = function (statusCode, ...args) {
                            return originalWriteHead.call(this, 404, ...args);
                        };
                        return next();
                    }

                    const isValidRoute = validRouteRegexes.some((regex) => regex.test(pathname));
                    if (!isValidRoute) {
                        res.statusCode = 404;
                        const originalWriteHead = res.writeHead;
                        res.writeHead = function (statusCode, ...args) {
                            return originalWriteHead.call(this, 404, ...args);
                        };
                    }
                }

                next();
            });
        }
    };
}

export default defineConfig({
    plugins: [react(), spa404Plugin()],
    server: {
        host: true,
        port: 5173,
        strictPort: true
    }
});
