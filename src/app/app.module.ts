import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '@environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// firebase imports
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';

// bootstarp
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// angular resize
import { AngularResizeEventModule } from 'angular-resize-event';
// timeago
import { TimeagoModule } from 'ngx-timeago';

// my imports
import { AppComponent } from './app.component';
import { JwtInterceptor } from '@app/auth/services/auth.jwt.interceptor';
import { ErrorInterceptor } from '@app/auth/services/auth.error.interceptor';
import { LayoutModule } from '@app/layout/layout.module';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        RouterModule.forRoot([]),
        BrowserAnimationsModule,
        HttpClientModule,
        NgbModule,
        LayoutModule,
        TimeagoModule.forRoot(),

        AngularFireModule.initializeApp(environment.firebase),
        AngularFireAnalyticsModule,
        AngularFireDatabaseModule,
        AngularFireAuthModule,
        AngularFirestoreModule,
        AngularFireStorageModule,

        AngularResizeEventModule,
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
