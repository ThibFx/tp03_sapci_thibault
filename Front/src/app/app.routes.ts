import { Routes } from '@angular/router';

import { PollutionDetailComponent } from './pollutions/pages/pollution-detail/pollution-detail.component';
import { PollutionFormComponent } from './pollutions/pages/pollution-form/pollution-form.component';
import { PollutionListComponent } from './pollutions/pages/pollution-list/pollution-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pollutions' },
  {
    path: 'pollutions',
    children: [
      { path: '', component: PollutionListComponent },
      { path: 'new', component: PollutionFormComponent },
      { path: ':id/edit', component: PollutionFormComponent },
      { path: ':id', component: PollutionDetailComponent }
    ]
  },
  { path: '**', redirectTo: 'pollutions' }
];
