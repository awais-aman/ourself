import { GraphQLError, Kind } from "graphql";

// The deepest real query (menu > category > items > field) is 4 levels and
// the full menu is about 55 fields, so these leave headroom while stopping
// alias floods and deeply nested fragments before any resolver runs.
export const MAX_DEPTH = 5;
export const MAX_FIELDS = 150;

function measure(selectionSet, fragments, depth, seen, totals) {
  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      // Introspection is gated separately; its own query is deliberately deep.
      if (selection.name.value.startsWith("__")) continue;
      totals.fields += 1;
      totals.depth = Math.max(totals.depth, depth);
      if (selection.selectionSet) {
        measure(selection.selectionSet, fragments, depth + 1, seen, totals);
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      measure(selection.selectionSet, fragments, depth, seen, totals);
    } else {
      const name = selection.name.value;
      const fragment = fragments[name];
      // Unknown and cyclic fragments are reported by graphql's own rules.
      if (!fragment || seen.has(name)) continue;
      measure(fragment.selectionSet, fragments, depth, new Set(seen).add(name), totals);
    }
  }
}

export function queryLimitsRule({ maxDepth = MAX_DEPTH, maxFields = MAX_FIELDS } = {}) {
  return (context) => {
    const fragments = Object.fromEntries(
      context
        .getDocument()
        .definitions.filter((d) => d.kind === Kind.FRAGMENT_DEFINITION)
        .map((d) => [d.name.value, d]),
    );
    return {
      OperationDefinition(operation) {
        const totals = { depth: 0, fields: 0 };
        measure(operation.selectionSet, fragments, 1, new Set(), totals);
        if (totals.depth > maxDepth) {
          context.reportError(
            new GraphQLError(`Query depth ${totals.depth} exceeds the limit of ${maxDepth}.`, { nodes: [operation] }),
          );
        }
        if (totals.fields > maxFields) {
          context.reportError(
            new GraphQLError(`Query selects ${totals.fields} fields; the limit is ${maxFields}.`, { nodes: [operation] }),
          );
        }
      },
    };
  };
}
