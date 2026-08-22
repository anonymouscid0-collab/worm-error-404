const fs = require('fs');
const file = 'backend/public/chat.html';
let c = fs.readFileSync(file, 'utf8');

// BUG 1 : Remplacer x-api-key par Authorization Bearer
c = c.replace("'x-api-key': 'sk-worm-' + token", "'Authorization': 'Bearer ' + token");

// BUG 2 : Corriger showChat() pour gérer token expiré
const oldShowChat = `async function showChat() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('chat').style.display = 'flex';
  
  try {
    const res = await fetch(API + '/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    user = await res.json();
    document.getElementById('user-info').textContent = (user.name || user.email) + ' | Plan: ' + user.plan;
  } catch(e) {}
  
  addMessage('bot', '👋 Salut ! Je suis WORM ERROR 404 v3. Pose-moi tes questions sur le code, les bugs, ou demande-moi de chercher quelque chose.');
}`;

const newShowChat = `async function showChat() {
  try {
    const res = await fetch(API + '/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (!res.ok) throw new Error('Session expirée');
    
    user = await res.json();
    document.getElementById('login').style.display = 'none';
    document.getElementById('chat').style.display = 'flex';
    document.getElementById('user-info').textContent = (user.name || user.email) + ' | Plan: ' + user.plan;
    addMessage('bot', '👋 Salut ! Je suis WORM ERROR 404 v3. Pose-moi tes questions.');
    
  } catch(e) {
    localStorage.removeItem('token');
    token = null;
    user = null;
    showError('Session expirée, reconnecte-toi');
    document.getElementById('login').style.display = 'flex';
    document.getElementById('chat').style.display = 'none';
  }
}`;

c = c.replace(oldShowChat, newShowChat);

// BUG 3 : Corriger le démarrage
c = c.replace(
  "if (token) showChat();",
  "if (token) { showChat(); } else { document.getElementById('login').style.display = 'flex'; }"
);

fs.writeFileSync(file, c);
console.log('✅ chat.html corrigé avec succès !');
