const fs = require('fs');
const path = require('path');

let apiUrl = 'http://10.0.2.2:3000';
try {
  const text = fs.readFileSync(path.resolve(__dirname, '../../.env'), 'utf-8');
  const m = text.match(/^EXPO_PUBLIC_API_URL=(.+)$/m);
  if (m) apiUrl = m[1].trim();
} catch {}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl,
  },
});
