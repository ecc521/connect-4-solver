import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Connect 4 Solver",
  description: "Perfect Connect 4 solver in C++ with a high-performance WebAssembly binary bridge and an object-oriented TypeScript wrapper.",
  base: '/connect-4-solver/',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Memory & Cache', link: '/cache' },
      { text: 'API Reference', link: '/api/standard' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/' },
          { text: 'Solution Books', link: '/solution-books' },
          { text: 'Memory & Caches', link: '/cache' },
          { text: 'WebWorkers (Async)', link: '/web-workers' },
        ]
      },
      {
        text: 'Solvers API',
        items: [
          { text: 'Connect4Solver', link: '/api/standard' },
          { text: 'ThreadedConnect4Solver', link: '/api/threaded' },
          { text: 'HeuristicConnect4Solver', link: '/api/heuristic' },
          { text: 'ReactNativeConnect4Solver', link: '/api/react-native' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ecc521/connect-4-solver' }
    ]
  }
})
