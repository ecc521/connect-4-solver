import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Connect 4 Solver",
  description: "Perfect Connect 4 solver in C++ with WebAssembly and TypeScript bindings for Node.js, browser, and React Native.",
  base: '/connect-4-solver/',
  
  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Solution Books', link: '/solution-books' },
      { text: 'API Reference', link: '/api/base-solver' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Solution Books', link: '/solution-books' },
          { text: 'Memory & Threading', link: '/cache' },
          { text: 'Heuristic Solver', link: '/heuristic-solver' },
        ]
      },
      {
        text: 'Solvers API',
        items: [
          { text: 'BaseConnect4Solver', link: '/api/base-solver' },
          { text: 'NodeConnect4Solver', link: '/api/nodeconnect4solver' },
          { text: 'SyncWasmConnect4Solver', link: '/api/syncwasmconnect4solver' },
          { text: 'WebWorker Solvers', link: '/api/webworker-solvers' },
          { text: 'ReactNativeConnect4Solver', link: '/api/react-native' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ecc521/connect-4-solver' }
    ]
  }
})
