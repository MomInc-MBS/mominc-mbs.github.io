export default {
  projectId: 'hive-local',
  targets: [{ name: 'cli', platform: 'tools' }],
  tests: ['tests/e2e/**/*.e2e.ts'],
  workers: 1,
  retries: 0,
  timeout: 30000,
  output: 'experiments/results/e2e',
};
