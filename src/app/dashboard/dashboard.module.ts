import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeagoClock, TimeagoModule } from 'ngx-timeago';
import { Observable, interval } from 'rxjs';
import { SharedModule } from '@shared/shared.module';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatButtonModule } from '@angular/material/button';
import { DashboardRoutingModule } from './dashboard-routing.module';

import { DashboardComponent } from '@app/dashboard/components/dashboard/dashboard.component';

// ticks every 1min
export class CustomClock extends TimeagoClock {
    tick(then: number): Observable<number> {
        return interval(60000);
    }
}

@NgModule({
    declarations: [DashboardComponent],
    imports: [
        CommonModule,
        SharedModule,
        DashboardRoutingModule,
        OverlayModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        ClipboardModule,
        MatChipsModule,
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        TimeagoModule.forChild({
            clock: { provide: TimeagoClock, useClass: CustomClock },
        }),
    ],
})
export class DashboardModule {}
