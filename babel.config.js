module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Si ya usas Reanimated (NativeWind lo instala como peer), déjalo AL FINAL:
      "react-native-reanimated/plugin",
    ],
  };
};
