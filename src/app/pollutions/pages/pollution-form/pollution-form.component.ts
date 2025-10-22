import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  PollutionPayload,
  PollutionStatus,
  PollutionType
} from '../../models/pollution.model';
import { PollutionService } from '../../pollution.service';

@Component({
  selector: 'app-pollution-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './pollution-form.component.html',
  styleUrl: './pollution-form.component.scss'
})
export class PollutionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pollutionService = inject(PollutionService);

  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEditing = signal(false);

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

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    type: ['air' as PollutionType, Validators.required],
    city: ['', Validators.required],
    level: [50, [Validators.required, Validators.min(0)]],
    recordedAt: [
      new Date().toISOString().slice(0, 10),
      Validators.required
    ],
    status: ['open' as PollutionStatus, Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  private pollutionId: string | null = null;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.pollutionId = id;
      this.loadPollution(id);
    }
  }

  submit() {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);
    const payload = this.toPayload();

    const request$ = this.isEditing() && this.pollutionId
      ? this.pollutionService.update(this.pollutionId, payload)
      : this.pollutionService.create(payload);

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (pollution) =>
          this.router.navigate(['/pollutions', pollution.id]),
        error: () =>
          this.error.set(
            'Impossible de sauvegarder la pollution. Réessayez plus tard.'
          )
      });
  }

  private loadPollution(id: string) {
    this.pollutionService.getById(id).subscribe({
      next: (pollution) => {
        this.form.patchValue({
          name: pollution.name,
          type: pollution.type,
          city: pollution.city,
          level: pollution.level,
          recordedAt: pollution.recordedAt.slice(0, 10),
          status: pollution.status,
          description: pollution.description
        });
      },
      error: () => {
        this.error.set("Impossible de charger la pollution demandée.");
      }
    });
  }

  private toPayload(): PollutionPayload {
    const value = this.form.getRawValue();
    const recordedDate = value.recordedAt
      ? new Date(value.recordedAt)
      : new Date();

    return {
      name: value.name,
      type: value.type,
      city: value.city,
      level: Number(value.level),
      recordedAt: recordedDate.toISOString(),
      status: value.status,
      description: value.description ?? ''
    };
  }
}
