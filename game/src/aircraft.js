// The aircraft itself: Sriti, a red-and-cream seaplane mail carrier
// with pontoons, a spinning propeller and a compass-rose roundel. It is
// drawn large in the chase view, banking with the turn and pitching
// with the climb, so the pilot always sees what the plane is doing.
export function drawAircraft(ctx, flight, width, height, time, weather) {
  const centerX = width / 2;
  const centerY = height - 208;
  const bank = flight.bank;
  const pitchShift = flight.pitch * 90;
  const bob = Math.sin(time * 2.1) * 2.5;
  const scale = 0.92;
  ctx.save();
  ctx.translate(centerX, centerY + pitchShift + bob);
  ctx.rotate(bank * 0.55);
  ctx.scale(scale, scale);
  drawPropellerBlur(ctx, time, weather);
  drawPontoons(ctx);
  drawWings(ctx, weather);
  drawFuselage(ctx, weather);
  drawTail(ctx);
  drawCockpit(ctx, weather);
  drawCompassRose(ctx, -118, -6);
  drawCompassRose(ctx, 118, -6);
  ctx.restore();
  drawPropellerHub(ctx, centerX, centerY + pitchShift + bob, time);
}

function drawPontoons(ctx) {
  ctx.save();
  for (const side of [-1, 1]) {
    ctx.fillStyle = "#b03a2a";
    ctx.beginPath();
    ctx.roundRect(side * 62 - 13, 52, 26, 66, 12);
    ctx.fill();
    ctx.fillStyle = "#7e2718";
    ctx.beginPath();
    ctx.roundRect(side * 62 - 13, 100, 26, 18, 9);
    ctx.fill();
    ctx.strokeStyle = "#5e1c10";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(side * 62, 34);
    ctx.lineTo(side * 62, 52);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWings(ctx, weather) {
  ctx.save();
  const wingColor = weather === "night" ? "#8f2f22" : "#c94f3d";
  ctx.fillStyle = wingColor;
  ctx.beginPath();
  ctx.moveTo(-196, -4);
  ctx.quadraticCurveTo(-196, -22, -168, -24);
  ctx.lineTo(-34, -20);
  ctx.lineTo(-34, 6);
  ctx.lineTo(-168, 4);
  ctx.quadraticCurveTo(-196, 4, -196, -4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(196, -4);
  ctx.quadraticCurveTo(196, -22, 168, -24);
  ctx.lineTo(34, -20);
  ctx.lineTo(34, 6);
  ctx.lineTo(168, 4);
  ctx.quadraticCurveTo(196, 4, 196, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f3e6c8";
  ctx.fillRect(-196, -22, 26, 26);
  ctx.fillRect(170, -22, 26, 26);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(-34, -20, 68, 5);
  ctx.restore();
}

function drawFuselage(ctx, weather) {
  ctx.save();
  const body = ctx.createLinearGradient(0, -30, 0, 46);
  if (weather === "night") {
    body.addColorStop(0, "#d8c9a3");
    body.addColorStop(1, "#8a7a58");
  } else {
    body.addColorStop(0, "#f7ead0");
    body.addColorStop(0.55, "#e8d3a8");
    body.addColorStop(1, "#b99f6e");
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-30, -18);
  ctx.quadraticCurveTo(-34, -34, -12, -38);
  ctx.lineTo(14, -38);
  ctx.quadraticCurveTo(34, -34, 30, -12);
  ctx.quadraticCurveTo(28, 34, 12, 46);
  ctx.lineTo(-12, 46);
  ctx.quadraticCurveTo(-28, 34, -30, -18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 60, 20, 0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#c94f3d";
  ctx.fillRect(-29, 8, 58, 10);
  ctx.fillStyle = "#7a2d20";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SRITI AIR MAIL", 0, 32);
  ctx.restore();
}

function drawTail(ctx) {
  ctx.save();
  ctx.fillStyle = "#c94f3d";
  ctx.beginPath();
  ctx.moveTo(-10, 40);
  ctx.lineTo(-46, 78);
  ctx.lineTo(-30, 80);
  ctx.lineTo(-4, 48);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 40);
  ctx.lineTo(46, 78);
  ctx.lineTo(30, 80);
  ctx.lineTo(4, 48);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f3e6c8";
  ctx.fillRect(-46, 66, 16, 12);
  ctx.fillRect(30, 66, 16, 12);
  ctx.restore();
}

function drawCockpit(ctx, weather) {
  ctx.save();
  const glass = ctx.createLinearGradient(0, -38, 0, -6);
  glass.addColorStop(0, weather === "night" ? "#ffe9a8" : "#bfe6f2");
  glass.addColorStop(1, weather === "night" ? "#c98f2e" : "#4a90b8");
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.ellipse(0, -22, 17, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(30, 30, 30, 0.55)";
  ctx.beginPath();
  ctx.ellipse(-4, -20, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8b98a";
  ctx.beginPath();
  ctx.arc(-4, -26, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b4a2a";
  ctx.beginPath();
  ctx.arc(-4, -30, 6, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPropellerBlur(ctx, time, weather) {
  ctx.save();
  ctx.translate(0, -52);
  ctx.rotate(time * 14);
  ctx.fillStyle = weather === "night" ? "rgba(255, 240, 190, 0.35)" : "rgba(240, 240, 240, 0.4)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, 52, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPropellerHub(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 52);
  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8d8d8";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCompassRose(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f3e6c8";
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7a2d20";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#c94f3d";
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(3, 0);
  ctx.lineTo(0, 11);
  ctx.lineTo(-3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2b4a6b";
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(0, 3);
  ctx.lineTo(11, 0);
  ctx.lineTo(0, -3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function describeAircraft() {
  return "Sriti, a red-and-cream seaplane mail carrier with pontoons, compass-rose roundels and a brass-trimmed cockpit.";
}
