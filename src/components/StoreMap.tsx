import { useEffect, useRef, useState } from 'react';
import { loadStoreMap } from '../lib/loadStoreMap';

type StoreMapProps = { position: [number, number] };

export default function StoreMap({ position: [latitude, longitude] }: StoreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let stopped = false;
    let dispose: (() => void) | undefined;
    const unavailable = () => {
      if (stopped) return;
      stopped = true;
      clearTimeout(timeout);
      dispose?.();
      dispose = undefined;
      setStatus('fallback');
    };
    const timeout = setTimeout(unavailable, 15_000);

    // Do not put the vector renderer on the public store/auth startup path.
    void loadStoreMap().then(({ createStoreMap }) => {
      if (stopped) return;
      dispose = createStoreMap(container, [longitude, latitude], () => {
        if (stopped) return;
        clearTimeout(timeout);
        setStatus('ready');
      }, unavailable);
    }).catch(unavailable);

    return () => {
      stopped = true;
      clearTimeout(timeout);
      dispose?.();
    };
  }, [latitude, longitude]);

  const fallbackUrl = 'https://www.openstreetmap.org/export/embed.html?'
    + new URLSearchParams({
      bbox: `${longitude - 0.003},${latitude - 0.0018},${longitude + 0.003},${latitude + 0.0018}`,
      layer: 'mapnik',
      marker: `${latitude},${longitude}`,
    });

  return (
    <div className="relative h-full w-full bg-[#F3F1EA]">
      <div ref={containerRef} className="store-map h-full w-full" aria-label="TreeRing 店家位置地圖" />
      {status === 'loading' && (
        <div role="status" className="absolute inset-0 flex items-center justify-center bg-[#F3F1EA] text-sm text-[#8A8175] pointer-events-none">
          地圖載入中…
        </div>
      )}
      {status === 'fallback' && (
        <div className="absolute inset-0 pb-8">
          <iframe src={fallbackUrl} title="TreeRing 店家位置備援地圖" className="h-full w-full border-0" />
          <p role="status" className="absolute top-2 left-2 rounded bg-white/90 px-2 py-1 text-xs text-[#5C5548]">
            目前顯示備援地圖
          </p>
        </div>
      )}
    </div>
  );
}
