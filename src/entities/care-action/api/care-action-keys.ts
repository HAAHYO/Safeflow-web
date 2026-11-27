export const careActionKeys = {
  all: ['care-action'] as const,
  list: () => [...careActionKeys.all, 'list'] as const,
  sendHistory: (careActionId: number) =>
    [...careActionKeys.all, 'send-history', careActionId] as const,
};
