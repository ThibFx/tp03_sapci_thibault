import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { parse } from 'node:url';

const pollutions = [
  {
    id: randomUUID(),
    name: 'Usine chimique de la zone Nord',
    type: 'air',
    city: 'Lyon',
    level: 87,
    recordedAt: new Date('2024-02-15T09:20:00Z').toISOString(),
    status: 'investigating',
    description:
      "Des pics répétés de dioxyde de soufre ont été détectés autour de l'usine chimique depuis début février."
  },
  {
    id: randomUUID(),
    name: 'Déversement dans la rivière Clarin',
    type: 'water',
    city: 'Nantes',
    level: 65,
    recordedAt: new Date('2024-03-04T11:00:00Z').toISOString(),
    status: 'open',
    description:
      'Un film huileux recouvre la surface de la rivière, avec mortalité de poissons observée sur 300 mètres.'
  },
  {
    id: randomUUID(),
    name: 'Décharge sauvage forêt de Verrières',
    type: 'soil',
    city: 'Versailles',
    level: 45,
    recordedAt: new Date('2024-01-28T14:30:00Z').toISOString(),
    status: 'open',
    description:
      'Accumulation de déchets industriels près d’un site Natura 2000 avec risques de lixiviation.'
  },
  {
    id: randomUUID(),
    name: 'Bruit nocturne zone logistique',
    type: 'noise',
    city: 'Lille',
    level: 72,
    recordedAt: new Date('2024-02-22T22:15:00Z').toISOString(),
    status: 'investigating',
    description:
      'Des convois nocturnes dépassent les niveaux réglementaires de bruit entre 22h et 2h.'
  },
  {
    id: randomUUID(),
    name: 'Pesticides dans les cultures',
    type: 'other',
    city: 'Bordeaux',
    level: 38,
    recordedAt: new Date('2024-03-10T07:45:00Z').toISOString(),
    status: 'resolved',
    description:
      'Dépassement ponctuel de résidus de pesticides dans les cultures viticoles, mesures correctives appliquées.'
  }
];

const server = createServer(async (req, res) => {
  const { pathname, query } = parse(req.url ?? '', true);

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (!pathname || !pathname.startsWith('/api/pollutions')) {
    return sendJson(res, 404, { message: 'Endpoint not found' });
  }

  const segments = pathname.split('/').filter(Boolean);
  const hasId = segments.length === 3;
  const id = hasId ? segments[2] : null;

  try {
    if (req.method === 'GET' && !hasId) {
      return sendJson(res, 200, filterPollutions(query));
    }

    if (req.method === 'GET' && hasId) {
      const pollution = pollutions.find((item) => item.id === id);
      if (!pollution) {
        return sendJson(res, 404, { message: 'Pollution not found' });
      }
      return sendJson(res, 200, pollution);
    }

    if (req.method === 'POST' && !hasId) {
      const body = await readJsonBody(req);
      const validation = validatePayload(body);
      if (!validation.valid) {
        return sendJson(res, 400, { message: validation.error });
      }

      const pollution = {
        ...body,
        id: randomUUID(),
        recordedAt: new Date(body.recordedAt ?? Date.now()).toISOString()
      };
      pollutions.unshift(pollution);
      return sendJson(res, 201, pollution);
    }

    if (req.method === 'PUT' && hasId) {
      const index = pollutions.findIndex((item) => item.id === id);
      if (index === -1) {
        return sendJson(res, 404, { message: 'Pollution not found' });
      }
      const body = await readJsonBody(req);
      const validation = validatePayload(body);
      if (!validation.valid) {
        return sendJson(res, 400, { message: validation.error });
      }

      pollutions[index] = {
        ...pollutions[index],
        ...body,
        recordedAt: new Date(body.recordedAt ?? pollutions[index].recordedAt).toISOString()
      };
      return sendJson(res, 200, pollutions[index]);
    }

    if (req.method === 'DELETE' && hasId) {
      const index = pollutions.findIndex((item) => item.id === id);
      if (index === -1) {
        return sendJson(res, 404, { message: 'Pollution not found' });
      }
      pollutions.splice(index, 1);
      res.writeHead(204);
      return res.end();
    }

    return sendJson(res, 405, { message: `Method ${req.method} not supported` });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { message: 'Internal server error' });
  }
});

server.listen(3000, () => {
  console.log('Mock API ready on http://localhost:3000/api/pollutions');
});

function sendJson(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString();
  if (!body) return {};
  return JSON.parse(body);
}

function validatePayload(payload) {
  const requiredFields = [
    'name',
    'type',
    'city',
    'level',
    'recordedAt',
    'status',
    'description'
  ];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return { valid: false, error: `Missing field: ${field}` };
    }
  }

  return { valid: true };
}

function filterPollutions(query) {
  return pollutions.filter((pollution) => {
    if (query.type && pollution.type !== query.type) {
      return false;
    }
    if (query.status && pollution.status !== query.status) {
      return false;
    }
    if (query.city && !pollution.city.toLowerCase().includes(String(query.city).toLowerCase())) {
      return false;
    }
    if (query.minLevel && Number(pollution.level) < Number(query.minLevel)) {
      return false;
    }
    if (query.maxLevel && Number(pollution.level) > Number(query.maxLevel)) {
      return false;
    }
    if (query.search) {
      const searchTerm = String(query.search).toLowerCase();
      const haystack = [
        pollution.name,
        pollution.description,
        pollution.city,
        pollution.type,
        pollution.status
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });
}

