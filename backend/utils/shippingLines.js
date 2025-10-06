
const OWNER_BY_PREFIX = {
  // MSC
  MSCU: "MSC",  
  MEDU: "MSC",

  // Maersk
  MAEU: "Maersk",
  MSKU: "Maersk",   // Maersk Sealand (muito comum)

  // CMA CGM
  CMAU: "CMA CGM",

  // Hapag-Lloyd
  HLCU: "Hapag-Lloyd",

  // Evergreen
  EGHU: "Evergreen",
  EMCU: "Evergreen",

  // COSCO / China Shipping
  COSU: "COSCO",
  CSNU: "COSCO",

  // ONE (Ocean Network Express)
  ONEY: "ONE",

  // Hamburg Süd (grupo Maersk)
  SUDU: "Hamburg Süd",

  // Yang Ming
  YMLU: "Yang Ming",

  // ZIM
  ZIMU: "ZIM",

  // OOCL
  OOLU: "OOCL",

  // HMM (Hyundai Merchant Marine)
  HDMU: "HMM",

  // NYK
  NYKU: "NYK"
};

function normalizeContainerId(raw = "") {
  
  return String(raw).toUpperCase().replace(/[-\s]+/g, "");
}

function deriveOwnerFromContainerId(containerId = "") {
  const id = normalizeContainerId(containerId);
  if (id.length < 4) return null;
  const prefix = id.slice(0, 4);
  return OWNER_BY_PREFIX[prefix] || null;
}

module.exports = {
  normalizeContainerId,
  deriveOwnerFromContainerId,
};
