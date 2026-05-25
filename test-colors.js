const oklchToRgb = (l, c, h) => {
  // Simple check for visibility
  console.log(`L: ${l}, C: ${c}, H: ${h}`);
  if (l > 0.5) console.log("Likely light text needed");
  else console.log("Likely dark text needed");
};
oklchToRgb(0.577, 0.245, 27.325); // destructive light
oklchToRgb(0.704, 0.191, 22.216); // destructive dark
