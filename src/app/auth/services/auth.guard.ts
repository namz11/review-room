import { Injectable } from '@angular/core';
import {
    Router,
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';

import { AuthService } from '@app/auth/services/auth.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(private router: Router, private authService: AuthService) {}

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        if (this.authService.isLoggedIn !== true) {
            this.router.navigate(['/auth/signin'], {
                queryParams: { returnUrl: state.url },
            });
            return false;
        }

        return true;
    }
}
