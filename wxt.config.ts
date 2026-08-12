import { defineConfig } from 'wxt'
import type { WxtViteConfig } from 'wxt'
import path from 'path'

import tailwindcss from '@tailwindcss/vite'

const resolve = (dir: string) => path.join(__dirname, dir)

// vite配置
const viteConfig: WxtViteConfig = {
    plugins: [tailwindcss()],
    resolve: {
        alias: {
            '@': resolve('src'),
        }
    }
}

// 浏览器manifest 配置
const manifest = {
    name: 'xtTab',
    description: '极简美观的新标签页效率工具：多引擎搜索与联想、书签管理置顶、标签页分组管理，一站式提升浏览效率',
    permissions: ['tabs', 'storage', 'bookmarks'],
    host_permissions: ['<all_urls>'],
    icons: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '96': 'icon/96.png',
        '128': 'icon/128.png'
    },
    chrome_url_overrides: {
        newtab: "newTab.html"
    },
}

export default defineConfig({
    srcDir: 'src',
    entrypointsDir: 'entries',
    modules: ['@wxt-dev/module-react'],
    vite: () => viteConfig,
    manifest,
    dev: {
        server: {
            port: 3000
        }
    },
    // @ts-ignore
    webExt: {
        chromiumArgs: [
            '--disable-features=DisableLoadExtensionCommandLineSwitch'
        ]
    }
})
