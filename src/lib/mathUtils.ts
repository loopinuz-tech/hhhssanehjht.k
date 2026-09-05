/**
 * Evaluates a string math expression (e.g. "4/9", "3/7", "2*sqrt(30)/3", "14*sqrt(30)") to a number if possible.
 */
export const evalMathExpression = (str: string): number | null => {
   if (!str) return null;
   let clean = String(str).trim().toLowerCase();
   clean = clean.replace(/\x0Crac/g, "\\frac").replace(/\x0C/g, "\\f");
   clean = clean.replace(/^\$\$?|\$\$?$/g, "").trim();

   // Convert LaTeX fractions \frac{a}{b} or \dfrac{a}{b} to (a)/(b)
   clean = clean.replace(/\\d?frac\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, "($1)/($2)");
   clean = clean.replace(/\\d?frac\s*([0-9a-zA-Z]+)\s*([0-9a-zA-Z]+)/gi, "($1)/($2)");
   // Convert LaTeX sqrt \sqrt{x} to sqrt(x)
   clean = clean.replace(/\\sqrt\s*\{([^}]+)\}/gi, "sqrt($1)");
   clean = clean.replace(/\\sqrt\s*(\d+)/gi, "sqrt($1)");
   clean = clean.replace(/\\cdot|\\times/gi, "*");
   clean = clean.replace(/\s+/g, "");

   // Check direct float
   const direct = parseFloat(clean);
   if (!isNaN(direct) && String(direct) === clean) return direct;

   // Check fraction simple a/b
   const fracMatch = clean.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
   if (fracMatch) {
      const num = parseFloat(fracMatch[1]);
      const den = parseFloat(fracMatch[2]);
      if (den !== 0) return num / den;
   }

   // Check mult * sqrt(x) / den or mult * sqrt(x)
   const sqrtMatch = clean.match(/^([+-]?\d*(?:\.\d+)?)?\*?sqrt\((\d+(?:\.\d+)?)\)(?:\/([+-]?\d+(?:\.\d+)?))?$/);
   if (sqrtMatch) {
      const multStr = sqrtMatch[1];
      let mult = 1;
      if (multStr === "-") mult = -1;
      else if (multStr === "+") mult = 1;
      else if (multStr) mult = parseFloat(multStr);

      const rad = parseFloat(sqrtMatch[2]);
      const den = sqrtMatch[3] ? parseFloat(sqrtMatch[3]) : 1;
      if (den !== 0 && !isNaN(rad)) return (mult * Math.sqrt(rad)) / den;
   }

   return isNaN(direct) ? null : direct;
};

/**
 * Normalizes math expressions and LaTeX strings for comparison.
 */
export const normalizeMathAnswer = (val: any): string => {
   if (val === undefined || val === null) return "";
   let str = String(val).trim().toLowerCase();
   if (!str) return "";

   // Fix Form Feed \x0C produced by JS string escape of \frac
   str = str.replace(/\x0Crac/g, "\\frac").replace(/\x0C/g, "\\f");

   // Remove outer math delimiters $ or $$ if present
   str = str.replace(/^\$\$?|\$\$?$/g, "").trim();

   // Normalize LaTeX fractions: \frac{a}{b} or \dfrac{a}{b} -> (a)/(b)
   str = str.replace(/\\d?frac\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, "($1)/($2)");
   str = str.replace(/\\d?frac\s*([0-9a-zA-Z]+)\s*([0-9a-zA-Z]+)/gi, "($1)/($2)");

   // Normalize LaTeX square root: \sqrt{x} or \sqrt{10} -> sqrt(x)
   str = str.replace(/\\sqrt\s*\{([^}]+)\}/gi, "sqrt($1)");
   str = str.replace(/\\sqrt\s*(\d+|\w+)/gi, "sqrt($1)");

   // Normalize multiplications: \cdot, \times -> *
   str = str.replace(/\\cdot|\\times/gi, "*");

   // Normalize parens: \left(, \right) -> (, )
   str = str.replace(/\\left\(|\\right\)/gi, (m) => m.includes("left") ? "(" : ")");
   str = str.replace(/\\left\[|\\right\]/gi, (m) => m.includes("left") ? "[" : "]");

   // Remove remaining LaTeX backslashes for simple symbols (e.g. \pi -> pi)
   str = str.replace(/\\([a-zA-Z]+)/g, "$1");

   // Strip parentheses surrounding single numbers or simple terms: (4)/(9) -> 4/9
   str = str.replace(/\(([^()]+)\)\/\(([^()]+)\)/g, "$1/$2");
   str = str.replace(/\(([^()]+)\)\/([^()]+)/g, "$1/$2");
   str = str.replace(/([^()]+)\/\(([^()]+)\)/g, "$1/$2");

   // Remove unnecessary spaces around operators and inside math
   str = str.replace(/\s+/g, "");

   return str;
};

/**
 * Checks if user math/text answer matches correct answer, handling LaTeX,
 * math equivalence, space differences, and multiple acceptable variants.
 */
export const isMathAnswerCorrect = (userAns: any, corrAns: any): boolean => {
   if (userAns === undefined || userAns === null || corrAns === undefined || corrAns === null) return false;

   let uRaw = String(userAns).trim().replace(/\x0Crac/g, "\\frac").replace(/\x0C/g, "\\f");
   if (!uRaw) return false;

   // Handle if corrAns is array or string with variants
   let corrVariants: string[] = [];
   if (Array.isArray(corrAns)) {
      corrVariants = corrAns.map(v => String(v).replace(/\x0Crac/g, "\\frac").replace(/\x0C/g, "\\f"));
   } else if (typeof corrAns === "string") {
      const sanitizedCorr = String(corrAns).replace(/\x0Crac/g, "\\frac").replace(/\x0C/g, "\\f");
      corrVariants = sanitizedCorr.split(/,|\n|;|\||\byoki\b|\bor\b/i).map(v => v.trim()).filter(Boolean);
      if (corrVariants.length === 0) corrVariants = [sanitizedCorr];
   } else {
      corrVariants = [String(corrAns)];
   }

   const uNorm = normalizeMathAnswer(uRaw);
   const uNum = evalMathExpression(uRaw);

   for (const variant of corrVariants) {
      const cRaw = variant.trim();
      if (!cRaw) continue;

      // 1. Direct raw string comparison (case-insensitive, trimmed)
      if (uRaw.toLowerCase() === cRaw.toLowerCase()) return true;

      // 2. Normalized math comparison
      const cNorm = normalizeMathAnswer(cRaw);
      if (uNorm && cNorm && uNorm === cNorm) return true;

      // 3. Remove all spaces comparison
      if (uRaw.replace(/\s+/g, "").toLowerCase() === cRaw.replace(/\s+/g, "").toLowerCase()) return true;

      // 4. Numeric evaluation comparison (e.g. 4/9 vs \frac{4}{9})
      const cNum = evalMathExpression(cRaw);
      if (uNum !== null && cNum !== null && !isNaN(uNum) && !isNaN(cNum)) {
         if (Math.abs(uNum - cNum) < 1e-5) return true;
      }
   }

   return false;
};

/**
 * Parses written / fill_blanks answer objects, arrays, JSON strings, or formatted strings into { a, b }
 */
export const parseWrittenAnswer = (raw: any): { a: string; b: string } => {
   if (raw === undefined || raw === null) return { a: "", b: "" };

   let obj = raw;
   if (typeof raw === "string") {
      const trimmed = raw.trim();
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
         try {
            obj = JSON.parse(trimmed);
         } catch {
            obj = trimmed;
         }
      }
   }

   // 1. Handle Array: ["1", "4/9"] or ["p^2/96", "3/7"]
   if (Array.isArray(obj)) {
      const aVal = obj[0] !== undefined && obj[0] !== null ? String(obj[0]).trim() : "";
      const bVal = obj[1] !== undefined && obj[1] !== null ? String(obj[1]).trim() : "";

      let a = aVal;
      let b = bVal;
      const matchA = aVal.match(/^[aA][\).\s]+(.*)/);
      if (matchA) a = matchA[1].trim();

      const matchB = bVal.match(/^[bB][\).\s]+(.*)/);
      if (matchB) b = matchB[1].trim();

      return { a, b };
   }

   // 2. Handle Object: { a: "1", b: "4/9" } or { "1": "1", "2": "4/9" } or { "0": "1", "1": "4/9" }
   if (typeof obj === "object" && obj !== null) {
      const aVal = obj.a ?? obj.A ?? obj["1"] ?? obj["0"] ?? "";
      const bVal = obj.b ?? obj.B ?? obj["2"] ?? (obj["0"] !== undefined ? obj["1"] : "") ?? "";

      let a = aVal !== undefined && aVal !== null ? String(aVal).trim() : "";
      let b = bVal !== undefined && bVal !== null ? String(bVal).trim() : "";

      const matchA = a.match(/^[aA][\).\s]+(.*)/);
      if (matchA) a = matchA[1].trim();

      const matchB = b.match(/^[bB][\).\s]+(.*)/);
      if (matchB) b = matchB[1].trim();

      return { a, b };
   }

   // 3. Handle String
   if (typeof obj === "string") {
      let str = obj.trim();

      // Format: "a) 1 b) 4/9" or "a: 1, b: 4/9" or "a=1, b=4/9"
      const abMatch = str.match(/(?:a\s*[:=\)]\s*)([^b]+)(?:b\s*[:=\)]\s*)(.+)/i);
      if (abMatch) {
         return { a: abMatch[1].trim(), b: abMatch[2].trim() };
      }

      // Format: "a) 1" or "b) 4/9"
      const aOnly = str.match(/a\s*[:=\)]\s*([^,;]+)/i);
      const bOnly = str.match(/b\s*[:=\)]\s*([^,;]+)/i);
      if (aOnly || bOnly) {
         return {
            a: aOnly ? aOnly[1].trim() : "",
            b: bOnly ? bOnly[1].trim() : "",
         };
      }

      // Formats with delimiters: "1; 4/9" or "1 | 4/9" or "1 \n 4/9"
      if (str.includes(";") || str.includes("|") || str.includes("\n")) {
         const parts = str.split(/;|\||\n/).map(s => s.trim()).filter(Boolean);
         if (parts.length >= 2) {
            return { a: parts[0], b: parts[1] };
         }
      }

      return { a: str, b: "" };
   }

   return { a: String(raw).trim(), b: "" };
};
