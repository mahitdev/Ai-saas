import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { semanticMetric } from "@/db/schema";

type MetricInput = Record<string, number>;

type MetricDef = {
  metricKey: string;
  displayName: string;
  formula: string;
  description: string;
};

const defaultMetrics: MetricDef[] = [
  {
    metricKey: "total_profit",
    displayName: "Total Profit",
    formula: "revenue - cogs",
    description: "Business profit after cost of goods sold.",
  },
  {
    metricKey: "gross_margin_pct",
    displayName: "Gross Margin %",
    formula: "((revenue - cogs) / revenue) * 100",
    description: "Gross margin as a percentage of revenue.",
  },
  {
    metricKey: "runway_months",
    displayName: "Runway (months)",
    formula: "cash_balance / monthly_burn",
    description: "Estimated runway based on current burn.",
  },
];

export async function ensureDefaultSemanticMetrics(userId: string) {
  const existing = await db
    .select({ id: semanticMetric.id })
    .from(semanticMetric)
    .where(eq(semanticMetric.userId, userId))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(semanticMetric).values(
    defaultMetrics.map((metric) => ({
      id: crypto.randomUUID(),
      userId,
      metricKey: metric.metricKey,
      displayName: metric.displayName,
      formula: metric.formula,
      description: metric.description,
      active: true,
    })),
  );
}

export async function listSemanticMetrics(userId: string) {
  await ensureDefaultSemanticMetrics(userId);
  return db
    .select({
      id: semanticMetric.id,
      metricKey: semanticMetric.metricKey,
      displayName: semanticMetric.displayName,
      formula: semanticMetric.formula,
      description: semanticMetric.description,
      active: semanticMetric.active,
      updatedAt: semanticMetric.updatedAt,
    })
    .from(semanticMetric)
    .where(and(eq(semanticMetric.userId, userId), eq(semanticMetric.active, true)));
}

function sanitizeFormula(formula: string) {
  return formula.replace(/[^a-zA-Z0-9_+\-*/().\s]/g, "");
}

export function evaluateFormula(formula: string, input: MetricInput) {
  const safeFormula = sanitizeFormula(formula);
  const replacements = Object.entries(input).map(([key, value]) => [key, String(value)] as const);

  let expression = safeFormula;
  for (const [key, value] of replacements) {
    const pattern = new RegExp(`\\b${key}\\b`, "g");
    expression = expression.replace(pattern, value);
  }

  if (/[^0-9+\-*/().\s]/.test(expression)) {
    throw new Error("Formula contains unresolved variables.");
  }

  return evaluateNumericExpression(expression);
}

function evaluateNumericExpression(expression: string) {
  const tokens = expression.match(/\d+(?:\.\d+)?|[()+\-*/]/g);
  if (!tokens) throw new Error("Formula evaluation failed.");

  const values: number[] = [];
  const operators: string[] = [];

  function precedence(operator: string) {
    if (operator === "+" || operator === "-") return 1;
    if (operator === "*" || operator === "/") return 2;
    return 0;
  }

  function applyOperator() {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (!operator || right === undefined || left === undefined) {
      throw new Error("Formula evaluation failed.");
    }
    if (operator === "+") values.push(left + right);
    else if (operator === "-") values.push(left - right);
    else if (operator === "*") values.push(left * right);
    else if (operator === "/") values.push(right === 0 ? 0 : left / right);
  }

  for (const token of tokens) {
    if (/^\d/.test(token)) {
      values.push(Number(token));
      continue;
    }
    if (token === "(") {
      operators.push(token);
      continue;
    }
    if (token === ")") {
      while (operators.length > 0 && operators[operators.length - 1] !== "(") {
        applyOperator();
      }
      operators.pop();
      continue;
    }
    while (
      operators.length > 0 &&
      operators[operators.length - 1] !== "(" &&
      precedence(operators[operators.length - 1]) >= precedence(token)
    ) {
      applyOperator();
    }
    operators.push(token);
  }

  while (operators.length > 0) {
    applyOperator();
  }

  if (values.length !== 1 || !Number.isFinite(values[0])) {
    throw new Error("Formula evaluation failed.");
  }

  return values[0];
}
