// Keyboard and mouse input. Keys are read as a held set so the plane
// answers every frame; the mouse steers gently toward the cursor and
// clicks start, choose and restart. No key, click or gesture leaves
// this file as anything but a plain held/released state.
export function createInput() {
  return {
    keys: new Set(),
    mouseX: 0.5,
    mouseY: 0.5,
    mouseSteer: 0,
    mousePitch: 0,
    mouseActive: false,
    clicked: null,
    pressed: new Set(),
  };
}

export function attachInput(input, canvas) {
  const keyName = (event) => event.key.toLowerCase();
  window.addEventListener("keydown", (event) => {
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(keyName(event))) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressed.add(keyName(event));
    input.keys.add(keyName(event));
  });
  window.addEventListener("keyup", (event) => {
    input.keys.delete(keyName(event));
  });
  window.addEventListener("blur", () => {
    input.keys.clear();
    input.mouseActive = false;
  });
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (event.clientX - rect.left) / rect.width;
    input.mouseY = (event.clientY - rect.top) / rect.height;
    input.mouseActive = true;
    input.mouseSteer = clampSteer((input.mouseX - 0.5) * 2.4);
    input.mousePitch = clampSteer((input.mouseY - 0.5) * 1.6);
  });
  canvas.addEventListener("mouseleave", () => {
    input.mouseActive = false;
    input.mouseSteer = 0;
    input.mousePitch = 0;
  });
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clicked = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  });
}

function clampSteer(value) {
  return Math.max(-1, Math.min(1, value));
}

export function readFlightInput(input) {
  const keys = input.keys;
  return {
    throttleUp: keys.has("w"),
    throttleDown: keys.has("s"),
    turnLeft: keys.has("a") || keys.has("arrowleft"),
    turnRight: keys.has("d") || keys.has("arrowright"),
    pitchUp: keys.has("arrowup"),
    pitchDown: keys.has("arrowdown"),
    mouseSteer: input.mouseActive ? input.mouseSteer * 0.45 : 0,
    mousePitch: input.mouseActive ? input.mousePitch * 0.4 : 0,
    drop: input.pressed.has(" "),
  };
}

export function consumePress(input, key) {
  const hit = input.pressed.has(key);
  if (hit) input.pressed.delete(key);
  return hit;
}

export function consumeClick(input) {
  const click = input.clicked;
  input.clicked = null;
  return click;
}

export function endFrameInput(input) {
  input.pressed.clear();
}
