(function() {
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };
  chrome.storage.local.get(['startupPageSettings', 'theme'], (result) => {
    const settings = result.startupPageSettings;
    const savedTheme = result.theme;
    let themeToApply = 'light';
    if (settings && settings.useDeviceTheme) {
      themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else if (result.theme) {
      themeToApply = result.theme;
    }
    applyTheme(themeToApply);
    document.body.classList.add('ready');
  });
})();