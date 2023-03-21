/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@app/auth/services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        // add auth header with jwt if user is logged in and request is to the api url
        const currentUser = this.authService.userData;
        const isLoggedIn = this.authService.isLoggedIn;
        if (isLoggedIn) {
            request = request.clone({
                setHeaders: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Authorization: `Bearer ${currentUser.token}`,
                },
            });
        }

        return next.handle(request);
    }
}
