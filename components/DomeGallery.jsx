/* DomeGallery — from React Bits, adapted for SECANT.
   Key modification: added `onImageClick({ id, src })` prop.
   When provided, clicking a tile calls onImageClick instead of expanding.
   Images can include an `id` field for navigation.                         */

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

const DEFAULTS = { maxVerticalRotationDeg: 5, dragSensitivity: 20, enlargeTransitionMs: 300, segments: 35 };

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const normalizeAngle  = d => ((d % 360) + 360) % 360;
const wrapAngleSigned = deg => { const a = (((deg + 180) % 360) + 360) % 360; return a - 180; };
const getDataNumber   = (el, name, fallback) => { const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`); const n = attr == null ? NaN : parseFloat(attr); return Number.isFinite(n) ? n : fallback; };

function buildItems(pool, seg) {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4,-2,0,2,4], oddYs = [-3,-1,1,3,5];
  const coords = xCols.flatMap((x, c) => { const ys = c % 2 === 0 ? evenYs : oddYs; return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 })); });
  const totalSlots = coords.length;
  if (pool.length === 0) return coords.map(c => ({ ...c, src: '', alt: '', id: '' }));
  const normalized = pool.map(img => typeof img === 'string' ? { src: img, alt: '', id: '' } : { src: img.src || '', alt: img.alt || '', id: img.id || '' });
  const used = Array.from({ length: totalSlots }, (_, i) => normalized[i % normalized.length]);
  for (let i = 1; i < used.length; i++) {
    if (used[i].src === used[i-1].src) {
      for (let j = i+1; j < used.length; j++) { if (used[j].src !== used[i].src) { const t = used[i]; used[i] = used[j]; used[j] = t; break; } }
    }
  }
  return coords.map((c, i) => ({ ...c, src: used[i].src, alt: used[i].alt, id: used[i].id }));
}

function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
  const unit = 360 / segments / 2;
  return { rotateX: unit * (offsetY - (sizeY - 1) / 2), rotateY: unit * (offsetX + (sizeX - 1) / 2) };
}

export default function DomeGallery({
  images = [],
  onImageClick,           /* NEW: ({id,src}) => void — overrides the enlarge behaviour */
  fit = 0.5, fitBasis = 'auto', minRadius = 600, maxRadius = Infinity,
  padFactor = 0.25, overlayBlurColor = '#120F17',
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments, dragDampening = 2,
  openedImageWidth = '250px', openedImageHeight = '350px',
  imageBorderRadius = '30px', openedImageBorderRadius = '30px',
  grayscale = true
}) {
  const rootRef    = useRef(null), mainRef  = useRef(null), sphereRef = useRef(null);
  const frameRef   = useRef(null), viewerRef = useRef(null), scrimRef  = useRef(null);
  const focusedElRef = useRef(null), originalTilePositionRef = useRef(null);
  const rotationRef = useRef({ x: 0, y: 0 }), startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef(null), draggingRef = useRef(false), movedRef = useRef(false);
  const inertiaRAF = useRef(null), openingRef = useRef(false), openStartedAtRef = useRef(0), lastDragEndAt = useRef(0);
  const scrollLockedRef = useRef(false);

  const lockScroll   = useCallback(() => { if (scrollLockedRef.current) return; scrollLockedRef.current = true;  document.body.classList.add('dg-scroll-lock'); }, []);
  const unlockScroll = useCallback(() => { if (!scrollLockedRef.current) return; if (rootRef.current?.getAttribute('data-enlarging') === 'true') return; scrollLockedRef.current = false; document.body.classList.remove('dg-scroll-lock'); }, []);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const applyTransform = (xDeg, yDeg) => {
    const el = sphereRef.current;
    if (el) el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
  };
  const lockedRadiusRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width), h = Math.max(1, cr.height);
      const minD = Math.min(w, h), maxD = Math.max(w, h), asp = w / h;
      let basis;
      switch (fitBasis) {
        case 'min': basis = minD; break; case 'max': basis = maxD; break;
        case 'width': basis = w; break; case 'height': basis = h; break;
        default: basis = asp >= 1.3 ? w : minD;
      }
      let radius = Math.min(basis * fit, h * 1.35);
      radius = clamp(radius, minRadius, maxRadius);
      lockedRadiusRef.current = Math.round(radius);
      const vPad = Math.max(8, Math.round(minD * padFactor));
      root.style.setProperty('--radius', `${lockedRadiusRef.current}px`);
      root.style.setProperty('--viewer-pad', `${vPad}px`);
      root.style.setProperty('--overlay-blur-color', overlayBlurColor);
      root.style.setProperty('--tile-radius', imageBorderRadius);
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius, openedImageWidth, openedImageHeight]);

  useEffect(() => { applyTransform(rotationRef.current.x, rotationRef.current.y); }, []);

  const stopInertia  = useCallback(() => { if (inertiaRAF.current) { cancelAnimationFrame(inertiaRAF.current); inertiaRAF.current = null; } }, []);
  const startInertia = useCallback((vx, vy) => {
    const MAX_V = 1.4;
    let vX = clamp(vx, -MAX_V, MAX_V) * 80, vY = clamp(vy, -MAX_V, MAX_V) * 80, frames = 0;
    const d = clamp(dragDampening ?? 0.6, 0, 1);
    const fri = 0.94 + 0.055 * d, thr = 0.015 - 0.01 * d, max = Math.round(90 + 270 * d);
    const step = () => {
      vX *= fri; vY *= fri;
      if (Math.abs(vX) < thr && Math.abs(vY) < thr) { inertiaRAF.current = null; return; }
      if (++frames > max) { inertiaRAF.current = null; return; }
      const nX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
      const nY = wrapAngleSigned(rotationRef.current.y + vX / 200);
      rotationRef.current = { x: nX, y: nY }; applyTransform(nX, nY);
      inertiaRAF.current = requestAnimationFrame(step);
    };
    stopInertia(); inertiaRAF.current = requestAnimationFrame(step);
  }, [dragDampening, maxVerticalRotationDeg, stopInertia]);

  useGesture({
    onDragStart: ({ event }) => {
      if (focusedElRef.current) return; stopInertia(); const evt = event;
      draggingRef.current = true; movedRef.current = false;
      startRotRef.current = { ...rotationRef.current };
      startPosRef.current = { x: evt.clientX, y: evt.clientY };
    },
    onDrag: ({ event, last, velocity = [0,0], direction = [0,0], movement }) => {
      if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;
      const evt = event;
      const dxT = evt.clientX - startPosRef.current.x, dyT = evt.clientY - startPosRef.current.y;
      if (!movedRef.current && dxT*dxT + dyT*dyT > 16) movedRef.current = true;
      const nX = clamp(startRotRef.current.x - dyT / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
      const nY = wrapAngleSigned(startRotRef.current.y + dxT / dragSensitivity);
      if (rotationRef.current.x !== nX || rotationRef.current.y !== nY) { rotationRef.current = { x: nX, y: nY }; applyTransform(nX, nY); }
      if (last) {
        draggingRef.current = false;
        let [vMX, vMY] = velocity; const [dX, dY] = direction;
        let vx = vMX * dX, vy = vMY * dY;
        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) { const [mx, my] = movement; vx = clamp((mx/dragSensitivity)*0.02,-1.2,1.2); vy = clamp((my/dragSensitivity)*0.02,-1.2,1.2); }
        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
        if (movedRef.current) lastDragEndAt.current = performance.now();
        movedRef.current = false;
      }
    }
  }, { target: mainRef, eventOptions: { passive: true } });

  /* ── Default enlarge behaviour (used when onImageClick is NOT set) ── */
  const openItemFromElement = useCallback(el => {
    if (openingRef.current) return; openingRef.current = true;
    openStartedAtRef.current = performance.now(); lockScroll();
    const parent = el.parentElement; focusedElRef.current = el; el.setAttribute('data-focused','true');
    const offsetX = getDataNumber(parent,'offsetX',0), offsetY = getDataNumber(parent,'offsetY',0);
    const sizeX   = getDataNumber(parent,'sizeX',2),  sizeY   = getDataNumber(parent,'sizeY',2);
    const pRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
    const pY = normalizeAngle(pRot.rotateY), gY = normalizeAngle(rotationRef.current.y);
    let rotY = -(pY + gY) % 360; if (rotY < -180) rotY += 360;
    const rotX = -pRot.rotateX - rotationRef.current.x;
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);
    const refDiv = document.createElement('div');
    refDiv.className = 'item__image item__image--reference'; refDiv.style.opacity = '0';
    refDiv.style.transform = `rotateX(${-pRot.rotateX}deg) rotateY(${-pRot.rotateY}deg)`;
    parent.appendChild(refDiv); void refDiv.offsetHeight;
    const tileR = refDiv.getBoundingClientRect(), mainR = mainRef.current?.getBoundingClientRect(), frameR = frameRef.current?.getBoundingClientRect();
    if (!mainR || !frameR || tileR.width <= 0) { openingRef.current = false; focusedElRef.current = null; parent.removeChild(refDiv); unlockScroll(); return; }
    originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
    el.style.visibility = 'hidden'; el.style.zIndex = 0;
    const overlay = document.createElement('div');
    overlay.className = 'enlarge'; overlay.style.cssText = `position:absolute;left:${frameR.left-mainR.left}px;top:${frameR.top-mainR.top}px;width:${frameR.width}px;height:${frameR.height}px;opacity:0;z-index:30;will-change:transform,opacity;transform-origin:top left;transition:transform ${enlargeTransitionMs}ms ease,opacity ${enlargeTransitionMs}ms ease;`;
    const rawSrc = parent.dataset.src || el.querySelector('img')?.src || '';
    const img = document.createElement('img'); img.src = rawSrc; overlay.appendChild(img);
    viewerRef.current.appendChild(overlay);
    const tx0 = tileR.left - frameR.left, ty0 = tileR.top - frameR.top;
    const sx0 = isFinite(tileR.width/frameR.width) && tileR.width/frameR.width > 0 ? tileR.width/frameR.width : 1;
    const sy0 = isFinite(tileR.height/frameR.height) && tileR.height/frameR.height > 0 ? tileR.height/frameR.height : 1;
    overlay.style.transform = `translate(${tx0}px,${ty0}px) scale(${sx0},${sy0})`;
    setTimeout(() => { if (!overlay.parentElement) return; overlay.style.opacity = '1'; overlay.style.transform = 'translate(0,0) scale(1,1)'; rootRef.current?.setAttribute('data-enlarging','true'); }, 16);
  }, [enlargeTransitionMs, lockScroll, segments, unlockScroll]);

  useEffect(() => {
    const scrim = scrimRef.current; if (!scrim) return;
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current; if (!el) return;
      const parent = el.parentElement;
      const overlay = viewerRef.current?.querySelector('.enlarge'); if (!overlay) return;
      const refDiv = parent.querySelector('.item__image--reference');
      overlay.remove(); if (refDiv) refDiv.remove();
      parent.style.setProperty('--rot-y-delta','0deg'); parent.style.setProperty('--rot-x-delta','0deg');
      el.style.visibility = ''; el.style.zIndex = 0;
      focusedElRef.current = null; rootRef.current?.removeAttribute('data-enlarging');
      openingRef.current = false; unlockScroll();
      originalTilePositionRef.current = null;
    };
    scrim.addEventListener('click', close);
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { scrim.removeEventListener('click', close); window.removeEventListener('keydown', onKey); };
  }, [unlockScroll]);

  const onTileClick = useCallback(e => {
    if (draggingRef.current || movedRef.current) return;
    if (performance.now() - lastDragEndAt.current < 80) return;
    if (openingRef.current) return;
    /* If caller provided onImageClick, navigate; otherwise enlarge in-place */
    if (onImageClick) {
      const parent = e.currentTarget.parentElement;
      const id  = parent?.dataset?.itemId || '';
      const src = parent?.dataset?.src    || '';
      onImageClick({ id, src });
      return;
    }
    openItemFromElement(e.currentTarget);
  }, [openItemFromElement, onImageClick]);

  const onTilePointerUp = useCallback(e => {
    if (e.pointerType !== 'touch') return;
    if (draggingRef.current || movedRef.current) return;
    if (performance.now() - lastDragEndAt.current < 80) return;
    if (openingRef.current) return;
    if (onImageClick) {
      const parent = e.currentTarget.parentElement;
      const id  = parent?.dataset?.itemId || '';
      const src = parent?.dataset?.src    || '';
      onImageClick({ id, src });
      return;
    }
    openItemFromElement(e.currentTarget);
  }, [openItemFromElement, onImageClick]);

  useEffect(() => () => { document.body.classList.remove('dg-scroll-lock'); }, []);

  return (
    <div ref={rootRef} className="sphere-root"
      style={{ '--segments-x': segments, '--segments-y': segments, '--overlay-blur-color': overlayBlurColor, '--tile-radius': imageBorderRadius, '--enlarge-radius': openedImageBorderRadius, '--image-filter': grayscale ? 'grayscale(1)' : 'none' }}
    >
      <main ref={mainRef} className="sphere-main">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div key={`${it.x},${it.y},${i}`} className="item"
                data-src={it.src} data-item-id={it.id}
                data-offset-x={it.x} data-offset-y={it.y} data-size-x={it.sizeX} data-size-y={it.sizeY}
                style={{ '--offset-x': it.x, '--offset-y': it.y, '--item-size-x': it.sizeX, '--item-size-y': it.sizeY }}
              >
                <div className="item__image" role="button" tabIndex={0} aria-label={it.alt || 'Open image'}
                  onClick={onTileClick} onPointerUp={onTilePointerUp}
                >
                  <img src={it.src} draggable={false} alt={it.alt} />
                  {/* Render / sketch name label */}
                  {it.alt && (
                    <div className="item__label"><span>{it.alt}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="overlay" /><div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" /><div className="edge-fade edge-fade--bottom" />
        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>
    </div>
  );
}
