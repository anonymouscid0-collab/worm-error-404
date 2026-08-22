import re

with open('backend/src/index.ts', 'r') as f:
    c = f.read()

old = '''app.get('/', (req, res) => {
  res.json({
    name: 'Worm Error 404',
    version: '3.0.0',
    status: 'online',
    telegram: telegramBot ? 'connected' : 'not configured'
  });
});'''

new = '''app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});'''

c = c.replace(old, new)

with open('backend/src/index.ts', 'w') as f:
    f.write(c)

print('✅ index.ts corrigé')
