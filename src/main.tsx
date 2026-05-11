import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App.tsx'
import './index.css'
import { setupSafeErrorFiltering, isMapLibreImageDecodeError } from './utils/mapLibreErrorFilter'
// Suppress MapLibre console.error (e.g. tile/image decode in offline mode)
setupSafeErrorFiltering()

// Swallow uncaught "Could not load image / could not be decoded" so they don't pop up when tiles are missing offline
window.addEventListener('error', (event) => {
  if (event.error && isMapLibreImageDecodeError(event.error)) {
    event.preventDefault()
    event.stopPropagation()
    return true
  }
}, true)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>,
)
