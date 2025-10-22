import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  finalize
} from 'rxjs/operators';

import {
  Pollution,
  PollutionFilters,
  PollutionStatus,
  PollutionType
} from '../../models/pollution.model';
import { PollutionService } from '../../pollution.service';

@Component({
  selector: 'app-pollution-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './pollution-list.component.html',
  styleUrl: './pollution-list.component.scss'
})
export class PollutionListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pollutionService = inject(PollutionService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    type: ['' as PollutionType | ''],
    city: [''],
    status: ['' as PollutionStatus | ''],
    minLevel: [null as number | null],
    maxLevel: [null as number | null]
  });

  readonly pollutions = computed(() => this.pollutionService.pollutions());
  readonly hasResults = computed(() => this.pollutions().length > 0);

  readonly pollutionTypes: Array<{ label: string; value: PollutionType }> = [
    { label: 'Air', value: 'air' },
    { label: 'Eau', value: 'water' },
    { label: 'Sol', value: 'soil' },
    { label: 'Bruit', value: 'noise' },
    { label: 'Autre', value: 'other' }
  ];

  readonly statuses: Array<{ label: string; value: PollutionStatus }> = [
    { label: 'Ouvert', value: 'open' },
    { label: 'Investigation', value: 'investigating' },
    { label: 'Résolu', value: 'resolved' }
  ];

  constructor() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        ),
        takeUntilDestroyed()
      )
      .subscribe((value) => this.fetchPollutions(value));

    this.fetchPollutions(this.filterForm.value);
  }

  trackByPollutionId(_: number, pollution: Pollution) {
    return pollution.id;
  }

  onDelete(pollution: Pollution) {
    const confirmed = window.confirm(
      `Supprimer "${pollution.name}" ? Cette action est irréversible.`
    );
    if (!confirmed) {
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.pollutionService.delete(pollution.id).subscribe({
      next: () => this.fetchPollutions(this.filterForm.value),
      error: () => {
        this.error.set("Impossible de supprimer la pollution.");
        this.isLoading.set(false);
      }
    });
  }

  refresh() {
    this.fetchPollutions(this.filterForm.value);
  }

  private fetchPollutions(rawFilters: PollutionFilters) {
    this.isLoading.set(true);
    this.error.set(null);

    const filters = this.normalizeFilters(rawFilters);
    this.pollutionService
      .load(filters)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        error: () =>
          this.error.set("Impossible de charger la liste des pollutions.")
      });
  }

  private normalizeFilters(filters: PollutionFilters): PollutionFilters {
    return {
      ...filters,
      search: filters.search?.trim() || undefined,
      city: filters.city?.trim() || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      minLevel:
        filters.minLevel !== null && filters.minLevel !== undefined
          ? Number(filters.minLevel)
          : undefined,
      maxLevel:
        filters.maxLevel !== null && filters.maxLevel !== undefined
          ? Number(filters.maxLevel)
          : undefined
    };
  }
}
