if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('/adamant-im/service-worker.js', { scope: '/adamant-im/' })})}