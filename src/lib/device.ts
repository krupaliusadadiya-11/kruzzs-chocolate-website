/** device + quality tier, decided once at boot (force with ?tier=high|low|none) */
export type Tier = "high" | "low" | "none";

export const device = {
  tier: "high" as Tier,
  mobile: false,
  reducedMotion: false,
};

export function detectDevice() {
  const mobile = window.matchMedia("(max-width: 820px)").matches || window.matchMedia("(pointer: coarse)").matches;
  device.mobile = mobile;
  device.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let tier: Tier = "high";
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) tier = "none";
  } catch {
    tier = "none";
  }
  const cores = navigator.hardwareConcurrency || 4;
  if (tier === "high" && (mobile || cores <= 4)) tier = "low";

  const forced = new URLSearchParams(location.search).get("tier");
  if (forced === "high" || forced === "low" || forced === "none") tier = forced;
  device.tier = tier;
  document.documentElement.dataset.tier = tier;
  if (device.reducedMotion) document.documentElement.classList.add("reduced");
}
