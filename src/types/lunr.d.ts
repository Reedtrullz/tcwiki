declare module 'lunr' {
  interface Builder {
    ref(field: string): void;
    field(field: string): void;
    add(doc: Record<string, string>): void;
  }

  class Index {
    search(query: string): Array<{ ref: string; score: number; matchData: unknown }>;
  }

  function lunr(builder: (this: Builder) => void): Index;
  export = lunr;
}
