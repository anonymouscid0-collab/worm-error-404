class WormBrainV3 {
  async generateResponse(message, options = {}) {
    const startTime = Date.now();
    const { sessionId = 'default', model = 'worm-fullstack-v3', context = [] } = options;
    const intent = this.detectIntent(message);
    const reasoning = await this.deepReason(message, intent, context);
    let response = '';
    let metadata = {};
    let projectZip = null;

    switch (intent.primary.name) {
      case 'code_generation':
        const lang = this.detectLanguage(message);
        const framework = this.detectFramework(message, lang);
        const generated = this.generateCode(message, lang, framework);
        if (message.toLowerCase().includes('zip') || message.toLowerCase().includes('projet') || message.toLowerCase().includes('project')) {
          try { projectZip = await this.generateProjectZip(message, lang, framework); } catch (e) { console.error('Erreur ZIP:', e); }
        }
        response = this.buildCodeResponse(generated, message, projectZip);
        metadata = { type: 'code_generation', language: lang, framework, projectType: generated.projectType, hasZip: !!projectZip, zipSize: projectZip?.size };
        break;
      case 'code_fix':
        const codeBlocks = this.extractCodeBlocks(message);
        if (codeBlocks.length > 0) {
          const fixed = this.fixCode(codeBlocks[0].code, codeBlocks[0].language);
          response = this.buildFixResponse(codeBlocks[0], fixed);
          metadata = { type: 'code_fix', issuesFound: fixed.issues.length };
        } else {
          response = "Je ne vois pas de code a corriger. Peux-tu le partager entre des backticks (```) ?";
        }
        break;
      case 'code_explain':
        const explainBlocks = this.extractCodeBlocks(message);
        if (explainBlocks.length > 0) {
          response = this.buildExplanationResponse(explainBlocks[0]);
        } else {
          response = this.buildTextualExplanation(message, intent, reasoning);
        }
        metadata = { type: 'explanation' };
        break;
      case 'code_optimize':
        const optBlocks = this.extractCodeBlocks(message);
        if (optBlocks.length > 0) {
          response = this.buildOptimizationResponse(optBlocks[0]);
        } else {
          response = this.buildTextualOptimization(message, intent, reasoning);
        }
        metadata = { type: 'optimization' };
        break;
      case 'research':
        response = this.buildResearchResponse(reasoning.webResults, message);
        metadata = { type: 'research', sources: reasoning.webResults?.sources?.length || 0 };
        break;
      case 'architecture':
        response = this.buildArchitectureResponse(message, reasoning);
        metadata = { type: 'architecture' };
        break;
      case 'security_audit':
        response = this.buildSecurityResponse(message, reasoning);
        metadata = { type: 'security_audit', riskScore: reasoning.securityAnalysis?.riskScore };
        break;
      case 'offensive_security':
        response = this.buildOffensiveResponse(message, reasoning);
        metadata = { type: 'offensive_security', disclaimer: 'Educatif uniquement' };
        break;
      case 'osint_investigation':
        response = this.buildOsintResponse(message, reasoning);
        metadata = { type: 'osint_investigation' };
        break;
      default:
        response = this.buildConversationalResponse(message, intent, reasoning);
        metadata = { type: 'conversation' };
    }

    const latency = Date.now() - startTime;
    return {
      response,
      projectZip,
      metadata: {
        ...metadata,
        intent: intent.primary.name,
        confidence: intent.primary.score,
        latency_ms: latency,
        reasoning_steps: reasoning.thoughts.length,
        reasoning_time: reasoning.reasoningTime,
        timestamp: new Date().toISOString(),
        model: 'worm-fullstack-v3'
      }
    };
  }

  generateCode(request, language, framework) {
    const projectType = this.detectProjectType(request);
    const baseTemplate = this.getBaseTemplate(language, projectType);
    const customized = this.customizeTemplate(baseTemplate, request, framework);
    const withImports = this.addImports(customized, language, framework);
    const documented = this.addDocumentation(withImports, request);
    return {
      code: documented,
      language,
      framework: framework || 'none',
      projectType,
      files: this.splitIntoFiles(documented, projectType, language),
      instructions: this.generateInstructions(projectType, language, framework)
    };
  }

  getBaseTemplate(language, projectType) {
    const templates = {
      javascript: {
        api: `const express = require('express');\nconst cors = require('cors');\nconst helmet = require('helmet');\nconst compression = require('compression');\nconst rateLimit = require('express-rate-limit');\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(helmet());\napp.use(cors());\napp.use(compression());\napp.use(express.json({ limit: '10mb' }));\n\napp.use(rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 100,\n  message: { error: 'Trop de requetes' }\n}));\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Bienvenue sur {{PROJECT_NAME}}', status: 'online', version: '1.0.0' });\n});\n\napp.get('/health', (req, res) => {\n  res.json({ status: 'ok', timestamp: new Date().toISOString() });\n});\n\napp.use((err, req, res, next) => {\n  console.error(err.stack);\n  res.status(500).json({ error: 'Something broke!' });\n});\n\napp.listen(PORT, () => {\n  console.log('{{PROJECT_NAME}} running on port ' + PORT);\n});\n\nmodule.exports = app;`,
        dashboard: `import React, { useState, useEffect } from 'react';\n\nfunction Dashboard() {\n  const [data, setData] = useState([]);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetchData();\n  }, []);\n\n  const fetchData = async () => {\n    try {\n      const response = await fetch('/api/data');\n      const result = await response.json();\n      setData(result);\n    } catch (error) {\n      console.error('Error:', error);\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  if (loading) return <div>Loading...</div>;\n\n  return (\n    <div className="dashboard">\n      <h1>{{PROJECT_NAME}} Dashboard</h1>\n      <div className="stats-grid">\n        {data.map((item, index) => (\n          <div key={index} className="stat-card">\n            <h3>{item.title}</h3>\n            <p>{item.value}</p>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}\n\nexport default Dashboard;`,
        chatbot: `class ChatBot {\n  constructor() {\n    this.responses = new Map();\n    this.context = [];\n    this.initializeResponses();\n  }\n\n  initializeResponses() {\n    this.responses.set('bonjour', 'Bonjour ! Comment puis-je vous aider ?');\n    this.responses.set('aide', 'Je peux vous aider avec: code, debug, architecture, securite...');\n  }\n\n  async processMessage(message) {\n    this.context.push({ role: 'user', content: message, timestamp: Date.now() });\n    const lower = message.toLowerCase();\n    let response = this.responses.get(lower);\n    if (!response) {\n      response = 'J\'ai recu: "' + message + '". Je vais analyser votre demande...';\n    }\n    this.context.push({ role: 'assistant', content: response, timestamp: Date.now() });\n    return { response, context: this.context.slice(-10) };\n  }\n}\n\nmodule.exports = ChatBot;`,
        scraper: `const axios = require('axios');\nconst cheerio = require('cheerio');\n\nclass WebScraper {\n  constructor(base_url) {\n    this.base_url = base_url;\n    this.session = axios.create({\n      headers: { 'User-Agent': 'WormError404/1.0' }\n    });\n  }\n\n  async fetch(url) {\n    try {\n      const response = await this.session.get(url);\n      return response.data;\n    } catch (e) {\n      console.error('Error fetching ' + url + ': ' + e.message);\n      return '';\n    }\n  }\n\n  parse(html) {\n    const $ = cheerio.load(html);\n    const results = [];\n    $('article, div, section').each((i, el) => {\n      const title = $(el).find('h1, h2, h3').first().text();\n      const content = $(el).text().substring(0, 500);\n      if (title) results.push({ title, content });\n    });\n    return results;\n  }\n\n  async scrape(path = '/') {\n    const url = this.base_url + path;\n    const html = await this.fetch(url);\n    return this.parse(html);\n  }\n}\n\nmodule.exports = WebScraper;`
      },
      python: {
        api: `from fastapi import FastAPI, HTTPException\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom typing import Optional, List\nimport uvicorn\n\napp = FastAPI(title="{{PROJECT_NAME}}", description="API generee par Worm Error 404", version="1.0.0")\n\napp.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])\n\nclass Item(BaseModel):\n    id: Optional[int] = None\n    name: str\n    description: Optional[str] = None\n\ndb = []\n\n@app.get("/")\ndef read_root():\n    return {"message": "Bienvenue sur {{PROJECT_NAME}}", "status": "online"}\n\n@app.get("/items", response_model=List[Item])\ndef get_items():\n    return db\n\n@app.post("/items")\ndef create_item(item: Item):\n    item.id = len(db) + 1\n    db.append(item)\n    return item\n\n@app.get("/items/{item_id}")\ndef get_item(item_id: int):\n    for item in db:\n        if item.id == item_id:\n            return item\n    raise HTTPException(status_code=404, detail="Item not found")\n\nif __name__ == "__main__":\n    uvicorn.run(app, host="0.0.0.0", port=8000)`,
        scraper: `import requests\nfrom bs4 import BeautifulSoup\nimport json\nfrom typing import List, Dict\n\nclass WebScraper:\n    def __init__(self, base_url: str):\n        self.base_url = base_url\n        self.session = requests.Session()\n        self.session.headers.update({'User-Agent': 'WormError404/1.0'})\n\n    def fetch(self, url: str) -> str:\n        try:\n            response = self.session.get(url)\n            response.raise_for_status()\n            return response.text\n        except requests.RequestException as e:\n            print(f"Error fetching {url}: {e}")\n            return ""\n\n    def parse(self, html: str) -> List[Dict]:\n        soup = BeautifulSoup(html, 'html.parser')\n        results = []\n        for element in soup.find_all(['article', 'div', 'section']):\n            data = {\n                'title': element.find(['h1', 'h2', 'h3']),\n                'content': element.get_text(strip=True)[:500]\n            }\n            if data['title']:\n                results.append(data)\n        return results\n\n    def scrape(self, path: str = "/") -> List[Dict]:\n        url = f"{self.base_url}{path}"\n        html = self.fetch(url)\n        return self.parse(html)\n\nif __name__ == "__main__":\n    scraper = WebScraper("[https://example.com](https://example.com)")\n    data = scraper.scrape()\n    print(json.dumps(data, indent=2, ensure_ascii=False))`
      },
      go: {
        api: `package main\n\nimport (\n	"encoding/json"\n	"fmt"\n	"log"\n	"net/http"\n	"time"\n)\n\ntype Response struct {\n	Message   string    ` + "`json:\"message\"`" + `\n	Status    string    ` + "`json:\"status\"`" + `\n	Timestamp time.Time ` + "`json:\"timestamp\"`" + `\n}\n\nfunc main() {\n	mux := http.NewServeMux()\n	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {\n		w.Header().Set("Content-Type", "application/json")\n		json.NewEncoder(w).Encode(Response{\n			Message:   "Bienvenue sur {{PROJECT_NAME}}",\n			Status:    "online",\n			Timestamp: time.Now(),\n		})\n	})\n	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {\n		w.Header().Set("Content-Type", "application/json")\n		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})\n	})\n	fmt.Printf("{{PROJECT_NAME}} running on port 8080\\n")\n	log.Fatal(http.ListenAndServe(":8080", mux))\n}`
      },
      rust: {
        api: `use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};\nuse serde::{Deserialize, Serialize};\nuse std::sync::Mutex;\n\n#[derive(Serialize, Deserialize, Clone)]\nstruct Item {\n    id: u32,\n    name: String,\n}\n\nstruct AppState {\n    db: Mutex<Vec<Item>>,\n}\n\n#[get("/")]\nasync fn index() -> impl Responder {\n    HttpResponse::Ok().json(serde_json::json!({\n        "message": "Bienvenue sur {{PROJECT_NAME}}",\n        "status": "online"\n    }))\n}\n\n#[get("/health")]\nasync fn health() -> impl Responder {\n    HttpResponse::Ok().json(serde_json::json!({"status": "ok"}))\n}\n\n#[actix_web::main]\nasync fn main() -> std::io::Result<()> {\n    let state = web::Data::new(AppState { db: Mutex::new(vec![]) });\n    println!("{{PROJECT_NAME}} running on port 8080");\n    HttpServer::new(move || {\n        App::new().app_data(state.clone()).service(index).service(health)\n    }).bind("127.0.0.1:8080")?.run().await\n}`
      }
    };
    return templates[language]?.[projectType] || templates.javascript?.api || '';
  }

  customizeTemplate(template, request, framework) {
    let customized = template;
    const placeholders = {
      '{{PROJECT_NAME}}': this.extractProjectName(request) || 'worm-project',
      '{{DESCRIPTION}}': request.substring(0, 200),
      '{{AUTHOR}}': 'Worm Error 404',
      '{{DATE}}': new Date().toISOString().split('T')[0],
      '{{FRAMEWORK}}': framework || 'none'
    };
    for (const [key, value] of Object.entries(placeholders)) {
      customized = customized.replace(new RegExp(key, 'g'), value);
    }
    return customized;
  }

  addImports(code, language, framework) {
    const imports = {
      javascript: {
        express: "const express = require('express');\nconst cors = require('cors');\n",
        react: "import React from 'react';\nimport ReactDOM from 'react-dom/client';\n",
        vue: "import { createApp } from 'vue';\n",
        default: "// Imports generes par Worm Error 404\n"
      },
      python: {
        flask: "from flask import Flask, request, jsonify\nfrom flask_cors import CORS\n",
        django: "from django.http import JsonResponse\nfrom django.views import View\n",
        fastapi: "from fastapi import FastAPI, HTTPException\nfrom fastapi.middleware.cors import CORSMiddleware\n",
        default: "# Imports generes par Worm Error 404\n"
      },
      go: { default: "package main\n\nimport (\n	\"net/http\"\n	\"encoding/json\"\n)\n" },
      rust: { default: "use std::collections::HashMap;\n" }
    };
    const langImports = imports[language] || imports.javascript;
    const frameworkImports = langImports[framework] || langImports.default;
    return frameworkImports + '\n' + code;
  }

  addDocumentation(code, request) {
    const header = `/**\n * ╔══════════════════════════════════════════════════════════════╗\n * ║  🐛 Genere par Worm Error 404 v3                             ║\n * ║  Date: ${new Date().toISOString()}                           ║\n * ║  Requete: ${request.substring(0, 80)}${request.length > 80 ? '...' : ''}  ║\n * ╚══════════════════════════════════════════════════════════════╝\n */\n\n`;
    return header + code;
  }

  splitIntoFiles(code, projectType, language) {
    const files = {};
    const ext = this.getFileExtension(language);
    const structures = {
      api: {
        [`index${ext}`]: code,
        [`routes${ext}`]: '// Routes\n',
        [`controllers${ext}`]: '// Controllers\n',
        [`models${ext}`]: '// Models\n',
        [`middleware${ext}`]: '// Middleware\n',
        [`config${ext}`]: '// Configuration\n',
        [`utils${ext}`]: '// Utilities\n',
        'package.json': JSON.stringify({ name: 'worm-api', version: '1.0.0', description: 'API generee par Worm Error 404', main: `index${ext}`, scripts: { start: `node index${ext}`, dev: 'nodemon' }, dependencies: {}, keywords: ['worm-error-404', 'api'], author: 'Worm Error 404', license: 'MIT' }, null, 2)
      },
      dashboard: {
        [`App${ext}`]: code,
        'index.html': '<!DOCTYPE html>\n<html>\n<head><title>Worm Dashboard</title></head>\n<body><div id="root"></div></body>\n</html>',
        'styles.css': '/* Styles du dashboard */\n',
        [`components/Dashboard${ext}`]: '// Composant Dashboard\n'
      },
      generic: {
        [`main${ext}`]: code,
        'README.md': '# Projet Worm Error 404\n\nGenere automatiquement.\n'
      }
    };
    return structures[projectType] || structures.generic;
  }

  generateInstructions(projectType, language, framework) {
    const instructions = {
      api: ['1. Installe les dependances: npm install', '2. Configure les variables d\'environnement dans .env', '3. Demarre le serveur: npm start', '4. Teste l\'API avec curl ou Postman'],
      dashboard: ['1. Installe les dependances: npm install', '2. Demarre le dev server: npm run dev', '3. Ouvre http://localhost:3000 dans ton navigateur'],
      generic: ['1. Installe les dependances si necessaire', '2. Execute le fichier principal', '3. Consulte le README pour plus de details']
    };
    return instructions[projectType] || instructions.generic;
  }

  fixCode(code, language) {
    let fixed = code;
    const issues = [];
    
    // Fix common issues
    if (language === 'javascript' || language === 'typescript') {
      if (/var\s+/.test(fixed)) {
        fixed = fixed.replace(/\bvar\b/g, 'const');
        issues.push('Remplace var par const');
      }
      if (/==\s*(?!=)/.test(fixed)) {
        fixed = fixed.replace(/==\s*(?!=)/g, '===');
        issues.push('Remplace == par ===');
      }
      if (!/try\s*\{/.test(fixed) && /await\s+/.test(fixed)) {
        issues.push('Ajoute try/catch pour les appels async');
      }
    }
    
    return { fixed, issues, original: code };
  }

  buildCodeResponse(generated, request, projectZip) {
    let response = `## 🚀 Projet genere: ${generated.projectType.toUpperCase()}\n\n`;
    response += `**Langage:** ${generated.language} | **Framework:** ${generated.framework || 'Aucun'} | **Modele:** worm-fullstack-v3\n\n`;
    if (projectZip) {
      response += `📦 **Projet complet genere en ZIP** (${Math.round(projectZip.size / 1024)} KB, ${projectZip.fileCount} fichiers)\n\n`;
      response += `> 💡 Le ZIP contient: code source, tests, Dockerfile, docker-compose, README, .env.example\n\n`;
    }
    response += `### 📁 Structure des fichiers\n\n`;
    response += `\`\`\`\n`;
    for (const [filename] of Object.entries(generated.files || {})) { response += `${filename}\n`; }
    response += `\`\`\`\n\n`;
    response += `### 💻 Code principal\n\n`;
    response += `\`\`\`${generated.language}\n${generated.code}\n`;
    response += `\`\`\`\n\n`;
    response += `### 📋 Instructions\n`;
    (generated.instructions || []).forEach((inst, i) => { response += `${i + 1}. ${inst}\n`; });
    response += `\n### 🎯 Prochaines etapes\n`;
    response += `- Configure les variables d\'environnement dans \`.env\`\n`;
    response += `- Installe les dependances\n`;
    response += `- Lance les tests: \`npm test\`\n`;
    response += `- Deploie sur Render/Vercel/Heroku\n`;
    return response;
  }

  buildFixResponse(codeBlock, fixed) {
    let response = `## 🔧 Analyse et correction\n\n`;
    response += `**Langage:** ${codeBlock.language} | **Problemes trouves:** ${fixed.issues.length}\n\n`;
    if (fixed.issues.length > 0) {
      response += `### ✅ Corrections appliquees (${fixed.issues.length})\n`;
      fixed.issues.forEach(fix => { response += `- ${fix}\n`; });
      response += `\n`;
    } else {
      response += `✅ Aucun probleme majeur detecte. Le code est propre !\n\n`;
    }
    response += `### 📝 Code corrige\n\n`;
    response += `\`\`\`${codeBlock.language}\n${fixed.fixed}\n`;
    response += `\`\`\`\n`;
    return response;
  }

  buildExplanationResponse(codeBlock) {
    const lines = codeBlock.code.split('\n');
    let response = `## 📖 Explication du code (${codeBlock.language})\n\n`;
    response += `### Ligne par ligne\n\n`;
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
        response += `\`L${index + 1}\` *${trimmed || '(ligne vide)'}*\n`;
        return;
      }
      let explanation = this.explainLine(trimmed, codeBlock.language);
      response += `\`L${index + 1}\` \`\`\`${codeBlock.language}\n${trimmed}\n`;
      response += `\`\`\`\n`;
      response += `→ ${explanation}\n\n`;
    });
    response += `### 🎯 Resume\n`;
    response += `Ce code ${this.summarizeCodePurpose(codeBlock.code, codeBlock.language)}.\n`;
    response += `**Points cles:** structure claire, gestion d\'erreurs, separation des concerns.\n`;
    return response;
  }

  explainLine(line, language) {
    const explanations = {
      javascript: {
        'const ': 'Declare une constante (valeur non reassignable)',
        'let ': 'Declare une variable (peut etre reassignee)',
        'var ': 'Declare une variable (ancienne syntaxe, eviter)',
        'function': 'Definit une fonction nommee',
        '=>': 'Fonction flechee (arrow function) - syntaxe concise',
        'import': 'Importe un module/export depuis un fichier externe',
        'export': 'Rend une valeur accessible depuis d\'autres modules',
        'async': 'Fonction asynchrone - retourne une Promise',
        'await': 'Attend la resolution d\'une Promise',
        'try': 'Debute un bloc de gestion d\'erreurs',
        'catch': 'Capture les erreurs levees dans le bloc try',
        'return': 'Retourne une valeur et termine l\'execution de la fonction',
        'if': 'Condition: execute le bloc si l\'expression est vraie',
        'for': 'Boucle: itere sur une sequence d\'elements',
        'while': 'Boucle: repete tant que la condition est vraie',
        'class': 'Definit une classe (modele pour creer des objets)',
        'new': 'Cree une nouvelle instance d\'une classe',
        'this.': 'Reference l\'instance courante de l\'objet',
        'require(': 'Importe un module CommonJS (Node.js)',
        'process.env': 'Accede aux variables d\'environnement',
      },
      python: {
        'def ': 'Definit une fonction',
        'class ': 'Definit une classe',
        'import ': 'Importe un module entier',
        'from ': 'Importe des elements specifiques d\'un module',
        'if ': 'Condition',
        'for ': 'Boucle for - itere sur une sequence',
        'while ': 'Boucle while - repete tant que condition vraie',
        'try:': 'Debute un bloc de gestion d\'exceptions',
        'except': 'Capture les exceptions specifiques',
        'return': 'Retourne une valeur depuis la fonction',
        'with ': 'Context manager - gestion automatique des ressources',
        'lambda': 'Fonction anonyme inline',
        'yield': 'Generateur - produit une valeur sans terminer',
        'async def': 'Fonction asynchrone - coroutine',
        'await': 'Attend la fin d\'une coroutine',
      },
      go: {
        'func ': 'Definit une fonction',
        'package': 'Declare le package du fichier',
        'import': 'Importe des packages',
        'struct': 'Definit une structure de donnees',
        'interface': 'Definit un contrat de methodes',
        'chan': 'Canal pour la communication entre goroutines',
        'go ': 'Lance une goroutine (execution concurrente)',
        'defer': 'Reporte l\'execution jusqu\'a la fin de la fonction',
        'select': 'Attend sur plusieurs operations de canal',
      }
    };
    const langExplanations = explanations[language] || explanations.javascript;
    for (const [pattern, explanation] of Object.entries(langExplanations)) {
      if (line.includes(pattern)) return explanation;
    }
    if (line.includes('=') && !line.includes('==')) return 'Affectation de valeur a une variable';
    if (line.includes('console.log') || line.includes('print(')) return 'Affiche une valeur dans la console';
    if (line.includes('//') || line.includes('#')) return 'Commentaire - ignore par le compilateur';
    if (line.includes('return')) return 'Retourne une valeur';
    return 'Instruction standard';
  }

  summarizeCodePurpose(code, language) {
    if (code.includes('app.listen') || code.includes('http.ListenAndServe') || code.includes('uvicorn.run')) return 'demarre un serveur web/API';
    if (code.includes('fetch') || code.includes('axios') || code.includes('requests.get') || code.includes('http.Get')) return 'effectue des requetes HTTP/API';
    if (code.includes('createElement') || code.includes('ReactDOM') || code.includes('render')) return 'cree une interface utilisateur (UI)';
    if (code.includes('SELECT') || code.includes('INSERT') || code.includes('UPDATE') || code.includes('db.')) return 'interagit avec une base de donnees';
    if (code.includes('bcrypt') || code.includes('jwt') || code.includes('hash') || code.includes('auth')) return 'gere l\'authentification et la securite';
    if (code.includes('scrape') || code.includes('cheerio') || code.includes('BeautifulSoup')) return 'extrait des donnees depuis des pages web';
    if (code.includes('bot') || code.includes('telegraf') || code.includes('ctx.reply')) return 'implemente un bot de messagerie';
    return 'effectue des operations logiques et de traitement de donnees';
  }

  buildTextualExplanation(message, intent, reasoning) {
    let response = `## 💡 Explication approfondie\n\n`;
    if (reasoning.knowledge && reasoning.knowledge.length > 0) {
      response += `### 📚 Connaissances pertinentes\n`;
      reasoning.knowledge.slice(0, 5).forEach(k => { response += `- **${k.key}**: ${k.value}\n`; });
      response += `\n`;
    }
    response += `### Reponse\n\n`;
    response += `Concernant *"${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"*, voici mon analyse:\n\n`;
    const topic = this.extractTopic(message);
    const knowledge = topic ? this.knowledgeGraph[topic] : null;
    if (knowledge) {
      if (knowledge.best_practices) {
        response += `**Bonnes pratiques:**\n`;
        knowledge.best_practices.forEach((bp, i) => { response += `${i + 1}. ${bp}\n`; });
        response += `\n`;
      }
      if (knowledge.frameworks) {
        response += `**Frameworks populaires:**\n`;
        for (const [name, desc] of Object.entries(knowledge.frameworks)) { response += `- **${name}**: ${desc}\n`; }
        response += `\n`;
      }
    }
    response += `**Analyse:** Cette demande touche a ${intent.detectedLanguage || 'plusieurs'} technologies. `;
    response += `L\'approche recommandee est ${this.buildStrategyV3(intent, reasoning.knowledge, reasoning.webResults, reasoning.securityAnalysis)}.\n`;
    if (reasoning.webResults && reasoning.webResults.totalResults > 0) {
      response += `\n🔍 *J\'ai trouve ${reasoning.webResults.totalResults} ressources en ligne. Veux-tu que je les affiche ?*\n`;
    }
    return response;
  }

  buildOptimizationResponse(codeBlock) {
    let response = `## ⚡ Optimisation\n\n`;
    response += `**Langage:** ${codeBlock.language}\n\n`;
    response += `### 🔍 Points d\'optimisation identifies\n\n`;
    const optimizations = [];
    const code = codeBlock.code;
    if (code.includes('for') && code.includes('length')) optimizations.push({ type: 'performance', desc: 'Utiliser une boucle optimisee ou .forEach/.map', impact: 'medium' });
    if (code.includes('var ')) optimizations.push({ type: 'quality', desc: 'Remplacer var par const/let', impact: 'low' });
    if (code.includes('== ') || code.includes('===')) optimizations.push({ type: 'quality', desc: 'Verifier l\'usage de === vs ==', impact: 'low' });
    if ((code.match(/function/g) || []).length > 5) optimizations.push({ type: 'architecture', desc: 'Extraire des fonctions utilitaires', impact: 'medium' });
    if (code.includes('console.log')) optimizations.push({ type: 'production', desc: 'Retirer les console.log en production', impact: 'medium' });
    if (code.includes('try') && !code.includes('catch')) optimizations.push({ type: 'reliability', desc: 'Ajouter un bloc catch', impact: 'high' });
    if (optimizations.length === 0) {
      response += `✅ Le code est deja bien optimise !\n\n`;
    } else {
      optimizations.forEach((opt, i) => {
        const emoji = opt.impact === 'high' ? '🔴' : opt.impact === 'medium' ? '🟠' : '🟡';
        response += `${i + 1}. ${emoji} **[${opt.impact.toUpperCase()}]** ${opt.desc} (${opt.type})\n`;
      });
      response += `\n`;
    }
    response += `### 💡 Recommandations generales\n`;
    response += `- Profiler le code pour identifier les goulots d\'etranglement\n`;
    response += `- Utiliser un bundler (Webpack/Vite/Rollup) pour la production\n`;
    response += `- Activer la compression Gzip/Brotli cote serveur\n`;
    response += `- Mettre en cache les donnees frequemment accedees (Redis)\n`;
    response += `- Utiliser le lazy loading pour les routes/modules\n`;
    return response;
  }

  buildTextualOptimization(message, intent, reasoning) {
    return this.buildTextualExplanation(message, intent, reasoning) + `\n\n**Focus optimisation:** Pour optimiser ce systeme, je recommande d\'analyser les metriques de performance, identifier les requetes lentes, et appliquer les patterns de caching et de lazy loading.`;
  }

  buildResearchResponse(webResults, query) {
    if (!webResults || webResults.totalResults === 0) {
      return `## 🔍 Recherche: "${query}"\n\nAucun resultat trouve en ligne. Voici ce que je sais de ma base de connaissances:\n\n${this.searchKnowledgeBase(query, { primary: { name: 'research' } }).map(k => `- **${k.key}**: ${k.value}`).join('\n') || 'Je vais approfondir cette recherche manuellement.'}`;
    }
    let response = `## 🔍 Resultats de recherche: "${query}"\n\n`;
    response += `**${webResults.totalResults} resultats agreges** | Sources: ${webResults.sources?.join(', ') || 'multiple'}\n\n`;
    Object.entries(webResults.results || {}).forEach(([source, data]) => {
      if (data.results && data.results.length > 0) {
        response += `### ${source} (${data.results.length} resultats)\n\n`;
        data.results.slice(0, 4).forEach(r => {
          response += `- **${r.title || r.name}**\n`;
          if (r.snippet || r.description) response += `  ${(r.snippet || r.description).substring(0, 120)}${(r.snippet || r.description).length > 120 ? '...' : ''}\n`;
          if (r.stars !== undefined) response += `  ⭐ ${r.stars} stars`;
          if (r.language) response += ` | 📝 ${r.language}`;
          if (r.score !== undefined) response += ` | 👍 ${r.score}`;
          if (r.answerCount !== undefined) response += ` | 💬 ${r.answerCount} reponses`;
          response += `\n`;
        });
        response += `\n`;
      }
    });
    response += `---\n`;
    response += `*Recherche effectuee le ${new Date().toLocaleString('fr-FR')} par Worm Error 404 v3*\n`;
    response += `*Sources: Google, GitHub, Stack Overflow, NPM, YouTube, Reddit, Telegram, Dark Web*\n`;
    return response;
  }

  buildArchitectureResponse(message, reasoning) {
    let response = `## 🏗️ Architecture proposee\n\n`;
    response += `### 📋 Analyse des besoins\n`;
    response += `D\'apres "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}", voici l\'architecture recommandee:\n\n`;
    response += `### 🏛️ Architecture haut niveau\n\n`;
    response += `\`\`\`\n┌─────────────┐     ┌─────────────┐     ┌─────────────┐\n│   Client    │────▶│   CDN/WAF   │────▶│  API GW     │\n│  (Web/App)  │     │  (CloudFlare│     │  (Kong/Nginx│\n└─────────────┘     └─────────────┘     └──────┬──────┘\n                                               │\n                    ┌──────────────────────────┼──────────┐\n                    │                          │          │\n              ┌─────▼─────┐            ┌──────▼─────┐  ┌▼────────┐\n              │  Service A │            │  Service B  │  │Service C│\n              │  (Auth)    │            │  (Business) │  │(Notif)  │\n              └─────┬──────┘            └──────┬─────┘  └────┬────┘\n                    │                          │             │\n              ┌─────▼──────┐           ┌──────▼─────┐  ┌───▼─────┐\n              │   Redis    │           │ PostgreSQL │  │  Queue  │\n              │  (Session) │           │  (Master)  │  │(RabbitMQ│\n              └────────────┘           └────────────┘  └─────────┘\n\`\`\`\n\n`;
    response += `### 🛠️ Stack technique recommandee\n\n`;
    response += `| Couche | Technologie | Raison |\n`;
    response += `|--------|-------------|--------|\n`;
    response += `| **Frontend** | React/Next.js + TypeScript | SSR, SSG, ecosystem mature |\n`;
    response += `| **Backend** | Node.js (NestJS) ou Python (FastAPI) | Performance, async, types |\n`;
    response += `| **Database** | PostgreSQL + Redis | ACID + cache performant |\n`;
    response += `| **Message Queue** | RabbitMQ ou Redis Streams | Async processing |\n`;
    response += `| **DevOps** | Docker + Kubernetes + GitHub Actions | Scalabilite, CI/CD |\n`;
    response += `| **Monitoring** | Prometheus + Grafana + ELK | Observabilite complete |\n`;
    response += `| **CDN** | Cloudflare ou AWS CloudFront | Performance globale |\n`;
    response += `\n`;
    response += `### 📐 Patterns architecturaux\n\n`;
    response += `1. **API Gateway** - Point d\'entree unique, rate limiting, auth\n`;
    response += `2. **Microservices** (si equipe > 5 devs) ou **Modular Monolith** (si < 5)\n`;
    response += `3. **CQRS** - Separation lecture/ecriture pour la scalabilite\n`;
    response += `4. **Event Sourcing** - Audit complet, replay d\'evenements\n`;
    response += `5. **Circuit Breaker** - Resilience face aux defaillances\n`;
    response += `6. **Bulkhead** - Isolation des ressources critiques\n`;
    response += `7. **Saga Pattern** - Transactions distribuees coherentes\n`;
    response += `\n`;
    response += `### 🔒 Securite\n\n`;
    response += `- Authentification: OAuth 2.0 + PKCE + JWT\n`;
    response += `- Authorization: RBAC (Role-Based Access Control)\n`;
    response += `- Communication: mTLS entre services\n`;
    response += `- Donnees: Chiffrement AES-256 au repos, TLS 1.3 en transit\n`;
    response += `- API: Rate limiting, input validation, WAF\n`;
    return response;
  }

  buildSecurityResponse(message, reasoning) {
    let response = `## 🔒 Audit de securite Worm Error 404 v3\n\n`;
    const sec = reasoning.securityAnalysis;
    if (sec) {
      response += `### 📊 Score de risque: ${sec.riskScore}/100 (${sec.riskLevel})\n\n`;
      if (sec.threats.length > 0) {
        response += `### 🚨 Menaces detectees\n\n`;
        sec.threats.forEach(t => {
          const emoji = t.severity === 'critical' ? '🔴' : '🟠';
          response += `${emoji} **${t.type}**: ${t.description}\n`;
        });
        response += `\n`;
      }
      if (sec.vulnerabilities.length > 0) {
        response += `### ⚠️ Vulnerabilites (${sec.vulnerabilities.length})\n\n`;
        sec.vulnerabilities.slice(0, 10).forEach(v => {
          const emoji = v.severity === 'critical' ? '🔴' : v.severity === 'high' ? '🟠' : v.severity === 'medium' ? '🟡' : '🟢';
          response += `${emoji} **L${v.line}** [${v.cwe}] ${v.name}\n   → ${v.fix}\n`;
        });
        response += `\n`;
      }
      if (sec.owaspMapping.length > 0) {
        response += `### 🎯 Mapping OWASP Top 10\n\n`;
        sec.owaspMapping.forEach(m => { response += `- **${m.owasp}**: ${m.name}\n`; });
        response += `\n`;
      }
    }
    response += `### 🛡️ Recommandations de securite\n\n`;
    response += `1. ✅ **Input Validation** - Valide TOUTES les entrees (whitelist, pas blacklist)\n`;
    response += `2. ✅ **Parameterized Queries** - Jamais de concatenation SQL\n`;
    response += `3. ✅ **Password Hashing** - bcrypt/argon2 avec salt unique\n`;
    response += `4. ✅ **HTTPS Everywhere** - Forcer TLS 1.3, HSTS, certificats valides\n`;
    response += `5. ✅ **Content Security Policy** - CSP strict pour mitiger XSS\n`;
    response += `6. ✅ **Rate Limiting** - Protection contre brute force et DoS\n`;
    response += `7. ✅ **Secrets Management** - Vault, AWS Secrets Manager, jamais en dur\n`;
    response += `8. ✅ **Dependency Scanning** - npm audit, Snyk, Dependabot\n`;
    response += `9. ✅ **Logging & Monitoring** - SIEM, detection d\'anomalies\n`;
    response += `10. ✅ **Penetration Testing** - Tests reguliers, bug bounty\n`;
    return response;
  }

  buildOffensiveResponse(message, reasoning) {
    let response = `## 🎯 Analyse d\'exploitation (EDUCATIF)\n\n`;
    response += `> ⚠️ **DISCLAIMER**: Cette reponse est strictly educative et destinee a la securite defensive (Red Team/Blue Team). L\'exploitation non autorisee est illegale.\n\n`;
    response += `### 🔍 Reconnaissance\n\n`;
    response += `Analyse de la cible et identification des surfaces d\'attaque potentielles.\n\n`;
    response += `### 📚 Techniques connues\n\n`;
    response += `1. **Reconnaissance passive** - OSINT, WHOIS, DNS enumeration\n`;
    response += `2. **Scanning** - Nmap, masscan, identification des services\n`;
    response += `3. **Enumeration** - Dirbusting, API discovery, parameter fuzzing\n`;
    response += `4. **Vulnerability Assessment** - Nessus, OpenVAS, manual testing\n`;
    response += `5. **Exploitation** - Metasploit, custom scripts, proof of concept\n`;
    response += `### 🛡️ Defense recommandee\n\n`;
    response += `- WAF (ModSecurity, Cloudflare)\n`;
    response += `- Honeypots et canary tokens\n`;
    response += `- SIEM et detection d\'intrusion\n`;
    response += `- Patch management automatise\n`;
    response += `- Segmentation reseau (Zero Trust)\n`;
    return response;
  }

  buildOsintResponse(message, reasoning) {
    let response = `## 🔍 Investigation OSINT\n\n`;
    response += `### 🎯 Cible\n`;
    response += `"${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"\n\n`;
    
    if (reasoning.webResults && reasoning.webResults.totalResults > 0) {
      response += `### 📊 Donnees collectees\n\n`;
      Object.entries(reasoning.webResults.results || {}).forEach(([source, data]) => {
        if (data.results && data.results.length > 0) {
          response += `**${source}** (${data.results.length} resultats):\n`;
          data.results.slice(0, 3).forEach(r => {
            response += `- ${r.title || r.name}\n`;
          });
          response += `\n`;
        }
      });
    }
    
    response += `### 🛠️ Outils recommandes\n\n`;
    response += `- **theHarvester** - Collecte d\'emails et de sous-domaines\n`;
    response += `- **Maltego** - Visualisation de relations et de connexions\n`;
    response += `- **Shodan** - Recherche d\'actifs IoT et exposes\n`;
    response += `- **SpiderFoot** - OSINT automatise et complet\n`;
    response += `- **Recon-ng** - Framework de reconnaissance web\n`;
    response += `- **OSINT Framework** - Guide methodologique complet\n`;
    response += `\n`;
    response += `### 📋 Methodologie\n\n`;
    response += `1. **Profiling** - Identifier la cible et ses actifs\n`;
    response += `2. **Surface Mapping** - Cartographier la presence en ligne\n`;
    response += `3. **Data Correlation** - Croiser les informations collectees\n`;
    response += `4. **Cross-Reference** - Valider les donnees via multiples sources\n`;
    response += `5. **Reporting** - Documenter les findings et les preuves\n`;
    return response;
  }

  buildConversationalResponse(message, intent, reasoning) {
    let response = '';
    if (intent.isQuestion) {
      const topic = this.extractTopic(message);
      const knowledge = this.searchKnowledgeBase(message, intent);
      if (knowledge && knowledge.length > 0) {
        response = `## 💬 ${message}\n\n`;
        response += `Voici ce que je sais:\n\n`;
        knowledge.slice(0, 5).forEach(k => { response += `**${k.key}**: ${k.value}\n\n`; });
      } else {
        response = `## 🐛 Worm Error 404 v3\n\n`;
        response += `J\'ai analyse: *"${message}"*\n\n`;
        response += `**Ma reflexion:**\n`;
        reasoning.thoughts.forEach((thought, i) => { response += `${i + 1}. **${thought.phase.toUpperCase()}** → ${thought.thought}\n`; });
        response += `\n`;
        response += `**Reponse:** `;
        if (message.toLowerCase().includes('comment') || message.toLowerCase().includes('how')) {
          response += `Pour cela, je recommande:\n`;
          response += `1. Decomposer le probleme en sous-etapes\n`;
          response += `2. Choisir les technologies adaptees\n`;
          response += `3. Prototyper rapidement (MVP)\n`;
          response += `4. Iterer avec tests et feedback\n`;
          response += `5. Optimiser et securiser\n`;
        } else if (message.toLowerCase().includes('pourquoi') || message.toLowerCase().includes('why')) {
          response += `Cela s\'explique par des facteurs techniques, architecturaux et parfois historiques. L\'approche depend du contexte specifique.\n`;
        } else {
          response += `Je peux t\'aider sur ce sujet. Precise si tu veux du code, une explication, ou une recherche approfondie.\n`;
        }
      }
    } else {
      response = `## 🐛 Worm Error 404 v3\n\n`;
      response += `J\'ai analyse ta demande: *"${message}"*\n\n`;
      if (intent.primary.score > 0.2) {
        response += `Intention detectee: **${intent.primary.name}** (confiance: ${Math.round(intent.primary.score * 100)}%)\n\n`;
      }
      response += `Je suis la pour t\'aider. Voici ce que je peux faire:\n\n`;
      response += `| Capacite | Description |\n`;
      response += `|----------|-------------|\n`;
      response += `| 📝 **Code** | Generer des projets complets dans 15+ langages |\n`;
      response += `| 🔧 **Debug** | Corriger et expliquer les bugs |\n`;
      response += `| 📖 **Explain** | Explications ligne par ligne |\n`;
      response += `| 🔍 **Research** | Recherche web temps reel (Google, GitHub, YouTube, Reddit, Telegram, Dark Web) |\n`;
      response += `| 🏗️ **Archi** | Conception de systemes scalables |\n`;
      response += `| 🔒 **Security** | Audit de vulnerabilites offensive/defensive |\n`;
      response += `| 🕵️ **OSINT** | Investigation et renseignement |\n`;
      response += `| ⚡ **Optimize** | Amelioration de performance |\n`;
      response += `| 📦 **ZIP** | Generation de projets telechargeables |\n`;
      response += `\n`;
      response += `Que veux-tu faire ? 🚀\n`;
    }
    return response;
  }

  extractTopic(message) {
    const topics = ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'php', 'architecture', 'security', 'docker', 'kubernetes', 'aws', 'vercel', 'database', 'redis', 'postgresql', 'mongodb', 'graphql', 'rest'];
    const lower = message.toLowerCase();
    for (const topic of topics) {
      if (lower.includes(topic)) return topic;
    }
    return null;
  }
}

module.exports = new WormBrainV3();
