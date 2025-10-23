import { Injectable, computed, effect, signal } from '@angular/core';
import { delay, of, throwError } from 'rxjs';

import {
  Pollution,
  PollutionFilters,
  PollutionPayload
} from './models/pollution.model';

const STORAGE_KEY = 'polluTracker.pollutions';

const FALLBACK_POLLUTIONS: Pollution[] = [
  {
    id: createId(),
    name: 'Usine chimique de la zone Nord',
    type: 'chemical',
    city: 'Lyon',
    recordedAt: new Date('2024-02-15T09:20:00Z').toISOString(),
    status: 'investigating',
    description:
      "Des pics répétés de dioxyde de soufre ont été détectés autour de l'usine chimique depuis début février."
  },
  {
    id: createId(),
    name: 'Déchets plastiques sur la plage de Malo',
    type: 'plastic',
    city: 'Dunkerque',
    recordedAt: new Date('2024-03-08T08:10:00Z').toISOString(),
    status: 'open',
    description:
      'Accumulation de filets, de bouteilles et de microplastiques sur 500 mètres de littoral après une tempête.'
  },
  {
    id: createId(),
    name: 'Déversement dans la rivière Clarin',
    type: 'water',
    city: 'Nantes',
    recordedAt: new Date('2024-03-04T11:00:00Z').toISOString(),
    status: 'open',
    description:
      'Un film huileux recouvre la surface de la rivière, avec mortalité de poissons observée sur 300 mètres.'
  },
  {
    id: createId(),
    name: 'Décharge sauvage forêt de Verrières',
    type: 'wild_dumping',
    city: 'Versailles',
    recordedAt: new Date('2024-01-28T14:30:00Z').toISOString(),
    status: 'open',
    description:
      'Accumulation de déchets industriels près d’un site Natura 2000 avec risques de lixiviation.'
  },
  {
    id: createId(),
    name: 'Bruit nocturne zone logistique',
    type: 'air',
    city: 'Lille',
    recordedAt: new Date('2024-02-22T22:15:00Z').toISOString(),
    status: 'investigating',
    description:
      'Des convois nocturnes dépassent les niveaux réglementaires de bruit entre 22h et 2h.'
  },
  {
    id: createId(),
    name: 'Pesticides dans les cultures',
    type: 'other',
    city: 'Bordeaux',
    recordedAt: new Date('2024-03-10T07:45:00Z').toISOString(),
    status: 'resolved',
    description:
      'Dépassement ponctuel de résidus de pesticides dans les cultures viticoles, mesures correctives appliquées.'
  }
];

const INITIAL_DATA = loadFromStorage();

@Injectable({
  providedIn: 'root'
})
export class PollutionService {
  private readonly store = signal<Pollution[]>([...INITIAL_DATA]);
  private readonly pollutionsSignal = signal<Pollution[]>([...INITIAL_DATA]);
  private lastFilters: PollutionFilters = {};

  readonly pollutions = computed(() => this.pollutionsSignal());

  constructor() {
    effect(() => {
      saveToStorage(this.store());
    });
  }

  load(filters: PollutionFilters = {}) {
    this.lastFilters = { ...filters };
    const filtered = this.applyFilters(this.store(), filters);
    this.pollutionsSignal.set([...filtered]);
    return of(filtered.map((pollution) => ({ ...pollution }))).pipe(delay(150));
  }

  getById(id: string) {
    const pollution = this.store().find((item) => item.id === id);
    if (!pollution) {
      return throwError(() => new Error('Pollution introuvable.'));
    }
    return of({ ...pollution }).pipe(delay(100));
  }

  create(payload: PollutionPayload) {
    const pollution: Pollution = {
      ...payload,
      id: createId(),
      recordedAt: payload.recordedAt ?? new Date().toISOString()
    };
    this.store.update((items) => [pollution, ...items]);
    this.refreshFiltered();
    return of({ ...pollution }).pipe(delay(120));
  }

  update(id: string, payload: PollutionPayload) {
    let updated: Pollution | null = null;
    this.store.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }
        updated = {
          ...item,
          ...payload,
          recordedAt: payload.recordedAt ?? item.recordedAt
        };
        return updated;
      })
    );
    if (!updated) {
      return throwError(() => new Error('Pollution introuvable pour mise à jour.'));
    }
    this.refreshFiltered();
    return of({ ...(updated as Pollution) }).pipe(delay(120));
  }

  delete(id: string) {
    const exists = this.store().some((item) => item.id === id);
    if (!exists) {
      return throwError(() => new Error('Pollution introuvable pour suppression.'));
    }
    this.store.update((items) => items.filter((item) => item.id !== id));
    this.refreshFiltered();
    return of(void 0).pipe(delay(80));
  }

  private applyFilters(list: Pollution[], filters: PollutionFilters) {
    let result = [...list];
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((pollution) =>
        [
          pollution.name,
          pollution.description,
          pollution.city,
          pollution.type,
          pollution.status
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }
    if (filters.type) {
      result = result.filter((pollution) => pollution.type === filters.type);
    }
    if (filters.city) {
      const cityTerm = filters.city.toLowerCase();
      result = result.filter((pollution) =>
        pollution.city.toLowerCase().includes(cityTerm)
      );
    }
    if (filters.status) {
      result = result.filter((pollution) => pollution.status === filters.status);
    }
    return result;
  }

  private refreshFiltered() {
    if (Object.keys(this.lastFilters).length === 0) {
      this.pollutionsSignal.set([...this.store()]);
      return;
    }
    const filtered = this.applyFilters(this.store(), this.lastFilters);
    this.pollutionsSignal.set([...filtered]);
  }
}

function createId() {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  return randomUUID ? randomUUID() : Math.random().toString(36).slice(2, 11);
}

function loadFromStorage(): Pollution[] {
  const storage = getLocalStorage();
  if (!storage) {
    return [...FALLBACK_POLLUTIONS];
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      storage.setItem(STORAGE_KEY, JSON.stringify(FALLBACK_POLLUTIONS));
      return [...FALLBACK_POLLUTIONS];
    }
    const parsed = JSON.parse(raw) as Pollution[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      storage.setItem(STORAGE_KEY, JSON.stringify(FALLBACK_POLLUTIONS));
      return [...FALLBACK_POLLUTIONS];
    }
    return parsed.map((item) => ({
      ...item,
      recordedAt: item.recordedAt ?? new Date().toISOString()
    }));
  } catch (error) {
    console.error(
      'Impossible de lire les données stockées, utilisation des données par défaut.',
      error
    );
    return [...FALLBACK_POLLUTIONS];
  }
}

function saveToStorage(pollutions: Pollution[]) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(pollutions));
  } catch (error) {
    console.warn('Impossible de sauvegarder les données.', error);
  }
}

function getLocalStorage(): Storage | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
