import { AttributionControl, Map, Marker, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './store-map.css';

setWorkerUrl(workerUrl);

export function createStoreMap(
  container: HTMLElement,
  center: [number, number],
  onReady: () => void,
  onUnavailable: () => void,
): () => void {
  const map = new Map({
    container,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center,
    // MapLibre's 512px tiles use a zoom level one lower than Leaflet's 256px tiles.
    zoom: 16,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    localIdeographFontFamily: 'sans-serif',
    locale: {
      'NavigationControl.ZoomIn': '放大地圖',
      'NavigationControl.ZoomOut': '縮小地圖',
      'Map.Title': 'TreeRing 店家位置地圖',
      'Popup.Close': '關閉店家資訊',
    },
  });

  let marker: Marker | undefined;
  let observer: ResizeObserver | undefined;
  let removed = false;
  const dispose = () => {
    if (removed) return;
    removed = true;
    observer?.disconnect();
    marker?.remove();
    map.remove();
  };

  try {
    map.touchZoomRotate.disableRotation();
    map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
    // The bottom sheet overlaps the map, so credits must stay at the top.
    map.addControl(new AttributionControl({ compact: false }), 'top-right');
    map.once('load', onReady);
    map.on('webglcontextlost', onUnavailable);
    map.on('style.load', () => {
      for (const layer of map.getStyle().layers) {
        if (layer.type === 'fill-extrusion') {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
        if (layer.type === 'fill' && layer['source-layer'] === 'building') {
          map.setLayerZoomRange(layer.id, layer.minzoom ?? 13, 24);
          map.setPaintProperty(layer.id, 'fill-color', '#E9E5DF');
        }
        const field = layer.type === 'symbol' && layer.layout?.['text-field'];
        if (!field || !JSON.stringify(field).includes('"name')) continue;
        // Prefer local names without replacing route numbers or house numbers.
        map.setLayoutProperty(layer.id, 'text-field', [
          'coalesce', ['get', 'name:zh-Hant'], ['get', 'name:zh'], ['get', 'name'], ['get', 'name:latin'],
        ]);
      }
    });

    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'store-map__pin';
    pin.setAttribute('aria-label', '顯示 TreeRing 店家地址');
    pin.innerHTML = `<span class="store-map__pin-circle"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.25 3a.75.75 0 0 0 0 1.5H3v.75a3.75 3.75 0 0 0 1.5 3V21h-1a.75.75 0 0 0 0 1.5h17a.75.75 0 0 0 0-1.5h-1V8.25a3.75 3.75 0 0 0 1.5-3V4.5h.75a.75.75 0 0 0 0-1.5h-19.5ZM7.5 21v-5.25a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21H7.5Zm6-9.75a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1-.75-.75v-3Z" /></svg></span><span class="store-map__pin-tip"></span>`;
    marker = new Marker({ element: pin, anchor: 'bottom' })
      .setLngLat(center)
      .setPopup(new Popup({ offset: 54, className: 'store-map__popup' })
        .setText('TreeRing\n新北市蘆洲區中山一路176號'))
      .addTo(map);

    observer = new ResizeObserver(() => { if (!removed) map.resize(); });
    observer.observe(container);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
