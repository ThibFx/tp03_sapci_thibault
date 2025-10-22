import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  POLLUTION_TYPE_LABELS,
  Pollution,
  PollutionType
} from '../../models/pollution.model';
import { PollutionService } from '../../pollution.service';

@Component({
  selector: 'app-pollution-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pollution-detail.component.html',
  styleUrl: './pollution-detail.component.scss'
})
export class PollutionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly pollutionService = inject(PollutionService);

  readonly pollution = signal<Pollution | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly typeLabels = POLLUTION_TYPE_LABELS;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Identifiant de pollution manquant.');
      this.isLoading.set(false);
      return;
    }

    this.pollutionService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (value) => this.pollution.set(value),
        error: () => this.error.set('Impossible de charger la pollution.')
      });
  }

  getTypeLabel(type: PollutionType | undefined) {
    return type ? this.typeLabels[type] : '';
  }
}
