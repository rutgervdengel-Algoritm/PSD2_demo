import { useState, useEffect, useMemo } from "react";

// ============================================================
// PSD2 Vaste Lasten Herkenning — Proof of Concept
// ============================================================
// This demo simulates:
// 1. Connecting to a PSD2 sandbox API (GoCardless/Nordigen)
// 2. Fetching & analyzing transactions
// 3. Recognizing recurring fixed costs
// 4. Categorizing & enriching with metadata
// 5. Exposing as an API/data product
// ============================================================

// --- Simulated PSD2 Sandbox Data (realistic Dutch transactions) ---
const SANDBOX_TRANSACTIONS = [
  // Energie
  { id: "tx_001", bookingDate: "2025-12-01", amount: -189.00, currency: "EUR", creditorName: "Vattenfall NL", creditorIban: "NL91ABNA0417164300", remittanceInfo: "Maandtermijn energie dec 2025 klantnr 8827361", merchantCategoryCode: "4900" },
  { id: "tx_002", bookingDate: "2025-11-01", amount: -189.00, currency: "EUR", creditorName: "Vattenfall NL", creditorIban: "NL91ABNA0417164300", remittanceInfo: "Maandtermijn energie nov 2025 klantnr 8827361", merchantCategoryCode: "4900" },
  { id: "tx_003", bookingDate: "2025-10-01", amount: -189.00, currency: "EUR", creditorName: "Vattenfall NL", creditorIban: "NL91ABNA0417164300", remittanceInfo: "Maandtermijn energie okt 2025 klantnr 8827361", merchantCategoryCode: "4900" },
  { id: "tx_004", bookingDate: "2025-09-01", amount: -185.00, currency: "EUR", creditorName: "Vattenfall NL", creditorIban: "NL91ABNA0417164300", remittanceInfo: "Maandtermijn energie sep 2025 klantnr 8827361", merchantCategoryCode: "4900" },
  // Zorgverzekering
  { id: "tx_010", bookingDate: "2025-12-01", amount: -142.50, currency: "EUR", creditorName: "CZ Zorgverzekeringen", creditorIban: "NL86INGB0002445588", remittanceInfo: "Premie zorgverzekering dec 2025 polisnr ZV-2025-44821", merchantCategoryCode: "6300" },
  { id: "tx_011", bookingDate: "2025-11-01", amount: -142.50, currency: "EUR", creditorName: "CZ Zorgverzekeringen", creditorIban: "NL86INGB0002445588", remittanceInfo: "Premie zorgverzekering nov 2025 polisnr ZV-2025-44821", merchantCategoryCode: "6300" },
  { id: "tx_012", bookingDate: "2025-10-01", amount: -142.50, currency: "EUR", creditorName: "CZ Zorgverzekeringen", creditorIban: "NL86INGB0002445588", remittanceInfo: "Premie zorgverzekering okt 2025 polisnr ZV-2025-44821", merchantCategoryCode: "6300" },
  { id: "tx_013", bookingDate: "2025-09-01", amount: -142.50, currency: "EUR", creditorName: "CZ Zorgverzekeringen", creditorIban: "NL86INGB0002445588", remittanceInfo: "Premie zorgverzekering sep 2025 polisnr ZV-2025-44821", merchantCategoryCode: "6300" },
  // Hypotheek
  { id: "tx_020", bookingDate: "2025-12-01", amount: -1247.83, currency: "EUR", creditorName: "ABN AMRO Hypotheken", creditorIban: "NL02ABNA0123456789", remittanceInfo: "Hypotheek maandlast dec 2025 leningnr HYP-992841", merchantCategoryCode: "6012" },
  { id: "tx_021", bookingDate: "2025-11-01", amount: -1247.83, currency: "EUR", creditorName: "ABN AMRO Hypotheken", creditorIban: "NL02ABNA0123456789", remittanceInfo: "Hypotheek maandlast nov 2025 leningnr HYP-992841", merchantCategoryCode: "6012" },
  { id: "tx_022", bookingDate: "2025-10-01", amount: -1247.83, currency: "EUR", creditorName: "ABN AMRO Hypotheken", creditorIban: "NL02ABNA0123456789", remittanceInfo: "Hypotheek maandlast okt 2025 leningnr HYP-992841", merchantCategoryCode: "6012" },
  { id: "tx_023", bookingDate: "2025-09-01", amount: -1247.83, currency: "EUR", creditorName: "ABN AMRO Hypotheken", creditorIban: "NL02ABNA0123456789", remittanceInfo: "Hypotheek maandlast sep 2025 leningnr HYP-992841", merchantCategoryCode: "6012" },
  // Internet & TV
  { id: "tx_030", bookingDate: "2025-12-05", amount: -64.99, currency: "EUR", creditorName: "KPN B.V.", creditorIban: "NL41INGB0006880612", remittanceInfo: "Internet + iTV dec 2025 klantnr KPN-2291847", merchantCategoryCode: "4899" },
  { id: "tx_031", bookingDate: "2025-11-05", amount: -64.99, currency: "EUR", creditorName: "KPN B.V.", creditorIban: "NL41INGB0006880612", remittanceInfo: "Internet + iTV nov 2025 klantnr KPN-2291847", merchantCategoryCode: "4899" },
  { id: "tx_032", bookingDate: "2025-10-05", amount: -64.99, currency: "EUR", creditorName: "KPN B.V.", creditorIban: "NL41INGB0006880612", remittanceInfo: "Internet + iTV okt 2025 klantnr KPN-2291847", merchantCategoryCode: "4899" },
  { id: "tx_033", bookingDate: "2025-09-05", amount: -64.99, currency: "EUR", creditorName: "KPN B.V.", creditorIban: "NL41INGB0006880612", remittanceInfo: "Internet + iTV sep 2025 klantnr KPN-2291847", merchantCategoryCode: "4899" },
  // Mobiel
  { id: "tx_040", bookingDate: "2025-12-15", amount: -24.99, currency: "EUR", creditorName: "T-Mobile Netherlands", creditorIban: "NL09DEUT0265153927", remittanceInfo: "Mobiel abonnement dec 2025 nr 06-12345678", merchantCategoryCode: "4812" },
  { id: "tx_041", bookingDate: "2025-11-15", amount: -24.99, currency: "EUR", creditorName: "T-Mobile Netherlands", creditorIban: "NL09DEUT0265153927", remittanceInfo: "Mobiel abonnement nov 2025 nr 06-12345678", merchantCategoryCode: "4812" },
  { id: "tx_042", bookingDate: "2025-10-15", amount: -24.99, currency: "EUR", creditorName: "T-Mobile Netherlands", creditorIban: "NL09DEUT0265153927", remittanceInfo: "Mobiel abonnement okt 2025 nr 06-12345678", merchantCategoryCode: "4812" },
  { id: "tx_043", bookingDate: "2025-09-15", amount: -24.99, currency: "EUR", creditorName: "T-Mobile Netherlands", creditorIban: "NL09DEUT0265153927", remittanceInfo: "Mobiel abonnement sep 2025 nr 06-12345678", merchantCategoryCode: "4812" },
  // Streaming
  { id: "tx_050", bookingDate: "2025-12-08", amount: -15.99, currency: "EUR", creditorName: "Netflix International", creditorIban: "NL94ABNA0826442812", remittanceInfo: "Netflix Premium dec 2025", merchantCategoryCode: "4899" },
  { id: "tx_051", bookingDate: "2025-11-08", amount: -15.99, currency: "EUR", creditorName: "Netflix International", creditorIban: "NL94ABNA0826442812", remittanceInfo: "Netflix Premium nov 2025", merchantCategoryCode: "4899" },
  { id: "tx_052", bookingDate: "2025-10-08", amount: -15.99, currency: "EUR", creditorName: "Netflix International", creditorIban: "NL94ABNA0826442812", remittanceInfo: "Netflix Premium okt 2025", merchantCategoryCode: "4899" },
  { id: "tx_053", bookingDate: "2025-09-08", amount: -13.99, currency: "EUR", creditorName: "Netflix International", creditorIban: "NL94ABNA0826442812", remittanceInfo: "Netflix Standard sep 2025", merchantCategoryCode: "4899" },
  // Spotify
  { id: "tx_054", bookingDate: "2025-12-10", amount: -10.99, currency: "EUR", creditorName: "Spotify AB", creditorIban: "NL25ABNA0560839752", remittanceInfo: "Spotify Premium Individual dec 2025", merchantCategoryCode: "5815" },
  { id: "tx_055", bookingDate: "2025-11-10", amount: -10.99, currency: "EUR", creditorName: "Spotify AB", creditorIban: "NL25ABNA0560839752", remittanceInfo: "Spotify Premium Individual nov 2025", merchantCategoryCode: "5815" },
  { id: "tx_056", bookingDate: "2025-10-10", amount: -10.99, currency: "EUR", creditorName: "Spotify AB", creditorIban: "NL25ABNA0560839752", remittanceInfo: "Spotify Premium Individual okt 2025", merchantCategoryCode: "5815" },
  // Sportschool
  { id: "tx_060", bookingDate: "2025-12-01", amount: -34.95, currency: "EUR", creditorName: "Basic-Fit Nederland", creditorIban: "NL76RABO0156789012", remittanceInfo: "Lidmaatschap Premium dec 2025 lid 9912847", merchantCategoryCode: "7941" },
  { id: "tx_061", bookingDate: "2025-11-01", amount: -34.95, currency: "EUR", creditorName: "Basic-Fit Nederland", creditorIban: "NL76RABO0156789012", remittanceInfo: "Lidmaatschap Premium nov 2025 lid 9912847", merchantCategoryCode: "7941" },
  { id: "tx_062", bookingDate: "2025-10-01", amount: -34.95, currency: "EUR", creditorName: "Basic-Fit Nederland", creditorIban: "NL76RABO0156789012", remittanceInfo: "Lidmaatschap Premium okt 2025 lid 9912847", merchantCategoryCode: "7941" },
  { id: "tx_063", bookingDate: "2025-09-01", amount: -34.95, currency: "EUR", creditorName: "Basic-Fit Nederland", creditorIban: "NL76RABO0156789012", remittanceInfo: "Lidmaatschap Premium sep 2025 lid 9912847", merchantCategoryCode: "7941" },
  // Autoverzekering (kwartaal)
  { id: "tx_070", bookingDate: "2025-12-01", amount: -187.50, currency: "EUR", creditorName: "Centraal Beheer", creditorIban: "NL55RABO0349876123", remittanceInfo: "Autoverzekering Q4-2025 polisnr AV-2025-77123", merchantCategoryCode: "6300" },
  { id: "tx_071", bookingDate: "2025-09-01", amount: -187.50, currency: "EUR", creditorName: "Centraal Beheer", creditorIban: "NL55RABO0349876123", remittanceInfo: "Autoverzekering Q3-2025 polisnr AV-2025-77123", merchantCategoryCode: "6300" },
  // Gemeentebelasting (jaarlijks)
  { id: "tx_080", bookingDate: "2025-02-28", amount: -812.00, currency: "EUR", creditorName: "Gemeente Amsterdam", creditorIban: "NL32BNGH0285063712", remittanceInfo: "Gemeentelijke belastingen 2025 aanslagnr GB-2025-442918", merchantCategoryCode: "9311" },
  // Niet-vaste kosten (ruis)
  { id: "tx_090", bookingDate: "2025-12-12", amount: -47.82, currency: "EUR", creditorName: "Albert Heijn 1542", creditorIban: "NL22RABO0123987456", remittanceInfo: "Betaalautomaat 12-12-2025 AH Kalverstraat", merchantCategoryCode: "5411" },
  { id: "tx_091", bookingDate: "2025-12-10", amount: -128.50, currency: "EUR", creditorName: "Bol.com", creditorIban: "NL62ABNA0507372901", remittanceInfo: "Bestelling 9928471-A 2x artikelen", merchantCategoryCode: "5999" },
  { id: "tx_092", bookingDate: "2025-11-28", amount: -35.00, currency: "EUR", creditorName: "Shell Station A2", creditorIban: "NL18INGB0007234567", remittanceInfo: "Tankbeurt 28-11-2025", merchantCategoryCode: "5541" },
  { id: "tx_093", bookingDate: "2025-11-15", amount: 2850.00, currency: "EUR", creditorName: "Werkgever B.V.", creditorIban: "NL44RABO0987654321", remittanceInfo: "Salaris november 2025", merchantCategoryCode: "0000" },
  { id: "tx_094", bookingDate: "2025-12-15", amount: 2850.00, currency: "EUR", creditorName: "Werkgever B.V.", creditorIban: "NL44RABO0987654321", remittanceInfo: "Salaris december 2025", merchantCategoryCode: "0000" },
  // Waterschapsbelasting
  { id: "tx_095", bookingDate: "2025-04-01", amount: -347.62, currency: "EUR", creditorName: "Waternet", creditorIban: "NL81INGB0002990066", remittanceInfo: "Waterschapsbelasting 2025 termijn 1/4", merchantCategoryCode: "4941" },
  { id: "tx_096", bookingDate: "2025-07-01", amount: -347.62, currency: "EUR", creditorName: "Waternet", creditorIban: "NL81INGB0002990066", remittanceInfo: "Waterschapsbelasting 2025 termijn 2/4", merchantCategoryCode: "4941" },
  { id: "tx_097", bookingDate: "2025-10-01", amount: -347.62, currency: "EUR", creditorName: "Waternet", creditorIban: "NL81INGB0002990066", remittanceInfo: "Waterschapsbelasting 2025 termijn 3/4", merchantCategoryCode: "4941" },
];

// --- Categorization Engine ---
const CATEGORY_RULES = [
  { category: "wonen", subcategory: "hypotheek", label: "Hypotheek", icon: "🏠", keywords: ["hypotheek", "mortgage", "leningnr"], mccRange: [6010, 6020], color: "#3B82F6" },
  { category: "wonen", subcategory: "energie", label: "Energie", icon: "⚡", keywords: ["energie", "vattenfall", "eneco", "essent", "greenchoice", "maandtermijn energie"], mccRange: [4900, 4999], color: "#F59E0B" },
  { category: "wonen", subcategory: "water", label: "Water & Belastingen", icon: "💧", keywords: ["waternet", "waterschap", "waterschapsbelasting"], mccRange: [4940, 4950], color: "#06B6D4" },
  { category: "wonen", subcategory: "gemeentebelasting", label: "Gemeentebelastingen", icon: "🏛️", keywords: ["gemeente", "gemeentelijke belasting", "aanslagnr"], mccRange: [9300, 9399], color: "#8B5CF6" },
  { category: "verzekeringen", subcategory: "zorg", label: "Zorgverzekering", icon: "🏥", keywords: ["zorgverzekering", "premie zorg", "polisnr zv"], mccRange: [6300, 6399], color: "#10B981" },
  { category: "verzekeringen", subcategory: "auto", label: "Autoverzekering", icon: "🚗", keywords: ["autoverzekering", "polisnr av", "centraal beheer", "univé"], mccRange: [6300, 6399], color: "#EF4444" },
  { category: "telecom", subcategory: "internet", label: "Internet & TV", icon: "🌐", keywords: ["internet", "itv", "kpn", "ziggo", "t-mobile thuis"], mccRange: [4899, 4899], color: "#6366F1" },
  { category: "telecom", subcategory: "mobiel", label: "Mobiel", icon: "📱", keywords: ["mobiel abonnement", "t-mobile", "vodafone", "sim only"], mccRange: [4812, 4812], color: "#EC4899" },
  { category: "abonnementen", subcategory: "streaming", label: "Streaming", icon: "🎬", keywords: ["netflix", "disney+", "hbo", "videoland", "prime video"], mccRange: [4899, 4899], color: "#F43F5E" },
  { category: "abonnementen", subcategory: "muziek", label: "Muziek", icon: "🎵", keywords: ["spotify", "apple music", "tidal", "deezer"], mccRange: [5815, 5815], color: "#A855F7" },
  { category: "abonnementen", subcategory: "sport", label: "Sportschool", icon: "💪", keywords: ["basic-fit", "sportcity", "anytime fitness", "lidmaatschap"], mccRange: [7941, 7941], color: "#14B8A6" },
];

function categorizeTransaction(tx) {
  const info = (tx.remittanceInfo + " " + tx.creditorName).toLowerCase();
  const mcc = parseInt(tx.merchantCategoryCode) || 0;
  
  for (const rule of CATEGORY_RULES) {
    const keywordMatch = rule.keywords.some(kw => info.includes(kw));
    const mccMatch = mcc >= rule.mccRange[0] && mcc <= rule.mccRange[1];
    if (keywordMatch || (mccMatch && !keywordMatch)) {
      return { ...rule };
    }
  }
  return null;
}

function detectRecurringPattern(transactions) {
  if (transactions.length < 2) return { frequency: "eenmalig", confidence: 0.3 };
  
  const sorted = [...transactions].sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate));
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i].bookingDate) - new Date(sorted[i - 1].bookingDate)) / (1000 * 60 * 60 * 24);
    gaps.push(diff);
  }
  
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  
  let frequency, confidence;
  if (avgGap >= 25 && avgGap <= 35) { frequency = "maandelijks"; confidence = stdDev < 5 ? 0.95 : 0.7; }
  else if (avgGap >= 85 && avgGap <= 95) { frequency = "kwartaal"; confidence = stdDev < 10 ? 0.9 : 0.6; }
  else if (avgGap >= 175 && avgGap <= 195) { frequency = "halfjaarlijks"; confidence = 0.85; }
  else if (avgGap >= 350 && avgGap <= 380) { frequency = "jaarlijks"; confidence = 0.8; }
  else { frequency = `~${Math.round(avgGap)} dagen`; confidence = 0.4; }
  
  return { frequency, confidence, avgGapDays: Math.round(avgGap), stdDev: Math.round(stdDev * 10) / 10 };
}

function buildFixedCostsProduct(transactions) {
  const groups = {};
  
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const cat = categorizeTransaction(tx);
    if (!cat) continue;
    
    const key = tx.creditorIban || tx.creditorName;
    if (!groups[key]) {
      groups[key] = { creditorName: tx.creditorName, creditorIban: tx.creditorIban, category: cat, transactions: [] };
    }
    groups[key].transactions.push(tx);
  }
  
  return Object.values(groups)
    .filter(g => g.transactions.length >= 2 || g.category.subcategory === "gemeentebelasting")
    .map(g => {
      const amounts = g.transactions.map(t => Math.abs(t.amount));
      const pattern = detectRecurringPattern(g.transactions);
      const latestTx = g.transactions.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))[0];
      const amountStable = new Set(amounts).size === 1;
      
      let annualCost;
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      if (pattern.frequency === "maandelijks") annualCost = avgAmount * 12;
      else if (pattern.frequency === "kwartaal") annualCost = avgAmount * 4;
      else if (pattern.frequency === "halfjaarlijks") annualCost = avgAmount * 2;
      else annualCost = avgAmount;

      return {
        id: `fc_${g.creditorIban?.slice(-6) || Math.random().toString(36).slice(2, 8)}`,
        creditor: { name: g.creditorName, iban: g.creditorIban },
        category: g.category.category,
        subcategory: g.category.subcategory,
        label: g.category.label,
        icon: g.category.icon,
        color: g.category.color,
        currentAmount: Math.abs(latestTx.amount),
        averageAmount: Math.round(avgAmount * 100) / 100,
        annualizedCost: Math.round(annualCost * 100) / 100,
        currency: "EUR",
        frequency: pattern.frequency,
        confidence: pattern.confidence,
        amountStable,
        priceChange: amountStable ? null : { from: Math.min(...amounts), to: Math.max(...amounts), direction: amounts[0] < amounts[amounts.length - 1] ? "up" : "down" },
        lastPaymentDate: latestTx.bookingDate,
        expectedNextPayment: estimateNext(latestTx.bookingDate, pattern.frequency),
        transactionCount: g.transactions.length,
        metadata: { remittanceExample: latestTx.remittanceInfo, merchantCategoryCode: latestTx.merchantCategoryCode },
      };
    })
    .sort((a, b) => b.annualizedCost - a.annualizedCost);
}

function estimateNext(lastDate, frequency) {
  const d = new Date(lastDate);
  if (frequency === "maandelijks") d.setMonth(d.getMonth() + 1);
  else if (frequency === "kwartaal") d.setMonth(d.getMonth() + 3);
  else if (frequency === "halfjaarlijks") d.setMonth(d.getMonth() + 6);
  else if (frequency === "jaarlijks") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

// --- UI Components ---

const fmt = (n) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

function Badge({ children, color = "#6B7280" }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, background: color + "18", color, letterSpacing: 0.3 }}>
      {children}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const barColor = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "#6B7280", fontVariantNumeric: "tabular-nums", minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

// --- Pipeline Steps ---
const STEPS = [
  { key: "connect", label: "API Connect", desc: "Verbinding met PSD2 sandbox" },
  { key: "fetch", label: "Transacties ophalen", desc: "Account data opvragen" },
  { key: "analyze", label: "Analyse & Herkenning", desc: "Vaste lasten detecteren" },
  { key: "enrich", label: "Verrijking", desc: "Metadata & categorisatie" },
  { key: "product", label: "Data Product", desc: "API-ready output" },
];

export default function PSD2Demo() {
  const [step, setStep] = useState(-1);
  const [transactions, setTransactions] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [view, setView] = useState("dashboard"); // dashboard | api | pipeline
  const [expandedCost, setExpandedCost] = useState(null);

  const runPipeline = () => {
    setStep(0);
    setView("pipeline");
    setTransactions([]);
    setFixedCosts([]);

    setTimeout(() => setStep(1), 800);
    setTimeout(() => { setStep(2); setTransactions(SANDBOX_TRANSACTIONS); }, 1800);
    setTimeout(() => setStep(3), 3000);
    setTimeout(() => { setStep(4); setFixedCosts(buildFixedCostsProduct(SANDBOX_TRANSACTIONS)); setView("dashboard"); }, 4200);
  };

  const totalMonthly = useMemo(() => fixedCosts.filter(c => c.frequency === "maandelijks").reduce((s, c) => s + c.currentAmount, 0), [fixedCosts]);
  const totalAnnual = useMemo(() => fixedCosts.reduce((s, c) => s + c.annualizedCost, 0), [fixedCosts]);

  const categoryTotals = useMemo(() => {
    const map = {};
    fixedCosts.forEach(c => {
      if (!map[c.category]) map[c.category] = { category: c.category, total: 0, count: 0, color: c.color };
      map[c.category].total += c.annualizedCost;
      map[c.category].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [fixedCosts]);

  const apiOutput = useMemo(() => ({
    api_version: "1.0.0",
    generated_at: new Date().toISOString(),
    source: { provider: "GoCardless (Nordigen)", institution: "SANDBOXFINANCE_SFIN0000", consent_valid_until: "2026-05-28T00:00:00Z" },
    summary: { total_monthly_fixed_costs: totalMonthly, total_annual_fixed_costs: totalAnnual, recognized_count: fixedCosts.length, categories: categoryTotals.length },
    fixed_costs: fixedCosts,
  }), [fixedCosts, totalMonthly, totalAnnual, categoryTotals]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>PSD2 Vaste Lasten API</span>
                <Badge color="#3B82F6">Proof of Concept</Badge>
              </div>
              <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>PSD2-as-a-Service → Transactie-analyse → Categorisatie → Data Product</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {fixedCosts.length > 0 && (
                <>
                  <button onClick={() => setView("dashboard")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: view === "dashboard" ? "#3B82F6" : "rgba(255,255,255,0.1)", color: "white" }}>
                    Dashboard
                  </button>
                  <button onClick={() => setView("api")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: view === "api" ? "#3B82F6" : "rgba(255,255,255,0.1)", color: "white" }}>
                    API Output
                  </button>
                  <button onClick={() => setView("consumers")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: view === "consumers" ? "#3B82F6" : "rgba(255,255,255,0.1)", color: "white" }}>
                    Afnemers
                  </button>
                </>
              )}
              <button onClick={runPipeline} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: "#10B981", color: "white" }}>
                {fixedCosts.length > 0 ? "↻ Opnieuw" : "▶ Start Demo"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px" }}>
        {/* Pipeline View */}
        {(view === "pipeline" || step === -1) && fixedCosts.length === 0 && (
          <div style={{ marginBottom: 32 }}>
            {step === -1 && (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>PSD2 Vaste Lasten Herkenning</h2>
                <p style={{ color: "#64748B", maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.6, fontSize: 14 }}>
                  Deze demo laat zien hoe je via een PSD2-as-a-Service leverancier (GoCardless/Nordigen sandbox) transacties ophaalt,
                  vaste lasten herkent, categoriseert en omzet naar een herbruikbaar data product.
                </p>
                <button onClick={runPipeline} style={{ padding: "14px 36px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "white", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}>
                  ▶ Start Pipeline Demo
                </button>
              </div>
            )}
            
            {step >= 0 && (
              <div style={{ display: "flex", gap: 8, padding: "20px 0" }}>
                {STEPS.map((s, i) => (
                  <div key={s.key} style={{ flex: 1, padding: "16px", borderRadius: 10, background: i <= step ? (i === step ? "#EFF6FF" : "#F0FDF4") : "white", border: `1.5px solid ${i === step ? "#3B82F6" : i < step ? "#10B981" : "#E2E8F0"}`, transition: "all 0.4s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: i < step ? "#10B981" : i === step ? "#3B82F6" : "#CBD5E1", color: "white" }}>
                        {i < step ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: i <= step ? "#0F172A" : "#94A3B8" }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>{s.desc}</p>
                    {i === step && (
                      <div style={{ marginTop: 8, height: 3, background: "#DBEAFE", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: "60%", height: "100%", background: "#3B82F6", borderRadius: 2, animation: "pulse 1s infinite" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dashboard View */}
        {view === "dashboard" && fixedCosts.length > 0 && (
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "white", borderRadius: 12, padding: "20px", border: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 4px", fontWeight: 500 }}>Maandelijkse vaste lasten</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: 0 }}>{fmt(totalMonthly)}</p>
              </div>
              <div style={{ background: "white", borderRadius: 12, padding: "20px", border: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 4px", fontWeight: 500 }}>Jaarbasis (geschat)</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: 0 }}>{fmt(totalAnnual)}</p>
              </div>
              <div style={{ background: "white", borderRadius: 12, padding: "20px", border: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 4px", fontWeight: 500 }}>Herkende vaste lasten</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: 0 }}>{fixedCosts.length}</p>
              </div>
              <div style={{ background: "white", borderRadius: 12, padding: "20px", border: "1px solid #E2E8F0" }}>
                <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 4px", fontWeight: 500 }}>Categorieën</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: 0 }}>{categoryTotals.length}</p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div style={{ background: "white", borderRadius: 12, padding: "20px 24px", border: "1px solid #E2E8F0", marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 16px" }}>Verdeling per categorie (jaarbasis)</h3>
              <div style={{ display: "flex", gap: 4, height: 32, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                {categoryTotals.map(c => (
                  <div key={c.category} style={{ flex: c.total / totalAnnual, background: c.color, minWidth: 4, transition: "flex 0.6s ease" }} title={`${c.category}: ${fmt(c.total)}`} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {categoryTotals.map(c => (
                  <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                    <span style={{ fontSize: 12, color: "#475569" }}>{c.category} <strong>{fmt(c.total)}</strong> ({c.count}×)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Costs List */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>Herkende vaste lasten</h3>
              </div>
              {fixedCosts.map((fc, i) => (
                <div key={fc.id} style={{ borderBottom: i < fixedCosts.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <div onClick={() => setExpandedCost(expandedCost === fc.id ? null : fc.id)} style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 100px 110px 100px 40px", alignItems: "center", padding: "14px 24px", cursor: "pointer", background: expandedCost === fc.id ? "#F8FAFC" : "transparent" }}>
                    <span style={{ fontSize: 20 }}>{fc.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>{fc.creditor.name}</p>
                      <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{fc.label}</p>
                    </div>
                    <Badge color={fc.color}>{fc.category} / {fc.subcategory}</Badge>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", textAlign: "right" }}>{fmt(fc.currentAmount)}</span>
                    <span style={{ fontSize: 11, color: "#64748B", textAlign: "center" }}>{fc.frequency}</span>
                    <ConfidenceBar value={fc.confidence} />
                    <span style={{ color: "#94A3B8", textAlign: "right", fontSize: 16 }}>{expandedCost === fc.id ? "▲" : "▼"}</span>
                  </div>
                  {expandedCost === fc.id && (
                    <div style={{ padding: "0 24px 16px 64px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Details</p>
                        <div style={{ display: "grid", gap: 4, fontSize: 12, color: "#334155" }}>
                          <div><span style={{ color: "#94A3B8" }}>IBAN:</span> {fc.creditor.iban}</div>
                          <div><span style={{ color: "#94A3B8" }}>Gemiddeld bedrag:</span> {fmt(fc.averageAmount)}</div>
                          <div><span style={{ color: "#94A3B8" }}>Jaarbasis:</span> {fmt(fc.annualizedCost)}</div>
                          <div><span style={{ color: "#94A3B8" }}>Bedrag stabiel:</span> {fc.amountStable ? "✅ Ja" : "⚠️ Nee"}</div>
                          {fc.priceChange && <div><span style={{ color: "#94A3B8" }}>Prijswijziging:</span> {fmt(fc.priceChange.from)} → {fmt(fc.priceChange.to)} ({fc.priceChange.direction === "up" ? "📈" : "📉"})</div>}
                        </div>
                      </div>
                      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Metadata & Planning</p>
                        <div style={{ display: "grid", gap: 4, fontSize: 12, color: "#334155" }}>
                          <div><span style={{ color: "#94A3B8" }}>Laatste betaling:</span> {fc.lastPaymentDate}</div>
                          <div><span style={{ color: "#94A3B8" }}>Verwachte volgende:</span> {fc.expectedNextPayment}</div>
                          <div><span style={{ color: "#94A3B8" }}>Aantal transacties:</span> {fc.transactionCount}</div>
                          <div><span style={{ color: "#94A3B8" }}>MCC:</span> {fc.metadata.merchantCategoryCode}</div>
                          <div><span style={{ color: "#94A3B8" }}>Omschrijving:</span> <span style={{ fontSize: 11 }}>{fc.metadata.remittanceExample}</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* API Output View */}
        {view === "api" && fixedCosts.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>API Response — Data Product Output</h3>
                <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
                  <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>GET /api/v1/customers/&#123;id&#125;/fixed-costs</code>
                </p>
              </div>
              <Badge color="#10B981">200 OK</Badge>
            </div>
            <pre style={{ background: "#0F172A", color: "#E2E8F0", borderRadius: 12, padding: 24, fontSize: 11.5, lineHeight: 1.6, overflow: "auto", maxHeight: "70vh", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {JSON.stringify(apiOutput, null, 2)}
            </pre>
          </div>
        )}

        {/* Consumers View */}
        {view === "consumers" && fixedCosts.length > 0 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 20px" }}>Afnemers van het Data Product</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                {
                  title: "Mijn-omgeving (Portaal)",
                  icon: "👤",
                  desc: "Klant ziet overzicht van alle vaste lasten, verwachte volgende betaling, en kan alerts instellen bij prijswijzigingen.",
                  endpoint: "GET /api/v1/customers/{id}/fixed-costs",
                  fields: ["label", "currentAmount", "frequency", "expectedNextPayment", "priceChange"],
                  color: "#3B82F6",
                },
                {
                  title: "Alert / Mail Service",
                  icon: "🔔",
                  desc: "Automatische notificaties bij: prijswijziging, naderende betaling, nieuwe vaste last herkend, of afwijkend bedrag.",
                  endpoint: "GET /api/v1/customers/{id}/fixed-costs/alerts",
                  fields: ["priceChange", "expectedNextPayment", "amountStable", "confidence"],
                  color: "#F59E0B",
                },
                {
                  title: "Financial Planning (Advisory)",
                  icon: "📊",
                  desc: "Adviseurs krijgen inzicht in totale lasten per categorie en jaarbasis om financieel advies op te baseren.",
                  endpoint: "GET /api/v1/customers/{id}/fixed-costs/summary",
                  fields: ["annualizedCost", "category", "categoryTotals"],
                  color: "#10B981",
                },
                {
                  title: "Risk & Acceptatie",
                  icon: "🛡️",
                  desc: "Bij leningaanvragen: automatisch vaste lasten in kaart brengen voor betaalcapaciteitstoets. Confidence score bepaalt betrouwbaarheid.",
                  endpoint: "GET /api/v1/customers/{id}/fixed-costs/risk-profile",
                  fields: ["annualizedCost", "confidence", "frequency", "transactionCount"],
                  color: "#8B5CF6",
                },
                {
                  title: "Data Analytics / BI",
                  icon: "📈",
                  desc: "Geaggregeerde inzichten: welke categorieën groeien, seizoenspatronen, benchmarking tegen cohorten.",
                  endpoint: "GET /api/v1/analytics/fixed-costs/aggregated",
                  fields: ["category", "subcategory", "averageAmount", "priceChange"],
                  color: "#EC4899",
                },
                {
                  title: "Compliance & Audit",
                  icon: "📋",
                  desc: "Herkomst traceerbaar: PSD2 consent, provider, confidence score, transactie-IDs. GDPR-compliant door design.",
                  endpoint: "GET /api/v1/customers/{id}/fixed-costs/audit-trail",
                  fields: ["source.provider", "source.consent_valid_until", "metadata"],
                  color: "#0EA5E9",
                },
              ].map(consumer => (
                <div key={consumer.title} style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", padding: 24, borderTop: `3px solid ${consumer.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{consumer.icon}</span>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{consumer.title}</h4>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, margin: "0 0 12px" }}>{consumer.desc}</p>
                  <code style={{ display: "block", background: "#F8FAFC", padding: "8px 12px", borderRadius: 6, fontSize: 11, color: "#475569", marginBottom: 8 }}>
                    {consumer.endpoint}
                  </code>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {consumer.fields.map(f => (
                      <span key={f} style={{ fontSize: 10, background: consumer.color + "15", color: consumer.color, padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; width: 30%; }
          50% { opacity: 0.7; width: 80%; }
        }
      `}</style>
    </div>
  );
}
