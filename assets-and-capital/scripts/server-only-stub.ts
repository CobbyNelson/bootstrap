/**
 * A no-op stand-in for the `server-only` package, used ONLY by scripts.
 *
 * The real package throws the moment it is imported outside a React Server
 * Component — which is its whole job, and why it correctly refuses to load
 * under plain `tsx`. That makes every module carrying the guard untestable from
 * a script, which is a poor trade: the guard exists to stop server code
 * reaching a browser bundle, not to stop us checking that the code is right.
 *
 * tsconfig.scripts.json maps the import here. The application build never sees
 * this file, so the guard keeps working everywhere it matters.
 */
export {};
