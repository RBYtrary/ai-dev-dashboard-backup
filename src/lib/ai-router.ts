/**
 * src/lib/ai-router.ts
 *
 * Config-driven AI intent router.
 * Classifies a user message into an intent, then selects the
 * appropriate system prompt, model override, and future tool set.
 *
 * DESIGN PRINCIPLE:
 * Routes are data (RouteConfig[]), not code (switch statements).
 * Adding a new route = adding one object to ROUTE_REGISTRY.
 * No routing logic lives outside this file.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Intent =
  | "chat"      // general conversation (fallback)
  | "code"      // code generation, review, refactor
  | "debug"     // error analysis, fix generation
  | "analysis"  // research, comparison, explanation
  | "search"    // future: web/doc search
  | "image"     // future: image generation
  | "terminal"  // future: terminal command reasoning
  | "agent";    // future: multi-step autonomous task

/**
 * Placeholder for future tool calling.
 * Schema intentionally minimal — expand when implementing tools.
 */
export type ToolDefinition = {
  name: string;
  description: string;
  // future: parameters: ZodSchema | JSONSchema7;
  // future: execute?: (args: unknown) => Promise<unknown>;
};

/**
 * A single route definition.
 * Routes are tested in descending priority order.
 * First match wins. Empty patterns[] = fallback (always matches last).
 */
export type RouteConfig = {
  /** Stable identifier for this route — used in logs and future admin UI */
  id: string;
  intent: Intent;
  /** Higher = checked first. Fallback route must be priority 0. */
  priority: number;
  /**
   * Array of RegExp patterns. At least ONE must match for this route
   * to fire. Empty array means this route only fires as the fallback.
   */
  patterns: RegExp[];
  /** Override MODEL_DEFAULT for this route only. undefined = use env default. */
  model?: string;
  /** Override MODEL_PROVIDER for this route only. undefined = use env default. */
  provider?: string;
  systemPrompt: string;
  tools?: ToolDefinition[];
  /** Route-specific overrides for model parameters */
  temperature?: number;
  maxTokens?: number;
};

export type RoutingResult = {
  intent: Intent;
  routeId: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  /** undefined = use MODEL_DEFAULT env var */
  model?: string;
  /** undefined = use MODEL_PROVIDER env var */
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  /**
   * How the intent was determined.
   * "pattern" = matched a RegExp.
   * "default"  = no pattern matched; fallback route used.
   * "llm"      = future: secondary LLM classification pass.
   * "override" = caller explicitly passed providerOverride/modelOverride.
   */
  confidence: "pattern" | "default" | "llm" | "override";
};

export type RouterOptions = {
  /** Force a specific provider for this request only */
  providerOverride?: string;
  /** Force a specific model for this request only */
  modelOverride?: string;
};

// ─── Route registry ───────────────────────────────────────────────────────────
// Routes are tested in descending priority order.
// To add a new route: push a new RouteConfig object here.
// To change routing behavior: edit the patterns or systemPrompt here.
// Nothing else needs to change.

const ROUTE_REGISTRY: RouteConfig[] = [
  {
    id: "debug",
    intent: "debug",
    priority: 100,
    patterns: [
      /\b(error|bug|fix|broken|failing|crash|exception|stacktrace)\b/i,
      /\b(typescript|build|compile|deploy|vercel|lint)\s*(error|fail|issue|problem)\b/i,
      /\b(why (is|isn'?t|doesn'?t|won'?t)|can'?t (run|build|start|compile|deploy))\b/i,
      /\b(undefined|null|NaN|cannot read|is not a function|type error)\b/i,
    ],
    systemPrompt: `You are a senior TypeScript/Next.js engineer performing root-cause analysis.

PROCESS:
1. Identify the exact error type and location
2. Explain why it's happening (not just what)
3. Provide the minimal targeted fix
4. Note any secondary issues the fix might expose

RULES:
- Prefer minimal targeted changes over rewrites
- Always include the corrected code block
- Flag if the fix has side effects
- Use TypeScript types in all examples`,
    temperature: 0.2,
    maxTokens: 3000,
  },

  {
    id: "code",
    intent: "code",
    priority: 90,
    patterns: [
      /\b(write|create|generate|implement|add|build)\b.{0,40}\b(function|component|hook|api|route|class|type|interface)\b/i,
      /\b(refactor|improve|optimize|clean up|rewrite)\b/i,
      /\b(how (to|do (i|you))|can you)\b.{0,60}\b(code|implement|build|create|add|write)\b/i,
      /\b(unit test|integration test|e2e test|jest|vitest|playwright)\b/i,
    ],
    systemPrompt: `You are a senior software engineer working inside a Next.js 14 App Router project with TypeScript.

CONTEXT:
- App Router (not Pages Router)
- Server Components by default; "use client" only when necessary
- TypeScript strict mode
- @/* alias maps to ./src/*

RULES:
- Always include proper TypeScript types
- Respect Server/Client component boundaries
- Follow existing patterns in the codebase
- Return complete, production-ready code
- Comment non-obvious decisions`,
    temperature: 0.3,
    maxTokens: 4000,
  },

  {
    id: "analysis",
    intent: "analysis",
    priority: 70,
    patterns: [
      /\b(analyze|analyse|explain|compare|evaluate|assess|review|audit)\b/i,
      /\b(what (is|are|does|do)|why (does|should|would)|how (does|should|would))\b/i,
      /\b(difference between|pros (and|vs) cons|trade.?off|best (practice|approach|way))\b/i,
    ],
    systemPrompt: `You are a senior technical advisor providing structured analysis.

FORMAT:
- Use headers for distinct sections
- Bullet points for lists of items
- Code blocks for any code references
- Be specific and actionable

STYLE:
- Lead with the most important finding
- Distinguish between facts and recommendations
- Quantify when possible ("~30% slower" not "slower")`,
    temperature: 0.5,
    maxTokens: 2000,
  },

  // ── Future route stubs ──────────────────────────────────────────────────────
  // These are registered but will never match until patterns are added.
  // They document the intended routing for Phase 2+ features.
  {
    id: "image",
    intent: "image",
    priority: 85,
    patterns: [], // future: /\b(generate|create|make|draw)\b.{0,30}\b(image|photo|picture|illustration)\b/i
    systemPrompt: "Image generation module — not yet activated.",
    maxTokens: 200,
  },
  {
    id: "terminal",
    intent: "terminal",
    priority: 80,
    patterns: [], // future: /\b(run|execute|terminal|shell|command|npm|git)\b/i
    systemPrompt: "Terminal reasoning module — not yet activated.",
    maxTokens: 500,
  },

  // ── Fallback (must be last, priority 0) ────────────────────────────────────
  {
    id: "chat",
    intent: "chat",
    priority: 0,
    patterns: [], // empty = matches everything not caught above
    systemPrompt: `You are an AI development assistant embedded in AI Dev OS — an experimental self-aware development platform built with Next.js.

You help developers:
- Understand and navigate their codebase
- Debug TypeScript and Next.js issues
- Design new features and architecture
- Write and review code

Be concise, technically precise, and direct.
Ask for clarification before making assumptions about requirements.`,
    temperature: 0.7,
    maxTokens: 2000,
  },
];

// ─── Internal classifier ──────────────────────────────────────────────────────

function classifyByPattern(message: string): RouteConfig | null {
  const candidates = [...ROUTE_REGISTRY]
    .filter((r) => r.patterns.length > 0)
    .sort((a, b) => b.priority - a.priority);

  for (const route of candidates) {
    if (route.patterns.some((p) => p.test(message))) {
      return route;
    }
  }
  return null;
}

function getFallback(): RouteConfig {
  const fallback = ROUTE_REGISTRY.find((r) => r.id === "chat");
  if (!fallback) {
    throw new Error("[ai-router] No fallback 'chat' route in ROUTE_REGISTRY");
  }
  return fallback;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Classify a message and return routing metadata.
 * This is the primary entry point — all AI requests go through here.
 */
export function route(
  message: string,
  options: RouterOptions = {}
): RoutingResult {
  const matched = classifyByPattern(message);
  const config = matched ?? getFallback();
  const hasOverride = !!(options.providerOverride || options.modelOverride);

  return {
    intent: config.intent,
    routeId: config.id,
    systemPrompt: config.systemPrompt,
    tools: config.tools ?? [],
    model: options.modelOverride ?? config.model,
    provider: options.providerOverride ?? (config.provider as any),
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    confidence: hasOverride ? "override" : matched ? "pattern" : "default",
  };
}

/** Inspect the registry — for future admin/debug UI */
export function getRegistry(): readonly RouteConfig[] {
  return ROUTE_REGISTRY;
}

export function getRouteById(id: string): RouteConfig | undefined {
  return ROUTE_REGISTRY.find((r) => r.id === id);
}
