with open('backend/public/chat.html', 'r') as f:
    c = f.read()

# BUG 1 : x-api-key → Authorization Bearer
c = c.replace("'x-api-key': 'sk-worm-' + token", "'Authorization': 'Bearer ' + token")

# BUG 2 : Corriger showChat() entièrement
old_showchat = '''async function showChat() {
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
}'''

new_showchat = '''async function showChat() {
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
}'''

c = c.replace(old_showchat, new_showchat)

# BUG 3 : Corriger le démarrage
c = c.replace(
    "if (token) showChat();",
    "if (token) { showChat(); } else { document.getElementById('login').style.display = 'flex'; }"
)

with open('backend/public/chat.html', 'w') as f:
    f.write(c)

print('✅ chat.html corrigé')
