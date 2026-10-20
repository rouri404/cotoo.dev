// Text written by the scripts is in Portuguese and goes through tr(). The English home page (/en/, made by api/en.js) loads
// assets/js/i18n-en.js first, whose I18N_EN maps each Portuguese string to English; everywhere else tr() returns it as is.
// "{name}" in a string is filled from vars
window.tr = function (pt, vars) {
  const text = (window.I18N_EN && window.I18N_EN[pt]) || pt;
  return vars ? text.replace(/\{(\w+)\}/g, (_, key) => vars[key]) : text;
};
window.LOCALE = window.I18N_EN ? "en-US" : "pt-BR";
