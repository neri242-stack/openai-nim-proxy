const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Configuration
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const PORT = process.env.PORT || 3000;

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Route de santé
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NVIDIA NIM to OpenAI Proxy is running',
    endpoints: {
      chat: '/v1/chat/completions',
      models: '/v1/models'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Liste des modèles
app.get('/v1/models', async (req, res) => {
  try {
    const response = await axios.get(`${NVIDIA_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching models:', error.response?.data || error.message);
    res.status(500).json({ 
      error: { 
        message: 'Failed to fetch models',
        type: 'api_error'
      } 
    });
  }
});

// Endpoint principal pour les completions de chat
app.post('/v1/chat/completions', async (req, res) => {
  try {
    // Vérifier la clé API
    if (!NVIDIA_API_KEY) {
      return res.status(500).json({
        error: {
          message: 'NVIDIA_API_KEY not configured',
          type: 'configuration_error'
        }
      });
    }

    // Extraire les paramètres de la requête OpenAI
    const { 
      model, 
      messages, 
      temperature, 
      max_tokens,
      stream,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
      reasoning_display,
      thinking_mode,
      reasoning_effort
    } = req.body;

    // Construire la requête pour NVIDIA NIM
    const nvidiaRequest = {
      model: model || 'meta/llama-3.1-405b-instruct',
      messages: messages,
      temperature: temperature !== undefined ? temperature : 0.7,
      max_tokens: max_tokens || 1024,
      stream: stream || false,
      reasoning_display: reasoning_display !== undefined ? reasoning_display : false,
      thinking_mode: thinking_mode !== undefined ? thinking_mode : false
    };

    // Ajouter les paramètres optionnels s'ils sont présents
    if (top_p !== undefined) nvidiaRequest.top_p = top_p;
    if (frequency_penalty !== undefined) nvidiaRequest.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined) nvidiaRequest.presence_penalty = presence_penalty;
    if (stop) nvidiaRequest.stop = stop;
    if (reasoning_effort !== undefined) nvidiaRequest.reasoning_effort = reasoning_effort;

    console.log('Sending request to NVIDIA NIM:', JSON.stringify(nvidiaRequest, null, 2));

    if (stream) {
      // Gérer le streaming
      const response = await axios.post(
        `${NVIDIA_BASE_URL}/chat/completions`,
        nvidiaRequest,
        {
          headers: {
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      );

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      response.data.pipe(res);

    } else {
      // Requête normale (non-streaming)
      const response = await axios.post(
        `${NVIDIA_BASE_URL}/chat/completions`,
        nvidiaRequest,
        {
          headers: {
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Retourner la réponse au format OpenAI
      res.json(response.data);
    }

  } catch (error) {
    console.error('Error proxying request:', error.response?.data || error.message);
    
    // Gérer les erreurs de manière compatible OpenAI
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || error.message || 'An error occurred';
    
    res.status(statusCode).json({
      error: {
        message: errorMessage,
        type: 'api_error',
        code: statusCode
      }
    });
  }
});

// Endpoint de completion (legacy)
app.post('/v1/completions', async (req, res) => {
  try {
    const { prompt, model, ...otherParams } = req.body;
    
    // Convertir le format completion en format chat
    const messages = [{ role: 'user', content: prompt }];
    
    const nvidiaRequest = {
      model: model || 'meta/llama-3.1-405b-instruct',
      messages: messages,
      ...otherParams
    };

    const response = await axios.post(
      `${NVIDIA_BASE_URL}/chat/completions`,
      nvidiaRequest,
      {
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Error in completions:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.error?.message || error.message,
        type: 'api_error'
      }
    });
  }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NVIDIA NIM Proxy Server running on port ${PORT}`);
  console.log(`📡 Proxying to: ${NVIDIA_BASE_URL}`);
  console.log(`🔑 API Key configured: ${NVIDIA_API_KEY ? 'Yes' : 'No'}`);
});
