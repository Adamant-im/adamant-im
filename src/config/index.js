// Each build bundles exactly one generated network configuration. The Vite mode selects it in
// `vite-config/plugins/networkConfigPlugin.ts`, which rejects unsupported modes before bundling.
export { default } from 'virtual:adamant-network-config'
