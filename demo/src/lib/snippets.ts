/**
 * Turns the options a playground is showing into code a reader can paste:
 * vanilla JS, React and Ember versions of the same chart.
 */

export interface SnippetInput {
  /** Chart class in the core package: "LineChart". */
  className: string;
  /** React component: "CyberLineChart". */
  reactName: string;
  /** Name the Ember modifier takes: "line". */
  emberType: string;
  /** Options to print, without the data. */
  options: Record<string, unknown>;
  /** The option that carries the data: "data", "thresholds". */
  dataKey: string;
  data: unknown;
  /** Height the examples give the container, or null for an inline chart. */
  height: number | null;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFlat(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.every((item) => !isRecord(item) && !Array.isArray(item));
  }
  if (isRecord(value)) {
    return Object.values(value).every((item) => !isRecord(item) && !Array.isArray(item));
  }
  return true;
}

function quote(text: string): string {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Prints a value as a JavaScript literal: unquoted keys, single quotes. */
export function toJs(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  const inner = '  '.repeat(indent + 1);

  if (typeof value === 'string') {
    return quote(value);
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? 'NaN' : String(value);
  }
  if (typeof value === 'boolean' || value === null || value === undefined) {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    if (isFlat(value)) {
      return `[${value.map((item) => toJs(item)).join(', ')}]`;
    }
    return `[\n${value.map((item) => `${inner}${toJs(item, indent + 1)},`).join('\n')}\n${pad}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (entries.length === 0) {
      return '{}';
    }
    const key = (name: string) => (IDENTIFIER.test(name) ? name : quote(name));
    if (isFlat(value)) {
      return `{ ${entries.map(([name, item]) => `${key(name)}: ${toJs(item)}`).join(', ')} }`;
    }
    return `{\n${entries
      .map(([name, item]) => `${inner}${key(name)}: ${toJs(item, indent + 1)},`)
      .join('\n')}\n${pad}}`;
  }
  return 'undefined';
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

/** Top-level `const` declarations for the data and every non-primitive option. */
function declarations(input: SnippetInput, includeOptions: boolean): string {
  const lines = [`const ${input.dataKey} = ${toJs(input.data)};`];
  if (includeOptions) {
    for (const [name, value] of Object.entries(input.options)) {
      if (!isPrimitive(value)) {
        lines.push(`const ${name} = ${toJs(value)};`);
      }
    }
  }
  return lines.join('\n');
}

export function vanillaSnippet(input: SnippetInput): string {
  const options = Object.entries(input.options)
    .map(([name, value]) => `  ${name}: ${toJs(value, 1)},`)
    .join('\n');
  const sizing =
    input.height === null
      ? '// <span id="chart"></span>'
      : `// <div id="chart" style="height: ${input.height}px"></div>`;

  return `import { ${input.className} } from 'cybercore-charts';

${declarations(input, false)}

${sizing}
const chart = new ${input.className}('#chart', {
  ${input.dataKey},
${options}
});

// Later: chart.update(newData), chart.setOptions({ … }), chart.destroy()`;
}

function jsxProp(name: string, value: unknown): string {
  if (value === true) {
    return name;
  }
  if (typeof value === 'string') {
    return `${name}=${JSON.stringify(value)}`;
  }
  return `${name}={${toJs(value, 3)}}`;
}

export function reactSnippet(input: SnippetInput): string {
  const props = [
    `${input.dataKey}={${input.dataKey}}`,
    ...Object.entries(input.options).map(([name, value]) => jsxProp(name, value)),
    ...(input.height === null ? [] : [`style={{ height: ${input.height} }}`]),
  ];

  return `import { ${input.reactName} } from 'cybercore-charts/react';

${declarations(input, false)}

export function Chart() {
  return (
    <${input.reactName}
${props.map((prop) => `      ${prop}`).join('\n')}
    />
  );
}`;
}

function emberArg(name: string, value: unknown): string {
  if (typeof value === 'string') {
    return `${name}=${JSON.stringify(value)}`;
  }
  // Objects and arrays are module-level constants, referenced by name.
  return isPrimitive(value) ? `${name}=${String(value)}` : `${name}=${name}`;
}

export function emberSnippet(input: SnippetInput): string {
  const args = [
    `${input.dataKey}=${input.dataKey}`,
    ...Object.entries(input.options).map(([name, value]) => emberArg(name, value)),
  ];
  const tag = input.height === null ? 'span' : 'div';
  const style = input.height === null ? '' : ` style="height: ${input.height}px"`;

  return `import { cyberChart } from 'cybercore-charts/ember';

${declarations(input, true)}

<template>
  <${tag}${style}
    {{cyberChart "${input.emberType}"
${args.map((arg) => `      ${arg}`).join('\n')}
    }}
  ></${tag}>
</template>`;
}
