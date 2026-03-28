type TokenMap = Record<string, string>;

type ScrubResult = {
  scrubbed: string;
  tokens: TokenMap;
};

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const cardPattern = /\b(?:\d[ -]*?){13,16}\b/g;
const phonePattern = /\b(?:\+?\d{1,3}[- ]?)?\d{10}\b/g;
const personPattern =
  /\b(?:my name is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g;

export function scrubSensitiveText(input: string) {
  let output = input;
  const tokens: TokenMap = {};
  let counter = 1;

  function replaceWithToken(pattern: RegExp, label: string) {
    output = output.replace(pattern, (value) => {
      const token = `[[PII_${label}_${counter++}]]`;
      tokens[token] = value;
      return token;
    });
  }

  replaceWithToken(emailPattern, "EMAIL");
  replaceWithToken(cardPattern, "CARD");
  replaceWithToken(phonePattern, "PHONE");

  output = output.replace(personPattern, (full, capturedName: string) => {
    if (!capturedName) return full;
    const token = `[[PII_NAME_${counter++}]]`;
    tokens[token] = capturedName;
    return full.replace(capturedName, token);
  });

  return {
    scrubbed: output,
    tokens,
  } satisfies ScrubResult;
}

export function scrubTextBatch(texts: string[]) {
  const mergedTokens: TokenMap = {};
  const scrubbed = texts.map((text) => {
    const result = scrubSensitiveText(text);
    Object.assign(mergedTokens, result.tokens);
    return result.scrubbed;
  });
  return { scrubbed, tokens: mergedTokens };
}

export function unmaskSensitiveText(input: string, tokens: TokenMap) {
  let output = input;
  for (const [token, value] of Object.entries(tokens)) {
    output = output.split(token).join(value);
  }
  return output;
}
