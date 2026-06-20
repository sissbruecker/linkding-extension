const MAX_EXISTING_TAGS = 80;
const MIN_SUGGESTED_TAGS = 3;
const MAX_SUGGESTED_TAGS = 5;
const MAX_DESCRIPTION_LENGTH = 220;
const AI_REQUEST_TIMEOUT_MS = 12000;
const AI_TIMEOUT_MESSAGE = "AI timed out. Edit manually or retry.";
const AI_ERROR_MESSAGE = "AI unavailable. Edit manually or retry.";
const AI_INVALID_RESPONSE_MESSAGE = "AI response invalid. Edit manually.";

export function isAiSuggestionConfigured(configuration) {
  return (
    configuration?.aiSuggestionsEnabled &&
    configuration?.aiEndpoint &&
    configuration?.aiModel
  );
}

export async function suggestBookmarkMetadata(configuration, context) {
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(
    () => abortController.abort(),
    AI_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(configuration.aiEndpoint, {
      method: "POST",
      headers: buildHeaders(configuration),
      signal: abortController.signal,
      body: JSON.stringify({
        model: configuration.aiModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `You suggest metadata for bookmarks from concise page context. Return only valid JSON with the shape {"tags":["tag-name"],"description":"one sentence"}. Suggest ${MIN_SUGGESTED_TAGS} to ${MAX_SUGGESTED_TAGS} distinct tags. Keep tags lowercase, without spaces, and prefer existing tag names when they fit.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              url: context.url,
              title: context.title,
              currentDescription: context.description,
              currentTags: context.tags,
              linkdingAutoTags: context.autoTags,
              pageExcerpt: context.pageExcerpt,
              requestedTagCount: {
                min: MIN_SUGGESTED_TAGS,
                max: MAX_SUGGESTED_TAGS,
              },
              existingTags: getRelevantExistingTags(context),
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(AI_ERROR_MESSAGE);
    }

    const body = await response.json();
    return normalizeSuggestion(parseCompletionContent(body));
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error(AI_TIMEOUT_MESSAGE);
    }

    if (
      e.message === AI_ERROR_MESSAGE ||
      e.message === AI_INVALID_RESPONSE_MESSAGE
    ) {
      throw e;
    }

    throw new Error(AI_ERROR_MESSAGE);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function buildHeaders(configuration) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (configuration.aiApiKey) {
    headers.Authorization = `Bearer ${configuration.aiApiKey}`;
  }

  return headers;
}

function parseCompletionContent(body) {
  const content = body?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(AI_INVALID_RESPONSE_MESSAGE);
  }

  try {
    return JSON.parse(content);
  } catch (_) {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(AI_INVALID_RESPONSE_MESSAGE);
    }
    return JSON.parse(match[0]);
  }
}

function normalizeSuggestion(suggestion) {
  return {
    tags: normalizeTags(suggestion?.tags),
    description: normalizeDescription(suggestion?.description),
  };
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set();
  return tags
    .map((tag) =>
      String(tag || "")
        .trim()
        .replace(/^#/, "")
        .replace(/\s+/g, "-")
        .toLowerCase(),
    )
    .filter((tag) => {
      if (!tag || seen.has(tag)) {
        return false;
      }
      seen.add(tag);
      return true;
    })
    .slice(0, MAX_SUGGESTED_TAGS);
}

function normalizeDescription(description) {
  return String(description || "")
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH);
}

function getRelevantExistingTags(context) {
  const availableTags = context.availableTags || [];
  const searchText = [
    context.url,
    context.title,
    context.description,
    context.pageExcerpt,
  ]
    .join(" ")
    .toLowerCase();
  const matchingTags = availableTags.filter((tag) => {
    const lowerTag = tag.toLowerCase();
    const normalizedTag = tag.toLowerCase().replace(/[-_]/g, " ");
    return searchText.includes(normalizedTag) || searchText.includes(lowerTag);
  });

  return (matchingTags.length ? matchingTags : availableTags).slice(
    0,
    MAX_EXISTING_TAGS,
  );
}
