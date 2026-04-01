import { Plane, Thermometer, Radio, Cog } from "lucide-react";

export const DVT_CATEGORIES = {
  flight_test: { label: "Flight Test", label_vi: "Bay Th\u1EED", Icon: Plane, color: "#3B82F6" },
  env_test: { label: "Environmental", label_vi: "M\u00F4i Tr\u01B0\u1EDDng", Icon: Thermometer, color: "#10B981" },
  emc_test: { label: "EMC/EMI", label_vi: "EMC/EMI", Icon: Radio, color: "#F59E0B" },
  mech_test: { label: "Mechanical", label_vi: "C\u01A1 Kh\u00ED", Icon: Cog, color: "#8B5CF6" },
};

export function getGateProgress(gateConfig, proj, phase) {
  const conds = gateConfig[phase]?.conditions || [];
  const checks = proj.gateChecks[phase] || {};
  const total = conds.length;
  const passed = conds.filter((c) => checks[c.id]).length;
  const reqTotal = conds.filter((c) => c.required).length;
  const reqPassed = conds.filter((c) => c.required && checks[c.id]).length;
  return {
    total,
    passed,
    reqTotal,
    reqPassed,
    pct: total ? Math.round((passed / total) * 100) : 0,
    canPass: reqPassed === reqTotal,
  };
}
export const GATE_CONFIG = {
  CONCEPT: {
    conditions: [
      {
        id: "c1",
        label: "Product requirements defined",
        label_vi: "Y\u00EAu c\u1EA7u s\u1EA3n ph\u1EA9m \u0111\u00E3 x\u00E1c \u0111\u1ECBnh",
        required: true,
        cat: "general",
      },
      {
        id: "c2",
        label: "Feasibility study completed",
        label_vi: "Nghi\u00EAn c\u1EE9u kh\u1EA3 thi ho\u00E0n t\u1EA5t",
        required: true,
        cat: "general",
      },
      {
        id: "c3",
        label: "Initial BOM estimated",
        label_vi: "BOM \u01B0\u1EDBc l\u01B0\u1EE3ng ban \u0111\u1EA7u",
        required: false,
        cat: "general",
      },
    ],
  },
  EVT: {
    conditions: [
      {
        id: "e1",
        label: "Schematic review passed",
        label_vi: "Review s\u01A1 \u0111\u1ED3 m\u1EA1ch \u0111\u1EA1t",
        required: true,
        cat: "design",
      },
      { id: "e2", label: "PCB layout DRC clean", label_vi: "PCB layout DRC s\u1EA1ch", required: true, cat: "design" },
      {
        id: "e3",
        label: "BOM finalized & sourced",
        label_vi: "BOM \u0111\u00E3 ch\u1ED1t & t\u00ECm ngu\u1ED3n",
        required: true,
        cat: "supply",
      },
      {
        id: "e4",
        label: "First power-on successful",
        label_vi: "B\u1EADt ngu\u1ED3n l\u1EA7n \u0111\u1EA7u OK",
        required: true,
        cat: "test",
      },
      {
        id: "e5",
        label: "Basic flight test passed",
        label_vi: "Bay test c\u01A1 b\u1EA3n \u0111\u1EA1t",
        required: false,
        cat: "test",
      },
    ],
  },
  DVT: {
    conditions: [
      {
        id: "d1",
        label: "All EVT issues closed",
        label_vi: "M\u1ECDi v\u1EA5n \u0111\u1EC1 EVT \u0111\u00E3 \u0111\u00F3ng",
        required: true,
        cat: "prerequisite",
      },
      {
        id: "d2",
        label: "Flight endurance validated",
        label_vi: "Th\u1EDDi gian bay x\u00E1c nh\u1EADn",
        required: true,
        cat: "flight_test",
      },
      {
        id: "d3",
        label: "Stability test passed",
        label_vi: "Test \u1ED5n \u0111\u1ECBnh \u0111\u1EA1t",
        required: true,
        cat: "flight_test",
      },
      {
        id: "d4",
        label: "Thermal test passed",
        label_vi: "Test nhi\u1EC7t \u0111\u1EA1t",
        required: true,
        cat: "env_test",
      },
      {
        id: "d5",
        label: "Humidity test passed",
        label_vi: "Test \u1EA9m \u0111\u1EA1t",
        required: true,
        cat: "env_test",
      },
      {
        id: "d6",
        label: "Dust ingress test passed",
        label_vi: "Test b\u1EE5i \u0111\u1EA1t",
        required: true,
        cat: "env_test",
      },
      {
        id: "d7",
        label: "EMC pre-scan passed",
        label_vi: "EMC pre-scan \u0111\u1EA1t",
        required: true,
        cat: "emc_test",
      },
      {
        id: "d8",
        label: "EMI certification submitted",
        label_vi: "\u0110\u00E3 n\u1ED9p ch\u1EE9ng nh\u1EADn EMI",
        required: true,
        cat: "emc_test",
      },
      {
        id: "d9",
        label: "Drop test passed",
        label_vi: "Test r\u01A1i \u0111\u1EA1t",
        required: true,
        cat: "mech_test",
      },
      {
        id: "d10",
        label: "Vibration test passed",
        label_vi: "Test rung \u0111\u1EA1t",
        required: true,
        cat: "mech_test",
      },
      {
        id: "d11",
        label: "Design freeze approved",
        label_vi: "\u0110\u00E3 ph\u00EA duy\u1EC7t \u0111\u00F3ng b\u0103ng thi\u1EBFt k\u1EBF",
        required: true,
        cat: "prerequisite",
      },
    ],
  },
  PVT: {
    conditions: [
      {
        id: "p1",
        label: "All DVT issues closed",
        label_vi: "M\u1ECDi v\u1EA5n \u0111\u1EC1 DVT \u0111\u00E3 \u0111\u00F3ng",
        required: true,
        cat: "prerequisite",
      },
      {
        id: "p2",
        label: "Production line validated",
        label_vi: "D\u00E2y chuy\u1EC1n s\u1EA3n xu\u1EA5t \u0111\u00E3 x\u00E1c nh\u1EADn",
        required: true,
        cat: "production",
      },
      {
        id: "p3",
        label: "QC process documented",
        label_vi: "Quy tr\u00ECnh QC \u0111\u00E3 t\u00E0i li\u1EC7u h\u00F3a",
        required: true,
        cat: "production",
      },
      { id: "p4", label: "Yield > 95%", label_vi: "Yield > 95%", required: true, cat: "production" },
      {
        id: "p5",
        label: "Regulatory certification",
        label_vi: "Ch\u1EE9ng nh\u1EADn ph\u00E1p quy",
        required: true,
        cat: "compliance",
      },
    ],
  },
  MP: {
    conditions: [
      {
        id: "m1",
        label: "All PVT issues closed",
        label_vi: "M\u1ECDi v\u1EA5n \u0111\u1EC1 PVT \u0111\u00E3 \u0111\u00F3ng",
        required: true,
        cat: "prerequisite",
      },
      {
        id: "m2",
        label: "Mass production BOM locked",
        label_vi: "BOM s\u1EA3n xu\u1EA5t h\u00E0ng lo\u1EA1t \u0111\u00E3 kh\u00F3a",
        required: true,
        cat: "production",
      },
      {
        id: "m3",
        label: "Supply chain confirmed",
        label_vi: "Chu\u1ED7i cung \u1EE9ng \u0111\u00E3 x\u00E1c nh\u1EADn",
        required: true,
        cat: "supply",
      },
    ],
  },
};
