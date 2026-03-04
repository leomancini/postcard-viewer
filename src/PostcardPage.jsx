import React, { useRef, useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";

const Container = styled.div`
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const Scene = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 900px;
  padding: 0 20px;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.ready {
    opacity: 1;
  }
`;

const Perspective = styled.div`
  perspective: 1200px;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  width: 100%;
  position: relative;
  transform-style: preserve-3d;
  user-select: none;
  -webkit-user-select: none;
`;

const Face = styled.div`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 6px;
  overflow: hidden;

  & > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  & > img.rotated {
    position: absolute;
    top: 50%;
    left: 50%;
    object-fit: cover;
    transform: translate(-50%, -50%) rotate(90deg);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      150% 150% at var(--light-x, 50%) var(--light-y, 20%),
      rgba(255, 255, 255, var(--light-intensity, 0.15)) 0%,
      transparent 60%
    );
  }
`;

const BackFace = styled(Face)`
  transform: rotateY(180deg);

  &::after {
    background: radial-gradient(
      150% 150% at var(--light-x-back, 50%) var(--light-y-back, 20%),
      rgba(255, 255, 255, var(--light-intensity-back, 0.3)) 0%,
      transparent 60%
    );
  }
`;

const LoadingText = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 1;

  &.hidden {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  & > span {
    color: #fff;
    font-weight: 500;
    font-size: 24px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

const HintOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.visible {
    opacity: 1;
  }

  & > span {
    color: #fff;
    font-weight: 500;
    font-size: 24px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 1), 0 0 60px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.9);
  }
`;

// Smoothly interpolate Z rotation using sine easing over a wide transition zone
function getZRotation(angle, needsRotation) {
  if (!needsRotation) return 0;
  const norm = ((angle % 360) + 360) % 360;
  const zone = 60;
  let t;
  if (norm < 90 - zone) return 0;
  if (norm >= 90 - zone && norm <= 90 + zone) {
    t = (norm - (90 - zone)) / (2 * zone);
    return (Math.sin((t - 0.5) * Math.PI) * 0.5 + 0.5) * 90;
  }
  if (norm > 90 + zone && norm < 270 - zone) return 90;
  if (norm >= 270 - zone && norm <= 270 + zone) {
    t = (270 + zone - norm) / (2 * zone);
    return (Math.sin((t - 0.5) * Math.PI) * 0.5 + 0.5) * 90;
  }
  return 0;
}

function PostcardPage() {
  const { id } = useParams();
  const cardRef = useRef(null);
  const needsRotationRef = useRef(false);
  const state = useRef({
    dragging: false,
    startX: 0,
    startAngle: 0,
    angle: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
    animationId: null,
  });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [frontAR, setFrontAR] = useState(null);
  const [needsRotation, setNeedsRotation] = useState(false);
  const [ready, setReady] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const frontImg = new Image();
    const backImg = new Image();
    let frontIsPortrait = null;
    let backIsPortrait = null;
    let loaded = 0;

    const check = () => {
      if (frontIsPortrait !== null && backIsPortrait !== null) {
        const rotated = frontIsPortrait !== backIsPortrait;
        needsRotationRef.current = rotated;
        setNeedsRotation(rotated);
      }
      loaded++;
      if (loaded === 2) setReady(true);
    };

    frontImg.onload = () => {
      setFrontAR(frontImg.naturalWidth / frontImg.naturalHeight);
      frontIsPortrait = frontImg.naturalHeight > frontImg.naturalWidth;
      check();
    };
    backImg.onload = () => {
      backIsPortrait = backImg.naturalHeight > backImg.naturalWidth;
      check();
    };

    frontImg.src = `/postcards/${id}/front.jpeg`;
    backImg.src = `/postcards/${id}/back.jpeg`;
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    // Wait for loading text to fade out (500ms), then brief pause, then show card
    const timer = setTimeout(() => setShowCard(true), 200);
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (!showCard || hasInteracted) return;
    const showTimer = setTimeout(() => setShowHint(true), 500);
    const hideTimer = setTimeout(() => setShowHint(false), 2500);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [showCard, hasInteracted]);

  useEffect(() => {
    if (hasInteracted) setShowHint(false);
  }, [hasInteracted]);

  const applyTransform = useCallback((angle) => {
    if (!cardRef.current) return;
    const z = getZRotation(angle, needsRotationRef.current);

    const el = cardRef.current;
    el.style.transform = `rotateY(${angle}deg) rotateZ(${z}deg)`;

    // 3D light projection: light above and in front of card
    // World coords: X=right, Y=up, Z=toward viewer
    // Card transforms: rotateY(angle) then rotateZ(z)
    const theta = (angle * Math.PI) / 180;
    const phi = (z * Math.PI) / 180;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);

    // Card's local axes in world space after rotateY(θ) · rotateZ(φ):
    // localX = (cosθ·cosφ, sinφ, -sinθ·cosφ)
    // localY = (-cosθ·sinφ, cosφ, sinθ·sinφ)
    // normal = (sinθ, 0, cosθ)
    // Light from above+front in CSS coords (Y-down): L = (0, -1, 1)
    // Project light position onto card local axes to find gradient center
    const k = 50; // gradient offset scale
    const frontLocalX = -(sinP + sinT * cosP);  // -(sinφ + sinθ·cosφ)
    const frontLocalY = sinT * sinP - cosP;      // sinθ·sinφ - cosφ
    const frontGradX = 50 + k * frontLocalX;
    const frontGradY = 50 + k * frontLocalY;

    // Back face: rotateY(180°) mirrors local X, keeps local Y
    const backGradX = 50 - k * frontLocalX;
    const backGradY = frontGradY;

    // Diffuse intensity: |dot(normal, lightDir)|
    // normal = (sinθ, 0, cosθ), lightDir = (0, 1/√2, 1/√2)
    // dot = cosθ/√2 — only depends on Y rotation, not Z
    const intensity = Math.abs(0.707 * cosT) * 1.0;

    el.style.setProperty("--light-x", `${frontGradX}%`);
    el.style.setProperty("--light-y", `${frontGradY}%`);
    el.style.setProperty("--light-intensity", `${intensity}`);
    el.style.setProperty("--light-x-back", `${backGradX}%`);
    el.style.setProperty("--light-y-back", `${backGradY}%`);
    el.style.setProperty("--light-intensity-back", `${intensity}`);
  }, []);

  const startDrag = useCallback((clientX) => {
    const s = state.current;
    if (s.animationId) {
      cancelAnimationFrame(s.animationId);
      s.animationId = null;
    }
    s.dragging = true;
    s.startX = clientX;
    s.startAngle = s.angle;
    s.lastX = clientX;
    s.lastTime = performance.now();
    s.velocity = 0;
    setHasInteracted(true);
  }, []);

  const moveDrag = useCallback((clientX) => {
    const s = state.current;
    if (!s.dragging) return;
    const now = performance.now();
    const dt = now - s.lastTime;
    if (dt > 0) {
      s.velocity = (clientX - s.lastX) / dt;
    }
    s.lastX = clientX;
    s.lastTime = now;

    const dx = clientX - s.startX;
    s.angle = s.startAngle + dx * 0.4;
    applyTransform(s.angle);
  }, [applyTransform]);

  const endDrag = useCallback(() => {
    const s = state.current;
    if (!s.dragging) return;
    s.dragging = false;

    const friction = 0.95;
    const minVelocity = 0.001;

    const animate = () => {
      s.velocity *= friction;
      if (Math.abs(s.velocity) < minVelocity) {
        s.animationId = null;
        return;
      }
      s.angle += s.velocity * 16 * 0.4;
      applyTransform(s.angle);
      s.animationId = requestAnimationFrame(animate);
    };

    s.animationId = requestAnimationFrame(animate);
  }, [applyTransform]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.target.closest("a")) return;
      e.preventDefault();
      startDrag(e.clientX);
    };
    const onMouseMove = (e) => moveDrag(e.clientX);
    const onMouseUp = () => endDrag();

    const onTouchStart = (e) => {
      if (e.target.closest("a")) return;
      startDrag(e.touches[0].clientX);
    };
    const onTouchMove = (e) => {
      if (!state.current.dragging) return;
      e.preventDefault();
      moveDrag(e.touches[0].clientX);
    };
    const onTouchEnd = () => endDrag();

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);

      if (state.current.animationId) {
        cancelAnimationFrame(state.current.animationId);
      }
    };
  }, [startDrag, moveDrag, endDrag]);

  const cardStyle = frontAR
    ? { maxHeight: "calc(100vh - 120px)", maxWidth: "calc((100vh - 120px) * " + frontAR + ")", aspectRatio: `${frontAR}` }
    : { maxHeight: "calc(100vh - 120px)", aspectRatio: "3 / 2" };

  return (
    <Container>
      <LoadingText className={ready ? "hidden" : ""}>
        <span>Loading</span>
      </LoadingText>
      <Scene className={showCard ? "ready" : ""}>
        <Perspective>
          <Card ref={cardRef} style={{ ...cardStyle, "--light-x": "50%", "--light-y": "0%", "--light-x-back": "50%", "--light-y-back": "0%", "--light-intensity": "0.707", "--light-intensity-back": "0.707" }}>
            <Face>
              <img src={`/postcards/${id}/front.jpeg`} alt="Front" draggable={false} />
              <HintOverlay className={showCard && showHint ? "visible" : ""}>
                <span>Drag to flip</span>
              </HintOverlay>
            </Face>
            <BackFace>
              <img
                src={`/postcards/${id}/back.jpeg`}
                alt="Back"
                draggable={false}
                className={needsRotation ? "rotated" : undefined}
                style={needsRotation && frontAR ? {
                  width: `${(1 / frontAR) * 100}%`,
                  height: `${frontAR * 100}%`,
                } : undefined}
              />
            </BackFace>
          </Card>
        </Perspective>
      </Scene>
    </Container>
  );
}

export default PostcardPage;
