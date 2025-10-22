import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import {
  Pollution,
  PollutionFilters,
  PollutionPayload
} from './models/pollution.model';

@Injectable({
  providedIn: 'root'
})
export class PollutionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/pollutions`;
  private readonly pollutionsSignal = signal<Pollution[]>([]);
  readonly pollutions = computed(() => this.pollutionsSignal());

  load(filters: PollutionFilters = {}) {
    const params = this.buildParams(filters);
    return this.http
      .get<Pollution[]>(this.baseUrl, { params })
      .pipe(tap((pollutions) => this.pollutionsSignal.set(pollutions)));
  }

  getById(id: string) {
    return this.http.get<Pollution>(`${this.baseUrl}/${id}`);
  }

  create(payload: PollutionPayload) {
    return this.http.post<Pollution>(this.baseUrl, payload);
  }

  update(id: string, payload: PollutionPayload) {
    return this.http.put<Pollution>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private buildParams(filters: PollutionFilters) {
    let params = new HttpParams();
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.city) {
      params = params.set('city', filters.city);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.minLevel != null) {
      params = params.set('minLevel', String(filters.minLevel));
    }
    if (filters.maxLevel != null) {
      params = params.set('maxLevel', String(filters.maxLevel));
    }
    return params;
  }
}
