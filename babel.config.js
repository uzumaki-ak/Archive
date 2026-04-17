/**
 * Babel config — Reanimated plugin MUST be listed last.
 * This is a hard requirement from react-native-reanimated.
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // react-native-reanimated plugin must always be last
    'react-native-reanimated/plugin',
  ],
};
