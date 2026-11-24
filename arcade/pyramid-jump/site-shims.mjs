// Site-owned stand-ins for Coach systems the vendored game imports (performance owner, quest reporter).
// The website has no Coach quests, so both are inert. Not overwritten by tools/sync_pyramid_jump.py.
export const performanceOwner = () => null;
export const createQuestProgressReporter = () => ({record() {}});
