// orbitCam.js - the showcase orbit/inspector camera: COMPLETE control to
// move around an object. It drives the host's existing posed-camera door
// (a `pose(x,y,z,yaw,pitch)` callback) from an orbit state - target point +
// distance + azimuth + elevation - with live mouse orbit, wheel zoom and
// drag pan. Deliberately NON-INVASIVE: no frame-loop surgery, it just calls
// the same pose() the ?shot scout uses, so it composes with any host.
//
// URL params (all optional, fall back to the defaults passed in):
//   cx cy cz   orbit target (the object to inspect)
//   cdist      camera distance from the target
//   cyaw       azimuth, radians (around the vertical)
//   cpitch     elevation, radians (up/down)

/** The camera pose that looks AT `target` from an orbit of `dist` at
 *  azimuth `yaw` and elevation `pitch`. Pure + Node-testable.
 *  Returns { pos:[x,y,z], yaw, pitch } - the camera sits at `pos` and
 *  looks in direction (yaw,pitch), which points exactly at the target. */
export function orbitPose({ cx, cy, cz, dist, yaw, pitch }) {
  const cp = Math.cos(pitch);
  const dir = [Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp]; // camera -> target
  return {
    pos: [cx - dist * dir[0], cy - dist * dir[1], cz - dist * dir[2]],
    yaw,
    pitch,
  };
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Install the orbit camera. `pose(x,y,z,yaw,pitch)` moves the host's
 *  camera; `canvas` (browser) gets the live orbit/zoom/pan handlers;
 *  `defaultTarget` is the [x,y,z] used when no cx/cy/cz is given.
 *  Returns the live orbit state. Node-safe (no canvas = no handlers). */
export function installOrbitCam({ params, pose, canvas = null, defaultTarget = [0, 0, 0] }) {
  const num = (k, d) => {
    const v = params.get ? params.get(k) : null;
    return v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d;
  };
  const state = {
    cx: num('cx', defaultTarget[0]),
    cy: num('cy', defaultTarget[1]),
    cz: num('cz', defaultTarget[2]),
    dist: clamp(num('cdist', 40), 2, 2000),
    yaw: num('cyaw', Math.PI),
    pitch: clamp(num('cpitch', -0.3), -1.55, 1.55),
  };
  const apply = () => {
    const p = orbitPose(state);
    pose(p.pos[0], p.pos[1], p.pos[2], p.yaw, p.pitch);
  };
  apply();

  if (canvas && typeof window !== 'undefined') {
    let drag = null;
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) drag = { kind: 'orbit', x: e.clientX, y: e.clientY };
      else if (e.button === 1 || e.button === 2) drag = { kind: 'pan', x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (drag.kind === 'orbit') {
        state.yaw += dx * 0.008;
        state.pitch = clamp(state.pitch + dy * 0.008, -1.55, 1.55);
      } else {
        // pan: slide the target along the camera's right and world-up
        const right = [Math.cos(state.yaw), 0, -Math.sin(state.yaw)];
        const s = state.dist * 0.0015;
        state.cx += (-dx * right[0]) * s;
        state.cy += dy * s;
        state.cz += (-dx * right[2]) * s;
      }
      apply();
    });
    window.addEventListener('mouseup', () => { drag = null; });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      state.dist = clamp(state.dist * Math.exp(e.deltaY * 0.001), 2, 2000);
      apply();
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    // probe surface (the port's window.__* doctrine)
    window.__orbit = {
      get state() { return { ...state }; },
      set: (o) => { Object.assign(state, o); apply(); },
      apply,
      pose: orbitPose(state),
    };
  }

  // Keep the pose current every frame so a host reset or a slow first
  // frame never leaves the camera on the old framing.
  if (typeof requestAnimationFrame !== 'undefined') {
    (function loop() { apply(); requestAnimationFrame(loop); })();
  }
  return state;
}
