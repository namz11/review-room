import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularResizeEventModule } from 'angular-resize-event';
import { MatTabsModule } from '@angular/material/tabs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TimeagoClock, TimeagoModule } from 'ngx-timeago';
import { interval, Observable } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SharedModule } from '@shared/shared.module';
import { ProjectRoutingModule } from './project-routing.module';

import { ProjectComponent } from './components/project/project.component';

// ticks every 1min
// TODO remove code redundancy
export class CustomClock extends TimeagoClock {
    tick(then: number): Observable<number> {
        return interval(60000);
    }
}
@NgModule({
    declarations: [ProjectComponent],
    imports: [
        CommonModule,
        ProjectRoutingModule,
        SharedModule,
        AngularResizeEventModule,
        MatTabsModule,
        NgbModule,
        MatDividerModule,
        MatSlideToggleModule,
        MatButtonToggleModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatChipsModule,
        ClipboardModule,
        MatInputModule,
        MatCheckboxModule,
        TimeagoModule.forChild({
            clock: { provide: TimeagoClock, useClass: CustomClock },
        }),
    ],
})
export class ProjectModule {}
