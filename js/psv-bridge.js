import { Viewer, EquirectangularAdapter } from '../vendor/photo-sphere-viewer-core.module.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const DEFAULT_AUTOROTATE_SPEED_DEG = 2.4;
const DEFAULT_AUTOROTATE_IDLE_DELAY = 1800;

const state = {
  instances: new Map(),
  activeKey: null,
  gyroscopeEnabled: false,
  gyroPermissionGranted: false,
  orientationBound: false,
  baseAlpha: null,
  baseBeta: null,
  baseAlphaUnwrapped: null,
  smoothAlpha: null,
  smoothAlphaUnwrapped: null,
  rawAlphaUnwrapped: null,
  smoothBeta: null,
  currentYawDeg: 0,
  currentYawDegUnwrapped: 0,
  currentPitchDeg: 0,
  motionAnchorYawDeg: 0,
  motionAnchorPitchDeg: 0,
  stillFrames: 0,
  lastAlpha: null,
  lastBeta: null,
  lastOrientationTs: 0,
  lastAppliedAlphaUnwrapped: null,
  samples: [],
};

function shortestAngleDelta(current, base) {
  let delta = current - base;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function circularMean(values) {
  if (!values.length) return 0;
  const total = values.reduce((acc, value) => {
    const radians = (value * Math.PI) / 180;
    acc.sin += Math.sin(radians);
    acc.cos += Math.cos(radians);
    return acc;
  }, { sin: 0, cos: 0 });
  let degrees = (Math.atan2(total.sin / values.length, total.cos / values.length) * 180) / Math.PI;
  if (degrees < 0) degrees += 360;
  return degrees;
}

function circularLerp(from, to, amount) {
  return (from + (shortestAngleDelta(to, from) * amount) + 360) % 360;
}

function normalizeDeg360(value) {
  let next = value;
  while (next < 0) next += 360;
  while (next >= 360) next -= 360;
  return next;
}

function getContainerKey(container) {
  if (!container) throw new Error('PSV container missing');
  if (!container.dataset.psvKey) {
    container.dataset.psvKey = `psv-${Math.random().toString(36).slice(2, 10)}`;
  }
  return container.dataset.psvKey;
}

function getHost(container) {
  let host = container.querySelector(':scope > .immersion-psv-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'immersion-psv-host';
    container.prepend(host);
  }
  container.dataset.psvActive = 'true';
  return host;
}

function buildScene(scene) {
  return {
    src: scene.src,
    yaw: scene.yaw || '0deg',
    pitch: scene.pitch || '0deg',
    zoom: Number.isFinite(scene.zoom) ? scene.zoom : 52,
    autorotate: scene.autorotate === true,
    autorotateSpeed: Number.isFinite(scene.autorotateSpeed) ? scene.autorotateSpeed : DEFAULT_AUTOROTATE_SPEED_DEG,
    autorotateIdleDelay: Number.isFinite(scene.autorotateIdleDelay) ? scene.autorotateIdleDelay : DEFAULT_AUTOROTATE_IDLE_DELAY,
  };
}

function parseDeg(value) {
  return Number.parseFloat(String(value || '0').replace('deg', '')) || 0;
}

function getInstance(container) {
  const key = getContainerKey(container);
  return state.instances.get(key) || null;
}

function storeInstance(container, instance) {
  state.instances.set(getContainerKey(container), instance);
  return instance;
}

function setActiveContainer(container) {
  state.activeKey = container ? getContainerKey(container) : null;
}

function getActiveInstance(container = null) {
  if (container) return getInstance(container);
  if (!state.activeKey) return null;
  return state.instances.get(state.activeKey) || null;
}

function createViewer(container, scene) {
  const host = getHost(container);
  const currentScene = buildScene(scene);
  const viewerOptions = {
    container: host,
    panorama: currentScene.src,
    adapter: [EquirectangularAdapter, {
      useXmpData: true,
      resolution: 64,
    }],
    defaultYaw: currentScene.yaw,
    defaultPitch: currentScene.pitch,
    defaultZoomLvl: currentScene.zoom,
    navbar: false,
    mousewheel: true,
    mousewheelCtrlKey: false,
    touchmoveTwoFingers: false,
    moveInertia: true,
    loadingImg: null,
    lang: {
      zoom: 'Zoom',
      move: 'Déplacer',
      download: 'Télécharger',
      fullscreen: 'Plein écran',
    },
  };

  let viewer;
  try {
    viewer = new Viewer(viewerOptions);
  } catch (error) {
    console.warn('[locpilot][psv] configured adapter failed, retrying with default adapter', error);
    viewer = new Viewer({
      ...viewerOptions,
      adapter: EquirectangularAdapter,
    });
  }

  const instance = {
    container,
    host,
    viewer,
    currentScene,
    sceneYawDeg: parseDeg(currentScene.yaw),
    scenePitchDeg: parseDeg(currentScene.pitch),
    autorotateEnabled: currentScene.autorotate === true,
    autorotateSpeedDeg: Number.isFinite(currentScene.autorotateSpeed) ? currentScene.autorotateSpeed : DEFAULT_AUTOROTATE_SPEED_DEG,
    autorotateIdleDelay: Number.isFinite(currentScene.autorotateIdleDelay) ? currentScene.autorotateIdleDelay : DEFAULT_AUTOROTATE_IDLE_DELAY,
    autorotateActive: false,
    autorotateRaf: null,
    autorotateResumeTimer: null,
    autorotateLastTs: null,
    autorotateBound: false,
    autorotatePauseHandler: null,
  };
  storeInstance(container, instance);
  applyAutorotateConfig(instance);
  setActiveContainer(container);
  return instance;
}

async function setScene(instance, scene) {
  instance.currentScene = buildScene(scene);
  instance.sceneYawDeg = parseDeg(instance.currentScene.yaw);
  instance.scenePitchDeg = parseDeg(instance.currentScene.pitch);

  await instance.viewer.setPanorama(instance.currentScene.src, {
    position: {
      yaw: instance.currentScene.yaw,
      pitch: instance.currentScene.pitch,
    },
    zoom: instance.currentScene.zoom,
    transition: false,
    showLoader: true,
  });

  instance.viewer.rotate({ yaw: instance.currentScene.yaw, pitch: instance.currentScene.pitch });
  instance.viewer.zoom(instance.currentScene.zoom);
  applyAutorotateConfig(instance);
  requestAnimationFrame(() => instance.viewer?.autoSize());
}

function clearAutorotateTimer(instance) {
  if (instance?.autorotateResumeTimer) {
    window.clearTimeout(instance.autorotateResumeTimer);
    instance.autorotateResumeTimer = null;
  }
}

function stopAutorotate(instance, { keepResume = false } = {}) {
  if (!instance) return;
  instance.autorotateActive = false;
  instance.autorotateLastTs = null;
  if (instance.autorotateRaf) {
    cancelAnimationFrame(instance.autorotateRaf);
    instance.autorotateRaf = null;
  }
  if (!keepResume) clearAutorotateTimer(instance);
}

function runAutorotate(instance, timestamp) {
  if (!instance?.autorotateEnabled || !instance.viewer || !instance.autorotateActive) return;

  if (document.hidden) {
    instance.autorotateRaf = window.requestAnimationFrame((nextTimestamp) => runAutorotate(instance, nextTimestamp));
    return;
  }

  if (instance.autorotateLastTs == null) {
    instance.autorotateLastTs = timestamp;
  }

  const elapsed = Math.min(64, Math.max(0, timestamp - instance.autorotateLastTs));
  instance.autorotateLastTs = timestamp;

  const currentPosition = instance.viewer.getPosition?.();
  if (currentPosition) {
    const yawStep = (instance.autorotateSpeedDeg * Math.PI / 180) * (elapsed / 1000);
    instance.viewer.rotate({
      yaw: currentPosition.yaw + yawStep,
      pitch: currentPosition.pitch,
    });
  }

  instance.autorotateRaf = window.requestAnimationFrame((nextTimestamp) => runAutorotate(instance, nextTimestamp));
}

function startAutorotate(instance) {
  if (!instance?.autorotateEnabled || !instance.viewer || instance.autorotateActive) return;
  clearAutorotateTimer(instance);
  instance.autorotateActive = true;
  instance.autorotateLastTs = null;
  instance.autorotateRaf = window.requestAnimationFrame((timestamp) => runAutorotate(instance, timestamp));
}

function scheduleAutorotate(instance, delay = instance?.autorotateIdleDelay || DEFAULT_AUTOROTATE_IDLE_DELAY) {
  if (!instance?.autorotateEnabled) return;
  clearAutorotateTimer(instance);
  instance.autorotateResumeTimer = window.setTimeout(() => {
    startAutorotate(instance);
  }, delay);
}

function pauseAutorotate(instance, { shouldResume = true } = {}) {
  stopAutorotate(instance, { keepResume: shouldResume });
  if (shouldResume) scheduleAutorotate(instance);
}

function bindAutorotateInteraction(instance) {
  if (!instance?.host || instance.autorotateBound === true) return;

  const pauseHandler = () => pauseAutorotate(instance, { shouldResume: true });
  instance.autorotatePauseHandler = pauseHandler;

  ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'touchmove'].forEach((eventName) => {
    instance.host.addEventListener(eventName, pauseHandler, { passive: true });
  });

  instance.autorotateBound = true;
}

function unbindAutorotateInteraction(instance) {
  if (!instance?.host || instance.autorotateBound !== true || !instance.autorotatePauseHandler) return;

  ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'touchmove'].forEach((eventName) => {
    instance.host.removeEventListener(eventName, instance.autorotatePauseHandler, { passive: true });
  });

  instance.autorotateBound = false;
  instance.autorotatePauseHandler = null;
}

function applyAutorotateConfig(instance) {
  if (!instance?.currentScene) return;

  instance.autorotateEnabled = instance.currentScene.autorotate === true;
  instance.autorotateSpeedDeg = Number.isFinite(instance.currentScene.autorotateSpeed)
    ? instance.currentScene.autorotateSpeed
    : DEFAULT_AUTOROTATE_SPEED_DEG;
  instance.autorotateIdleDelay = Number.isFinite(instance.currentScene.autorotateIdleDelay)
    ? instance.currentScene.autorotateIdleDelay
    : DEFAULT_AUTOROTATE_IDLE_DELAY;

  if (instance.autorotateEnabled) {
    bindAutorotateInteraction(instance);
    scheduleAutorotate(instance, 900);
    return;
  }

  stopAutorotate(instance);
  unbindAutorotateInteraction(instance);
}

function resetViewForInstance(instance) {
  if (!instance?.viewer || !instance.currentScene) return;
  instance.viewer.rotate({ yaw: instance.currentScene.yaw, pitch: instance.currentScene.pitch });
  instance.viewer.zoom(instance.currentScene.zoom);
  if (getContainerKey(instance.container) === state.activeKey) {
    resetGyroscopeCalibration();
    state.currentYawDeg = instance.sceneYawDeg;
    state.currentYawDegUnwrapped = instance.sceneYawDeg;
    state.currentPitchDeg = instance.scenePitchDeg;
    state.motionAnchorYawDeg = instance.sceneYawDeg;
    state.motionAnchorPitchDeg = instance.scenePitchDeg;
  }
  if (instance.autorotateEnabled) scheduleAutorotate(instance, 900);
}

function resetGyroscopeCalibration() {
  state.baseAlpha = null;
  state.baseBeta = null;
  state.baseAlphaUnwrapped = null;
  state.smoothAlpha = null;
  state.smoothAlphaUnwrapped = null;
  state.rawAlphaUnwrapped = null;
  state.smoothBeta = null;
  state.currentYawDeg = 0;
  state.currentYawDegUnwrapped = 0;
  state.currentPitchDeg = 0;
  state.motionAnchorYawDeg = 0;
  state.motionAnchorPitchDeg = 0;
  state.stillFrames = 0;
  state.lastAlpha = null;
  state.lastBeta = null;
  state.lastOrientationTs = 0;
  state.lastAppliedAlphaUnwrapped = null;
  state.samples = [];
}

function handleDeviceOrientation(event) {
  if (!state.gyroscopeEnabled) return;
  const instance = getActiveInstance();
  if (!instance?.viewer || !instance.currentScene) return;

  const { alpha, beta } = event;
  if (typeof alpha !== 'number' || typeof beta !== 'number') return;

  const now = typeof event.timeStamp === 'number' ? event.timeStamp : performance.now();
  const elapsed = state.lastOrientationTs ? Math.max(0, now - state.lastOrientationTs) : 16;
  state.lastOrientationTs = now;

  if (state.baseAlpha == null || state.baseBeta == null) {
    state.samples.push({ alpha, beta });
    if (state.samples.length > 18) state.samples.shift();
    if (state.samples.length < 10) return;

    state.baseAlpha = circularMean(state.samples.map((sample) => sample.alpha));
    state.baseBeta = state.samples.reduce((sum, sample) => sum + sample.beta, 0) / state.samples.length;
    state.baseAlphaUnwrapped = state.baseAlpha;
    state.smoothAlpha = state.baseAlpha;
    state.smoothAlphaUnwrapped = state.baseAlpha;
    state.rawAlphaUnwrapped = state.baseAlpha;
    state.smoothBeta = state.baseBeta;
    state.currentYawDeg = instance.sceneYawDeg;
    state.currentYawDegUnwrapped = instance.sceneYawDeg;
    state.currentPitchDeg = instance.scenePitchDeg;
    state.motionAnchorYawDeg = state.currentYawDeg;
    state.motionAnchorPitchDeg = state.currentPitchDeg;
    state.lastAppliedAlphaUnwrapped = state.smoothAlphaUnwrapped;
    state.lastAlpha = alpha;
    state.lastBeta = beta;
    state.stillFrames = 0;
    return;
  }

  const previousAlpha = state.lastAlpha;
  const previousBeta = state.lastBeta;

  if (previousAlpha != null && elapsed < 120) {
    const rawYawJump = Math.abs(shortestAngleDelta(alpha, previousAlpha));
    const rawPitchJump = Math.abs(beta - (previousBeta ?? beta));
    if (rawYawJump > 28 || rawPitchJump > 20) {
      state.lastAlpha = alpha;
      state.lastBeta = beta;
      return;
    }
  }
  state.lastAlpha = alpha;
  state.lastBeta = beta;

  if (state.smoothAlpha == null) state.smoothAlpha = alpha;
  if (state.smoothAlphaUnwrapped == null) state.smoothAlphaUnwrapped = state.baseAlphaUnwrapped ?? alpha;
  if (state.rawAlphaUnwrapped == null) state.rawAlphaUnwrapped = state.smoothAlphaUnwrapped;
  if (state.smoothBeta == null) state.smoothBeta = beta;

  const smoothing = elapsed > 45 ? 0.09 : 0.07;
  const rawAlphaStep = shortestAngleDelta(alpha, previousAlpha ?? alpha);
  state.rawAlphaUnwrapped += rawAlphaStep;
  state.smoothAlphaUnwrapped += (state.rawAlphaUnwrapped - state.smoothAlphaUnwrapped) * smoothing;
  state.smoothAlpha = normalizeDeg360(state.smoothAlphaUnwrapped);
  state.smoothBeta += (beta - state.smoothBeta) * smoothing;

  const yawDelta = state.smoothAlphaUnwrapped - (state.baseAlphaUnwrapped ?? state.smoothAlphaUnwrapped);
  const pitchDelta = state.smoothBeta - state.baseBeta;

  const yawDeadZone = 2.8;
  const pitchDeadZone = 2.2;
  const yawStillZone = 3.6;
  const pitchStillZone = 2.8;

  const isYawStill = Math.abs(yawDelta) <= yawStillZone;
  const isPitchStill = Math.abs(pitchDelta) <= pitchStillZone;
  const isStill = isYawStill && isPitchStill;

  if (isStill) {
    state.stillFrames += 1;

    if (state.stillFrames > 4) {
      state.baseAlphaUnwrapped = (state.baseAlphaUnwrapped ?? state.smoothAlphaUnwrapped) + ((state.smoothAlphaUnwrapped - (state.baseAlphaUnwrapped ?? state.smoothAlphaUnwrapped)) * 0.035);
      state.baseAlpha = normalizeDeg360(state.baseAlphaUnwrapped);
      state.baseBeta += (state.smoothBeta - state.baseBeta) * 0.035;
      state.motionAnchorYawDeg = state.currentYawDeg;
      state.motionAnchorPitchDeg = state.currentPitchDeg;
    }

    state.lastAppliedAlphaUnwrapped = state.smoothAlphaUnwrapped;
    return;
  }

  state.stillFrames = 0;

  const activeYaw = Math.abs(yawDelta) <= yawDeadZone
    ? 0
    : yawDelta - (Math.sign(yawDelta) * yawDeadZone);
  const activePitch = Math.abs(pitchDelta) <= pitchDeadZone
    ? 0
    : pitchDelta - (Math.sign(pitchDelta) * pitchDeadZone);

  if (state.lastAppliedAlphaUnwrapped == null) {
    state.lastAppliedAlphaUnwrapped = state.smoothAlphaUnwrapped;
  }

  const rawYawStep = state.smoothAlphaUnwrapped - state.lastAppliedAlphaUnwrapped;
  state.lastAppliedAlphaUnwrapped = state.smoothAlphaUnwrapped;

  const yawStepDeadZone = 0.08;
  const normalizedYawStep = Math.abs(rawYawStep) <= yawStepDeadZone
    ? 0
    : rawYawStep - (Math.sign(rawYawStep) * yawStepDeadZone);
  const clampedYawStep = clamp(normalizedYawStep, -8, 8);
  const yawGain = elapsed > 45 ? 0.64 : 0.7;

  state.currentYawDegUnwrapped += clampedYawStep * yawGain;
  state.currentYawDeg = normalizeDeg360(state.currentYawDegUnwrapped);

  const pitchAnchor = Number.isFinite(state.motionAnchorPitchDeg) ? state.motionAnchorPitchDeg : instance.scenePitchDeg;
  const targetPitch = clamp(pitchAnchor + (activePitch * 0.28), -55, 55);
  state.currentPitchDeg += (targetPitch - state.currentPitchDeg) * 0.1;

  instance.viewer.rotate({
    yaw: `${state.currentYawDeg.toFixed(2)}deg`,
    pitch: `${state.currentPitchDeg.toFixed(2)}deg`,
  });
}

function ensureOrientationBinding() {
  if (state.orientationBound) return;
  window.addEventListener('deviceorientation', handleDeviceOrientation, true);
  state.orientationBound = true;
}

async function requestGyroscopePermission() {
  if (!window.DeviceOrientationEvent) {
    throw new Error('no-device-orientation');
  }
  if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
    const response = await window.DeviceOrientationEvent.requestPermission();
    if (response !== 'granted') {
      throw new Error('permission-denied');
    }
  }
  state.gyroPermissionGranted = true;
}

function autoSizeAll() {
  state.instances.forEach((instance) => instance.viewer?.autoSize?.());
}

const api = {
  isReady() {
    return true;
  },
  async open({ container, src, yaw = '0deg', pitch = '0deg', zoom = 52, autorotate = false, autorotateSpeed = DEFAULT_AUTOROTATE_SPEED_DEG, autorotateIdleDelay = DEFAULT_AUTOROTATE_IDLE_DELAY }) {
    const scene = { src, yaw, pitch, zoom, autorotate, autorotateSpeed, autorotateIdleDelay };
    let instance = getInstance(container);
    if (!instance) {
      instance = createViewer(container, scene);
      requestAnimationFrame(() => instance.viewer?.autoSize());
      return;
    }
    setActiveContainer(container);
    if (instance.currentScene?.src === src
      && instance.currentScene?.yaw === yaw
      && instance.currentScene?.pitch === pitch
      && instance.currentScene?.zoom === zoom) {
      resetViewForInstance(instance);
      requestAnimationFrame(() => instance.viewer?.autoSize());
      return;
    }
    await setScene(instance, scene);
  },
  resize(container = null) {
    if (container) {
      getInstance(container)?.viewer?.autoSize?.();
      return;
    }
    autoSizeAll();
  },
  zoomIn(step = 10, container = null) {
    getActiveInstance(container)?.viewer?.zoomIn?.(step);
  },
  zoomOut(step = 10, container = null) {
    getActiveInstance(container)?.viewer?.zoomOut?.(step);
  },
  resetView(container = null) {
    resetViewForInstance(getActiveInstance(container));
  },
  async toggleGyroscope(container = null) {
    const instance = getActiveInstance(container);
    if (!instance) throw new Error('no-active-viewer');
    setActiveContainer(instance.container);
    if (state.gyroscopeEnabled) {
      state.gyroscopeEnabled = false;
      return false;
    }
    await requestGyroscopePermission();
    ensureOrientationBinding();
    resetGyroscopeCalibration();
    state.currentYawDeg = instance.sceneYawDeg;
    state.currentYawDegUnwrapped = instance.sceneYawDeg;
    state.currentPitchDeg = instance.scenePitchDeg;
    state.motionAnchorYawDeg = instance.sceneYawDeg;
    state.motionAnchorPitchDeg = instance.scenePitchDeg;
    state.lastAppliedAlphaUnwrapped = null;
    state.gyroscopeEnabled = true;
    return true;
  },
  isGyroscopeEnabled() {
    return state.gyroscopeEnabled;
  },
  disableGyroscope() {
    state.gyroscopeEnabled = false;
    resetGyroscopeCalibration();
  },
  destroy(container = null) {
    if (!container) {
      state.instances.forEach((instance) => {
        stopAutorotate(instance);
        unbindAutorotateInteraction(instance);
        instance.viewer?.destroy?.();
        instance.host?.remove?.();
        delete instance.container?.dataset?.psvActive;
      });
      state.instances.clear();
      state.activeKey = null;
      state.gyroscopeEnabled = false;
      return;
    }

    const key = getContainerKey(container);
    const instance = state.instances.get(key);
    if (!instance) return;
    stopAutorotate(instance);
    unbindAutorotateInteraction(instance);
    instance.viewer?.destroy?.();
    instance.host?.remove?.();
    delete container.dataset.psvActive;
    state.instances.delete(key);
    if (state.activeKey === key) {
      state.activeKey = null;
      state.gyroscopeEnabled = false;
      resetGyroscopeCalibration();
    }
  },
};

window.LocPilotPsvBridge = api;
window.addEventListener('resize', () => autoSizeAll(), { passive: true });
window.dispatchEvent(new CustomEvent('locpilot:psv-ready'));
