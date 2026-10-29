export type PlotContext = Readonly<{ data: any; action: string }>;
export type PlotCondition = (ctx: PlotContext) => boolean;
export type PlotStage = { advance: PlotCondition; respond?: PlotCondition };
export type PlotDefinition = {
  name: string; entry: string; order: number; region: PlotCondition;
  opening: PlotCondition; openingScene: PlotCondition; authorized?: PlotCondition;
  matches: (action: string) => boolean; mentions?: (action: string) => boolean; response: (action: string) => boolean;
  stages: Record<string, PlotStage>; completedAliases?: string[];
};
export type DailyDefinition = { name: string; entry: string; pending: PlotCondition };
export type PlotDecision = { title: string; phase: string; kind: 'opening' | 'advance' | 'respond' | 'none'; advance: boolean; respond: boolean; opening: boolean; diagnostics: string[] };
