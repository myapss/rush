// TEST-ONLY mock of the Anthropic Messages API for end-to-end tests.
// Recipe requests get canned ideas built from the food codes in the prompt;
// any other request (e.g. the meal planner) gets a 400 so the app's
// non-AI fallback runs.
import { createServer } from "node:http";

const port = Number(process.env.MOCK_ANTHROPIC_PORT ?? 3999);

function codeFor(prompt, name) {
  const m = prompt.match(new RegExp(`(F\\d+): ${name} \\(`));
  return m?.[1];
}

createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    if (req.method !== "POST" || !req.url.startsWith("/v1/messages")) {
      res.writeHead(req.url === "/health" ? 200 : 404).end();
      return;
    }
    const json = JSON.parse(body || "{}");
    const system = typeof json.system === "string" ? json.system : JSON.stringify(json.system ?? "");
    if (!system.includes("recipe assistant")) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "mock: unsupported request" } }));
      return;
    }
    const prompt = String(json.messages?.[0]?.content ?? "");
    const meal = prompt.match(/Meal: (\w+)/)?.[1];
    const rice = codeFor(prompt, "TEST rice");
    const beans = codeFor(prompt, "TEST beans");
    const spinach = codeFor(prompt, "TEST spinach");
    const recipes = [
      {
        title: "TEST Mock bean and rice bowl",
        description: "A simple bowl from the mock model.",
        meal_type: meal && meal !== "any" ? meal : "lunch",
        servings: 2,
        prep_minutes: 10,
        cook_minutes: 15,
        ingredients: [
          { food: rice, grams: 300, amount: "2 cups", note: "" },
          { food: beans, grams: 200, amount: "1 cup", note: "rinsed" },
          { food: spinach, grams: 100, amount: "3 cups", note: "" },
        ],
        steps: ["Warm the beans for 5 minutes.", "Wilt the spinach.", "Serve over the rice."],
        substitutions: [{ instead_of: spinach, use: beans, tip: "More beans for extra protein." }],
      },
      {
        title: "TEST Invalid idea",
        description: "Uses an ingredient code that doesn't exist; must be rejected.",
        meal_type: "lunch",
        servings: 1,
        prep_minutes: 5,
        cook_minutes: 5,
        ingredients: [{ food: "F999", grams: 100, amount: "", note: "" }, { food: rice, grams: 200, amount: "", note: "" }],
        steps: ["Mix."],
        substitutions: [],
      },
    ];
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        id: "msg_mock",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [{ type: "text", text: JSON.stringify({ recipes }) }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 600, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      }),
    );
  });
}).listen(port, "127.0.0.1", () => console.log(`mock anthropic on ${port}`));
