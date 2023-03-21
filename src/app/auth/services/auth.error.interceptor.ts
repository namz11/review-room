import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '@app/auth/services/auth.service';
import { SnackbarService } from '@shared/providers/snackbar.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    urlsToNotUse = ['/api/auth/signin'];

    constructor(
        private readonly authService: AuthService,
        private readonly snackBar: SnackbarService
    ) {}

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((err) => {
                if (
                    err.status === 401 &&
                    this.isValidRequestForInterceptor(request.url)
                ) {
                    // auto logout if 401 response returned from api
                    this.authService.signOut();
                }

                const error = err.error.message || err.statusText;
                this.snackBar.snackbarError(error);
                return throwError(error);
            })
        );
    }

    private isValidRequestForInterceptor(requestUrl: string): boolean {
        for (const address of this.urlsToNotUse) {
            if (new RegExp(address).test(requestUrl)) {
                return false;
            }
        }

        return true;
    }
}
