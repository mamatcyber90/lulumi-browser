const { remote } = require('electron');
const { LocalStorage } = require('node-localstorage');

process.once('loaded', () => {
  global.LocalStorage = LocalStorage;
  const inject = (extensionId) => {
    const context = {};
    require('./inject-to').injectTo(extensionId, false, context);
    global.lulumi = context.lulumi;
  };

  // read the renderer process preferences to see if we need to inject scripts
  const preferences = remote.getGlobal('renderProcessPreferences');
  if (preferences) {
    preferences.forEach(pref => inject(pref.extensionId));
  }
});
